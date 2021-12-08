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

export type Diagnostic = MissingStudyDefDiagnostic | NotFoundDiagnostic;
