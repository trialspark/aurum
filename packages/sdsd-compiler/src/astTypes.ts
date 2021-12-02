import { DocumentVisitor } from "./compiler/visitor";

export type NodeType =
  | "args"
  | "both-window"
  | "codelist-definition"
  | "codelist-extension"
  | "codelist-member"
  | "column-definition"
  | "column-mapping"
  | "column-mapping-source"
  | "dataset-definition"
  | "dataset-extension"
  | "dataset-mapping"
  | "day-expression"
  | "directive"
  | "document"
  | "domain-definition"
  | "domain-extension"
  | "hour-expression"
  | "identifier"
  | "identifier-list"
  | "interface-definition"
  | "key-value-pair"
  | "milestone-definition"
  | "negative-window"
  | "path"
  | "path-list"
  | "positive-window"
  | "source-code"
  | "string"
  | "study-day"
  | "study-definition"
  | "time-expression"
  | "time-list"
  | "time-operator"
  | "time-range"
  | "timeconf"
  | "type-expression"
  | "type-expression-member"
  | "variable-mapping"
  | "window";

export type Node =
  | Args
  | BothWindow
  | CodelistDefinition
  | CodelistExtension
  | CodelistMember
  | ColumnDefinition
  | ColumnMapping
  | ColumnMappingSource
  | DatasetDefinition
  | DatasetExtension
  | DatasetMapping
  | DayExpression
  | Directive
  | Document
  | DomainDefinition
  | DomainExtension
  | HourExpression
  | Identifier
  | IdentifierList
  | InterfaceDefinition
  | KeyValuePair
  | MilestoneDefinition
  | NegativeWindow
  | Path
  | PathList
  | PositiveWindow
  | SourceCode
  | String
  | StudyDay
  | StudyDefinition
  | TimeExpression
  | TimeList
  | TimeOperator
  | TimeRange
  | Timeconf
  | TypeExpression
  | TypeExpressionMember
  | VariableMapping
  | Window;

interface NodeBase<
  T extends NodeType,
  Accept extends (v: DocumentVisitor) => unknown
> {
  type: T;
  loc: Loc;
  accept: Accept;
}

export interface DocumentPosition {
  line: number;
  col: number;
}

export interface Loc {
  start: DocumentPosition;
  end: DocumentPosition;
}

export interface Document
  extends NodeBase<
    "document",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visit"]>
  > {
  children: DocumentChild[];
}

export type DocumentChild =
  | StudyDefinition
  | MilestoneDefinition
  | InterfaceDefinition
  | CodelistDefinition
  | CodelistExtension
  | DomainDefinition
  | DomainExtension;

export type DomainChild = DatasetDefinition;

export type DomainExtensionChild = DatasetDefinition | DatasetExtension;

export interface StudyDefinition
  extends NodeBase<
    "study-definition",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitStudyDefinition"]>
  > {
  children: KeyValuePair[];
}

export interface MilestoneDefinition
  extends NodeBase<
    "milestone-definition",
    <V extends DocumentVisitor>(
      v: V
    ) => ReturnType<V["visitMilestoneDefinition"]>
  > {
  name: Identifier;
  children: KeyValuePair[];
}

export interface KeyValuePair
  extends NodeBase<
    "key-value-pair",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitKeyValuePair"]>
  > {
  lhs: Identifier;
  rhs: Value;
}

export type Value = String | Timeconf;

export interface Identifier
  extends NodeBase<
    "identifier",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitIdentifier"]>
  > {
  value: string;
}

export interface String
  extends NodeBase<
    "string",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitString"]>
  > {
  value: string;
}

export interface Timeconf
  extends NodeBase<
    "timeconf",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitTimeconf"]>
  > {
  value: TimeList | TimeExpression;
}

export interface TimeList
  extends NodeBase<
    "time-list",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitTimeList"]>
  > {
  items: TimeValue[];
  at: HourExpression[] | null;
}

export interface TimeOperator
  extends NodeBase<
    "time-operator",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitTimeOperator"]>
  > {
  value: ">" | "<" | ">=" | "<=";
}

export interface TimeExpression
  extends NodeBase<
    "time-expression",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitTimeExpression"]>
  > {
  operator: TimeOperator;
  rhs: TimeValue;
}

export interface DayExpression
  extends NodeBase<
    "day-expression",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitDayExpression"]>
  > {
  unit: "day";
  value: number;
}

interface WindowBase<
  T extends NodeType,
  O extends string,
  Accept extends (v: DocumentVisitor) => unknown
> extends NodeBase<T, Accept> {
  operator: O;
  days: DayExpression;
}

export interface BothWindow
  extends WindowBase<
    "both-window",
    "+-",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitBothWindow"]>
  > {}

export interface NegativeWindow
  extends WindowBase<
    "negative-window",
    "-",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitNegativeWindow"]>
  > {}

export interface PositiveWindow
  extends WindowBase<
    "positive-window",
    "+",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitPositiveWindow"]>
  > {}

export interface Window
  extends NodeBase<
    "window",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitWindow"]>
  > {
  window:
    | [PositiveWindow]
    | [NegativeWindow]
    | [BothWindow]
    | [PositiveWindow, NegativeWindow]
    | [NegativeWindow, PositiveWindow];
}

export interface StudyDay
  extends NodeBase<
    "study-day",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitStudyDay"]>
  > {
  day: DayExpression;
  window: Window | null;
}

export interface TimeRange
  extends NodeBase<
    "time-range",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitTimeRange"]>
  > {
  start: TimeValue;
  end: TimeValue;
}

export interface Args
  extends NodeBase<
    "args",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitArgs"]>
  > {
  args: Value[];
}

export interface Directive
  extends NodeBase<
    "directive",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitDirective"]>
  > {
  name: string;
  args: Args | null;
}

export interface ColumnDefinition
  extends NodeBase<
    "column-definition",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitColumnDefinition"]>
  > {
  columnName: Identifier;
  columnType: TypeExpression;
  directives: Directive[];
}

export interface InterfaceDefinition
  extends NodeBase<
    "interface-definition",
    <V extends DocumentVisitor>(
      v: V
    ) => ReturnType<V["visitInterfaceDefinition"]>
  > {
  name: Identifier;
  columns: ColumnDefinition[];
}

export interface CodelistMember
  extends NodeBase<
    "codelist-member",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitCodelistMember"]>
  > {
  name: String | Identifier;
  directives: Directive[];
}

export interface CodelistDefinition
  extends NodeBase<
    "codelist-definition",
    <V extends DocumentVisitor>(
      v: V
    ) => ReturnType<V["visitCodelistDefinition"]>
  > {
  name: Identifier;
  members: CodelistMember[];
}

export type TimeValue = StudyDay | Identifier | TimeRange;

export interface TypeExpressionMember
  extends NodeBase<
    "type-expression-member",
    <V extends DocumentVisitor>(
      v: V
    ) => ReturnType<V["visitTypeExpressionMember"]>
  > {
  value: Identifier;
  optional: boolean;
}

export interface TypeExpression
  extends NodeBase<
    "type-expression",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitTypeExpression"]>
  > {
  members: TypeExpressionMember[];
}

export interface HourExpression
  extends NodeBase<
    "hour-expression",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitHourExpression"]>
  > {
  unit: "hour";
  value: number;
}

export interface IdentifierList
  extends NodeBase<
    "identifier-list",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitIdentifierList"]>
  > {
  identifiers: Identifier[];
}

export interface DatasetDefinition
  extends NodeBase<
    "dataset-definition",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitDatasetDefinition"]>
  > {
  name: Identifier;
  interfaces: PathList | null;
  directives: Directive[];
  columns: ColumnDefinition[];
}

export interface DomainDefinition
  extends NodeBase<
    "domain-definition",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitDomainDefinition"]>
  > {
  name: Identifier | String;
  directives: Directive[];
  children: DomainChild[];
}

export interface Path
  extends NodeBase<
    "path",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitPath"]>
  > {
  value: string;
  parts: Identifier[];
}

export interface PathList
  extends NodeBase<
    "path-list",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitPathList"]>
  > {
  paths: Path[];
}

export interface CodelistExtension
  extends NodeBase<
    "codelist-extension",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitCodelistExtension"]>
  > {
  extends: Path;
  members: CodelistMember[];
}

export interface DomainExtension
  extends NodeBase<
    "domain-extension",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitDomainExtension"]>
  > {
  extends: Identifier | String;
  directives: Directive[];
  children: DomainExtensionChild[];
}

export interface DatasetExtension
  extends NodeBase<
    "dataset-extension",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitDatasetExtension"]>
  > {
  extends: Identifier;
  interfaces: PathList | null;
  directives: Directive[];
  columns: ColumnDefinition[];
}

export interface DatasetMapping
  extends NodeBase<
    "dataset-mapping",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitDatasetMapping"]>
  > {
  dataset: Path;
  variables: VariableMapping[];
  columns: ColumnMapping[];
}

export interface VariableMapping
  extends NodeBase<
    "variable-mapping",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitVariableMapping"]>
  > {
  variable: Identifier;
  values: Args;
}

export interface ColumnMapping
  extends NodeBase<
    "column-mapping",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitColumnMapping"]>
  > {
  column: Identifier;
  sources: ColumnMappingSource[];
  computation: SourceCode | null;
}

export interface ColumnMappingSource
  extends NodeBase<
    "column-mapping-source",
    <V extends DocumentVisitor>(
      v: V
    ) => ReturnType<V["visitColumnMappingSource"]>
  > {
  source: Identifier;
  variable: Identifier | null;
  code: SourceCode;
}

export interface SourceCode
  extends NodeBase<
    "source-code",
    <V extends DocumentVisitor>(v: V) => ReturnType<V["visitSourceCode"]>
  > {
  language: string;
  code: string;
}
