import assert from "assert";
import { Milestone } from ".";
import { RelativeMilestone } from "..";
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
  TypeExpression,
  TypeExpressionMember,
  Value,
  Window,
} from "../astTypes";
import { setFirst, unreachable } from "../utils";
import { CodelistDef, File, NamedDefMap } from "./defBuilder";
import {
  ArgsScope,
  BothWindowScope,
  CodelistMemberScope,
  CodelistScope,
  ColumnScope,
  DatasetScope,
  DirectiveScope,
  DomainScope,
  IdentifierScope,
  KeyValueScope,
  MilestoneScope,
  NegativeWindowScope,
  PositiveWindowScope,
  StringScope,
  StudyDayScope,
  StudyScope,
  TimeconfScope,
  TimeExpressionScope,
  TimeListScope,
  TimeRangeScope,
  TypeExpressionMemberScope,
  TypeExpressionScope,
  WindowScope,
} from "./scope";
import { DocumentVisitor } from "./visitor";

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

  onVisitStudyDefinition(_: StudyDefinition, scope: StudyScope) {
    assert(typeof scope.kv.id === "string");
    assert(typeof scope.kv.name === "string");

    this.file.result.study = {
      id: scope.kv.id,
      name: scope.kv.name,
    };
  }

  onVisitMilestoneDefinition(node: MilestoneDefinition, scope: MilestoneScope) {
    const at = scope.kv.at;
    assert(typeof at !== "string");

    if (!this.file.result.milestones) {
      this.file.result.milestones = {};
    }

    const milestone: Milestone = (() => {
      switch (at.type) {
        case "time-list": {
          const [day] = at.members;
          assert(day.type === "study-day");

          return {
            type: "absolute",
            name: node.name.value,
            day: day.day,
            window: day.window,
          } as const;
        }

        case "time-expression": {
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
            )[at.operator],
            relativeTo: (() => {
              switch (at.rhs.type) {
                case "study-day":
                  return {
                    type: "anonymous",
                    milestone: {
                      name: null,
                      type: "absolute",
                      day: at.rhs.day,
                      window: at.rhs.window,
                    },
                  } as const;
                case "milestone-identifier":
                  return { type: "reference", name: at.rhs.value } as const;
              }
            })(),
          } as const;
        }
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
    assert(typeof scope.directives.desc.args[0] === "string");
    scope.parent.items.push({
      value: node.name.value,
      description: scope.directives.desc.args[0],
    });
  }

  onVisitDomainDefinition(node: DomainDefinition, scope: DomainScope) {
    const domains = this.file.result.domains || (this.file.result.domains = {});
    assert(typeof scope.directives.abbr.args[0] === "string");
    domains[node.name.value] = {
      name: node.name.value,
      datasets: scope.datasets,
      abbr: scope.directives["abbr"].args[0],
    };
  }

  onVisitDatasetDefinition(node: DatasetDefinition, scope: DatasetScope) {
    const milestones = this.accessors.getMilestones();
    const datasetMilestones = scope.directives.milestone.args[0];
    assert(
      typeof datasetMilestones !== "string" &&
        datasetMilestones.type === "time-list" // Can this actually be a range...?
    );
    scope.parent.datasets[node.name.value] = {
      name: node.name.value,
      columns: scope.columns,
      milestones: datasetMilestones.members.flatMap((member) => {
        switch (member.type) {
          case "milestone-identifier": {
            const milestone = milestones[member.value] as Milestone | undefined;
            return [
              {
                name: milestone?.name ?? null,
                day: milestone?.type === "absolute" ? milestone.day : null,
                hour: null,
              },
            ];
          }
          case "study-day": {
            return [
              {
                name: null,
                day: member.day,
                hour: null,
              },
            ];
          }

          case "time-range": {
            return [];
          }
        }
      }),
    };
  }

  onVisitColumnDefinition(node: ColumnDefinition, scope: ColumnScope) {
    assert(typeof scope.directives.label.args[0] === "string");
    assert(typeof scope.directives.desc.args[0] === "string");
    scope.parent.columns.push({
      name: node.columnName.value,
      label: scope.directives.label.args[0],
      description: scope.directives.desc.args[0],
      type: scope.types,
    });
  }

  onVisitDirective(node: Directive, scope: DirectiveScope) {
    scope.parent.directives[node.name] = {
      name: node.name,
      args: scope.args,
    };
  }

  onVisitArgs(_: Args, scope: ArgsScope) {
    scope.parent.args = scope.args;
  }

  onVisitKeyValuePair(_: KeyValuePair, scope: KeyValueScope) {
    scope.parent.kv[scope.key] = scope.value;
  }

  onVisitString(node: String, scope: StringScope) {
    switch (scope.parent.type) {
      case "args": {
        scope.parent.args.push(node.value);
        return;
      }
      case "key-value": {
        scope.parent.value = node.value;
        return;
      }
    }
    assert(unreachable(scope.parent));
  }

  onVisitIdentifier(node: Identifier, scope: IdentifierScope) {
    switch (scope.parent.type) {
      case "key-value": {
        scope.parent.key = node.value;
        return;
      }
      case "time-expression": {
        scope.parent.rhs = { type: "milestone-identifier", value: node.value };
        return;
      }
      case "time-range": {
        setFirst(scope.parent, ["start", "end"], {
          type: "milestone-identifier",
          value: node.value,
        });
        return;
      }
      case "time-list": {
        scope.parent.members.push({
          type: "milestone-identifier",
          value: node.value,
        });
      }
    }
    assert(unreachable(scope.parent));
  }

  onVisitInterfaceDefinition() {}

  onVisitBothWindow(node: BothWindow, scope: BothWindowScope) {
    scope.parent.before = node.days.value * -1;
    scope.parent.after = node.days.value;
  }

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

  onVisitNegativeWindow(node: NegativeWindow, scope: NegativeWindowScope) {
    scope.parent.before = node.days.value * -1;
  }

  onVisitPath() {}

  onVisitPathList() {}

  onVisitPositiveWindow(node: PositiveWindow, scope: PositiveWindowScope) {
    scope.parent.after = node.days.value;
  }

  onVisitSourceCode() {}

  onVisitStudyDay(node: StudyDay, scope: StudyDayScope): void {
    switch (scope.parent.type) {
      case "time-list": {
        scope.parent.members.push({
          type: "study-day",
          day: node.day.value,
          window: scope.window,
        });
        return;
      }
    }

    assert(unreachable(scope.parent));
  }

  onVisitTimeExpression(node: TimeExpression, scope: TimeExpressionScope) {
    scope.parent.result = {
      type: "time-expression",
      operator: node.operator.value,
      rhs: scope.rhs,
    };
  }

  onVisitTimeList(_: TimeList, scope: TimeListScope) {
    scope.parent.result = { type: "time-list", members: scope.members };
  }

  onVisitTimeOperator() {}

  onVisitTimeRange(node: TimeRange, scope: TimeRangeScope) {
    switch (scope.parent.type) {
      case "time-list": {
        assert(
          scope.start?.type === "milestone-identifier" ||
            scope.start?.type === "study-day"
        );
        assert(
          scope.end?.type === "milestone-identifier" ||
            scope.end?.type === "study-day"
        );
        scope.parent.members.push({
          type: "time-range",
          start: scope.start,
          end: scope.end!,
        });
      }
    }
    assert(unreachable(scope.parent));
  }

  onVisitTimeconf(_: Timeconf, scope: TimeconfScope) {
    switch (scope.parent.type) {
      case "key-value": {
        scope.parent.value = scope.result ?? { type: "time-list", members: [] };
        return;
      }
      case "args": {
        if (scope.result) {
          scope.parent.args.push(scope.result);
        }
        return;
      }
    }

    assert(unreachable(scope.parent));
  }

  onVisitTypeExpression(_: TypeExpression, scope: TypeExpressionScope) {
    scope.parent.types = scope.types;
  }

  onVisitTypeExpressionMember(
    node: TypeExpressionMember,
    scope: TypeExpressionMemberScope
  ) {
    const codelists = this.accessors.getCodelistDefs();
    const name = node.value.value;

    if (name in codelists) {
      scope.parent.types.push({ type: "codelist", value: name });
    } else {
      scope.parent.types.push({ type: "scalar", value: name });
    }
    if (node.optional) {
      scope.parent.types.push({ type: "scalar", value: "Null" });
    }
  }

  onVisitVariableMapping() {}

  onVisitWindow(_: Window, scope: WindowScope) {
    scope.parent.window.before = scope.before;
    scope.parent.window.after = scope.after;
  }

  getFile(): File {
    this.visit(this.file.ast);
    return this.file;
  }
}
