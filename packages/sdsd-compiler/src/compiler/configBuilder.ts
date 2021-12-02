import assert from "assert";
import {
  CodelistItem,
  ColumnType,
  Dataset,
  DatasetColumn,
  DatasetMilestone,
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
  DatasetDefinition,
  Directive,
  DomainDefinition,
  Identifier,
  KeyValuePair,
  MilestoneDefinition,
  NegativeWindow,
  PositiveWindow,
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
  Value,
  Window,
} from "../astTypes";
import { setFirst, unreachable } from "../utils";
import { CodelistDef, File, NamedDefMap } from "./defBuilder";
import { DocumentVisitor } from "./visitor";

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
  items: ParsedTimeValue[];
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

type ParsedTimeValue =
  | StudyDayValue
  | MilestoneIdentifierValue
  | TimeRangeValue;

type ParsedTimeconfValue = TimeExpressionValue | TimeListValue;

type ParsedValue = StringValue | ParsedTimeconfValue;

export class ConfigBuilder extends DocumentVisitor {
  constructor(
    private file: File,
    private accessors: {
      getCodelistDefs: () => NamedDefMap<CodelistDef>;
      getMilestones: () => NamedDefMap<Milestone>;
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

  visitStudyDefinition(node: StudyDefinition): void {
    const { id, name } = this.getAttributes(node.children);

    assert(id.type === "string");
    assert(name.type === "string");

    this.file.result.study = {
      id: id.value,
      name: name.value,
    };
  }

  visitMilestoneDefinition(node: MilestoneDefinition) {
    if (!this.file.result.milestones) {
      this.file.result.milestones = {};
    }
    const timeconf = this.getAttributes(node.children).at;
    assert(
      timeconf.type === "time-list" || timeconf.type === "time-expression"
    );

    const milestone = ((): Milestone => {
      switch (timeconf.type) {
        case "time-list": {
          const [expression] = timeconf.items;
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
                  return { type: "reference", name: relativeTo.milestoneName };
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
    })();

    this.file.result.milestones[milestone.name!] = milestone;
  }

  visitCodelistDefinition(node: CodelistDefinition) {
    const codelists =
      this.file.result.codelists ?? (this.file.result.codelists = {});

    codelists[node.name.value] = {
      name: node.name.accept(this).value,
      items: node.members.map((member) => member.accept(this)),
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

  visitDomainDefinition(node: DomainDefinition) {
    const domains = this.file.result.domains || (this.file.result.domains = {});
    const { abbr } = this.getDirectives(node.directives);

    assert(abbr.args[0].type === "string");

    domains[node.name.value] = {
      name: node.name.accept(this).value,
      abbr: abbr.args[0].value,
      datasets: Object.fromEntries(
        node.children.map((child) => {
          const dataset = child.accept(this);

          return [dataset.name, dataset];
        })
      ),
    };
  }

  visitDatasetDefinition(node: DatasetDefinition): Dataset {
    const {
      milestone: {
        args: [timelist],
      },
    } = this.getDirectives(node.directives);
    const milestones = this.accessors.getMilestones();

    assert(timelist.type === "time-list");

    return {
      name: node.name.accept(this).value,
      columns: node.columns.map((column) => column.accept(this)),
      milestones: timelist.items.flatMap(
        (item): DatasetMilestone | DatasetMilestone[] => {
          switch (item.type) {
            case "study-day":
              return {
                name: null,
                day: item.day,
                hour: 0,
              };
            case "milestone-identifier": {
              const milestone = milestones[item.milestoneName] as
                | Milestone
                | undefined;

              return {
                name: milestone?.name ?? null,
                day: milestone?.type === "absolute" ? milestone.day : null,
                hour: null,
              };
            }
            case "time-range": {
              return [];
            }
          }
        }
      ),
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

  visitArgs(node: Args): ParsedValue[] {
    return node.args.map((arg) => arg.accept(this));
  }

  visitKeyValuePair(node: KeyValuePair): [string, ParsedValue] {
    const key = node.lhs.accept(this);
    const value = node.rhs.accept(this);

    return [key.value, value];
  }

  visitString(node: String): StringValue {
    return { type: "string", value: node.value };
  }

  visitIdentifier(node: Identifier): IdentifierValue {
    return { type: "identifier", value: node.value };
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

  visitStudyDay(node: StudyDay): StudyDayValue {
    return {
      type: "study-day",
      day: node.day.value,
      window: node.window?.accept(this) ?? {
        before: 0,
        after: 0,
      },
    };
  }

  parseTimeValue(value: TimeValue): ParsedTimeValue {
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

  visitTimeList(node: TimeList): TimeListValue {
    return {
      type: "time-list",
      items: node.items.map((item): ParsedTimeValue => {
        switch (item.type) {
          case "identifier":
            return {
              type: "milestone-identifier",
              milestoneName: item.accept(this).value,
            };
          default:
            return item.accept(this);
        }
      }),
    };
  }

  visitTimeRange(node: TimeRange): TimeRangeValue {
    return {
      type: "time-range",
      start: this.parseTimeValue(node.start),
      end: this.parseTimeValue(node.end),
    };
  }

  visitTimeconf(node: Timeconf): ParsedTimeconfValue {
    return node.value.accept(this);
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

  visitWindow(node: Window): StudyDayWindow {
    let window: StudyDayWindow = { before: 0, after: 0 };
    for (const child of node.window) {
      window = { ...window, ...child.accept(this) };
    }
    return window;
  }

  getFile(): File {
    this.visit(this.file.ast);
    return this.file;
  }
}
