import assert from "assert";
import {
  AbsoluteMilestone,
  CodelistItem,
  Dataset,
  DatasetColumn,
  Domain,
  Milestone,
} from ".";
import {
  Args,
  CodelistDefinition,
  CodelistMember,
  ColumnDefinition,
  DatasetDefinition,
  Directive,
  DomainDefinition,
  KeyValuePair,
  MilestoneDefinition,
  String,
  StudyDay,
  StudyDefinition,
  Value,
} from "../astTypes";
import { File } from "./defBuilder";
import {
  ArgsScope,
  CodelistMemberScope,
  CodelistScope,
  ColumnScope,
  DatasetScope,
  DirectiveScope,
  DomainScope,
  KeyValueScope,
  StringScope,
  StudyScope,
} from "./scope";
import { DocumentVisitor } from "./visitor";

class KeyValuePairAccessor {
  private valuesByKey: { [key: string]: Value };

  constructor(pairs: KeyValuePair[]) {
    this.valuesByKey = Object.fromEntries(
      pairs.map((pair) => [pair.lhs.value, pair.rhs])
    );
  }

  get(key: string): Value | null;
  get(keys: string[]): (Value | null)[];
  get(key: string | string[]): (Value | null) | (Value | null)[] {
    if (typeof key === "string") {
      return this.valuesByKey[key] ?? null;
    }

    return key.map((key) => this.get(key));
  }
}

const milestoneFromStudyDay = (
  name: string | null,
  day: StudyDay
): AbsoluteMilestone => {
  const milestone: Milestone = {
    name,
    type: "absolute",
    day: day.day.value,
    window: {
      before: 0,
      after: 0,
    },
  };

  for (const window of day.window?.window ?? []) {
    if (window.type === "negative-window") {
      milestone.window.before = window.days.value * -1;
    }
    if (window.type === "positive-window") {
      milestone.window.after = window.days.value;
    }
    if (window.type === "both-window") {
      milestone.window.before = window.days.value * -1;
      milestone.window.after = window.days.value;
    }
  }

  return milestone;
};

export class ConfigBuilder extends DocumentVisitor {
  constructor(private file: File) {
    super();
  }

  onVisitStudyDefinition(node: StudyDefinition, scope: StudyScope) {
    this.file.result.study = {
      id: scope.kv.id,
      name: scope.kv.name,
    };
  }

  onVisitMilestoneDefinition(node: MilestoneDefinition) {
    const attributes = new KeyValuePairAccessor(node.children);
    const at = attributes.get("at");

    assert(at?.type === "timeconf");
    const value = at.value;

    if (!this.file.result.milestones) {
      this.file.result.milestones = {};
    }

    const milestone: Milestone = (() => {
      switch (value.type) {
        case "time-list": {
          const [day] = value.items;
          assert(day.type === "study-day");

          return milestoneFromStudyDay(node.name.value, day);
        }

        case "time-expression":
          return {
            name: node.name.value,
            type: "relative",
            position: (
              {
                "<": "before",
                ">": "after",
                "<=": "before/on",
                ">=": "after/on",
              } as const
            )[value.operator.value],
            relativeTo: (() => {
              const { rhs } = value;
              switch (rhs.type) {
                case "study-day":
                  return {
                    type: "anonymous",
                    milestone: milestoneFromStudyDay(null, rhs),
                  } as const;
                case "identifier":
                  return { type: "reference", name: rhs.value } as const;
              }
            })(),
          } as const;
      }
    })();

    this.file.result.milestones[milestone.name!] = milestone;
  }

  onVisitCodelistDefinition(node: CodelistDefinition, scope: CodelistScope) {
    const codelists =
      this.file.result.codelists ?? (this.file.result.codelists = {});

    codelists[node.name.value] = {
      name: node.name.value,
      items: scope.items,
    };
  }

  onVisitCodelistMember(node: CodelistMember, scope: CodelistMemberScope) {
    scope.parent.items.push({
      value: node.name.value,
      description: scope.directives.desc.args[0],
    });
  }

  onVisitDomainDefinition(node: DomainDefinition, scope: DomainScope) {
    const domains = this.file.result.domains || (this.file.result.domains = {});
    domains[node.name.value] = {
      name: node.name.value,
      datasets: scope.datasets,
      abbr: scope.directives["abbr"].args[0],
    };
  }

  onVisitDatasetDefinition(node: DatasetDefinition, scope: DatasetScope) {
    scope.parent.datasets[node.name.value] = {
      name: node.name.value,
      columns: scope.columns,
    };
  }

  onVisitColumnDefinition(node: ColumnDefinition, scope: ColumnScope) {
    scope.parent.columns.push({
      name: node.columnName.value,
      label: scope.directives.label.args[0],
      description: scope.directives.desc.args[0],
    });
  }

  onVisitDirective(node: Directive, scope: DirectiveScope) {
    scope.parent.directives[node.name] = {
      name: node.name,
      args: scope.args,
    };
  }

  onVisitArgs(args: Args, scope: ArgsScope) {
    scope.parent.args = scope.args;
  }

  onVisitKeyValuePair(node: KeyValuePair, scope: KeyValueScope) {
    if (node.rhs.type === "string") {
      scope.parent.kv[node.lhs.value] = node.rhs.value;
    }
  }

  onVisitString(node: String, scope: StringScope) {
    if (scope.parent.type === "args") {
      scope.parent.args.push(node.value);
    }
  }

  onVisitIdentifier() {}

  onVisitInterfaceDefinition() {}

  onVisitBothWindow() {}

  onVisitCodelistExtension() {}

  onVisitColumnMapping() {}

  onVisitColumnMappingSource() {}

  onVisitDatasetExtension() {}

  onVisitDatasetMapping() {}

  onVisitDayExpression() {}

  onVisitDocument() {}

  onVisitDomainExtension() {}

  onVisitHourExpression() {}

  onVisitIdentifierList() {}

  onVisitNegativeWindow() {}

  onVisitPath() {}

  onVisitPathList() {}

  onVisitPositiveWindow() {}

  onVisitSourceCode() {}

  onVisitStudyDay() {}

  onVisitTimeExpression() {}

  onVisitTimeList() {}

  onVisitTimeOperator() {}

  onVisitTimeRange() {}

  onVisitTimeconf() {}

  onVisitTypeExpression() {}

  onVisitTypeExpressionMember() {}

  onVisitVariableMapping() {}

  onVisitWindow() {}

  getFile(): File {
    this.visit(this.file.ast);
    return this.file;
  }
}
