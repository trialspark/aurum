import { Compiler, DiagnosticCode, DiagnosticScope } from ".";

describe("Compiler", () => {
  let compiler: Compiler;

  beforeEach(() => {
    compiler = new Compiler({});
  });

  it("exists", () => {
    expect(compiler).toEqual(expect.any(Compiler));
  });

  it("requires a study definition initially", () => {
    expect(compiler.diagnostics).toMatchSnapshot();
  });

  it("includes diagnostics for syntax errors", () => {
    compiler.updateFiles({
      "bad.sdsd": "sturdy {}",
    });
    expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "code": "parse_failure",
    "loc": Object {
      "end": Object {
        "col": 6,
        "line": 1,
      },
      "filename": "bad.sdsd",
      "start": Object {
        "col": 1,
        "line": 1,
      },
    },
    "message": "Syntax error on line 1 col 1:

sturdy {}
^

Unexpected token: \\"sturdy\\".",
    "scope": "local",
  },
  Object {
    "code": "missing_study_def",
    "loc": null,
    "message": "Missing study definition, e.g.:

study {
  id: \\"STUDY-ID\\"
  name: \\"Longer name for my study\\"
}",
    "scope": "global",
  },
]
`);
  });

  describe("when a study definition is added", () => {
    beforeEach(() => {
      compiler.updateFiles({
        "study.sdsd": `
          study {
            id: "MY-STUDY"
            name: "Longer version of my study"
          }
        `,
      });
    });

    it("compiles without error", () => {
      expect(compiler.diagnostics).toEqual([]);
      expect(compiler.result).toMatchSnapshot();
    });

    it("errors when the study definition is removed", () => {
      compiler.updateFiles({ "study.sdsd": null });
      expect(compiler.diagnostics).toMatchSnapshot();
    });

    it("errors if the id/name are not strings", () => {
      compiler.updateFiles({ "study.sdsd": 'study { id: t"d0" name: t"d1" }' });
      expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "actualType": "time-list",
    "code": "invalid_type",
    "expectedType": "string",
    "loc": Object {
      "end": Object {
        "col": 16,
        "line": 1,
      },
      "filename": "study.sdsd",
      "start": Object {
        "col": 15,
        "line": 1,
      },
    },
    "message": "Invalid type: time-list, should be a string. (e.g. \\"hello\\")",
    "scope": "local",
  },
  Object {
    "actualType": "time-list",
    "code": "invalid_type",
    "expectedType": "string",
    "loc": Object {
      "end": Object {
        "col": 28,
        "line": 1,
      },
      "filename": "study.sdsd",
      "start": Object {
        "col": 27,
        "line": 1,
      },
    },
    "message": "Invalid type: time-list, should be a string. (e.g. \\"hello\\")",
    "scope": "local",
  },
]
`);
    });

    it("errors if the id/name are missing", () => {
      compiler.updateFiles({ "study.sdsd": "study {}" });
      expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "attributeName": "id",
    "code": "missing_attribute",
    "defType": "study",
    "loc": Object {
      "end": Object {
        "col": 8,
        "line": 1,
      },
      "filename": "study.sdsd",
      "start": Object {
        "col": 1,
        "line": 1,
      },
    },
    "message": "study must have an \\"id\\" attribute. Please add one:

        study {
  id: \\"STUDY-ID\\"
  name: \\"Name of study\\"
}",
    "scope": "local",
  },
  Object {
    "attributeName": "name",
    "code": "missing_attribute",
    "defType": "study",
    "loc": Object {
      "end": Object {
        "col": 8,
        "line": 1,
      },
      "filename": "study.sdsd",
      "start": Object {
        "col": 1,
        "line": 1,
      },
    },
    "message": "study must have an \\"name\\" attribute. Please add one:

        study {
  id: \\"STUDY-ID\\"
  name: \\"Name of study\\"
}",
    "scope": "local",
  },
]
`);
    });

    it("errors if the study has extra attributes", () => {
      compiler.updateFiles({
        "study.sdsd": `study { id: "ID" name: "name" foo: "bar"}`,
      });
      expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "attributeName": "foo",
    "code": "extra_attribute",
    "defType": "study",
    "loc": Object {
      "end": Object {
        "col": 40,
        "line": 1,
      },
      "filename": "study.sdsd",
      "start": Object {
        "col": 36,
        "line": 1,
      },
    },
    "message": "Extra attribute \\"foo\\"",
    "scope": "local",
  },
]
`);
    });

    it("errors if the study has duplicate attributes", () => {
      compiler.updateFiles({
        "study.sdsd": `study { id: "ID" id: "FOO" name: "HELLO"}`,
      });
      expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "attributeName": "id",
    "code": "duplicate_attribute",
    "defType": "study",
    "loc": Object {
      "end": Object {
        "col": 26,
        "line": 1,
      },
      "filename": "study.sdsd",
      "start": Object {
        "col": 18,
        "line": 1,
      },
    },
    "message": "Duplicate attribute id",
    "scope": "local",
  },
]
`);
    });

    describe("and some milestones are added", () => {
      beforeEach(() => {
        compiler.updateFiles({
          "milestones.sdsd": `
            milestone SCREENING {
              at: t"d-14 +d14 -d10"
            }

            milestone BASELINE {
              at: t"d0"
            }

            milestone CLINIC_1 {
              at: t"d7 +-d4"
            }

            milestone CLINIC_2 {
              at: t"d14 +-d4"
            }

            milestone CLINIC_3 {
              at: t"d21 +-d3"
            }

            milestone EARLY_TERM {
              at: t"> BASELINE"
            }
          `,
        });
      });

      it("compiles without error", () => {
        expect(compiler.diagnostics).toEqual([]);
        expect(compiler.result).toMatchSnapshot();
      });

      it("errors if a milestone has an invalid reference to another", () => {
        compiler.updateFiles({ "bad.sdsd": 'milestone BAD { at: t"> FOO" }' });
        expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "code": "not_found",
    "defType": "milestone",
    "loc": Object {
      "end": Object {
        "col": 27,
        "line": 1,
      },
      "filename": "bad.sdsd",
      "start": Object {
        "col": 25,
        "line": 1,
      },
    },
    "message": "Could not find milestone with name \\"FOO\\". Please add it:

milestone FOO {
  at: t\\"d7 +-2\\"
}",
    "name": "FOO",
    "scope": "local",
  },
]
`);
      });

      it('errors if the milestone does not have an "at" attribute', () => {
        compiler.updateFiles({ "bad.sdsd": "milestone BAD {}" });
        expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "attributeName": "at",
    "code": "missing_attribute",
    "defType": "milestone",
    "loc": Object {
      "end": Object {
        "col": 16,
        "line": 1,
      },
      "filename": "bad.sdsd",
      "start": Object {
        "col": 1,
        "line": 1,
      },
    },
    "message": "milestone must have an \\"at\\" attribute. Please add one:

        milestone BAD {
  at: t\\"d0\\"
}",
    "scope": "local",
  },
]
`);
      });

      it("errors if the milestone has extra attributes", () => {
        compiler.updateFiles({
          "bad.sdsd": `milestone BAD { at: t"d0" foo: "bar"}`,
        });
        expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "attributeName": "foo",
    "code": "extra_attribute",
    "defType": "milestone",
    "loc": Object {
      "end": Object {
        "col": 36,
        "line": 1,
      },
      "filename": "bad.sdsd",
      "start": Object {
        "col": 32,
        "line": 1,
      },
    },
    "message": "Extra attribute \\"foo\\"",
    "scope": "local",
  },
]
`);
      });

      it('errors if the "at" attribute is not a time string', () => {
        compiler.updateFiles({
          "bad.sdsd": `milestone BAD { at: "d0" }`,
        });
        expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "actualType": "string",
    "code": "invalid_type",
    "expectedType": "t-string",
    "loc": Object {
      "end": Object {
        "col": 24,
        "line": 1,
      },
      "filename": "bad.sdsd",
      "start": Object {
        "col": 21,
        "line": 1,
      },
    },
    "message": "Invalid type: string, should be a t-string. (e.g. t\\"d0\\")",
    "scope": "local",
  },
]
`);
      });

      it("errors if the milestone has more than one day", () => {
        compiler.updateFiles({
          "bad.sdsd": `milestone BAD { at: t"d0, d1" }`,
        });
        expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "actualType": "t-string with 2 item(s)",
    "code": "invalid_type",
    "expectedType": "t-string with 1 item",
    "loc": Object {
      "end": Object {
        "col": 28,
        "line": 1,
      },
      "filename": "bad.sdsd",
      "start": Object {
        "col": 23,
        "line": 1,
      },
    },
    "message": "Invalid type: t-string with 2 item(s), should be a t-string with 1 item. (e.g. t\\"d0\\")",
    "scope": "local",
  },
]
`);
      });

      it('errors if the "at" attribute references another milestone', () => {
        compiler.updateFiles({
          "bad.sdsd": `milestone BAD { at: t"BASELINE" }`,
        });
        expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "actualType": "milestone-identifier",
    "code": "invalid_type",
    "expectedType": "day-of-study",
    "loc": Object {
      "end": Object {
        "col": 30,
        "line": 1,
      },
      "filename": "bad.sdsd",
      "start": Object {
        "col": 23,
        "line": 1,
      },
    },
    "message": "Invalid type: milestone-identifier, should be a day-of-study. (e.g. t\\"d0\\")",
    "scope": "local",
  },
]
`);
      });

      it('errors if the "at" attribute expression includes a time range', () => {
        compiler.updateFiles({
          "bad.sdsd": `milestone BAD { at: t"> BASELINE -> CLINIC_1" }`,
        });
        expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "actualType": "time-range",
    "code": "invalid_type",
    "expectedType": "milestone or day-of-study",
    "loc": Object {
      "end": Object {
        "col": 44,
        "line": 1,
      },
      "filename": "bad.sdsd",
      "start": Object {
        "col": 23,
        "line": 1,
      },
    },
    "message": "Invalid type: time-range, should be a milestone or day-of-study. (e.g. t\\"> BASELINE\\")",
    "scope": "local",
  },
]
`);
      });

      it("can add milestones in a separate file", () => {
        compiler.updateFiles({
          "milestones2.sdsd": `
            milestone CLOSEOUT {
              at: t"d28"
            }
          `,
        });
        expect(compiler.diagnostics).toEqual([]);
        expect(compiler.result).toMatchSnapshot();
      });

      it("can remove milestones", () => {
        compiler.updateFiles({
          "milestones.sdsd": `
            milestone CLOSEOUT {
              at: t"d28"
            }
          `,
        });
        expect(compiler.diagnostics).toEqual([]);
        expect(compiler.result).toMatchSnapshot();
      });

      describe("and some interfaces are added", () => {
        beforeEach(() => {
          compiler.updateFiles({
            "interfaces.sdsd": `
              interface base {
                USUBJID String   @subject.uuid
                                 @label("Unique Subject Identifier")
                                 @desc("Identifier used to uniquely identify a subject across all studies.")
            
                SUBJID String    @subject.id
                                 @label("Subject Identifier for the Study")
                                 @desc("Subject identifier, which is unique within the study.")
              }
            
              interface visit_base {
                VISITNUM Integer @milestone.study_day
                                 @label("Visit Number")
                                 @desc("Clinical encounter number.")
                                 
                VISIT String     @milestone.name
                                 @label("Visit Name")
                                 @desc("Protocol-defined description of clinical encounter.")
                              
                VISITDY Integer  @milestone.study_day
                                 @label("Planned Study Day of Visit")
                                 @desc("Planned study day of the visit based upon RFSTDTC in Demographics.")
              }
            `,
          });
        });

        it("errors if a directive is passed the wrong type", () => {
          compiler.updateFiles({
            "bad.sdsd": 'interface a { A String @label("A") @desc(t"d0") }',
          });
          expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "actualType": "time-list",
    "code": "invalid_type",
    "expectedType": "string",
    "loc": Object {
      "end": Object {
        "col": 45,
        "line": 1,
      },
      "filename": "bad.sdsd",
      "start": Object {
        "col": 44,
        "line": 1,
      },
    },
    "message": "Invalid type: time-list, should be a string.",
    "scope": "local",
  },
]
`);
        });

        it("errors if a directive is passed too few arguments", () => {
          compiler.updateFiles({
            "bad.sdsd": 'interface a { A String @label @desc("A") }',
          });
          expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "actual": 0,
    "code": "incorrect_number_of_args",
    "expected": 1,
    "loc": Object {
      "end": Object {
        "col": 29,
        "line": 1,
      },
      "filename": "bad.sdsd",
      "start": Object {
        "col": 24,
        "line": 1,
      },
    },
    "message": "Incorrect number of arguments. Expected 1 but got 0.",
    "scope": "local",
  },
]
`);
        });

        it("errors if a required directive is omitted", () => {
          compiler.updateFiles({
            "bad.sdsd": 'interface a { A String @label("A") }',
          });
          expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "code": "missing_directive",
    "directiveName": "desc",
    "loc": Object {
      "end": Object {
        "col": 34,
        "line": 1,
      },
      "filename": "bad.sdsd",
      "start": Object {
        "col": 15,
        "line": 1,
      },
    },
    "message": "Missing directive desc. Please add it (e.g. @desc(...)).",
    "scope": "local",
  },
]
`);
        });

        describe("and some codelists are added", () => {
          beforeEach(() => {
            compiler.updateFiles({
              "codelists.sdsd": `
                codelist VSTestCode {
                  BMI    @desc("A general indicator of the body fat an individual is carrying based upon the ratio of weight to height.")
                  DIABP  @desc("The minimum blood pressure in the systemic arterial circulation during the cardiac cycle.")
                  HEIGHT @desc("The vertical measurement or distance from the base to the top of an object; the vertical dimension of extension.")
                  HR     @desc("The number of heartbeats per unit of time, usually expressed as beats per minute.")
                  SYSBP  @desc("The maximum blood pressure in the systemic arterial circulation during the cardiac cycle.")
                  TEMP   @desc("A measurement of the temperature of the body.")
                  WEIGHT @desc("The vertical force exerted by a mass as a result of gravity.")
                }
              
                codelist VSPosition {
                  PRONE    @desc("An anterior recumbent body position whereby the person lies on its stomach and faces downward.")
                  SITTING  @desc("The state or act of one who sits; the posture of one who occupies a seat.")
                  STANDING @desc("The act of assuming or maintaining an erect upright position.")
                  SUPINE   @desc("A posterior recumbent body position whereby the person lies on its back and faces upward.")
                }
              
                codelist VSUnit {
                  "%"         @desc("One hundred times the quotient of one quantity divided by another, with the same units of measurement.")
                  "beats/min" @desc("The number of heartbeats measured per minute time.")
                  C           @desc("A unit of temperature of the temperature scale designed so that the freezing point of water is 0 degrees and the boiling point is 100 degrees at standard atmospheric pressure.")
                }
              `,
            });
          });

          it("compiles without error", () => {
            expect(compiler.diagnostics).toEqual([]);
            expect(compiler.result).toMatchSnapshot();
          });

          describe("and a domain is added", () => {
            beforeEach(() => {
              compiler.updateFiles({
                "vs.sdsd": `
                  domain "VITAL SIGNS" @abbr("VS") {
                    dataset vs implements base, visit_base @milestone(t"BASELINE, CLINIC_1, CLINIC_2, CLINIC_3") {
                      VSSEQ Integer                 @sequence
                                                    @label("Sequence Number")
                                                    @desc("Sequence number given to ensure uniqueness of subject records within a domain.")
                  
                      VSTESTCD VSTestCode           @label("Vital Signs Test Short Name")
                                                    @desc("Short name of the measurement, test, or examination described in VSTEST.")
                                          
                      VSPOS VSPosition?             @label("Vital Signs Position of Subject")
                                                    @desc("Position of the subject during a measurement or examination.")
                                      
                      VSORRES String|Integer|Float  @label("Result or Finding in Original Units")
                                                    @desc("Result of the vital signs measurement as originally received or collected.")
                                                  
                      VSORRESU VSUnit?              @label("Original Units")
                                                    @desc("Original units in which the data were collected. The unit for VSORRES.")
                                      
                      VSSTRESC String|Integer|Float @label("Character Result/Finding in Std Format")
                                                    @desc("Contains the result value for all findings, copied or
                                                          derived from VSORRES in a standard format or standard units.")
                                                          
                      VSSTRESN Integer|Float?       @label("Numeric Result/Finding in Standard Units")
                                                    @desc("Used for continuous or numeric results or findings in standard format")
                                                    
                      VSSTRESU VSUnit               @label("Standard Units")
                                                    @desc("Standardized unit used for VSSTRESC and VSSTRESN")
                                      
                      VSSTAT Boolean                @label("Completion Status")
                                                    @desc("Used to indicate that a vital sign measurement was not done.")
                                    
                      VSREASND String?              @label("Reason Not Performed")
                                                    @desc("Describes why a measurement or test was not performed.")
                    }
                    
                    dataset vs_hr implements base @milestone(t"BASELINE -> CLINIC_3 at h8, h15, h19") {
                      VISITDY Integer               @milestone.study_day
                                                    @label("Study Day")
                                                    @desc("Study day based upon RFSTDTC in Demographics.")
                                                    
                      VISITHR Integer               @milestone.hour
                                                    @label("Hour of Day")
                                                    @desc("Hour of study day")
                  
                      VSSEQ Integer                 @sequence
                                                    @label("Sequence Number")
                                                    @desc("Sequence number given to ensure uniqueness of subject records within a domain.")
                  
                      VSTESTCD VSTestCode           @label("Vital Signs Test Short Name")
                                                    @desc("Short name of the measurement, test, or examination described in VSTEST.")
                                      
                      VSORRES String|Integer|Float  @label("Result or Finding in Original Units")
                                                    @desc("Result of the vital signs measurement as originally received or collected.")
                                                  
                      VSORRESU VSUnit               @label("Original Units")
                                                    @desc("Original units in which the data were collected. The unit for VSORRES.")
                                      
                      VSSTRESC String|Integer|Float @label("Character Result/Finding in Std Format")
                                                    @desc("Contains the result value for all findings, copied or
                                                          derived from VSORRES in a standard format or standard units.")
                                                          
                      VSSTRESN Integer|Float        @label("Numeric Result/Finding in Standard Units")
                                                    @desc("Used for continuous or numeric results or findings in standard format")
                                                    
                      VSSTRESU VSUnit               @label("Standard Units")
                                                    @desc("Standardized unit used for VSSTRESC and VSSTRESN")
                                      
                      VSSTAT Boolean                @label("Completion Status")
                                                    @desc("Used to indicate that a vital sign measurement was not done.")
                                    
                      VSREASND String               @label("Reason Not Performed")
                                                    @desc("Describes why a measurement or test was not performed.")
                    }
                  }
                `,
              });
            });

            it("compiles without error", () => {
              expect(compiler.diagnostics).toEqual([]);
              expect(compiler.result).toMatchSnapshot();
            });

            it("includes diagnostics if an undefined milestone is referenced", () => {
              compiler.updateFiles({
                "bad.sdsd": `domain "MY DOMAIN" @abbr("MY") { dataset some_dataset @milestone(t"BAD_MILESTONE") {} }`,
              });
              expect(compiler.diagnostics).toMatchInlineSnapshot(`
        Array [
          Object {
            "code": "not_found",
            "defType": "milestone",
            "loc": Object {
              "end": Object {
                "col": 80,
                "line": 1,
              },
              "filename": "bad.sdsd",
              "start": Object {
                "col": 68,
                "line": 1,
              },
            },
            "message": "Could not find milestone with name \\"BAD_MILESTONE\\". Please add it:
        
        milestone BAD_MILESTONE {
          at: t\\"d7 +-2\\"
        }",
            "name": "BAD_MILESTONE",
            "scope": "local",
          },
        ]
        `);
            });

            it("errors if an optional directive has the wrong args", () => {
              compiler.updateFiles({
                "bad.sdsd":
                  'domain "A" @abbr("A") { dataset a { A String @label("A") @desc("A") @sequence("BAD") }}',
              });
              expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "actual": 1,
    "code": "incorrect_number_of_args",
    "expected": 0,
    "loc": Object {
      "end": Object {
        "col": 84,
        "line": 1,
      },
      "filename": "bad.sdsd",
      "start": Object {
        "col": 69,
        "line": 1,
      },
    },
    "message": "Incorrect number of arguments. Expected 0 but got 1.",
    "scope": "local",
  },
]
`);
            });

            it("errors if a unexpected directive is included", () => {
              compiler.updateFiles({
                "bad.sdsd":
                  'domain "A" @abbr("A") { dataset a { A String @label("A") @desc("A") @hehe }}',
              });
              expect(compiler.diagnostics).toMatchInlineSnapshot(`
Array [
  Object {
    "code": "unexpected_directive",
    "loc": Object {
      "end": Object {
        "col": 73,
        "line": 1,
      },
      "filename": "bad.sdsd",
      "start": Object {
        "col": 69,
        "line": 1,
      },
    },
    "message": "Did expect to see directive hehe here.",
    "name": "hehe",
    "scope": "local",
  },
]
`);
            });

            describe("and dataset mappings are added", () => {
              beforeEach(() => {
                compiler.updateFiles({
                  "vs_map.sdsd": `
                    map dataset vs with VSTESTCD as ("HEIGHT", "HR", "TEMP", "WEIGHT") {
                      VSTESTCD from literal \`\`\`json
                        "{{VSTESTCD}}"
                      \`\`\`
                      
                      VSPOS from esource \`\`\`path
                        {{MILESTONE.NAME}}.VS.{{VSTESTCD}}POS
                      \`\`\`
                      
                      VSORRES from esource \`\`\`path
                        {{MILESTONE.NAME}}.VS.{{VSTESTCD}}ORRES
                      \`\`\`
                      
                      VSORRESU from esource \`\`\`path
                        {{MILESTONE.NAME}}.VS.{{VSTESTCD}}ORRESU
                      \`\`\`
                      
                      VSSTRESC from self \`\`\`sql
                        SELECT
                          CASE
                            WHEN vs.VSORRESU = "lbs" THEN vs.VSORRES / 2.2046
                            WHEN vs.VSORRESU = "F" THEN (cs.VSORRES - 32) * .5556
                            ELSE vs.VSORRES
                        FROM vs WHERE VSTESTCD = "{{VSTESTCD}}"
                      \`\`\`
                      
                      VSSTRESN from self \`\`\`sql
                        SELECT vs.VSORRES
                        FROM vs WHERE VSTESTCD = "{{VSTESTCD}}" AND pg_typeof(vs.VSORRES) = "integer"
                      \`\`\`
                      
                      VSSTRESU from self \`\`\`sql
                        SELECT
                          CASE
                            WHEN vs.VSORRESU = "lbs" THEN "kg"
                            WHEN vs.VSORRESU = "F" THEN "C"
                            ELSE vs.VSORRESU
                        FROM vs WHERE VSTESTCD = "{{VSTESTCD}}"
                      \`\`\`
                      
                      VSSTAT from self \`\`\`sql
                        SELECT CAST(vs.VSORRES as BOOLEAN)
                        FROM vs WHERE VSTESTCD = "{{VSTESTCD}}"
                      \`\`\`
                      
                      VSREASND from esource \`\`\`path
                        {{MILESTONE.NAME}}.VS.{{VSTESTCD}}REASND
                      \`\`\`
                    }
                    
                    map dataset vs {
                      VSTESTCD from literal \`\`\`json
                        "BMI"
                      \`\`\`
                      
                      VSPOS from literal \`\`\`json
                        null
                      \`\`\`
                      
                      VSORRES from self as HEIGHT \`\`\`sql
                        SELECT vs.VSSTRESC FROM vs WHERE VSTESTCD = "HEIGHT";
                      \`\`\` from self as WEIGHT \`\`\`sql
                        SELECT vs.VSSTRESC FROM vs WHERE VSTESTCD = "WEIGHT";
                      \`\`\` => \`\`\`python
                        return (WEIGHT / HEIGHT / HEIGHT) * 10000
                      \`\`\`
                      
                      VSORRESU from literal \`\`\`json
                        null
                      \`\`\`
                      
                      VSSTRESC from self \`\`\`sql
                        SELECT VSORRES FROM vs WHERE VSTESTCD = "BMI"
                      \`\`\`
                      
                      VSSTRESN from self \`\`\`sql
                        SELECT VSSTRESC FROM vs WHERE VSTESTCD = "BMI" 
                      \`\`\`
                      
                      VSSTRESU from literal \`\`\`json
                        null
                      \`\`\`
                      
                      VSSTAT from self \`\`\`sql
                        SELECT CAST(VSORRES as BOOLEAN) FROM vs WHERE VSTESTCD = "BMI"
                      \`\`\`
                      
                      VSREASND from literal \`\`\`json
                        null
                      \`\`\`
                    }
                    
                    map dataset vs with VSTESTCD as ("DIABP", "SYSBP") {
                      VSTESTCD from literal \`\`\`json
                        "{{VSTESTCD}}"
                      \`\`\`
                      
                      VSPOS from esource \`\`\`path
                        {{MILESTONE.NAME}}.VS.BPPOS
                      \`\`\`
                      
                      VSORRES from esource \`\`\`path
                        {{MILESTONE.NAME}}.VS.BPORRES.{{VSTESTCD}}
                      \`\`\`
                      
                      VSORRESU from literal \`\`\`json
                        "mmHg"
                      \`\`\`
                      
                      VSSTRESC from self \`\`\`sql
                        SELECT VSORRES FROM vs WHERE VSTESTCD = "{{VSTESTCD}}"
                      \`\`\`
                      
                      VSSTRESN from self \`\`\`sql
                        SELECT VSSTRESC FROM vs WHERE VSTESTCD = "{{VSTESTCD}}"
                      \`\`\`
                      
                      VSSTRESU from self \`\`\`sql
                        SELECT VSORRESU FROM vs WHERE VSTESTCD = "{{VSTESTCD}}"
                      \`\`\`
                      
                      VSSTAT from self \`\`\`sql
                        SELECT CAST(VSORRES as BOOLEAN) FROM vs WHERE VSTESTCD = "{{VSTESTCD}}"
                      \`\`\`
                      
                      VSREASND from esource \`\`\`path
                        {{MILESTONE.NAME}}.VS.BPREASND
                      \`\`\`
                    }
                    
                    map dataset vs_hr {
                      VSTESTCD from literal \`\`\`json
                        "HR"
                      \`\`\`
                    
                      VSORRES from apple_watch \`\`\`sql
                        SELECT AVG(bpm)
                        FROM hr
                        WHERE
                          study_day = {{MILESTONE.STUDY_DAY}}
                          AND hour > {{MILESTONE.HOUR}} - 2
                          AND hour < {{MILESTONE.HOUR}} + 2;
                      \`\`\`
                    
                      VSORRESU from literal \`\`\`json
                        "BPM"
                      \`\`\`
                    
                      VSSTRESC from self \`\`\`sql
                        SELECT VSORRES FROM vs_hr
                      \`\`\`
                    
                      VSSTRESC from self \`\`\`sql
                        SELECT VSORRES FROM vs_hr 
                      \`\`\`
                    
                      VSSTRESU from self \`\`\`sql
                        SELECT VSORRESU FROM vs_hr   
                      \`\`\`
                    
                      VSSTAT from self \`\`\`sql
                        SELECT CAST(VSORRES as BOOLEAN) FROM vs_hr
                      \`\`\`
                    
                      VSREASND from self \`\`\`sql
                        SELECT CASE WHEN VSSTAT IS FALSE THEN "No data collected during time period."
                              ELSE NULL
                              END
                        FROM vs_hr;
                      \`\`\`
                    }
                  `,
                });
              });

              it("compiles without error", () => {
                expect(compiler.diagnostics).toEqual([]);
                expect(compiler.result).toMatchSnapshot();
              });
            });
          });
        });
      });
    });
  });

  describe("order definition", () => {
    let inOrderCompiler: Compiler;
    let fileEntries: [string, string][];

    beforeEach(() => {
      fileEntries = [
        [
          "study.sdsd",
          `
            study {
              id: "MY-STUDY"
              name: "This is my study"
            }
          `,
        ],
        [
          "milestones.sdsd",
          `
            milestone SCREENING {
              at: t"d-14"
            }

            milestone BASELINE {
              at: t"d0"
            }

            milestone CLINIC_1 {
              at: t"d7"
            }

            milestone CLINIC_2 {
              at: t"d14"
            }

            milestone CLOSEOUT {
              at: t"d21"
            }

            milestone EARLY_TERM {
              at: t"> BASELINE"
            }
          `,
        ],
        [
          "codelists.sdsd",
          `
            codelist BodySide {
              LEFT        @desc("Left side of the body")
              RIGHT       @desc("Right side of the body")
            }

            codelist ArmPosition {
              UPPER       @desc("Upper arm position")
              LOWER       @desc("Lower arm position")
            }

            codelist VisitType {
              SCREENING        @desc("A screening visit")
              BASELINE         @desc("A baseline visit")
              TREATMENT        @desc("A visit that occurs during the course of treatment")
              EARLY_WITHDRAWAL @desc("A visit that occurs when the subject exits the study early")
            }
          `,
        ],
        [
          "interfaces.sdsd",
          `
            interface base {
              SUBJID  String                     @subject.id
                                                 @label("Subject id")
                                                 @desc("Identifier for subject in the study")
              SUBJUID String                     @subject.uuid
                                                 @label("Subject universal id")
                                                 @desc("Universal subject id across studies")
            }

            interface visit_base {
              VISTYP VisitType                   @label("The type of visit that occurred")
                                                 @desc("Indicates the category of the visit")
            }
          `,
        ],
        [
          "domains/vs.sdsd",
          `
            domain "VITAL SIGNS" @abbr("VS") {
              dataset vs implements base, visit_base @milestone(t"SCREENING, BASELINE, CLINIC_1, CLINIC_2, CLOSEOUT") {
                VSORRES Integer                  @label("Vital signs result")
                                                 @desc("Result of the vital signs measurement")
                VSBOSI  BodySide                 @label("Body side")
                                                 @desc("The side of the body the measurement was taken on")
                VSPOS   ArmPosition              @label("Arm position")
                                                 @desc("The position of the arm the measurement was taken on")
              }
            }
          `,
        ],
        [
          "domains/vs_map.sdsd",
          `
            map dataset vs {
              VISTYP from literal as VISIT_NAME \`\`\`json
                "{{MILESTONE.NAME}}"
              \`\`\` => \`\`\`python
                if VISIT_NAME == 'SCREENING':
                    return 'SCREENING'
                if VISIT_NAME == 'BASELINE':
                    return 'BASELINE'
                if VISIT_NAME == 'EARLY_TERM':
                    return 'EARLY_WITHDRAWAL'
                return 'TREATMENT'
              \`\`\`

              VSORRES from esource \`\`\`path
                {{MILESTONE.NAME}}.VS.VSORRES
              \`\`\`

              VSBOSI from esource \`\`\`path
                {{MILESTONE.NAME}}.VS.VSBOSI
              \`\`\`

              VSPOS from esource \`\`\`path
                {{MILESTONE.NAME}}.VS.VSPOS
              \`\`\`
            }
          `,
        ],
      ];
      inOrderCompiler = new Compiler({});
      for (const [filename, source] of fileEntries) {
        inOrderCompiler.updateFiles({ [filename]: source });
      }
    });

    it("allows an entire study to be defined in order at once", () => {
      compiler.updateFiles(Object.fromEntries(fileEntries));
      expect(compiler.result).toEqual(inOrderCompiler.result);
      expect(compiler.diagnostics).toEqual([]);
    });

    it("allows an entire study to be defined out of order at the same time", () => {
      compiler.updateFiles(Object.fromEntries([...fileEntries].reverse()));
      expect(compiler.result).toEqual(inOrderCompiler.result);
      expect(compiler.diagnostics).toEqual([]);
    });

    it("allows an entire study to be defined out of order one file at a time", () => {
      for (const [filename, source] of [...fileEntries].reverse()) {
        compiler.updateFiles({ [filename]: source });
      }
      expect(compiler.result).toEqual(inOrderCompiler.result);
      expect(compiler.diagnostics).toEqual([]);
    });

    it("keeps the old results of a file around if parsing fails", () => {
      const prevResult = inOrderCompiler.result;

      // Replace file with invalid parsing
      inOrderCompiler.updateFiles({ "codelists.sdsd": "blah blah blah" });

      expect(inOrderCompiler.result.codelists).toEqual(prevResult.codelists);
    });

    it("compiles a cyclic dependency between two files", () => {
      compiler.updateFiles({
        "study.sdsd": 'study { id: "FOO" name: "BAR" }',
        "milestone_and_map.sdsd": `
          milestone FOO {
            at: t"d0"
          }

          map dataset foo {
            FOO from literal \`\`\`json "{{MILESTONE.NAME}}" \`\`\`
          }
        `,
        "domain.sdsd": `
          domain "FOO" @abbr("FOO") {
            dataset foo @milestone(t"BAR") {
              FOO String @label("Foo") @desc("Foo")
            }
          }
        `,
      });

      expect(compiler.diagnostics.map(({ code }) => code)).toEqual(
        expect.arrayContaining([DiagnosticCode.NOT_FOUND])
      );

      compiler.updateFiles({
        "milestone_and_map.sdsd": `
          milestone BAR {
            at: t"d0"
          }

          map dataset foo {
            FOO from literal \`\`\`json "{{MILESTONE.NAME}}" \`\`\`
          }
        `,
      });
      expect(compiler.diagnostics).toEqual([]);
      expect(compiler.result).toMatchSnapshot();
    });
  });

  describe("auto completion options for keywords", () => {
    let fileEntries: [string, string][];

    beforeEach(() => {
      fileEntries = [
        [
          "study.sdsd",
          `
            study {
              id: "MY-STUDY"
              name: "This is my study"
            }
          `,
        ],
        [
          "milestones.sdsd",
          `
            milestone SCREENING {
              at: t"d-14"
            }

            milestone BASELINE {
              at: t"d0"
            }

            milestone CLINIC_1 {
              at: t"d7"
            }

            milestone CLINIC_2 {
              at: t"d14"
            }

            milestone CLOSEOUT {
              at: t"d21"
            }

            milestone EARLY_TERM {
              at: t"> BASELINE"
            }
          `,
        ],
        [
          "codelists.sdsd",
          `
            codelist BodySide {
              LEFT        @desc("Left side of the body")
              RIGHT       @desc("Right side of the body")
            }

            codelist ArmPosition {
              UPPER       @desc("Upper arm position")
              LOWER       @desc("Lower arm position")
            }

            codelist VisitType {
              SCREENING        @desc("A screening visit")
              BASELINE         @desc("A baseline visit")
              TREATMENT        @desc("A visit that occurs during the course of treatment")
              EARLY_WITHDRAWAL @desc("A visit that occurs when the subject exits the study early")
            }
          `,
        ],
        [
          "interfaces.sdsd",
          `
          interface base {
            USUBJID String   @subject.uuid
                             @label("Unique Subject Identifier")
                             @desc("Identifier used to uniquely identify a subject across all studies.")
        
            SUBJID String    @subject.id
                             @label("Subject Identifier for the Study")
                             @desc("Subject identifier, which is unique within the study.")
          }
        
          interface visit_base {
            VISITNUM Integer @milestone.study_day
                             @label("Visit Number")
                             @desc("Clinical encounter number.")
                             
            VISIT String     @milestone.name
                             @label("Visit Name")
                             @desc("Protocol-defined description of clinical encounter.")
                          
            VISITDY Integer  @milestone.study_day
                             @label("Planned Study Day of Visit")
                             @desc("Planned study day of the visit based upon RFSTDTC in Demographics.")
          }`,
        ],
        [
          "domains/vs_map.sdsd",
          `
              map dataset vs {
                VISTYP from literal as VISIT_NAME \`\`\`json
                  "{{MILESTONE.NAME}}"
                \`\`\` => \`\`\`python
                  if VISIT_NAME == 'SCREENING':
                      return 'SCREENING'
                  if VISIT_NAME == 'BASELINE':
                      return 'BASELINE'
                  if VISIT_NAME == 'EARLY_TERM':
                      return 'EARLY_WITHDRAWAL'
                  return 'TREATMENT'
                \`\`\`

                VSORRES from esource \`\`\`path
                  {{MILESTONE.NAME}}.VS.VSORRES
                \`\`\`

                VSBOSI from esource \`\`\`path
                  {{MILESTONE.NAME}}.VS.VSBOSI
                \`\`\`

                VSPOS from esource \`\`\`path
                  {{MILESTONE.NAME}}.VS.VSPOS
                \`\`\`
              }
            `,
        ],
      ];
      compiler = new Compiler({});
      compiler.updateFiles(Object.fromEntries(fileEntries));
    });

    it("Gets autocomplete items for keywords", () => {
      const result = compiler.getCompletionItems(
        1,
        1,
        `
INVAL
codelist BodySide {
    LEFT        @desc("Left side of the body")
    RIGHT       @desc("Right side of the body")
}

codelist ArmPosition {
    UPPER       @desc("Upper arm position")
    LOWER       @desc("Lower arm position")
}

codelist VisitType {
    SCREENING        @desc("A screening visit")
    BASELINE         @desc("A baseline visit")
    TREATMENT        @desc("A visit that occurs during the course of treatment")
    EARLY_WITHDRAWAL @desc("A visit that occurs when the subject exits the study early")
}
        `
      );
      expect(result).toEqual([
        { label: "study" },
        { label: "milestone" },
        { label: "codelist" },
        { label: "extend" },
        { label: "interface" },
        { label: "domain" },
        { label: "extend" },
        { label: "map" },
      ]);
    });
  });
});
