import { Loc } from "../astTypes";

export const CompilerErrorScope = {
  GLOBAL: "global",
  LOCAL: "local",
} as const;
export type CompilerErrorScope =
  typeof CompilerErrorScope[keyof typeof CompilerErrorScope];

export const CompilerErrorCode = {
  MISSING_STUDY_DEF: "missing_study_def",
} as const;
export type CompilerErrorCode =
  typeof CompilerErrorCode[keyof typeof CompilerErrorCode];

export interface CompilerError {
  code: CompilerErrorCode;
  message: string;
  loc: Loc | null;
  scope: CompilerErrorScope;
}
