interface Node<T extends string> {
  type: T;
  loc: number;
}

export interface Document extends Node<"document"> {
  children: DocumentChild[];
}

export type DocumentChild =
  | StudyDefinition
  | MilestoneDefinition
  | InterfaceDefinition
  | CodelistDefinition;

export interface StudyDefinition extends Node<"study-definition"> {
  children: KeyValuePair[];
}

export interface MilestoneDefinition extends Node<"milestone-definition"> {
  name: Identifier;
  children: KeyValuePair[];
}

export interface KeyValuePair extends Node<"key-value-pair"> {
  lhs: Identifier;
  rhs: String;
}

export type Value = String | Timeconf;

export interface Identifier extends Node<"identifier"> {
  value: string;
}

export interface String extends Node<"string"> {
  value: string;
}

export interface Timeconf extends Node<"timeconf"> {
  value: TimeList | TimeExpression;
}

export interface TimeList extends Node<"time-list"> {
  items: TimeValue[];
}

export interface TimeOperator extends Node<"time-operator"> {
  value: ">" | "<" | ">=" | "<=";
}

export interface TimeExpression extends Node<"time-expression"> {
  operator: TimeOperator;
  rhs: Identifier;
}

export interface DayExpression extends Node<"day-expression"> {
  unit: "day";
  value: number;
}

interface WindowBase<T extends string, O extends string> extends Node<T> {
  operator: O;
  days: DayExpression;
}

export interface BothWindow extends WindowBase<"both-window", "+-"> {}

export interface NegativeWindow extends WindowBase<"negative-window", "-"> {}

export interface PositiveWindow extends WindowBase<"positive-window", "+"> {}

export interface Window extends Node<"window"> {
  window:
    | [PositiveWindow]
    | [NegativeWindow]
    | [BothWindow]
    | [PositiveWindow, NegativeWindow]
    | [NegativeWindow, PositiveWindow];
}

export interface StudyDay extends Node<"study-day"> {
  day: DayExpression;
  window: Window | null;
}

export interface TimeRange extends Node<"time-range"> {
  start: TimeValue;
  end: TimeValue;
}

export interface Args extends Node<"args"> {
  args: Value[];
}

export interface Directive extends Node<"directive"> {
  name: string;
  args: Args | null;
}

export interface ColumnDefinition extends Node<"column-definition"> {
  columnName: Identifier;
  columnType: Identifier;
  directives: Directive[];
}

export interface InterfaceDefinition extends Node<"interface-definition"> {
  name: Identifier;
  columns: ColumnDefinition[];
}

export interface CodelistMember extends Node<"codelist-member"> {
  name: String | Identifier;
  directives: Directive[];
}

export interface CodelistDefinition extends Node<"codelist-definition"> {
  name: Identifier;
  members: CodelistMember[];
}

export type TimeValue = StudyDay | Identifier;

export interface TypeExpressionMember extends Node<"type-expression-member"> {
  value: Identifier;
  optional: boolean;
}

export interface TypeExpression extends Node<"type-expression"> {
  members: TypeExpressionMember[];
}
