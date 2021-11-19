import {
  BothWindow,
  DayExpression,
  Document,
  Value,
  Identifier,
  KeyValuePair,
  MilestoneDefinition,
  NegativeWindow,
  PositiveWindow,
  String,
  StudyDay,
  StudyDefinition,
  Timeconf,
  TimeExpression,
  TimeOperator,
  Window,
} from "./astTypes";
import {
  CloseBrToken,
  ColonToken,
  DayToken,
  GteToken,
  GtToken,
  IdentifierToken,
  LteToken,
  LtToken,
  MilestoneToken,
  MinusToken,
  OpenBrToken,
  PlusToken,
  StringToken,
  StudyToken,
  TimeconfendToken,
  TimeconfToken,
} from "./lexer";

type WhiteSpace = null;

export const main = (
  [topLevelDefs]: [MilestoneDefinition | StudyDefinition][],
  loc: number
): Document => ({
  type: "document",
  children: topLevelDefs.flat(),
  loc,
});

export const studyDefinition = ([, study, , , , KeyValuePairs]: [
  WhiteSpace,
  StudyToken,
  WhiteSpace,
  OpenBrToken,
  WhiteSpace,
  KeyValuePair[],
  WhiteSpace,
  CloseBrToken,
  WhiteSpace
]): StudyDefinition => ({
  type: "study-definition",
  loc: study.offset,
  children: KeyValuePairs,
});

export const milestoneDefinition = ([
  ,
  milestone,
  ,
  name,
  ,
  ,
  ,
  keyValuePairs,
]: [
  WhiteSpace,
  MilestoneToken,
  WhiteSpace,
  Identifier,
  WhiteSpace,
  OpenBrToken,
  WhiteSpace,
  KeyValuePair[],
  WhiteSpace,
  CloseBrToken,
  WhiteSpace
]): MilestoneDefinition => ({
  type: "milestone-definition",
  loc: milestone.offset,
  name,
  children: keyValuePairs,
});

export const keyValuePair = ([identifier, , , , string]: [
  Identifier,
  WhiteSpace,
  ColonToken,
  WhiteSpace,
  String,
  WhiteSpace
]): KeyValuePair => ({
  type: "key-value-pair",
  loc: identifier.loc,
  lhs: identifier,
  rhs: string,
});

export const value = ([[expression]]: [Value][]): Value => expression;

export const identifier = ([token]: [IdentifierToken]): Identifier => ({
  type: "identifier",
  loc: token.offset,
  value: token.toString(),
});

export const timeconf = ([timeconf, , [value]]: [
  TimeconfToken,
  WhiteSpace,
  [StudyDay | TimeExpression],
  WhiteSpace,
  TimeconfendToken
]): Timeconf => ({ type: "timeconf", loc: timeconf.offset, value });

export const studyDay = ([day, window]: [
  DayExpression,
  [WhiteSpace, Window] | null
]): StudyDay => ({
  type: "study-day",
  loc: day.loc,
  day,
  window: window?.[1] ?? null,
});

export const window = ([windows]: [
  [
    | PositiveWindow
    | NegativeWindow
    | BothWindow
    | [PositiveWindow, WhiteSpace, NegativeWindow]
    | [NegativeWindow, WhiteSpace, PositiveWindow]
  ]
]): Window => {
  const window = windows.flat().filter((window) => window != null);

  return {
    type: "window",
    loc: window[0]!.loc,
    window: window as Window["window"],
  };
};

export const positiveWindow = ([plus, day]: [
  PlusToken,
  DayExpression
]): PositiveWindow => ({
  type: "positive-window",
  operator: "+",
  loc: plus.offset,
  days: day,
});

export const negativeWindow = ([minus, day]: [
  MinusToken,
  DayExpression
]): NegativeWindow => ({
  type: "negative-window",
  operator: "-",
  loc: minus.offset,
  days: day,
});

export const bothWindow = ([plus, , day]: [
  PlusToken,
  MinusToken,
  DayExpression
]): BothWindow => ({
  type: "both-window",
  operator: "+-",
  loc: plus.offset,
  days: day,
});

export const day = ([token]: [DayToken]): DayExpression => ({
  type: "day-expression",
  loc: token.offset,
  unit: "day",
  value: parseInt(token.toString().slice(1)),
});

export const timeExpression = ([operator, , rhs]: [
  TimeOperator,
  WhiteSpace,
  Identifier
]): TimeExpression => ({
  type: "time-expression",
  loc: operator.loc,
  operator,
  rhs,
});

export const timeOperator = ([[token]]: [
  [GtToken | LtToken | GteToken | LteToken]
]): TimeOperator => ({
  type: "time-operator",
  loc: token.offset,
  value: token.value,
});

export const string = ([token]: [StringToken]): String => ({
  type: "string",
  loc: token.offset,
  value: token.value.substring(1, token.value.length - 1),
});

export const _ = () => null;

export const __ = () => null;
