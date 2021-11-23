import grammar from "./sdsd.ne";
import { Parser, Grammar } from "nearley";

export const stringToAST = (source: string) => {
  const { results } = new Parser(Grammar.fromCompiled(grammar)).feed(source);

  return results[0];
};
