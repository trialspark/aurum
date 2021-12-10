import { Loc as BaseLoc } from "../astTypes";

export interface Loc extends BaseLoc {
  filename: string;
}

export const DiagnosticScope = {
  GLOBAL: "global",
  LOCAL: "local",
} as const;
export type DiagnosticScope =
  typeof DiagnosticScope[keyof typeof DiagnosticScope];

export const DiagnosticCode = {
  MISSING_STUDY_DEF: "missing_study_def",
  NOT_FOUND: "not_found",
  PARSE_FAILURE: "parse_failure",
  MISSING_ATTRIBUTE: "missing_attribute",
  EXTRA_ATTRIBUTE: "extra_attribute",
  INVALID_TYPE: "invalid_type",
  DUPLICATE_ATTRIBUTE: "duplicate_attribute",
  DUPLICATE_DEFINITION: "duplicate_definition",
} as const;
export type DiagnosticCode = typeof DiagnosticCode[keyof typeof DiagnosticCode];

export const DefinitionType = {
  STUDY: "study",
  MILESTONE: "milestone",
  CODELIST: "codelist",
  INTERFACE: "interface",
  DATASET: "dataset",
} as const;
export type DefinitionType = typeof DefinitionType[keyof typeof DefinitionType];

export interface BaseDiagnostic<
  C extends DiagnosticCode,
  S extends DiagnosticScope
> {
  code: C;
  message: string;
  loc: S extends typeof DiagnosticScope["LOCAL"] ? Loc : null;
  scope: S;
}

export interface MissingStudyDefDiagnostic
  extends BaseDiagnostic<
    typeof DiagnosticCode["MISSING_STUDY_DEF"],
    typeof DiagnosticScope["GLOBAL"]
  > {}

export interface NotFoundDiagnostic
  extends BaseDiagnostic<
    typeof DiagnosticCode["NOT_FOUND"],
    typeof DiagnosticScope["LOCAL"]
  > {
  defType: DefinitionType;
  name: string;
}

export interface ParseDiagnostic
  extends BaseDiagnostic<
    typeof DiagnosticCode["PARSE_FAILURE"],
    typeof DiagnosticScope["LOCAL"]
  > {}

export interface MissingAttributeDiagnostic
  extends BaseDiagnostic<
    typeof DiagnosticCode["MISSING_ATTRIBUTE"],
    typeof DiagnosticScope["LOCAL"]
  > {
  attributeName: string;
  defType: typeof DefinitionType["MILESTONE"] | typeof DefinitionType["STUDY"];
}

export interface ExtraAttributeDiagnostic
  extends BaseDiagnostic<
    typeof DiagnosticCode["EXTRA_ATTRIBUTE"],
    typeof DiagnosticScope["LOCAL"]
  > {
  attributeName: string;
  defType: typeof DefinitionType["MILESTONE"] | typeof DefinitionType["STUDY"];
}

export interface DuplicateAttributeDiagnostic
  extends BaseDiagnostic<
    typeof DiagnosticCode["DUPLICATE_ATTRIBUTE"],
    typeof DiagnosticScope["LOCAL"]
  > {
  attributeName: string;
  defType: typeof DefinitionType["MILESTONE"] | typeof DefinitionType["STUDY"];
}

export interface DuplicateDefinitionDiagnostic
  extends BaseDiagnostic<
    typeof DiagnosticCode["DUPLICATE_DEFINITION"],
    typeof DiagnosticScope["LOCAL"]
  > {
  name: string | null;
  defType: DefinitionType;
}

export interface InvalidTypeDiagnostic
  extends BaseDiagnostic<
    typeof DiagnosticCode["INVALID_TYPE"],
    typeof DiagnosticScope["LOCAL"]
  > {
  expectedType: string;
  actualType: string;
}

export type Diagnostic =
  | MissingStudyDefDiagnostic
  | NotFoundDiagnostic
  | ParseDiagnostic
  | MissingAttributeDiagnostic
  | ExtraAttributeDiagnostic
  | InvalidTypeDiagnostic
  | DuplicateAttributeDiagnostic
  | DuplicateDefinitionDiagnostic;
