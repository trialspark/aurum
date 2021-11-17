import grammar from "./sdsd.ne";
import { Parser, Grammar } from "nearley";

export const stringToAST = (source: string) => {
  return new Parser(Grammar.fromCompiled(grammar)).feed(source).results[0];
};
