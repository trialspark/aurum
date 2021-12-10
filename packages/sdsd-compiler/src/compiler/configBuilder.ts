import { UnionToIntersection } from "utility-types";
import assert from "assert";
import { escapeRegExp, range } from "lodash";
import {
  CodelistItem,
  ColumnType,
  Dataset,
  DatasetColumn,
  DatasetMappingColumn,
  DatasetMapping as DatasetMappingResult,
  DatasetMilestone,
  Domain,
  Milestone,
  RelativeMilestone,
  DatasetColumnRole,
  AttributableAction,
  Diagnostic,
  CompilerOptions,
  DiagnosticCode,
  DiagnosticScope,
  DefinitionType,
  Loc,
  ExtraAttributeDiagnostic,
  MissingAttributeDiagnostic,
  InvalidTypeDiagnostic,
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
import { atLeastOne, nonNull, untab } from "../utils";
import { File, filesActions, NamedDefMap, ReducerState } from "./state";
import { DocumentVisitor } from "./visitor";
import { Action } from "./state";
import { configBuilderActions } from "./state/configBuilder";

interface StringValue {
  type: "string";
  value: string;
  loc: Loc;
}

interface IdentifierValue {
  type: "identifier";
  value: string;
}

interface TimeExpressionValue {
  type: "time-expression";
  position: "before" | "after" | "before/on" | "after/on";
  relativeTo: ParsedTimeValue;
  loc: Loc;
}

interface TimeListValue {
  type: "time-list";
  days: ParsedTimeValue[];
  hours: ParsedHourValue[] | null;
  loc: Loc;
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

interface ParsedDirective<A extends ParsedValue[] = ParsedValue[]> {
  name: string;
  args: A;
  loc: Loc;
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

type DirectiveTypes = {
  label: [StringValue];
  desc: [StringValue];
  abbr: [StringValue];
  milestone: [TimeListValue];
  "milestone.study_day": [];
  "milestone.name": [];
  "milestone.hour": [];
  sequence: [];
  "subject.id": [];
  "subject.uuid": [];
};
type ParsedValueTypes<Tuple extends [...ParsedValue[]]> = {
  [Index in keyof Tuple]: Tuple[Index] extends { type: string }
    ? Tuple[Index]["type"]
    : never;
};
type HandleEmpty<T> = T extends never[] ? [] : T;
const DirectiveTypes: {
  [T in keyof DirectiveTypes]: HandleEmpty<{
    [Index in keyof DirectiveTypes[T]]: ParsedValueTypes<
      DirectiveTypes[T]
    >[Index];
  }>;
} = {
  label: ["string"],
  desc: ["string"],
  abbr: ["string"],
  milestone: ["time-list"],
  "milestone.hour": [],
  "milestone.name": [],
  "milestone.study_day": [],
  "subject.id": [],
  "subject.uuid": [],
  sequence: [],
};

/**
 * Parses/transforms core/shared entities like directives/args/identifiers/strings/values/etc.
 */
class BaseConfigBuilder extends DocumentVisitor {
  constructor(
    private files: File[],
    protected accessors: {
      getState: () => ReducerState;
      getOptions: () => CompilerOptions;
    }
  ) {
    super();
  }

  protected currentFile: File | null = null;

  private diagnosticActions: ReturnType<
    typeof configBuilderActions["addDiagnostic"]
  >[] = [];
  private filesActions: ReturnType<typeof filesActions["addDependency"]>[] = [];

  protected addDiagnostic<D extends Diagnostic>(diagnostic: D): D {
    this.diagnosticActions.push(configBuilderActions.addDiagnostic(diagnostic));
    return diagnostic;
  }

  protected addFileDependency(parent: File) {
    this.filesActions.push(
      filesActions.addDependency({
        filename: parent.name,
        dependencyFilename: this.currentFile!.name,
      })
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

  private withCleanFiles<R>(fn: () => R): R {
    try {
      this.filesActions = [];
      return fn();
    } finally {
      this.filesActions = [];
    }
  }

  protected recordMilestoneReference(milestoneName: string, loc: Loc) {
    const milestoneDef =
      this.accessors.getState().defBuilder.milestoneDefs[milestoneName];

    if (milestoneDef) {
      this.addFileDependency(milestoneDef.file);
    } else {
      this.addDiagnostic({
        code: DiagnosticCode.NOT_FOUND,
        scope: DiagnosticScope.LOCAL,
        loc,
        message: untab(`
        Could not find milestone with name "${milestoneName}". Please add it:

        milestone ${milestoneName} {
          at: t"d7 +-2"
        }
      `),
        defType: DefinitionType.MILESTONE,
        name: milestoneName,
      });
    }
  }

  protected checkForExtraAttributes(
    attributes: ReturnType<BaseConfigBuilder["getAttributes"]>,
    expectedAttributes: Set<string>,
    defType: ExtraAttributeDiagnostic["defType"]
  ) {
    for (const [attributeName, attribute] of Object.entries(attributes)) {
      if (!expectedAttributes.has(attributeName)) {
        this.addDiagnostic({
          code: DiagnosticCode.EXTRA_ATTRIBUTE,
          scope: DiagnosticScope.LOCAL,
          loc: attribute!.loc,
          message: untab(`
            Extra attribute "${attributeName}"
          `),
          defType,
          attributeName,
        });
      }
    }
  }

  protected addTypeError(
    { expectedType, actualType }: { expectedType: string; actualType: string },
    example: string,
    loc: Loc
  ) {
    return this.addDiagnostic({
      code: DiagnosticCode.INVALID_TYPE,
      scope: DiagnosticScope.LOCAL,
      loc,
      message: untab(`
        Invalid type: ${actualType}, should be a ${expectedType}.${
        example ? ` (e.g. ${example})` : ""
      }
      `),
      actualType,
      expectedType,
    });
  }

  protected addMissingAttributeDiagnostic(
    attribute: string,
    parentLoc: Loc,
    defType: MissingAttributeDiagnostic["defType"],
    example: string
  ) {
    this.addDiagnostic({
      code: DiagnosticCode.MISSING_ATTRIBUTE,
      scope: DiagnosticScope.LOCAL,
      loc: parentLoc,
      message: untab(`
        ${defType} must have an "${attribute}" attribute. Please add one:

        ${example}
      `),
      attributeName: attribute,
      defType,
    });
  }

  protected getStringAttributes(
    attributes: ReturnType<BaseConfigBuilder["getAttributes"]>,
    keys: string[],
    parentLoc: Loc,
    defType: MissingAttributeDiagnostic["defType"],
    example: string
  ): (StringValue | null)[] {
    return keys.map((key) => {
      const value = attributes[key];

      if (value == null) {
        this.addMissingAttributeDiagnostic(key, parentLoc, defType, example);
        return null;
      }

      if (value.type !== "string") {
        this.addTypeError(
          { expectedType: "string", actualType: value.type },
          '"hello"',
          value.loc
        );
        return null;
      }

      return value;
    });
  }

  protected getTimeconfAttributes(
    attributes: ReturnType<BaseConfigBuilder["getAttributes"]>,
    keys: string[],
    parentLoc: Loc,
    defType: MissingAttributeDiagnostic["defType"],
    example: string
  ): (ParsedTimeconfValue | null)[] {
    return keys.map((key) => {
      const value = attributes[key];

      if (value == null) {
        this.addMissingAttributeDiagnostic(key, parentLoc, defType, example);
        return null;
      }

      if (value.type !== "time-expression" && value.type !== "time-list") {
        this.addTypeError(
          { expectedType: "t-string", actualType: value.type },
          't"d0"',
          value.loc
        );
        return null;
      }

      return value;
    });
  }

  protected getDatasets(): NamedDefMap<{ domain: Domain; dataset: Dataset }> {
    return Object.fromEntries(
      Object.values(
        this.accessors.getState().configBuilder.result.domains
      ).flatMap((domain) =>
        Object.values(domain.datasets).map((dataset) => [
          dataset.name,
          { domain, dataset },
        ])
      )
    );
  }

  protected getAttributes(
    keyValuePairs: KeyValuePair[],
    defType: ExtraAttributeDiagnostic["defType"]
  ): {
    [attrName: string]: ParsedValue | undefined;
  } {
    const attributes: ReturnType<BaseConfigBuilder["getAttributes"]> = {};

    for (const node of keyValuePairs) {
      const { key, value, loc } = node.accept(this);
      if (!(key in attributes)) {
        attributes[key] = value;
      } else {
        this.addDiagnostic({
          code: DiagnosticCode.DUPLICATE_ATTRIBUTE,
          scope: DiagnosticScope.LOCAL,
          loc,
          message: `Duplicate attribute ${key}`,
          attributeName: key,
          defType,
        });
      }
    }

    return attributes;
  }

  private typecheckDirective<Name extends keyof DirectiveTypes>(
    name: Name,
    directive: ParsedDirective
  ): [Name, ParsedDirective | null] {
    const expectedArgTypes = DirectiveTypes[name];

    if (directive.args.length !== expectedArgTypes.length) {
      this.addDiagnostic({
        code: DiagnosticCode.INCORRECT_NUMBER_OF_ARGS,
        scope: DiagnosticScope.LOCAL,
        loc: directive.loc,
        message: `Incorrect number of arguments. Expected ${expectedArgTypes.length} but got ${directive.args.length}.`,
        expected: expectedArgTypes.length,
        actual: directive.args.length,
      });
      return [name, null];
    }

    const typeErrors = directive.args.flatMap(
      (arg, index): InvalidTypeDiagnostic[] => {
        const expectedType = expectedArgTypes[index];

        if (arg.type !== expectedType) {
          return [
            this.addTypeError(
              { actualType: arg.type, expectedType },
              "",
              arg.loc
            ),
          ];
        }

        return [];
      }
    );

    if (typeErrors.length > 0) {
      return [name, null];
    }

    return [name, directive];
  }

  protected getDirectives<
    RequiredNames extends ReadonlyArray<keyof DirectiveTypes>,
    OptionalNames extends ReadonlyArray<keyof DirectiveTypes>
  >(
    directiveNodes: Directive[],
    {
      required,
      optional,
    }: { required: RequiredNames; optional: OptionalNames },
    parentLoc: Loc
  ): {
    [K in (RequiredNames | OptionalNames)[number]]: ParsedDirective<
      DirectiveTypes[K]
    > | null;
  } {
    type Names = (RequiredNames[number] | OptionalNames[number])[];
    const directives = Object.fromEntries(
      directiveNodes.map((directive) => {
        const parsed = directive.accept(this);

        if (!(parsed.name in DirectiveTypes)) {
          this.addDiagnostic({
            code: DiagnosticCode.UNEXPECTED_DIRECTIVE,
            scope: DiagnosticScope.LOCAL,
            loc: parsed.loc,
            message: `Did expect to see directive ${parsed.name} here.`,
            name: parsed.name,
          });
        }

        return [parsed.name, parsed];
      })
    );
    const result = Object.fromEntries([
      ...required.map((name): [Names[number], ParsedDirective | null] => {
        const directive = directives[name];

        if (!directive) {
          this.addDiagnostic({
            code: DiagnosticCode.MISSING_DIRECTIVE,
            scope: DiagnosticScope.LOCAL,
            loc: parentLoc,
            message: untab(`
              Missing directive ${name}. Please add it (e.g. @${name}(...)).
            `),
            directiveName: name,
          });
          return [name, null];
        }

        return this.typecheckDirective(name, directive);
      }),
      ...optional.map((name): [Names[number], ParsedDirective | null] => {
        const directive = directives[name];

        if (!directive) {
          return [name, null];
        }

        return this.typecheckDirective(name, directive);
      }),
    ]);

    return result as any;
  }

  private parseTimeValue(value: TimeValue): ParsedTimeValue {
    switch (value.type) {
      case "identifier":
        this.recordMilestoneReference(value.accept(this).value, {
          ...value.loc,
          filename: this.currentFile!.name,
        });
        return {
          type: "milestone-identifier",
          milestoneName: value.accept(this).value,
          loc: { ...value.loc, filename: this.currentFile!.name },
        };
      default:
        return value.accept(this);
    }
  }

  visitColumnDefinition(node: ColumnDefinition): DatasetColumn {
    const { label, desc, ...roleDirectives } = this.getDirectives(
      node.directives,
      {
        optional: [
          "milestone.study_day",
          "milestone.hour",
          "milestone.name",
          "subject.id",
          "subject.uuid",
          "sequence",
        ],
        required: ["label", "desc"],
      },
      { ...node.loc, filename: this.currentFile!.name }
    );

    return {
      name: node.columnName.accept(this).value,
      label: label?.args[0].value ?? "",
      description: desc?.args[0].value ?? "",
      type: node.columnType.accept(this),
      role: ((): DatasetColumnRole | null => {
        const roles: { [R in keyof typeof roleDirectives]: null } = {
          "milestone.study_day": null,
          "milestone.hour": null,
          "milestone.name": null,
          "subject.id": null,
          "subject.uuid": null,
          sequence: null,
        };

        for (const role in roles) {
          if (roleDirectives[role as keyof typeof roles]) {
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
      loc: { ...node.loc, filename: this.currentFile!.name },
    };
  }

  visitTypeExpression(node: TypeExpression): ColumnType[] {
    return node.members.flatMap((member) => member.accept(this));
  }

  visitTypeExpressionMember(node: TypeExpressionMember): ColumnType[] {
    const options = this.accessors.getOptions();
    const codelists = this.accessors.getState().defBuilder.codelistDefs;
    const type = node.value.accept(this).value;
    const types: ColumnType[] = [];

    if (type in codelists) {
      types.push({ type: "codelist", value: type });
      this.addFileDependency(codelists[type]!.file);
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

  visitKeyValuePair(node: KeyValuePair): {
    key: string;
    value: ParsedValue;
    loc: Loc;
  } {
    const key = node.lhs.accept(this);
    const value = node.rhs.accept(this);

    return {
      key: key.value,
      value,
      loc: { ...node.loc, filename: this.currentFile!.name },
    };
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
      loc: { ...node.loc, filename: this.currentFile!.name },
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
      loc: { ...node.loc, filename: this.currentFile!.name },
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
    return {
      type: "string",
      value: node.value,
      loc: { ...node.loc, filename: this.currentFile!.name },
    };
  }

  visit(node: Document): Action[] {
    return node.children.flatMap((child) => {
      const actions = child.accept(this);

      return Array.isArray(actions) ? actions : [];
    });
  }

  getActions(): AttributableAction[] {
    return this.files.flatMap((file) =>
      this.withCleanDiagnostics(() =>
        this.withCleanFiles(() =>
          this.withFile(file, () => {
            if (!file.ast) {
              return [];
            }
            const configActions = this.visit(file.ast);
            return [
              ...this.diagnosticActions,
              ...this.filesActions,
              ...configActions,
            ].map((action) => ({
              file,
              action,
            }));
          })
        )
      )
    );
  }
}

/**
 * Builds configuration entities for studies, codelists, and milestones.
 */
export class Phase1ConfigBuilder extends BaseConfigBuilder {
  constructor(
    files: File[],
    protected accessors: {
      getState: () => ReducerState;
      getOptions: () => CompilerOptions;
    }
  ) {
    super(files, accessors);
  }

  visitStudyDefinition(node: StudyDefinition): Action[] {
    const attributes = this.getAttributes(node.children, DefinitionType.STUDY);
    const [id, name] = this.getStringAttributes(
      attributes,
      ["id", "name"],
      { ...node.loc, filename: this.currentFile!.name },
      DefinitionType.STUDY,
      untab(`
        study {
          id: "STUDY-ID"
          name: "Name of study"
        }
      `)
    );

    this.checkForExtraAttributes(
      attributes,
      new Set(["id", "name"]),
      DefinitionType.STUDY
    );

    return [
      configBuilderActions.setStudy({
        id: id?.value ?? "",
        name: name?.value ?? "",
      }),
    ];
  }

  visitMilestoneDefinition(node: MilestoneDefinition): Action[] {
    const attributes = this.getAttributes(
      node.children,
      DefinitionType.MILESTONE
    );
    const [timeconf] = this.getTimeconfAttributes(
      attributes,
      ["at"],
      { ...node.loc, filename: this.currentFile!.name },
      DefinitionType.MILESTONE,
      untab(`
        milestone ${node.name.accept(this).value} {
          at: t"d0"
        }
      `)
    );

    this.checkForExtraAttributes(
      attributes,
      new Set(["at"]),
      DefinitionType.MILESTONE
    );

    if (!timeconf) {
      return [];
    }

    return [
      configBuilderActions.addMilestone(
        ((): Milestone => {
          switch (timeconf.type) {
            case "time-list": {
              if (timeconf.days.length !== 1) {
                this.addTypeError(
                  {
                    expectedType: "t-string with 1 item",
                    actualType: `t-string with ${timeconf.days.length} item(s)`,
                  },
                  't"d0"',
                  timeconf.loc
                );
              }

              const [expression] = timeconf.days;

              if (expression.type !== "study-day") {
                this.addTypeError(
                  { expectedType: "day-of-study", actualType: expression.type },
                  't"d0"',
                  timeconf.loc
                );
                return {
                  type: "absolute",
                  day: 0,
                  name: null,
                  window: {
                    after: 0,
                    before: 0,
                  },
                };
              }

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
                    default:
                      this.addTypeError(
                        {
                          expectedType: "milestone or day-of-study",
                          actualType: relativeTo.type,
                        },
                        't"> BASELINE"',
                        timeconf.loc
                      );
                      return {
                        type: "anonymous",
                        milestone: {
                          type: "absolute",
                          name: null,
                          day: 0,
                          window: { before: 0, after: 0 },
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
    const { desc } = this.getDirectives(
      node.directives,
      { required: ["desc"], optional: [] },
      {
        ...node.loc,
        filename: this.currentFile!.name,
      }
    );

    return {
      value: node.name.accept(this).value,
      description: desc?.args[0].value ?? "",
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
      getState: () => ReducerState;
      getOptions: () => CompilerOptions;
    }
  ) {
    super(files, accessors);
  }

  private getDatasetMilestonesFromTimeValue(
    dayValue: ParsedTimeValue
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
        const milestone =
          this.accessors.getState().configBuilder.result.milestones[
            dayValue.milestoneName
          ];

        return [
          {
            name: milestone?.name ?? null,
            day: milestone?.type === "absolute" ? milestone.day : null,
          },
        ];
      }
      case "time-range": {
        const { start, end } = dayValue;
        const startMilestones = this.getDatasetMilestonesFromTimeValue(start);
        const endMilestones = this.getDatasetMilestonesFromTimeValue(end);
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
    const { abbr } = this.getDirectives(
      node.directives,
      { required: ["abbr"], optional: [] },
      {
        ...node.loc,
        filename: this.currentFile!.name,
      }
    );

    return [
      configBuilderActions.addDomain({
        name: node.name.accept(this).value,
        abbr: abbr?.args[0].value ?? "",
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
    const interfaces = this.accessors.getState().configBuilder.interfaces;
    const interfaceDefs = this.accessors.getState().defBuilder.interfaceDefs;
    const interfaceNames =
      node.interfaces?.accept(this).map(({ path }) => path) ?? [];
    const interfaceColumns = interfaceNames.map((name) => {
      const iface = interfaces[name];
      const ifaceDef = interfaceDefs[name];

      if (ifaceDef) {
        this.addFileDependency(ifaceDef.file);
      }

      if (!iface) {
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

      return iface.columns;
    });
    const { milestone } = this.getDirectives(
      node.directives,
      { optional: ["milestone"], required: [] },
      { ...node.loc, filename: this.currentFile!.name }
    );
    const timelist = milestone?.args[0] ?? null;

    return {
      name: node.name.accept(this).value,
      columns: [
        ...interfaceColumns.flat(),
        ...node.columns.map((column) => column.accept(this)),
      ],
      milestones:
        timelist?.days
          ?.flatMap((item) => this.getDatasetMilestonesFromTimeValue(item))
          .flatMap(
            (data): DatasetMilestone[] =>
              timelist?.hours?.map(({ hour }) => ({ ...data, hour })) ?? [
                {
                  ...data,
                  hour: null,
                },
              ]
          ) ?? [],
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
      getState: () => ReducerState;
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
    const { dataset } = this.getDatasets()[datasetName] ?? {};
    const datasetDef =
      this.accessors.getState().defBuilder.datasetDefs[datasetName];

    if (datasetDef) {
      this.addFileDependency(datasetDef.file);
    }

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
