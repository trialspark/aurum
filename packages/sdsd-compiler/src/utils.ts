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

export const unreachable = (value: never) => true;

export const setFirst = <O extends object, K extends keyof O, V extends O[K]>(
  object: O,
  keys: K[],
  value: V
) => {
  for (const key of keys) {
    if (object[key] == null) {
      object[key] = value;
      return;
    }
  }
};

export type ObjectValues<O extends object> = O[keyof O];

export const atLeastOne = <A extends any[], D>(
  array: A | undefined,
  defaultMember: D
): (A[number] | D)[] => (array?.length ? array : [defaultMember]);
