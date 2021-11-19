import moo, { Rules, Token } from "moo";

export type StudyToken = Token;
export type OpenBrToken = Token;
export type CloseBrToken = Token;
export type MilestoneToken = Token;
export type ColonToken = Token;
export type IdentifierToken = Token;
export type StringToken = Token;
export type TimeconfToken = Token;
export type DayToken = Token;
export type PlusToken = Token;
export type MinusToken = Token;
export type GtToken = Token & { type: "gt"; value: ">" };
export type LtToken = Token & { type: "lt"; value: "<" };
export type GteToken = Token & { type: "gte"; value: ">=" };
export type LteToken = Token & { type: "lte"; value: "<=" };
export type TimeconfendToken = Token;

const identifier: Rules[string] = /[a-zA-Z$_][a-zA-Z0-9$_.]*/;

export const lexer = moo.states({
  main: {
    string: /"(?:\\["bfnrt\/\\]|\\u[a-fA-F0-9]{4}|[^"\\])*"/,
    timeconf: { match: 't"', push: "timeconf" },
    openbr: "{",
    closebr: "}",
    colon: ":",
    keyword: ["study", "milestone"],
    identifier,
    ws: { match: /[ \t\n]+/, lineBreaks: true },
  },
  timeconf: {
    day: /d-?[0-9]+/,
    identifier,
    plus: "+",
    minus: "-",
    gt: ">",
    lt: "<",
    gte: ">=",
    lte: "<=",
    ws: /[ \t]+/,
    timeconfend: { match: '"', pop: 1 },
  },
});
