import { last, min } from "lodash";
import { Token } from "moo";
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
  Path,
  PathList,
  CodelistExtension,
  DomainExtension,
  DatasetExtension,
  DomainExtensionChild,
  DatasetMapping,
  SourceCode,
  ColumnMappingSource,
  ColumnMapping,
  VariableMapping,
} from "./astTypes";
import {
  ArrowToken,
  AsToken,
  AtToken,
  CloseBrToken,
  CloseParenToken,
  CodeblockToken,
  CodelistToken,
  ColonToken,
  CommaToken,
  DatasetToken,
  DayToken,
  DirectiveToken,
  DomainToken,
  DotToken,
  EndcodeblockToken,
  ExtendToken,
  FromToken,
  GteToken,
  GtToken,
  HourToken,
  IdentifierToken,
  ImplementsToken,
  InterfaceToken,
  LteToken,
  LtToken,
  MapToken,
  MilestoneToken,
  MinusToken,
  OpenBrToken,
  OpenParenToken,
  PipeToken,
  PlusToken,
  QuestionToken,
  SourcecodeToken,
  StringToken,
  StudyToken,
  ThruToken,
  TimeconfendToken,
  TimeconfToken,
  WithToken,
} from "./lexer";
import { tokenToLoc } from "./utils";

export const main = ([topLevelDefs]: [
  | MilestoneDefinition
  | StudyDefinition
  | InterfaceDefinition
  | CodelistDefinition
  | CodelistExtension
  | DomainDefinition
  | DomainExtension
][]): Document => {
  const children = topLevelDefs.flat();

  return {
    type: "document",
    children,
    loc: {
      start: children[0]?.loc.start ?? { col: 0, line: 0 },
      end: last(children)?.loc.end ?? { col: 0, line: 0 },
    },
    accept(visitor): any {
      return visitor.visit(this);
    },
  };
};

export const studyDefinition = ([study, , KeyValuePairs, closebr]: [
  StudyToken,
  OpenBrToken,
  KeyValuePair[],
  CloseBrToken
]): StudyDefinition => ({
  type: "study-definition",
  loc: {
    start: tokenToLoc(study).start,
    end: tokenToLoc(closebr).end,
  },
  children: KeyValuePairs,
  accept(visitor): any {
    return visitor.visitStudyDefinition(this);
  },
});

export const milestoneDefinition = ([
  milestone,
  name,
  ,
  keyValuePairs,
  closebr,
]: [
  MilestoneToken,
  Identifier,
  OpenBrToken,
  KeyValuePair[],
  CloseBrToken
]): MilestoneDefinition => ({
  type: "milestone-definition",
  loc: {
    start: tokenToLoc(milestone).start,
    end: tokenToLoc(closebr).end,
  },
  name,
  children: keyValuePairs,
  accept(visitor): any {
    return visitor.visitMilestoneDefinition(this);
  },
});

export const interfaceDefinition = ([iface, name, , columns, closebr]: [
  InterfaceToken,
  Identifier,
  OpenBrToken,
  ColumnDefinition[],
  CloseBrToken
]): InterfaceDefinition => ({
  type: "interface-definition",
  loc: {
    start: tokenToLoc(iface).start,
    end: tokenToLoc(closebr).end,
  },
  name,
  columns,
  accept(visitor): any {
    return visitor.visitInterfaceDefinition(this);
  },
});

export const codelistDefinition = ([codelist, name, , members, closebr]: [
  CodelistToken,
  Identifier,
  OpenBrToken,
  CodelistMember[],
  CloseBrToken
]): CodelistDefinition => ({
  type: "codelist-definition",
  loc: {
    start: tokenToLoc(codelist).start,
    end: tokenToLoc(closebr).end,
  },
  name,
  members: members,
  accept(visitor): any {
    return visitor.visitCodelistDefinition(this);
  },
});

export const codelistExtension = ([extend, , path, , members, closebr]: [
  ExtendToken,
  CodelistToken,
  Path,
  OpenBrToken,
  CodelistMember[],
  CloseBrToken
]): CodelistExtension => ({
  type: "codelist-extension",
  loc: { start: tokenToLoc(extend).start, end: tokenToLoc(closebr).end },
  extends: path,
  members,
  accept(visitor): any {
    return visitor.visitCodelistExtension(this);
  },
});

export const domainDefinition = ([
  domain,
  [name],
  directives,
  ,
  children,
  closebr,
]: [
  DomainToken,
  [String | Identifier],
  Directive[],
  OpenBrToken,
  DomainChild[],
  CloseBrToken
]): DomainDefinition => ({
  type: "domain-definition",
  loc: {
    start: tokenToLoc(domain).start,
    end: tokenToLoc(closebr).end,
  },
  name,
  directives,
  children,
  accept(visitor): any {
    return visitor.visitDomainDefinition(this);
  },
});

export const domainExtension = ([
  extend,
  ,
  [name],
  directives,
  ,
  children,
  closebr,
]: [
  ExtendToken,
  DomainToken,
  [String | Identifier],
  Directive[],
  OpenBrToken,
  DomainExtensionChild[],
  CloseBrToken
]): DomainExtension => ({
  type: "domain-extension",
  loc: { start: tokenToLoc(extend).start, end: tokenToLoc(closebr).end },
  extends: name,
  directives,
  children,
  accept(visitor): any {
    return visitor.visitDomainExtension(this);
  },
});

export const datasetMapping = ([
  map,
  ,
  dataset,
  variables,
  ,
  columns,
  closebr,
]: [
  MapToken,
  DatasetToken,
  Path,
  [WithToken, VariableMapping[]] | null,
  OpenBrToken,
  ColumnMapping[],
  CloseBrToken
]): DatasetMapping => ({
  type: "dataset-mapping",
  loc: { start: tokenToLoc(map).start, end: tokenToLoc(closebr).end },
  dataset,
  columns,
  variables: variables?.[1] ?? [],
  accept(visitor): any {
    return visitor.visitDatasetMapping(this);
  },
});

export const domainChildren = ([children]: [
  [DatasetDefinition][]
]): DomainChild[] => children.flat();

export const domainExtensionChildren = ([children]: [
  [DatasetDefinition | DatasetExtension][]
]): DomainExtensionChild[] => children.flat();

export const datasetDefinition = ([
  dataset,
  name,
  interfaces,
  directives,
  ,
  columns,
  closebr,
]: [
  DatasetToken,
  Identifier,
  [ImplementsToken, PathList] | null,
  Directive[],
  OpenBrToken,
  ColumnDefinition[],
  CloseBrToken
]): DatasetDefinition => ({
  type: "dataset-definition",
  loc: { start: tokenToLoc(dataset).start, end: tokenToLoc(closebr).end },
  name,
  interfaces: interfaces?.[1] ?? null,
  directives,
  columns,
  accept(visitor): any {
    return visitor.visitDatasetDefinition(this);
  },
});

export const datasetExtension = ([extend, dataset]: [
  ExtendToken,
  DatasetDefinition
]): DatasetExtension => ({
  type: "dataset-extension",
  loc: { start: tokenToLoc(extend).start, end: dataset.loc.end },
  extends: dataset.name,
  interfaces: dataset.interfaces,
  directives: dataset.directives,
  columns: dataset.columns,
  accept(visitor): any {
    return visitor.visitDatasetExtension(this);
  },
});

export const keyValuePair = ([identifier, , string]: [
  Identifier,
  ColonToken,
  Value
]): KeyValuePair => ({
  type: "key-value-pair",
  loc: { start: identifier.loc.start, end: string.loc.end },
  lhs: identifier,
  rhs: string,
  accept(visitor): any {
    return visitor.visitKeyValuePair(this);
  },
});

export const columnDefinition = ([columnName, columnType, directives]: [
  Identifier,
  TypeExpression,
  Directive[]
]): ColumnDefinition => ({
  type: "column-definition",
  loc: {
    start: columnName.loc.start,
    end: last(directives)?.loc.end ?? columnType.loc.end,
  },
  columnName: columnName,
  columnType,
  directives,
  accept(visitor): any {
    return visitor.visitColumnDefinition(this);
  },
});

export const codelistMember = ([[name], directives]: [
  [String | Identifier],
  Directive[]
]): CodelistMember => ({
  type: "codelist-member",
  loc: {
    start: name.loc.start,
    end: last(directives)?.loc.end ?? name.loc.end,
  },
  name,
  directives,
  accept(visitor): any {
    return visitor.visitCodelistMember(this);
  },
});

export const variableMapping = ([name, , , args, closeparen]: [
  Identifier,
  AsToken,
  OpenParenToken,
  Args,
  CloseParenToken
]): VariableMapping => ({
  type: "variable-mapping",
  loc: { start: name.loc.start, end: tokenToLoc(closeparen).end },
  variable: name,
  values: args,
  accept(visitor): any {
    return visitor.visitVariableMapping(this);
  },
});

export const columnMapping = ([column, sources, computation]: [
  Identifier,
  ColumnMappingSource[],
  [ArrowToken, SourceCode] | null
]): ColumnMapping => ({
  type: "column-mapping",
  loc: {
    start: column.loc.start,
    end: computation?.[1].loc.end ?? last(sources)!.loc.end,
  },
  column,
  sources,
  computation: computation?.[1] ?? null,
  accept(visitor): any {
    return visitor.visitColumnMapping(this);
  },
});

export const columnMappingSource = ([from, source, variable, code]: [
  FromToken,
  Identifier,
  [AsToken, Identifier] | null,
  SourceCode
]): ColumnMappingSource => ({
  type: "column-mapping-source",
  loc: { start: tokenToLoc(from).start, end: code.loc.end },
  source,
  variable: variable?.[1] ?? null,
  code,
  accept(visitor): any {
    return visitor.visitColumnMappingSource(this);
  },
});

export const directive = ([directive, optionalArgs]: [
  DirectiveToken,
  [OpenParenToken, Args | null, CloseParenToken] | null
]): Directive => ({
  type: "directive",
  loc: {
    start: tokenToLoc(directive).start,
    end: tokenToLoc(optionalArgs?.[2] ?? directive).end,
  },
  name: directive.value.slice(1),
  args: optionalArgs?.[1] ?? null,
  accept(visitor): any {
    return visitor.visitDirective(this);
  },
});

export const typeExpression = ([firstMembers, lastMember]: [
  [TypeExpressionMember, PipeToken][],
  TypeExpressionMember
]): TypeExpression => {
  const members = [...firstMembers.map(([member]) => member), lastMember];

  return {
    type: "type-expression",
    loc: { start: members[0].loc.start, end: last(members)!.loc.end },
    members,
    accept(visitor): any {
      return visitor.visitTypeExpression(this);
    },
  };
};

export const typeExpressionMember = ([identifier, question]: [
  Identifier,
  QuestionToken | null
]): TypeExpressionMember => ({
  type: "type-expression-member",
  loc: {
    start: identifier.loc.start,
    end: question ? tokenToLoc(question).end : identifier.loc.end,
  },
  value: identifier,
  optional: !!question,
  accept(visitor): any {
    return visitor.visitTypeExpressionMember(this);
  },
});

export const value = ([[expression]]: [Value][]): Value => expression;

export const identifier = ([token]: [IdentifierToken]): Identifier => ({
  type: "identifier",
  loc: tokenToLoc(token),
  value: token.toString(),
  accept(visitor): any {
    return visitor.visitIdentifier(this);
  },
});

export const path = ([first, rest]: [
  Identifier,
  [DotToken, Identifier][]
]): Path => {
  const identifiers = [first, ...rest.map(([, identifier]) => identifier)];

  return {
    type: "path",
    loc: { start: identifiers[0].loc.start, end: last(identifiers)!.loc.end },
    value: identifiers.map((identifier) => identifier.value).join("."),
    parts: identifiers,
    accept(visitor): any {
      return visitor.visitPath(this);
    },
  };
};

export const sourceCode = ([start, code, end]: [
  CodeblockToken,
  SourcecodeToken | null,
  EndcodeblockToken
]): SourceCode => ({
  type: "source-code",
  loc: { start: tokenToLoc(start).start, end: tokenToLoc(end).end },
  language: start.value.slice(3),
  code: code?.value ?? "",
  accept(visitor): any {
    return visitor.visitSourceCode(this);
  },
});

export const args = ([nthArgs, lastArgValue, trailingComma]: [
  [Value, CommaToken][],
  Value,
  CommaToken | null
]): Args => {
  const args = [...nthArgs.map(([value]) => value), lastArgValue];

  return {
    type: "args",
    loc: {
      start: args[0].loc.start,
      end: trailingComma ? tokenToLoc(trailingComma).end : last(args)!.loc.end,
    },
    args,
    accept(visitor): any {
      return visitor.visitArgs(this);
    },
  };
};

export const identifierList = ([args, lastIdentifier, trailingComma]: [
  [Identifier, CommaToken][],
  Identifier,
  CommaToken | null
]): IdentifierList => {
  const identifiers = [...args.map(([value]) => value), lastIdentifier];

  return {
    type: "identifier-list",
    loc: {
      start: identifiers[0].loc.start,
      end: trailingComma
        ? tokenToLoc(trailingComma).end
        : last(identifiers)!.loc.end,
    },
    identifiers,
    accept(visitor): any {
      return visitor.visitIdentifierList(this);
    },
  };
};

export const pathList = ([first, lastPath, trailingComma]: [
  [Path, CommaToken][],
  Path,
  CommaToken | null
]): PathList => {
  const paths = [...first.map(([path]) => path), lastPath];

  return {
    type: "path-list",
    loc: {
      start: paths[0].loc.start,
      end: trailingComma ? tokenToLoc(trailingComma).end : last(paths)!.loc.end,
    },
    paths,
    accept(visitor): any {
      return visitor.visitPathList(this);
    },
  };
};

export const timeconf = ([timeconf, [value], end]: [
  TimeconfToken,
  [TimeList | TimeExpression],
  TimeconfendToken
]): Timeconf => ({
  type: "timeconf",
  loc: {
    start: tokenToLoc(timeconf).start,
    end: tokenToLoc(end).end,
  },
  value,
  accept(visitor): any {
    return visitor.visitTimeconf(this);
  },
});

export const studyDay = ([day, window]: [
  DayExpression,
  Window | null
]): StudyDay => ({
  type: "study-day",
  loc: {
    start: day.loc.start,
    end: window?.loc.end ?? day.loc.end,
  },
  day,
  window,
  accept(visitor): any {
    return visitor.visitStudyDay(this);
  },
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
  const window = windows.flat();

  return {
    type: "window",
    loc: {
      start: window[0].loc.start,
      end: last(window)!.loc.end,
    },
    window: window as Window["window"],
    accept(visitor): any {
      return visitor.visitWindow(this);
    },
  };
};

export const positiveWindow = ([plus, day]: [
  PlusToken,
  DayExpression
]): PositiveWindow => ({
  type: "positive-window",
  operator: "+",
  loc: {
    start: tokenToLoc(plus).start,
    end: day.loc.end,
  },
  days: day,
  accept(visitor): any {
    return visitor.visitPositiveWindow(this);
  },
});

export const negativeWindow = ([minus, day]: [
  MinusToken,
  DayExpression
]): NegativeWindow => ({
  type: "negative-window",
  operator: "-",
  loc: {
    start: tokenToLoc(minus).start,
    end: day.loc.end,
  },
  days: day,
  accept(visitor): any {
    return visitor.visitNegativeWindow(this);
  },
});

export const bothWindow = ([plus, , day]: [
  PlusToken,
  MinusToken,
  DayExpression
]): BothWindow => ({
  type: "both-window",
  operator: "+-",
  loc: {
    start: tokenToLoc(plus).start,
    end: day.loc.end,
  },
  days: day,
  accept(visitor): any {
    return visitor.visitBothWindow(this);
  },
});

export const day = ([token]: [DayToken]): DayExpression => ({
  type: "day-expression",
  loc: tokenToLoc(token),
  unit: "day",
  value: parseInt(token.toString().slice(1)),
  accept(visitor): any {
    return visitor.visitDayExpression(this);
  },
});

export const hour = ([token]: [HourToken]): HourExpression => ({
  type: "hour-expression",
  loc: tokenToLoc(token),
  unit: "hour",
  value: parseInt(token.value.slice(1)),
  accept(visitor): any {
    return visitor.visitHourExpression(this);
  },
});

export const timeExpression = ([operator, rhs]: [
  TimeOperator,
  TimeValue
]): TimeExpression => ({
  type: "time-expression",
  loc: {
    start: operator.loc.start,
    end: rhs.loc.end,
  },
  operator,
  rhs,
  accept(visitor): any {
    return visitor.visitTimeExpression(this);
  },
});

export const timeOperator = ([[token]]: [
  [GtToken | LtToken | GteToken | LteToken]
]): TimeOperator => ({
  type: "time-operator",
  loc: tokenToLoc(token),
  value: token.value,
  accept(visitor): any {
    return visitor.visitTimeOperator(this);
  },
});

export const timeRange = ([start, , end]: [
  TimeValue,
  ThruToken,
  TimeValue
]): TimeRange => ({
  type: "time-range",
  loc: { start: start.loc.start, end: end.loc.end },
  start,
  end,
  accept(visitor): any {
    return visitor.visitTimeRange(this);
  },
});

export const timeList = ([items, at]: [
  TimeValue[],
  [AtToken, HourExpression[]] | null
]): TimeList => ({
  type: "time-list",
  loc: {
    start: items[0].loc.start,
    end: at?.[1] ? last(at?.[1])!.loc.end : last(items)!.loc.end,
  },
  items,
  at: at?.[1] ?? null,
  accept(visitor): any {
    return visitor.visitTimeList(this);
  },
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
  loc: tokenToLoc(token),
  value: token.value
    .substring(1, token.value.length - 1)
    .replace(/\\"/g, '"')
    .replace(/\n\s*/g, " "),
  accept(visitor): any {
    return visitor.visitString(this);
  },
});
