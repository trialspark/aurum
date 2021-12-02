import { Compiler, CompilerErrorCode, CompilerErrorScope } from ".";

describe("Compiler", () => {
  let compiler: Compiler;

  beforeEach(() => {
    compiler = new Compiler({});
  });

  it("exists", () => {
    expect(compiler).toEqual(expect.any(Compiler));
  });

  it("requires a study definition initially", () => {
    expect(compiler.errors).toMatchSnapshot();
  });

  describe("when a study definition is added", () => {
    beforeEach(() => {
      compiler.set(
        "study.sdsd",
        `
          study {
            id: "MY-STUDY"
            name: "Longer version of my study"
          }
        `
      );
    });

    it("compiles without error", () => {
      expect(compiler.errors).toEqual([]);
      expect(compiler.result).toMatchSnapshot();
    });

    it("errors when the study definition is removed", () => {
      compiler.set("study.sdsd", null);
      expect(compiler.errors).toMatchSnapshot();
    });

    describe("and some milestones are added", () => {
      beforeEach(() => {
        compiler.set(
          "milestones.sdsd",
          `
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
          `
        );
      });

      it("compiles without error", () => {
        expect(compiler.errors).toEqual([]);
        expect(compiler.result).toMatchSnapshot();
      });

      it("can add milestones in a separate file", () => {
        compiler.set(
          "milestones2.sdsd",
          `
            milestone CLOSEOUT {
              at: t"d28"
            }
          `
        );
        expect(compiler.errors).toEqual([]);
        expect(compiler.result).toMatchSnapshot();
      });

      it("can remove milestones", () => {
        compiler.set(
          "milestones.sdsd",
          `
            milestone CLOSEOUT {
              at: t"d28"
            }
          `
        );
        expect(compiler.errors).toEqual([]);
        expect(compiler.result).toMatchSnapshot();
      });

      describe("and some interfaces are added", () => {
        beforeEach(() => {
          compiler.set(
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
                VISITNUM Integer @milestone.number
                                 @label("Visit Number")
                                 @desc("Clinical encounter number.")
                                 
                VISIT String     @milestone.id
                                 @label("Visit Name")
                                 @desc("Protocol-defined description of clinical encounter.")
                              
                VISITDY Integer  @milestone.day
                                 @label("Planned Study Day of Visit")
                                 @desc("Planned study day of the visit based upon RFSTDTC in Demographics.")
              }
            `
          );
        });

        describe("and some codelists are added", () => {
          beforeEach(() => {
            compiler.set(
              "codelists.sdsd",
              `
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
              `
            );
          });

          it("compiles without error", () => {
            expect(compiler.errors).toEqual([]);
            expect(compiler.result).toMatchSnapshot();
          });

          describe("and a domain is added", () => {
            beforeEach(() => {
              compiler.set(
                "vs.sdsd",
                `
                  domain "VITAL SIGNS" @abbr("VS") {
                    dataset vs implements base, visit_base @milestone(t"BASELINE, CLINIC_1, CLINIC_2, CLINIC_3, CLINIC_4") {
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
                      VISITDY Integer               @milestone.day
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
                `
              );
            });

            it("compiles without error", () => {
              expect(compiler.errors).toEqual([]);
              expect(compiler.result).toMatchSnapshot();
            });
          });
        });
      });
    });
  });
});