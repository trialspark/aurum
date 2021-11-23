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
  HourExpression,
  TimeRange,
  IdentifierList,
  DatasetDefinition,
  DomainChild,
  DomainDefinition,
} from "./astTypes";
import {
  AtToken,
  CloseBrToken,
  CloseParenToken,
  CodelistToken,
  ColonToken,
  CommaToken,
  DatasetToken,
  DayToken,
  DirectiveToken,
  DomainToken,
  GteToken,
  GtToken,
  HourToken,
  IdentifierToken,
  ImplementsToken,
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
  ThruToken,
  TimeconfendToken,
  TimeconfToken,
} from "./lexer";

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

export const studyDefinition = ([study, , KeyValuePairs]: [
  StudyToken,
  OpenBrToken,
  KeyValuePair[],
  CloseBrToken
]): StudyDefinition => ({
  type: "study-definition",
  loc: study.offset,
  children: KeyValuePairs,
});

export const milestoneDefinition = ([milestone, name, , keyValuePairs]: [
  MilestoneToken,
  Identifier,
  OpenBrToken,
  KeyValuePair[],
  CloseBrToken
]): MilestoneDefinition => ({
  type: "milestone-definition",
  loc: milestone.offset,
  name,
  children: keyValuePairs,
});

export const interfaceDefinition = ([iface, name, , columns]: [
  InterfaceToken,
  Identifier,
  OpenBrToken,
  ColumnDefinition[],
  CloseBrToken
]): InterfaceDefinition => ({
  type: "interface-definition",
  loc: iface.offset,
  name,
  columns,
});

export const codelistDefinition = ([codelist, name, , members]: [
  CodelistToken,
  Identifier,
  OpenBrToken,
  CodelistMember[],
  CloseBrToken
]): CodelistDefinition => ({
  type: "codelist-definition",
  loc: codelist.offset,
  name,
  members: members,
});

export const domainDefinition = ([domain, [name], directives, , children]: [
  DomainToken,
  [String | Identifier],
  Directive[],
  OpenBrToken,
  DomainChild[],
  CloseBrToken
]): DomainDefinition => ({
  type: "domain-definition",
  loc: domain.offset,
  name,
  directives,
  children,
});

export const domainChildren = ([children]: [
  [DatasetDefinition][]
]): DomainChild[] => children.flat();

export const datasetDefinition = ([
  dataset,
  name,
  interfaces,
  directives,
  ,
  columns,
]: [
  DatasetToken,
  Identifier,
  [ImplementsToken, IdentifierList] | null,
  Directive[],
  OpenBrToken,
  ColumnDefinition[],
  CloseBrToken
]): DatasetDefinition => ({
  type: "dataset-definition",
  loc: dataset.offset,
  name,
  interfaces: interfaces?.[1] ?? null,
  directives,
  columns,
});

export const keyValuePair = ([identifier, , string]: [
  Identifier,
  ColonToken,
  String
]): KeyValuePair => ({
  type: "key-value-pair",
  loc: identifier.loc,
  lhs: identifier,
  rhs: string,
});

export const columnDefinition = ([columnName, columnType, directives]: [
  Identifier,
  Identifier,
  Directive[]
]): ColumnDefinition => ({
  type: "column-definition",
  loc: columnName.loc,
  columnName: columnName,
  columnType,
  directives,
});

export const codelistMember = ([[name], directives]: [
  [String | Identifier],
  Directive[]
]): CodelistMember => ({
  type: "codelist-member",
  loc: name.loc,
  name,
  directives,
});

export const directive = ([directive, optionalArgs]: [
  DirectiveToken,
  [OpenParenToken, Args | null, CloseParenToken] | null
]): Directive => ({
  type: "directive",
  loc: directive.offset,
  name: directive.value.slice(1),
  args: optionalArgs?.[1] ?? null,
});

export const typeExpression = ([firstMembers, lastMember]: [
  [TypeExpressionMember, PipeToken][],
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

export const args = ([nthArgs, lastArgValue]: [
  [Value, CommaToken][],
  Value,
  CommaToken | null
]): Args => {
  const args = [...nthArgs.map(([value]) => value), lastArgValue];

  return {
    type: "args",
    loc: args[0].loc,
    args,
  };
};

export const identifierList = ([args, last]: [
  [Identifier, CommaToken][],
  Identifier,
  CommaToken | null
]): IdentifierList => {
  const identifiers = [...args.map(([value]) => value), last];

  return {
    type: "identifier-list",
    loc: identifiers[0].loc,
    identifiers,
  };
};

export const timeconf = ([timeconf, [value]]: [
  TimeconfToken,
  [TimeList | TimeExpression],
  TimeconfendToken
]): Timeconf => ({ type: "timeconf", loc: timeconf.offset, value });

export const studyDay = ([day, window]: [
  DayExpression,
  Window | null
]): StudyDay => ({
  type: "study-day",
  loc: day.loc,
  day,
  window,
});

export const window = ([windows]: [
  [
    | PositiveWindow
    | NegativeWindow
    | BothWindow
    | [PositiveWindow, NegativeWindow]
    | [NegativeWindow, PositiveWindow]
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

export const hour = ([token]: [HourToken]): HourExpression => ({
  type: "study-hour",
  loc: token.offset,
  unit: "hour",
  value: parseInt(token.value.slice(1)),
});

export const timeExpression = ([operator, rhs]: [
  TimeOperator,
  TimeValue
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

export const timeRange = ([start, , end]: [
  TimeValue,
  ThruToken,
  TimeValue
]): TimeRange => ({
  type: "time-range",
  loc: start.loc,
  start,
  end,
});

export const timeList = ([items, at]: [
  TimeList["items"],
  [AtToken, HourExpression[]] | null
]): TimeList => ({
  type: "time-list",
  loc: items[0]?.loc,
  items,
  at: at?.[1] ?? null,
});

export const timeListMembers = ([firstArgs, lastArg]: [
  [TimeValue, CommaToken][],
  TimeValue,
  CommaToken | null
]): TimeValue[] => {
  return [...firstArgs.map(([value]) => value), lastArg];
};

export const hoursListMembers = ([args, lastArg]: [
  [HourExpression, CommaToken][],
  HourExpression,
  CommaToken | null
]): HourExpression[] => [...args.map(([value]) => value), lastArg];

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
