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
  Args,
  Directive,
  ColumnDefinition,
  InterfaceDefinition,
  CodelistMember,
  CodelistDefinition,
  TimeValue,
  TimeList,
  TypeExpressionMember,
  TypeExpression,
} from "./astTypes";
import {
  CloseBrToken,
  CloseParenToken,
  CodelistToken,
  ColonToken,
  CommaToken,
  DayToken,
  DirectiveToken,
  GteToken,
  GtToken,
  IdentifierToken,
  InterfaceToken,
  LteToken,
  LtToken,
  MilestoneToken,
  MinusToken,
  OpenBrToken,
  OpenParenToken,
  PipeToken,
  PlusToken,
  QuestionToken,
  StringToken,
  StudyToken,
  TimeconfendToken,
  TimeconfToken,
} from "./lexer";

type WhiteSpace = null;

export const main = (
  [topLevelDefs]: [
    | MilestoneDefinition
    | StudyDefinition
    | InterfaceDefinition
    | CodelistDefinition
  ][],
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

export const interfaceDefinition = ([, iface, , name, , , , columns]: [
  WhiteSpace,
  InterfaceToken,
  WhiteSpace,
  Identifier,
  WhiteSpace,
  OpenBrToken,
  WhiteSpace,
  ColumnDefinition[],
  WhiteSpace,
  CloseBrToken,
  WhiteSpace
]): InterfaceDefinition => ({
  type: "interface-definition",
  loc: iface.offset,
  name,
  columns,
});

export const codelistDefinition = ([, codelist, , name, , , , members]: [
  WhiteSpace,
  CodelistToken,
  WhiteSpace,
  Identifier,
  WhiteSpace,
  OpenBrToken,
  WhiteSpace,
  CodelistMember[],
  WhiteSpace,
  CloseBrToken,
  WhiteSpace
]): CodelistDefinition => ({
  type: "codelist-definition",
  loc: codelist.offset,
  name,
  members: members,
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

export const columnDefinition = ([columnName, , columnType, , directives]: [
  Identifier,
  WhiteSpace,
  Identifier,
  WhiteSpace,
  Directive[]
]): ColumnDefinition => ({
  type: "column-definition",
  loc: columnName.loc,
  columnName: columnName,
  columnType,
  directives,
});

export const codelistMember = ([[name], , directives]: [
  [String | Identifier],
  WhiteSpace,
  Directive[]
]): CodelistMember => ({
  type: "codelist-member",
  loc: name.loc,
  name,
  directives,
});

export const directive = ([, directive, optionalArgs]: [
  WhiteSpace,
  DirectiveToken,
  [OpenParenToken, Args | null, CloseParenToken] | null,
  WhiteSpace
]): Directive => ({
  type: "directive",
  loc: directive.offset,
  name: directive.value.slice(1),
  args: optionalArgs?.[1] ?? null,
});

export const typeExpression = ([firstMembers, lastMember]: [
  [TypeExpressionMember, WhiteSpace, PipeToken, WhiteSpace][],
  TypeExpressionMember
]): TypeExpression => {
  const members = [...firstMembers.map(([member]) => member), lastMember];

  return {
    type: "type-expression",
    loc: members[0].loc,
    members,
  };
};

export const typeExpressionMember = ([identifier, question]: [
  Identifier,
  QuestionToken | null
]): TypeExpressionMember => ({
  type: "type-expression-member",
  loc: identifier.loc,
  value: identifier,
  optional: !!question,
});

export const value = ([[expression]]: [Value][]): Value => expression;

export const identifier = ([token]: [IdentifierToken]): Identifier => ({
  type: "identifier",
  loc: token.offset,
  value: token.toString(),
});

export const args = ([, [nthArgs, lastArgValue]]: [
  WhiteSpace,
  [
    [Value, WhiteSpace, CommaToken, WhiteSpace][],
    Value,
    WhiteSpace,
    CommaToken | null
  ],
  WhiteSpace
]): Args => {
  const args = [...nthArgs.map(([value]) => value), lastArgValue];

  return {
    type: "args",
    loc: args[0].loc,
    args,
  };
};

export const timeconf = ([timeconf, , [value]]: [
  TimeconfToken,
  WhiteSpace,
  [TimeList | TimeExpression],
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

export const timeList = ([firstArgs, lastArg]: [
  [TimeValue, WhiteSpace, CommaToken, WhiteSpace][],
  [TimeValue, WhiteSpace, CommaToken | null] | null
]): TimeList => {
  const items = [
    ...firstArgs.map(([value]) => value),
    ...(lastArg ? [lastArg[0]] : []),
  ];

  return {
    type: "time-list",
    loc: items[0]?.loc,
    items,
  };
};

export const timeValue = ([[value]]: [[StudyDay | Identifier]]): TimeValue =>
  value;

export const string = ([token]: [StringToken]): String => ({
  type: "string",
  loc: token.offset,
  value: token.value
    .substring(1, token.value.length - 1)
    .replace(/\\"/g, '"')
    .replace(/\n\s*/g, " "),
});

export const _ = () => null;

export const __ = () => null;
