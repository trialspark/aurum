export interface StudyInfo {
  id: string;
  name: string;
}

export interface MilestoneWindow {
  before: number;
  after: number;
}

export interface AbsoluteMilestone {
  name: string | null;
  type: "absolute";
  day: number;
  window: MilestoneWindow;
}

export interface RelativeMilestone {
  name: string;
  type: "relative";
  position: "before" | "after" | "before/on" | "after/on";
  relativeTo:
    | { type: "reference"; name: string }
    | { type: "anonymous"; milestone: AbsoluteMilestone };
}

export type Milestone = AbsoluteMilestone | RelativeMilestone;

export interface CodelistItem {
  value: string;
  description: string;
}

export interface Codelist {
  name: string;
  items: CodelistItem[];
}

export interface Domain {
  name: string;
  abbr: string;
  datasets: { [name: string]: Dataset };
}

export interface DatasetMilestone {
  name: string | null;
  day: number | null;
  hour: number | number;
}

export interface Dataset {
  name: string;
  milestones: DatasetMilestone[];
  columns: DatasetColumn[];
}

export interface DatasetColumn {
  name: string;
  label: string;
  description: string;
  type: ColumnType[];
}

export interface Scalar {
  type: "scalar";
  value: string;
}

export interface CodelistRef {
  type: "codelist";
  value: string;
}

export type ColumnType = Scalar | CodelistRef;

export interface CompilationResult {
  study: StudyInfo;
  milestones: { [name: string]: Milestone };
  codelists: { [name: string]: Codelist };
  domains: { [name: string]: Domain };
}
