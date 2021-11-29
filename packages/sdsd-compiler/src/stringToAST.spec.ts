import { stringToAST } from ".";

describe("stringToAST()", () => {
  it("converts study metadata", () => {
    expect(
      stringToAST(`
        study {
          id: "TER101-AD-201"
          name: "Teres Atopic Derm Phase 2a"
        }
      `)
    ).toMatchSnapshot();
  });

  it("converts milestone definitions", () => {
    expect(
      stringToAST(`
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
        
        milestone CLINIC_4 {
          day: t"d28 +-d4"
        }
        
        milestone CLOSEOUT {
          day: t"d35 +d2 -d4"
        }
        
        milestone EARLY_TERM {
          day: t"> BASELINE"
        }
    `)
    ).toMatchSnapshot();
  });

  it("converts interface definitions", () => {
    expect(
      stringToAST(`
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
      `)
    ).toMatchSnapshot();
  });

  it("converts codelists", () => {
    expect(
      stringToAST(`
        codelist Race {
          "AMERICAN INDIAN OR ALASKA NATIVE"          @desc("A person having origins in any of the original peoples
                                                             of North and South America (including Central America),
                                                             and who maintains tribal affiliation or community attachment.")
          ASIAN                                       @desc("A person having origins in any of the original peoples of the Far
                                                             East, Southeast Asia, or the Indian subcontinent including, for example,
                                                             Cambodia, China, India, Japan, Korea, Malaysia, Pakistan, the Philippine Islands,
                                                             Thailand, and Vietnam.")
          "BLACK OR AFRICAN AMERICAN"                 @desc("A person having origins in any of the black racial groups of Africa. Terms such
                                                             as \\"Haitian\\" or \\"Negro\\" can be used in addition to \\"Black or African American.\\"")
          "NATIVE HAWAIIAN OR OTHER PACIFIC ISLANDER" @desc("Denotes a person having origins in any of the original peoples of Hawaii,
                                                             Guam, Samoa, or other Pacific Islands. The term covers particularly people
                                                             who identify themselves as part-Hawaiian, Native Hawaiian, Guamanian
                                                             or Chamorro, Carolinian, Samoan, Chuu.")
          "NOT REPORTED"                              @desc("Not provided or available.")
          UNKNOWN                                     @desc("Not known, not observed, not recorded, or refused.")
          WHITE                                       @desc("Denotes a person with European, Middle Eastern, or North African ancestral
                                                             origin who identifies, or is identified, as White.")
        }
        
        codelist Ethnicity {
          "HISPANIC OR LATINO"     @desc("A person of Mexican, Puerto Rican, Cuban, Central or South American
                                          or other Spanish culture or origin, regardless of race.")
          "NOT HISPANIC OR LATINO" @desc("A person not of Cuban, Mexican, Puerto Rican, South or Central American,
                                          or other Spanish culture or origin, regardless of race.")
          "NOT REPORTED"           @desc("Not provided or available.")
          UNKNOWN                  @desc("Not known, not observed, not recorded, or refused.")
        }
      `)
    ).toMatchSnapshot();
  });

  it("converts a domain and datasets", () => {
    expect(
      stringToAST(`
        domain "VITAL SIGNS" @abbr("DM") {
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
          
          dataset vs_hr implements base @milestone(t"BASELINE -> CLOSEOUT at h8, h15, h19") {
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
      `)
    ).toMatchSnapshot();
  });

  it("supports implementing datasets via a path", () => {
    expect(
      stringToAST(`domain VS { dataset vs implements sdtm.vs.vs {} }`)
    ).toMatchSnapshot();
  });

  it("supports extending a codelist", () => {
    expect(
      stringToAST(`
        extend codelist sdtm.vs.Race {
          ALPHA        @desc("Extend with alpha")
          BRAVO        @desc("Extend with bravo")
        }
      `)
    ).toMatchSnapshot();
  });

  it("supports extending a domain/dataset", () => {
    expect(
      stringToAST(`
        extend domain "VITAL SIGNS" @abbr("VS") {
          extend dataset vs implements base {
            NEWCOL String    @label("New column")
                             @desc("New column description")

            NEWCOL2 String   @label("Second new column")
                             @desc("Second new column description")
          }

          dataset new_vs implements base, visit_base {
            NEWCOL String    @label("New column")
                             @desc("New column description")

            NEWCOL2 String   @label("Second new column")
                             @desc("Second new column description")
          }
        }
      `)
    ).toMatchSnapshot();
  });
});
