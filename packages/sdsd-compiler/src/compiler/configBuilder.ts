import { createSlice, freeze, PayloadAction, original } from "@reduxjs/toolkit";
import assert from "assert";
import { escapeRegExp, range } from "lodash";
import {
  Codelist,
  CodelistItem,
  ColumnType,
  CompilationResult,
  Dataset,
  DatasetColumn,
  DatasetMappingColumn,
  DatasetMapping as DatasetMappingResult,
  DatasetMilestone,
  Domain,
  Milestone,
  RelativeMilestone,
  StudyInfo,
} from ".";
import {
  Args,
  BothWindow,
  CodelistDefinition,
  CodelistMember,
  ColumnDefinition,
  ColumnMapping,
  ColumnMappingSource,
  DatasetDefinition,
  DatasetMapping,
  DayExpression,
  Directive,
  Document,
  DomainDefinition,
  HourExpression,
  Identifier,
  InterfaceDefinition,
  KeyValuePair,
  MilestoneDefinition,
  NegativeWindow,
  Path,
  PathList,
  PositiveWindow,
  SourceCode,
  String,
  StudyDay,
  StudyDefinition,
  Timeconf,
  TimeExpression,
  TimeList,
  TimeRange,
  TimeValue,
  TypeExpression,
  TypeExpressionMember,
  VariableMapping,
  Window,
} from "../astTypes";
import { atLeastOne, nonNull } from "../utils";
import { CodelistDef, File, InterfaceDef, NamedDefMap } from "./defBuilder";
import { DocumentVisitor } from "./visitor";

export interface ConfigBuilderState {
  result: CompilationResult;
  interfaces: NamedDefMap<Interface>;
}

const initialState: ConfigBuilderState = {
  result: {
    study: {
      id: "",
      name: "",
    },
    milestones: {},
    codelists: {},
    domains: {},
  },
  interfaces: {},
};

const { reducer, actions } = createSlice({
  initialState,
  name: "configBuilder",
  reducers: {
    setStudy: (state, action: PayloadAction<StudyInfo>) => {
      state.result.study = freeze(action.payload);
    },
    addMilestone: (state, action: PayloadAction<Milestone>) => {
      state.result.milestones[action.payload.name!] = freeze(action.payload);
    },
    addInterface: (state, action: PayloadAction<Interface>) => {
      state.interfaces[action.payload.name] = freeze(action.payload);
    },
    addCodelist: (state, action: PayloadAction<Codelist>) => {
      state.result.codelists[action.payload.name] = freeze(action.payload);
    },
    addDomain: (state, action: PayloadAction<Domain>) => {
      state.result.domains[action.payload.name] = freeze(action.payload);
    },
    addDatasetMapping: (
      state,
      action: PayloadAction<{
        dataset: string;
        mappings: DatasetMappingResult[];
      }>
    ) => {
      const datasetName = action.payload.dataset;
      const domainName = Object.entries(original(state)!.result.domains).find(
        ([, value]) => datasetName in value.datasets
      )?.[0];

      if (domainName) {
        state.result.domains[domainName].datasets[datasetName].mappings.push(
          ...action.payload.mappings
        );
      }
    },
  },
});

type Action = ReturnType<typeof actions[keyof typeof actions]>;

interface Interface {
  name: string;
  columns: DatasetColumn[];
}

interface StringValue {
  type: "string";
  value: string;
}

interface IdentifierValue {
  type: "identifier";
  value: string;
}

interface TimeExpressionValue {
  type: "time-expression";
  position: "before" | "after" | "before/on" | "after/on";
  relativeTo: ParsedTimeValue;
}

interface TimeListValue {
  type: "time-list";
  days: ParsedTimeValue[];
  hours: ParsedHourValue[] | null;
}

interface StudyDayValue {
  type: "study-day";
  day: number;
  window: StudyDayWindow;
}

interface StudyDayWindow {
  before: number;
  after: number;
}

interface MilestoneIdentifierValue {
  type: "milestone-identifier";
  milestoneName: string;
}

interface TimeRangeValue {
  type: "time-range";
  start: ParsedTimeValue;
  end: ParsedTimeValue;
}

interface ParsedDirective {
  name: string;
  args: ParsedValue[];
}

interface ParsedHourValue {
  hour: number;
}

type ParsedTimeValue =
  | StudyDayValue
  | MilestoneIdentifierValue
  | TimeRangeValue;

type ParsedTimeconfValue = TimeExpressionValue | TimeListValue;

type ParsedValue = StringValue | ParsedTimeconfValue;

interface PathValue {
  path: string;
  parts: IdentifierValue[];
}

interface ParsedVariableMapping {
  variable: string;
  values: string[];
}

interface ParsedColumnMappingSource {
  source: string;
  variable: string | null;
  code: ParsedSourceCode;
}

interface ParsedSourceCode {
  language: string;
  code: string;
}

export class ConfigBuilder extends DocumentVisitor {
  constructor(
    private file: File,
    private accessors: {
      getCodelistDefs: () => NamedDefMap<CodelistDef>;
      getInterfaceDefs: () => NamedDefMap<Interface>;
      getMilestones: () => NamedDefMap<Milestone>;
      getDatasets: () => NamedDefMap<{ domain: Domain; dataset: Dataset }>;
    }
  ) {
    super();
  }

  private getAttributes(keyValuePairs: KeyValuePair[]) {
    return Object.fromEntries(keyValuePairs.map((node) => node.accept(this)));
  }

  private getDirectives(directives: Directive[]) {
    return Object.fromEntries(
      directives.map((directive) => {
        const parsed = directive.accept(this);

        return [parsed.name, parsed];
      })
    );
  }

  private getDatasetMilestonesFromTimeValue(
    dayValue: ParsedTimeValue,
    milestones: NamedDefMap<Milestone>
  ): Omit<DatasetMilestone, "hour">[] {
    switch (dayValue.type) {
      case "study-day":
        return [
          {
            name: null,
            day: dayValue.day,
          },
        ];
      case "milestone-identifier": {
        const milestone = milestones[dayValue.milestoneName] as
          | Milestone
          | undefined;

        return [
          {
            name: milestone?.name ?? null,
            day: milestone?.type === "absolute" ? milestone.day : null,
          },
        ];
      }
      case "time-range": {
        const { start, end } = dayValue;
        const startMilestones = this.getDatasetMilestonesFromTimeValue(
          start,
          milestones
        );
        const endMilestones = this.getDatasetMilestonesFromTimeValue(
          end,
          milestones
        );
        const startDay =
          Math.max(...startMilestones.map((milestone) => milestone.day ?? 0)) +
          1;
        const endDay =
          Math.min(...endMilestones.map((milestone) => milestone.day ?? 0)) - 1;
        const daysInBetween = range(startDay, endDay + 1);

        return [
          ...startMilestones,
          ...daysInBetween.map((day) => ({ day, name: null, hour: null })),
          ...endMilestones,
        ];
      }
    }
  }

  private parseTimeValue(value: TimeValue): ParsedTimeValue {
    switch (value.type) {
      case "identifier":
        return {
          type: "milestone-identifier",
          milestoneName: value.accept(this).value,
        };
      default:
        return value.accept(this);
    }
  }

  private interpolateVariablesIntoCode(
    code: string,
    variables: { [name: string]: string | number }
  ): string {
    return Object.entries(variables).reduce(
      (code, [variableName, variableValue]) =>
        code.replace(
          new RegExp(`{{\\s*${escapeRegExp(variableName)}\\s*}}`, "g"),
          () => variableValue.toString()
        ),
      code
    );
  }

  private interpolateVariablesIntoColumnMapping(
    mapping: DatasetMappingColumn,
    variables: { [name: string]: string | number }
  ): DatasetMappingColumn {
    return {
      ...mapping,
      mappingLogic: {
        ...mapping.mappingLogic,
        code: this.interpolateVariablesIntoCode(
          mapping.mappingLogic.code,
          variables
        ),
      },
      variables: mapping.variables.map((variable) => ({
        ...variable,
        code: {
          ...variable.code,
          code: this.interpolateVariablesIntoCode(
            variable.code.code,
            variables
          ),
        },
      })),
    };
  }

  private getInterpolationVariables(
    variable: ParsedVariableMapping | null,
    variableValue: string | null,
    milestone: DatasetMilestone | null
  ): { [name: string]: string | number } {
    const variables: { [name: string]: string | number } = {};

    if (variable && variableValue != null) {
      variables[variable.variable] = variableValue;
    }

    if (milestone?.name) {
      variables["MILESTONE.NAME"] = milestone.name;
    }

    if (milestone?.day != null) {
      variables["MILESTONE.STUDY_DAY"] = milestone.day;
    }

    if (milestone?.hour != null) {
      variables["MILESTONE.HOUR"] = milestone.hour;
    }

    return variables;
  }

  visitStudyDefinition(node: StudyDefinition): Action {
    const { id, name } = this.getAttributes(node.children);

    assert(id.type === "string");
    assert(name.type === "string");

    return actions.setStudy({
      id: id.value,
      name: name.value,
    });
  }

  visitMilestoneDefinition(node: MilestoneDefinition): Action {
    const timeconf = this.getAttributes(node.children).at;
    assert(
      timeconf.type === "time-list" || timeconf.type === "time-expression"
    );

    return actions.addMilestone(
      ((): Milestone => {
        switch (timeconf.type) {
          case "time-list": {
            const [expression] = timeconf.days;
            assert(expression.type === "study-day");

            return {
              type: "absolute",
              name: node.name.accept(this).value,
              day: expression.day,
              window: expression.window,
            };
          }

          case "time-expression": {
            const { position, relativeTo } = timeconf;
            return {
              type: "relative",
              name: node.name.accept(this).value,
              position,
              relativeTo: ((): RelativeMilestone["relativeTo"] => {
                assert(relativeTo.type !== "time-range");
                switch (relativeTo.type) {
                  case "milestone-identifier":
                    return {
                      type: "reference",
                      name: relativeTo.milestoneName,
                    };
                  case "study-day":
                    return {
                      type: "anonymous",
                      milestone: {
                        type: "absolute",
                        name: null,
                        day: relativeTo.day,
                        window: relativeTo.window,
                      },
                    };
                }
              })(),
            };
          }
        }
      })()
    );
  }

  visitCodelistDefinition(node: CodelistDefinition): Action {
    return actions.addCodelist({
      name: node.name.accept(this).value,
      items: node.members.map((member) => member.accept(this)),
    });
  }

  visitInterfaceDefinition(node: InterfaceDefinition): Action {
    return actions.addInterface({
      name: node.name.accept(this).value,
      columns: node.columns.map((column) => column.accept(this)),
    });
  }

  visitDomainDefinition(node: DomainDefinition): Action {
    const { abbr } = this.getDirectives(node.directives);

    assert(abbr.args[0].type === "string");

    return actions.addDomain({
      name: node.name.accept(this).value,
      abbr: abbr.args[0].value,
      datasets: Object.fromEntries(
        node.children.map((child) => {
          const dataset = child.accept(this);

          return [dataset.name, dataset];
        })
      ),
    });
  }

  visitDatasetDefinition(node: DatasetDefinition): Dataset {
    const interfaceDefs = this.accessors.getInterfaceDefs();
    const interfaceColumns =
      node.interfaces
        ?.accept(this)
        .map(({ path }) => interfaceDefs[path].columns) ?? [];
    const {
      milestone: {
        args: [timelist],
      },
    } = this.getDirectives(node.directives);
    const milestones = this.accessors.getMilestones();

    assert(timelist.type === "time-list");

    return {
      name: node.name.accept(this).value,
      columns: [
        ...interfaceColumns.flat(),
        ...node.columns.map((column) => column.accept(this)),
      ],
      milestones: timelist.days
        .flatMap((item) =>
          this.getDatasetMilestonesFromTimeValue(item, milestones)
        )
        .flatMap(
          (data): DatasetMilestone[] =>
            timelist.hours?.map(({ hour }) => ({ ...data, hour })) ?? [
              {
                ...data,
                hour: null,
              },
            ]
        ),
      mappings: [],
    };
  }

  visitDatasetMapping(node: DatasetMapping): Action {
    const datasetName = node.dataset.accept(this).path;
    const { dataset } = this.accessors.getDatasets()[datasetName];
    const milestones = atLeastOne(dataset.milestones, null);
    const variables = atLeastOne(
      node.variables.map((variable) => variable.accept(this)),
      null
    );

    return actions.addDatasetMapping({
      dataset: datasetName,
      mappings: variables.flatMap((variable) =>
        (variable?.values ?? [null]).flatMap((value) =>
          milestones.map(
            (milestone): DatasetMappingResult => ({
              columns: Object.fromEntries(
                node.columns.map((column) => {
                  const columnMapping =
                    this.interpolateVariablesIntoColumnMapping(
                      column.accept(this),
                      this.getInterpolationVariables(variable, value, milestone)
                    );
                  return [columnMapping.name, columnMapping] as const;
                })
              ),
            })
          )
        )
      ),
    });
  }

  visitColumnMapping(node: ColumnMapping): DatasetMappingColumn {
    const sources = node.sources.map((source) => source.accept(this));
    const computation = node.computation?.accept(this);

    return {
      name: node.column.accept(this).value,
      variables: sources
        .filter((source) => source.variable != null)
        .map((source) => ({
          name: source.variable!,
          code: {
            source: source.source,
            language: source.code.language,
            code: source.code.code,
          },
        })),
      mappingLogic: ((): DatasetMappingColumn["mappingLogic"] => {
        if (computation) {
          return {
            source: null,
            language: computation.language,
            code: computation.code,
          };
        }

        const [source] = sources;

        return {
          source: source.source,
          language: source.code.language,
          code: source.code.code,
        };
      })(),
    };
  }

  visitColumnMappingSource(
    node: ColumnMappingSource
  ): ParsedColumnMappingSource {
    return {
      source: node.source.accept(this).value,
      variable: node.variable?.accept(this).value ?? null,
      code: node.code.accept(this),
    };
  }

  visitSourceCode(node: SourceCode): ParsedSourceCode {
    return {
      language: node.language,
      code: node.code,
    };
  }

  visitCodelistMember(node: CodelistMember): CodelistItem {
    const { desc } = this.getDirectives(node.directives);
    assert(desc.args[0].type === "string");

    return {
      value: node.name.accept(this).value,
      description: desc.args[0].value,
    };
  }

  visitVariableMapping(node: VariableMapping): ParsedVariableMapping {
    return {
      variable: node.variable.accept(this).value,
      values: node.values
        .accept(this)
        .filter((arg): arg is StringValue => arg.type === "string")
        .map((arg) => arg.value),
    };
  }

  visitColumnDefinition(node: ColumnDefinition): DatasetColumn {
    const {
      label: {
        args: [label],
      },
      desc: {
        args: [desc],
      },
    } = this.getDirectives(node.directives);

    assert(label.type === "string");
    assert(desc.type === "string");

    return {
      name: node.columnName.accept(this).value,
      label: label.value,
      description: desc.value,
      type: node.columnType.accept(this),
    };
  }

  visitDirective(node: Directive): ParsedDirective {
    return {
      name: node.name,
      args: node.args?.accept(this) ?? [],
    };
  }

  visitTypeExpression(node: TypeExpression): ColumnType[] {
    return node.members.flatMap((member) => member.accept(this));
  }

  visitTypeExpressionMember(node: TypeExpressionMember): ColumnType[] {
    const codelists = this.accessors.getCodelistDefs();
    const type = node.value.accept(this).value;
    const types: ColumnType[] = [];

    if (type in codelists) {
      types.push({ type: "codelist", value: type });
    } else {
      types.push({ type: "scalar", value: type });
    }

    if (node.optional) {
      types.push({ type: "scalar", value: "Null" });
    }

    return types;
  }

  visitIdentifier(node: Identifier): IdentifierValue {
    return { type: "identifier", value: node.value };
  }

  visitPath(node: Path): PathValue {
    return {
      path: node.value,
      parts: node.parts.map((part) => part.accept(this)),
    };
  }

  visitArgs(node: Args): ParsedValue[] {
    return node.args.map((arg) => arg.accept(this));
  }

  visitPathList(node: PathList): PathValue[] {
    return node.paths.map((path) => path.accept(this));
  }

  visitKeyValuePair(node: KeyValuePair): [string, ParsedValue] {
    const key = node.lhs.accept(this);
    const value = node.rhs.accept(this);

    return [key.value, value];
  }

  visitTimeconf(node: Timeconf): ParsedTimeconfValue {
    return node.value.accept(this);
  }

  visitStudyDay(node: StudyDay): StudyDayValue {
    return {
      type: "study-day",
      day: node.day.accept(this),
      window: node.window?.accept(this) ?? {
        before: 0,
        after: 0,
      },
    };
  }

  visitWindow(node: Window): StudyDayWindow {
    let window: StudyDayWindow = { before: 0, after: 0 };
    for (const child of node.window) {
      window = { ...window, ...child.accept(this) };
    }
    return window;
  }

  visitBothWindow(node: BothWindow): StudyDayWindow {
    return {
      before: node.days.value * -1,
      after: node.days.value,
    };
  }

  visitNegativeWindow(node: NegativeWindow): Partial<StudyDayWindow> {
    return { before: node.days.value * -1 };
  }

  visitPositiveWindow(node: PositiveWindow): Partial<StudyDayWindow> {
    return {
      after: node.days.value,
    };
  }

  visitTimeExpression(node: TimeExpression): TimeExpressionValue {
    return {
      type: "time-expression",
      position: (
        {
          "<": "before",
          ">": "after",
          "<=": "before/on",
          ">=": "after/on",
        } as const
      )[node.operator.value],
      relativeTo: this.parseTimeValue(node.rhs),
    };
  }

  visitDayExpression(node: DayExpression): number {
    return node.value;
  }

  visitHourExpression(node: HourExpression): ParsedHourValue {
    return {
      hour: node.value,
    };
  }

  visitTimeList(node: TimeList): TimeListValue {
    return {
      type: "time-list",
      hours: node.at?.map((hour) => hour.accept(this)) ?? null,
      days: node.items.map((item) => this.parseTimeValue(item)),
    };
  }

  visitTimeRange(node: TimeRange): TimeRangeValue {
    return {
      type: "time-range",
      start: this.parseTimeValue(node.start),
      end: this.parseTimeValue(node.end),
    };
  }

  visitString(node: String): StringValue {
    return { type: "string", value: node.value };
  }

  visit(node: Document): Action[] {
    return nonNull(
      node.children.map((child) => child.accept(this))
    ) as Action[];
  }

  getActions(): Action[] {
    return this.visit(this.file.ast);
  }
}

export { actions as configBuilderActions, reducer as configBuilderReducer };
