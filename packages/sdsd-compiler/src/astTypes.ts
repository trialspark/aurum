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

interface NodeBase<T extends NodeType> {
  type: T;
  loc: Loc;
  accept(visitor: DocumentVisitor): void;
}

export interface DocumentPosition {
  line: number;
  col: number;
}

export interface Loc {
  start: DocumentPosition;
  end: DocumentPosition;
}

export interface Document extends NodeBase<"document"> {
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

export interface StudyDefinition extends NodeBase<"study-definition"> {
  children: KeyValuePair[];
}

export interface MilestoneDefinition extends NodeBase<"milestone-definition"> {
  name: Identifier;
  children: KeyValuePair[];
}

export interface KeyValuePair extends NodeBase<"key-value-pair"> {
  lhs: Identifier;
  rhs: Value;
}

export type Value = String | Timeconf;

export interface Identifier extends NodeBase<"identifier"> {
  value: string;
}

export interface String extends NodeBase<"string"> {
  value: string;
}

export interface Timeconf extends NodeBase<"timeconf"> {
  value: TimeList | TimeExpression;
}

export interface TimeList extends NodeBase<"time-list"> {
  items: TimeValue[];
  at: HourExpression[] | null;
}

export interface TimeOperator extends NodeBase<"time-operator"> {
  value: ">" | "<" | ">=" | "<=";
}

export interface TimeExpression extends NodeBase<"time-expression"> {
  operator: TimeOperator;
  rhs: TimeValue;
}

export interface DayExpression extends NodeBase<"day-expression"> {
  unit: "day";
  value: number;
}

interface WindowBase<T extends NodeType, O extends string> extends NodeBase<T> {
  operator: O;
  days: DayExpression;
}

export interface BothWindow extends WindowBase<"both-window", "+-"> {}

export interface NegativeWindow extends WindowBase<"negative-window", "-"> {}

export interface PositiveWindow extends WindowBase<"positive-window", "+"> {}

export interface Window extends NodeBase<"window"> {
  window:
    | [PositiveWindow]
    | [NegativeWindow]
    | [BothWindow]
    | [PositiveWindow, NegativeWindow]
    | [NegativeWindow, PositiveWindow];
}

export interface StudyDay extends NodeBase<"study-day"> {
  day: DayExpression;
  window: Window | null;
}

export interface TimeRange extends NodeBase<"time-range"> {
  start: TimeValue;
  end: TimeValue;
}

export interface Args extends NodeBase<"args"> {
  args: Value[];
}

export interface Directive extends NodeBase<"directive"> {
  name: string;
  args: Args | null;
}

export interface ColumnDefinition extends NodeBase<"column-definition"> {
  columnName: Identifier;
  columnType: Identifier;
  directives: Directive[];
}

export interface InterfaceDefinition extends NodeBase<"interface-definition"> {
  name: Identifier;
  columns: ColumnDefinition[];
}

export interface CodelistMember extends NodeBase<"codelist-member"> {
  name: String | Identifier;
  directives: Directive[];
}

export interface CodelistDefinition extends NodeBase<"codelist-definition"> {
  name: Identifier;
  members: CodelistMember[];
}

export type TimeValue = StudyDay | Identifier;

export interface TypeExpressionMember
  extends NodeBase<"type-expression-member"> {
  value: Identifier;
  optional: boolean;
}

export interface TypeExpression extends NodeBase<"type-expression"> {
  members: TypeExpressionMember[];
}

export interface HourExpression extends NodeBase<"hour-expression"> {
  unit: "hour";
  value: number;
}

export interface IdentifierList extends NodeBase<"identifier-list"> {
  identifiers: Identifier[];
}

export interface DatasetDefinition extends NodeBase<"dataset-definition"> {
  name: Identifier;
  interfaces: PathList | null;
  directives: Directive[];
  columns: ColumnDefinition[];
}

export interface DomainDefinition extends NodeBase<"domain-definition"> {
  name: Identifier | String;
  directives: Directive[];
  children: DomainChild[];
}

export interface Path extends NodeBase<"path"> {
  value: string;
  parts: Identifier[];
}

export interface PathList extends NodeBase<"path-list"> {
  paths: Path[];
}

export interface CodelistExtension extends NodeBase<"codelist-extension"> {
  extends: Path;
  members: CodelistMember[];
}

export interface DomainExtension extends NodeBase<"domain-extension"> {
  extends: Identifier | String;
  directives: Directive[];
  children: DomainExtensionChild[];
}

export interface DatasetExtension extends NodeBase<"dataset-extension"> {
  extends: Identifier;
  interfaces: PathList | null;
  directives: Directive[];
  columns: ColumnDefinition[];
}

export interface DatasetMapping extends NodeBase<"dataset-mapping"> {
  dataset: Path;
  variables: VariableMapping[];
  columns: ColumnMapping[];
}

export interface VariableMapping extends NodeBase<"variable-mapping"> {
  variable: Identifier;
  values: Args;
}

export interface ColumnMapping extends NodeBase<"column-mapping"> {
  column: Identifier;
  sources: ColumnMappingSource[];
  computation: SourceCode | null;
}

export interface ColumnMappingSource extends NodeBase<"column-mapping-source"> {
  source: Identifier;
  variable: Identifier | null;
  code: SourceCode;
}

export interface SourceCode extends NodeBase<"source-code"> {
  language: string;
  code: string;
}
