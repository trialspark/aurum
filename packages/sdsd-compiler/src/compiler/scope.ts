import { CodelistItem, Dataset, DatasetColumn } from ".";
import { ColumnType, MilestoneWindow } from "..";
import { TimeExpression } from "../astTypes";

interface BaseScope<Type extends string, Parent extends Scope | null> {
  type: Type;
  parent: Parent;
}

interface WithKVPairs {
  kv: KeyValuePairs;
}

interface WithDirectives {
  directives: DirectiveMap;
}

interface WithColumns {
  columns: DatasetColumn[];
}

interface WithArgs {
  args: ParsedValue[];
}

interface WithCodelistItems {
  items: CodelistItem[];
}

interface WithDatasets {
  datasets: { [name: string]: Dataset };
}

export interface DocumentScope extends BaseScope<"document", null> {}

export interface StudyScope
  extends BaseScope<"study", DocumentScope>,
    WithKVPairs {}

export interface MilestoneScope
  extends BaseScope<"milestone", DocumentScope>,
    WithKVPairs {}

export interface CodelistScope
  extends BaseScope<"codelist", DocumentScope>,
    WithCodelistItems {}

export interface CodelistMemberScope
  extends BaseScope<"codelist-member", CodelistScope | CodelistExtensionScope>,
    WithDirectives {}

export interface DomainScope
  extends BaseScope<"domain", DocumentScope>,
    WithDirectives,
    WithDatasets {}

export interface DatasetScope
  extends BaseScope<"dataset", DomainScope>,
    WithDirectives,
    WithColumns {}

export interface InterfaceScope
  extends BaseScope<"interface", DocumentScope>,
    WithColumns {}

export interface ColumnScope
  extends BaseScope<
      "column",
      DatasetScope | InterfaceScope | DatasetExtensionScope
    >,
    WithDirectives {
  types: ColumnType[];
}

export interface DirectiveScope
  extends BaseScope<
      "directive",
      | ColumnScope
      | DomainScope
      | DatasetScope
      | CodelistMemberScope
      | DomainExtensionScope
      | DatasetExtensionScope
    >,
    WithArgs {}

export interface ParsedDirective {
  name: string;
  args: ParsedValue[];
}

export interface ArgsScope
  extends BaseScope<"args", DirectiveScope>,
    WithArgs {}

export interface KeyValueScope
  extends BaseScope<"key-value", StudyScope | MilestoneScope> {
  key: string;
  value: ParsedValue;
}

export interface KeyScope extends BaseScope<"key", KeyValueScope> {
  key: string;
}

export interface ParsedTimeList {
  type: "time-list";
  members: ParsedTimeListMember[];
}

export interface ParsedTimeExpression {
  type: "time-expression";
  operator: TimeExpression["operator"]["value"];
  rhs: ParsedTimeListMember;
}

export type ParsedTimeconf = ParsedTimeList | ParsedTimeExpression;

export interface TimeconfScope
  extends BaseScope<"timeconf", KeyValueScope | ArgsScope> {
  result: ParsedTimeconf | null;
}

export interface ParsedStudyDay {
  type: "study-day";
  day: number;
  window: MilestoneWindow;
}

export interface ParsedMilestoneIdentifier {
  type: "milestone-identifier";
  value: string;
}

export type ParsedTimeListMember = ParsedStudyDay | ParsedMilestoneIdentifier;

export interface TimeListScope extends BaseScope<"time-list", TimeconfScope> {
  members: ParsedTimeListMember[];
}

export interface TimeRangeScope
  extends BaseScope<
    "time-range",
    TimeExpressionScope | TimeRangeScope | TimeListScope
  > {}

export interface TimeExpressionScope
  extends BaseScope<"time-expression", TimeconfScope> {
  rhs: ParsedTimeListMember;
}

export interface StudyDayScope
  extends BaseScope<
    "study-day",
    TimeExpressionScope | TimeRangeScope | TimeListScope
  > {
  window: MilestoneWindow;
}

export interface WindowScope extends BaseScope<"window", StudyDayScope> {
  before: number;
  after: number;
}

export interface BothWindowScope
  extends BaseScope<"both-window", WindowScope> {}

export interface PositiveWindowScope
  extends BaseScope<"positive-window", WindowScope> {}

export interface NegativeWindowScope
  extends BaseScope<"negative-window", WindowScope> {}

export interface CodelistExtensionScope
  extends BaseScope<"codelist-extension", DocumentScope>,
    WithCodelistItems {}

export interface DatasetMappingScope
  extends BaseScope<"dataset-mapping", DocumentScope> {}

export interface ColumnMappingScope
  extends BaseScope<"column-mapping", DatasetMappingScope> {}

export interface ColumnMappingSourceScope
  extends BaseScope<"column-mapping-source", ColumnMappingScope> {}

export interface DomainExtensionScope
  extends BaseScope<"domain-extension", DocumentScope>,
    WithDirectives,
    WithDatasets {}

export interface DatasetExtensionScope
  extends BaseScope<"dataset-extension", DomainExtensionScope>,
    WithDirectives,
    WithColumns {}

export interface DayExpressionScope
  extends BaseScope<
    "day-expression",
    BothWindowScope | PositiveWindowScope | NegativeWindowScope | StudyDayScope
  > {}

export interface HourExpressionScope
  extends BaseScope<"hour-expression", TimeListScope> {}

export interface VariableMappingScope
  extends BaseScope<"variable-mapping", DatasetMappingScope> {}

export interface PathListScope extends BaseScope<"path-list", DatasetScope> {}

export interface PathScope
  extends BaseScope<
    "path",
    CodelistExtensionScope | DatasetMappingScope | PathListScope
  > {}

export interface IdentifierListScope
  extends BaseScope<"identifier-list", null> {}

export interface IdentifierScope
  extends BaseScope<
    "identifier",
    | CodelistMemberScope
    | CodelistScope
    | ColumnMappingScope
    | ColumnMappingSourceScope
    | ColumnScope
    | DatasetScope
    | DomainExtensionScope
    | DomainScope
    | IdentifierListScope
    | InterfaceScope
    | KeyValueScope
    | MilestoneScope
    | PathScope
    | TimeExpressionScope
    | TimeRangeScope
    | TimeListScope
    | TypeExpressionMemberScope
    | VariableMappingScope
  > {}

export interface SourceCodeScope
  extends BaseScope<
    "source-code",
    ColumnMappingScope | ColumnMappingSourceScope
  > {}

export interface StringScope
  extends BaseScope<
    "string",
    | DomainScope
    | DomainExtensionScope
    | CodelistMemberScope
    | KeyValueScope
    | ArgsScope
  > {}

export interface TimeOperatorScope
  extends BaseScope<"time-operator", TimeExpressionScope> {}

export interface TypeExpressionScope
  extends BaseScope<"type-expression", ColumnScope> {
  types: ColumnType[];
}

export interface TypeExpressionMemberScope
  extends BaseScope<"type-expression-member", TypeExpressionScope> {}

export type KeyValuePairs = { [key: string]: ParsedValue };
export type DirectiveMap = { [name: string]: ParsedDirective };
export type ParsedValue = string | ParsedTimeconf;

export type Scope =
  | ArgsScope
  | BothWindowScope
  | CodelistExtensionScope
  | CodelistMemberScope
  | CodelistScope
  | ColumnMappingScope
  | ColumnMappingSourceScope
  | ColumnScope
  | DatasetExtensionScope
  | DatasetMappingScope
  | DatasetMappingScope
  | DatasetScope
  | DayExpressionScope
  | DirectiveScope
  | DocumentScope
  | DomainExtensionScope
  | DomainScope
  | HourExpressionScope
  | IdentifierListScope
  | IdentifierScope
  | InterfaceScope
  | KeyValueScope
  | MilestoneScope
  | NegativeWindowScope
  | PathListScope
  | PathScope
  | PositiveWindowScope
  | SourceCodeScope
  | StringScope
  | StudyDayScope
  | StudyScope
  | TimeExpressionScope
  | TimeListScope
  | TimeOperatorScope
  | TimeRangeScope
  | TimeconfScope
  | TypeExpressionMemberScope
  | TypeExpressionScope
  | VariableMappingScope
  | WindowScope;

type ScopeWithParent<S extends Scope = Scope> = S extends { parent: object }
  ? S
  : never;
type ScopeWithType<T extends string, S extends Scope = Scope> = S extends {
  type: T;
}
  ? S
  : never;

const parentTypes: {
  [T in ScopeWithParent["type"]]: {
    [K in ScopeWithType<T, ScopeWithParent>["parent"]["type"]]: null;
  };
} = {
  "both-window": { window: null },
  "codelist-extension": { document: null },
  "codelist-member": { "codelist-extension": null, codelist: null },
  "column-mapping": { "dataset-mapping": null },
  "column-mapping-source": { "column-mapping": null },
  "dataset-extension": { "domain-extension": null },
  "dataset-mapping": { document: null },
  "day-expression": {
    "both-window": null,
    "study-day": null,
    "positive-window": null,
    "negative-window": null,
  },
  "domain-extension": { document: null },
  "hour-expression": { "time-list": null },
  "key-value": { milestone: null, study: null },
  "negative-window": { window: null },
  "path-list": { dataset: null },
  "positive-window": { window: null },
  "source-code": { "column-mapping": null, "column-mapping-source": null },
  "study-day": {
    "time-expression": null,
    "time-list": null,
    "time-range": null,
  },
  "time-expression": { timeconf: null },
  "time-list": { timeconf: null },
  "time-operator": { "time-expression": null },
  "time-range": {
    "time-expression": null,
    "time-list": null,
    "time-range": null,
  },
  "type-expression": { column: null },
  "type-expression-member": { "type-expression": null },
  "variable-mapping": { "dataset-mapping": null },
  args: { directive: null },
  codelist: { document: null },
  column: { dataset: null, "dataset-extension": null, interface: null },
  dataset: { domain: null },
  directive: {
    domain: null,
    "dataset-extension": null,
    dataset: null,
    column: null,
    "codelist-member": null,
    "domain-extension": null,
  },
  domain: { document: null },
  identifier: {
    "domain-extension": null,
    "codelist-member": null,
    column: null,
    dataset: null,
    domain: null,
    interface: null,
    "time-range": null,
    "time-list": null,
    "time-expression": null,
    "column-mapping-source": null,
    "column-mapping": null,
    "identifier-list": null,
    "key-value": null,
    "variable-mapping": null,
    codelist: null,
    milestone: null,
    path: null,
    "type-expression-member": null,
  },
  interface: { document: null },
  milestone: { document: null },
  path: {
    "codelist-extension": null,
    "dataset-mapping": null,
    "path-list": null,
  },
  string: {
    "codelist-member": null,
    "key-value": null,
    domain: null,
    "domain-extension": null,
    args: null,
  },
  study: { document: null },
  timeconf: { args: null, "key-value": null },
  window: { "study-day": null },
};

export const isParentOf = <T extends keyof typeof parentTypes>(
  type: T,
  scope: Scope | null
): scope is ScopeWithType<T>["parent"] => {
  return !!scope && scope.type in parentTypes[type];
};
