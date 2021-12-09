import grammar from "./sdsd.ne";
import { Parser, Grammar } from "nearley";
import { Token } from "moo";
import { Loc } from "./astTypes";
import { tokenToLoc } from "./utils";

interface NearleyParseError extends Error {
  token: Token;
  offset: number;
}

const isNearlyParseError = (value: any): value is NearleyParseError =>
  typeof value?.token === "object" &&
  typeof value?.offset === "number" &&
  value instanceof Error;

const tryCreateParseErrorFromLexerError = (
  source: string,
  error: unknown
): ParseError | null => {
  if (!(error instanceof Error)) {
    return null;
  }

  const lineColMatch = error.message.match(
    /invalid syntax at line (\d+) col (\d+)/
  );

  if (!lineColMatch) {
    return null;
  }

  const line = parseInt(lineColMatch[1]);
  const col = parseInt(lineColMatch[2]);
  const invalidChar = source.split("\n")[line - 1][col - 1];

  return new ParseError(source, invalidChar, {
    start: { line, col },
    end: { line, col },
  });
};

export class ParseError extends Error {
  constructor(source: string, invalidChar: string, public loc: Loc) {
    super(
      `Syntax error on line ${loc.start.line} col ${loc.start.col}:\n` +
        "\n" +
        `${source.split("\n")[loc.start.line - 1]}\n` +
        `${new Array(loc.start.col).join(" ")}^\n` +
        "\n" +
        `Unexpected token: "${invalidChar}".`
    );
    ParseError.captureStackTrace(this);
    Object.setPrototypeOf(this, ParseError.prototype);
  }
}

export const stringToAST = (source: string) => {
  try {
    const { results } = new Parser(Grammar.fromCompiled(grammar)).feed(source);

    return results[0];
  } catch (error) {
    const parseError = isNearlyParseError(error)
      ? new ParseError(source, error.token.value, tokenToLoc(error.token))
      : tryCreateParseErrorFromLexerError(source, error);

    if (parseError) {
      throw parseError;
    }

    throw error;
  }
};
