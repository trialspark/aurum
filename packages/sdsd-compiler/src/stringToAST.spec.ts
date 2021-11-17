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
          at: "d-14 +d14 -d10"
        }
        
        milestone BASELINE {
          at: "d0"
        }
        
        milestone CLINIC_1 {
          at: "d7 +-d4"
        }
        
        milestone CLINIC_2 {
          at: "d14 +-d4"
        }
        
        milestone CLINIC_3 {
          at: "d21 +-d3"
        }
        
        milestone CLINIC_4 {
          day: "d28 +-d4"
        }
        
        milestone CLOSEOUT {
          day: "d35 +d2 -d4"
        }
        
        milestone EARLY_TERM {
          day: "> BASELINE"
        }
    `)
    ).toMatchSnapshot();
  });
});
