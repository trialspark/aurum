import { Token } from "moo";
import { Loc } from "./astTypes";

export const tokenToLoc = (token: Token): Loc => ({
  start: { line: token.line, col: token.col },
  end: {
    line: token.line + token.lineBreaks,
    col: (() => {
      if (token.lineBreaks > 0) {
        // This token spans multiple lines so we want to only get the col at the end of the last line
        const lastLine = token.value.match(/.*$/)![0];

        return lastLine.length;
      }

      return token.col + token.value.length - 1;
    })(),
  },
});
