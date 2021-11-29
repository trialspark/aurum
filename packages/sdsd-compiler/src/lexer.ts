import moo, { Rules, Token } from "moo";

import { TokenSkippingLexer } from "./tokenSkippingLexer";

export type StudyToken = Token & { type: "study" };
export type OpenBrToken = Token & { type: "openbr" };
export type CloseBrToken = Token & { type: "closebr" };
export type MilestoneToken = Token & { type: "milestone" };
export type ColonToken = Token & { type: "colon" };
export type IdentifierToken = Token & { type: "identifier" };
export type StringToken = Token & { type: "string" };
export type TimeconfToken = Token & { type: "timeconf" };
export type DayToken = Token & { type: "day" };
export type PlusToken = Token & { type: "plus" };
export type MinusToken = Token & { type: "minus" };
export type GtToken = Token & { type: "gt"; value: ">" };
export type LtToken = Token & { type: "lt"; value: "<" };
export type GteToken = Token & { type: "gte"; value: ">=" };
export type LteToken = Token & { type: "lte"; value: "<=" };
export type TimeconfendToken = Token & { type: "timeconfend" };
export type InterfaceToken = Token & { type: "interface" };
export type DirectiveToken = Token & { type: "directive" };
export type DotToken = Token & { type: "dot" };
export type OpenParenToken = Token & { type: "openparen" };
export type CloseParenToken = Token & { type: "closeparen" };
export type CommaToken = Token & { type: "comma" };
export type CodelistToken = Token & { type: "codelist" };
export type DomainToken = Token & { type: "domain" };
export type DatasetToken = Token & { type: "dataset" };
export type ImplementsToken = Token & { type: "implements" };
export type QuestionToken = Token & { type: "question" };
export type PipeToken = Token & { type: "pipe" };
export type ThruToken = Token & { type: "thru" };
export type AtToken = Token & { type: "at" };
export type HourToken = Token & { type: "hour" };
export type ExtendToken = Token & { type: "extend" };

const identifier: Rules[string] = /[a-zA-Z$_][a-zA-Z0-9$_]*/;

export const lexer = new TokenSkippingLexer(
  moo.states({
    main: {
      string: {
        match: /"(?:\\["bfnrt\/\\]|\\u[a-fA-F0-9]{4}|[^"\\])*"/,
        lineBreaks: true,
      },
      directive: /@[a-zA-Z][a-zA-Z.]*/,
      timeconf: { match: 't"', push: "timeconf" },
      openbr: "{",
      closebr: "}",
      openparen: "(",
      closeparen: ")",
      colon: ":",
      dot: ".",
      comma: ",",
      question: "?",
      pipe: "|",
      keyword: [
        "study",
        "milestone",
        "interface",
        "codelist",
        "domain",
        "dataset",
        "implements",
        "extend",
      ],
      identifier,
      ws: { match: /[ \t\n]+/, lineBreaks: true },
    },
    timeconf: {
      keyword: ["at"],
      day: /d-?[0-9]+/,
      hour: /h[0-9]+/,
      identifier,
      thru: "->",
      comma: ",",
      plus: "+",
      minus: "-",
      gt: ">",
      lt: "<",
      gte: ">=",
      lte: "<=",
      ws: /[ \t]+/,
      timeconfend: { match: '"', pop: 1 },
    },
  }),
  ["ws"]
);
