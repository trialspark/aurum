import { createSlice, freeze, PayloadAction, original } from "@reduxjs/toolkit";
import { UnionToIntersection } from "utility-types";
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
  DatasetColumnRole,
  AttributableAction,
  Diagnostic,
  CompilerOptions,
  DiagnosticCode,
  DiagnosticScope,
  DefinitionType,
  Interface,
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
  Loc,
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
import { atLeastOne, nonNull, untab } from "../utils";
import { CodelistDef, File, NamedDefMap } from "./state";
import { DocumentVisitor } from "./visitor";
import { Action } from "./state";
import { configBuilderActions } from "./state/configBuilder";

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
  loc: Loc;
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

/**
 * Parses/transforms core/shared entities like directives/args/identifiers/strings/values/etc.
 */
class BaseConfigBuilder extends DocumentVisitor {
  constructor(
    private files: File[],
    protected accessors: {
      getCodelistDefs: () => NamedDefMap<CodelistDef>;
      getOptions: () => CompilerOptions;
    }
  ) {
    super();
  }

  protected currentFile: File | null = null;

  private diagnosticActions: ReturnType<
    typeof configBuilderActions["addDiagnostic"]
  >[] = [];

  protected addDiagnostic(diagnostic: Diagnostic) {
    return this.diagnosticActions.push(
      configBuilderActions.addDiagnostic(diagnostic)
    );
  }

  private withFile<R>(file: File, fn: () => R): R {
    try {
      this.currentFile = file;
      return fn();
    } finally {
      this.currentFile = null;
    }
  }

  private withCleanDiagnostics<R>(fn: () => R): R {
    try {
      this.diagnosticActions = [];
      return fn();
    } finally {
      this.diagnosticActions = [];
    }
  }

  protected getAttributes(keyValuePairs: KeyValuePair[]) {
    return Object.fromEntries(keyValuePairs.map((node) => node.accept(this)));
  }

  protected getDirectives(directives: Directive[]): {
    [directiveName: string]: ParsedDirective;
  } {
    return Object.fromEntries(
      directives.map((directive) => {
        const parsed = directive.accept(this);

        return [parsed.name, parsed];
      })
    );
  }

  private parseTimeValue(value: TimeValue): ParsedTimeValue {
    switch (value.type) {
      case "identifier":
        return {
          type: "milestone-identifier",
          milestoneName: value.accept(this).value,
          loc: value.loc,
        };
      default:
        return value.accept(this);
    }
  }

  visitColumnDefinition(node: ColumnDefinition): DatasetColumn {
    const directives = this.getDirectives(node.directives);
    const {
      label: {
        args: [label],
      },
      desc: {
        args: [desc],
      },
    } = directives;

    assert(label.type === "string");
    assert(desc.type === "string");

    return {
      name: node.columnName.accept(this).value,
      label: label.value,
      description: desc.value,
      type: node.columnType.accept(this),
      role: ((): DatasetColumnRole | null => {
        const roles: { [R in DatasetColumnRole]: null } = {
          "milestone.study_day": null,
          "milestone.hour": null,
          "milestone.name": null,
          "subject.id": null,
          "subject.uuid": null,
          sequence: null,
        };

        for (const role in roles) {
          if (role in directives) {
            return role as DatasetColumnRole;
          }
        }

        return null;
      })(),
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
    const options = this.accessors.getOptions();
    const codelists = this.accessors.getCodelistDefs();
    const type = node.value.accept(this).value;
    const types: ColumnType[] = [];

    if (type in codelists) {
      types.push({ type: "codelist", value: type });
    } else if (options.scalarTypes.includes(type)) {
      types.push({ type: "scalar", value: type });
    } else {
      // We can assume this is referencing a Codelist that has not yet been defined
      this.addDiagnostic({
        code: DiagnosticCode.NOT_FOUND,
        scope: DiagnosticScope.LOCAL,
        loc: { ...node.loc, filename: this.currentFile!.name },
        message: untab(`
          Could not find codelist with name "${type}". Please define it:

          codelist ${type} {
            EXAMPLE            @desc("An example member of the codelist")
          }
        `),
        defType: DefinitionType.CODELIST,
        name: type,
      });
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

  visitSourceCode(node: SourceCode): ParsedSourceCode {
    return {
      language: node.language,
      code: node.code,
    };
  }

  visitString(node: String): StringValue {
    return { type: "string", value: node.value };
  }

  visit(node: Document): Action[] {
    return node.children.flatMap((child) => {
      const actions = child.accept(this);

      return Array.isArray(actions) ? actions : [];
    });
  }

  getActions(): AttributableAction[] {
    return this.files.flatMap((file) => {
      return this.withCleanDiagnostics(() =>
        this.withFile(file, () => {
          const configActions = this.visit(file.ast);
          return [...this.diagnosticActions, ...configActions].map(
            (action) => ({
              file,
              action,
            })
          );
        })
      );
    });
  }
}

/**
 * Builds configuration entities for studies, codelists, and milestones.
 */
export class Phase1ConfigBuilder extends BaseConfigBuilder {
  constructor(
    files: File[],
    protected accessors: {
      getCodelistDefs: () => NamedDefMap<CodelistDef>;
      getOptions: () => CompilerOptions;
    }
  ) {
    super(files, accessors);
  }

  visitStudyDefinition(node: StudyDefinition): Action[] {
    const { id, name } = this.getAttributes(node.children);

    assert(id.type === "string");
    assert(name.type === "string");

    return [
      configBuilderActions.setStudy({
        id: id.value,
        name: name.value,
      }),
    ];
  }

  visitMilestoneDefinition(node: MilestoneDefinition): Action[] {
    const timeconf = this.getAttributes(node.children).at;
    assert(
      timeconf.type === "time-list" || timeconf.type === "time-expression"
    );

    return [
      configBuilderActions.addMilestone(
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
      ),
    ];
  }

  visitCodelistDefinition(node: CodelistDefinition): Action[] {
    return [
      configBuilderActions.addCodelist({
        name: node.name.accept(this).value,
        items: node.members.map((member) => member.accept(this)),
      }),
    ];
  }

  visitCodelistMember(node: CodelistMember): CodelistItem {
    const { desc } = this.getDirectives(node.directives);
    assert(desc.args[0].type === "string");

    return {
      value: node.name.accept(this).value,
      description: desc.args[0].value,
    };
  }
}

/**
 * Builds configuration entities for interfaces.
 */
export class Phase2ConfigBuilder extends BaseConfigBuilder {
  visitInterfaceDefinition(node: InterfaceDefinition): Action[] {
    return [
      configBuilderActions.addInterface({
        name: node.name.accept(this).value,
        columns: node.columns.map((column) => column.accept(this)),
      }),
    ];
  }
}

/**
 * Builds configuration entities for domain definitions.
 */
export class Phase3ConfigBuilder extends BaseConfigBuilder {
  constructor(
    files: File[],
    protected accessors: {
      getCodelistDefs: () => NamedDefMap<CodelistDef>;
      getInterfaceDefs: () => NamedDefMap<Interface>;
      getMilestones: () => NamedDefMap<Milestone>;
      getOptions: () => CompilerOptions;
    }
  ) {
    super(files, accessors);
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
        const milestone = milestones[dayValue.milestoneName];

        if (!milestone) {
          this.addDiagnostic({
            code: DiagnosticCode.NOT_FOUND,
            scope: DiagnosticScope.LOCAL,
            loc: { ...dayValue.loc, filename: this.currentFile!.name },
            message: untab(`
              Could not find milestone with name "${dayValue.milestoneName}". Please add it:

              milestone ${dayValue.milestoneName} {
                at: t"d7 +-2"
              }
            `),
            defType: DefinitionType.MILESTONE,
            name: dayValue.milestoneName,
          });
        }

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

  visitDomainDefinition(node: DomainDefinition): Action[] {
    const { abbr } = this.getDirectives(node.directives);

    assert(abbr.args[0].type === "string");

    return [
      configBuilderActions.addDomain({
        name: node.name.accept(this).value,
        abbr: abbr.args[0].value,
        datasets: Object.fromEntries(
          node.children.map((child) => {
            const dataset = child.accept(this);

            return [dataset.name, dataset];
          })
        ),
      }),
    ];
  }

  visitDatasetDefinition(node: DatasetDefinition): Dataset {
    const interfaceDefs = this.accessors.getInterfaceDefs();
    const interfaceNames =
      node.interfaces?.accept(this).map(({ path }) => path) ?? [];
    const interfaceColumns = interfaceNames.map((name) => {
      const interfaceDef = interfaceDefs[name];

      if (!interfaceDef) {
        this.addDiagnostic({
          code: DiagnosticCode.NOT_FOUND,
          scope: DiagnosticScope.LOCAL,
          loc: { ...node.loc, filename: this.currentFile!.name },
          message: untab(`
            Could not find interface with name ${name}. Please define it:

            interface ${name} {
              COLUMN String       @label("Example column")
                                  @desc("A definition of a column for illustrative purposes")
            }
          `),
          defType: DefinitionType.INTERFACE,
          name,
        });

        return [];
      }

      return interfaceDef.columns;
    });
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
}

/**
 * Builds configuration entities for dataset mappings.
 */
export class Phase4ConfigBuilder extends BaseConfigBuilder {
  constructor(
    files: File[],
    protected accessors: {
      getCodelistDefs: () => NamedDefMap<CodelistDef>;
      getDatasets: () => NamedDefMap<{ domain: Domain; dataset: Dataset }>;
      getOptions: () => CompilerOptions;
    }
  ) {
    super(files, accessors);
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

  visitDatasetMapping(node: DatasetMapping): Action[] {
    const datasetName = node.dataset.accept(this).path;
    const { dataset } = this.accessors.getDatasets()[datasetName] ?? {};

    if (!dataset) {
      this.addDiagnostic({
        code: DiagnosticCode.NOT_FOUND,
        scope: DiagnosticScope.LOCAL,
        loc: { ...node.loc, filename: this.currentFile!.name },
        message: untab(`
          Could not find dataset with name "${datasetName}". Please define it:

          domain "MY DOMAIN" @abbr("MD") {
            dataset ${datasetName} {
              COLUMN String       @label("Example column")
                                  @desc("A definition of a column for illustrative purposes")
            }
          }
        `),
        defType: DefinitionType.DATASET,
        name: datasetName,
      });
      return [];
    }

    const milestones = atLeastOne(dataset.milestones, null);
    const variables = atLeastOne(
      node.variables.map((variable) => variable.accept(this)),
      null
    );
    const autoMappedColumns: DatasetMappingColumn[] = dataset.columns
      .map((column) => ({
        name: column.name,
        variables: [],
        mappingLogic: {
          source: "literal",
          language: "json",
          code: ((): string => {
            switch (column.role) {
              case "milestone.name":
                return `"{{${column.role.toUpperCase()}}}"`;
              case "milestone.study_day":
              case "milestone.hour":
                return `{{${column.role.toUpperCase()}}}`;
              case "subject.uuid":
              case "subject.id":
              case "sequence":
              case null:
                return "";
            }
          })(),
        },
      }))
      .filter((mapping) => mapping.mappingLogic.code !== "");

    return [
      configBuilderActions.addDatasetMapping({
        dataset: datasetName,
        mappings: variables.flatMap((variable) =>
          (variable?.values ?? [null]).flatMap((value) =>
            milestones.map(
              (milestone): DatasetMappingResult => ({
                columns: Object.fromEntries([
                  ...autoMappedColumns.map(
                    (column): [string, DatasetMappingColumn] => [
                      column.name,
                      this.interpolateVariablesIntoColumnMapping(
                        column,
                        this.getInterpolationVariables(
                          variable,
                          value,
                          milestone
                        )
                      ),
                    ]
                  ),
                  ...node.columns.map((column) => {
                    const columnMapping =
                      this.interpolateVariablesIntoColumnMapping(
                        column.accept(this),
                        this.getInterpolationVariables(
                          variable,
                          value,
                          milestone
                        )
                      );
                    return [columnMapping.name, columnMapping] as const;
                  }),
                ]),
              })
            )
          )
        ),
      }),
    ];
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

  visitVariableMapping(node: VariableMapping): ParsedVariableMapping {
    return {
      variable: node.variable.accept(this).value,
      values: node.values
        .accept(this)
        .filter((arg): arg is StringValue => arg.type === "string")
        .map((arg) => arg.value),
    };
  }
}

export const configBuilders = [
  Phase1ConfigBuilder,
  Phase2ConfigBuilder,
  Phase3ConfigBuilder,
  Phase4ConfigBuilder,
] as const;

export type SuperAccessor = UnionToIntersection<
  ConstructorParameters<typeof configBuilders[number]>[1]
>;
