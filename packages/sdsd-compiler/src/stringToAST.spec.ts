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
});
