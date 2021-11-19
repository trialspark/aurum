import moo, { Token } from "moo";

export type StudyToken = Token;
export type OpenBrToken = Token;
export type CloseBrToken = Token;
export type MilestoneToken = Token;
export type ColonToken = Token;
export type IdentifierToken = Token;
export type StringToken = Token;

export const lexer = moo.compile({
  string: /"(?:\\["bfnrt\/\\]|\\u[a-fA-F0-9]{4}|[^"\\])*"/,
  openbr: "{",
  closebr: "}",
  colon: ":",
  keyword: ["study", "milestone"],
  identifier: /[a-zA-Z$_][a-zA-Z0-9$_.]*/,
  ws: { match: /[ \t\n]+/, lineBreaks: true },
});
