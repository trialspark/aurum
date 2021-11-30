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
  InterfaceDefinition,
  KeyValuePair,
  MilestoneDefinition,
  String,
  StudyDay,
  StudyDefinition,
  Value,
} from "../astTypes";
import { File } from "./defBuilder";
import { DocumentVisitor } from "./visitor";

interface DocumentScope {
  type: "document";
  parent: null;
}

interface StudyScope {
  type: "study";
  parent: DocumentScope;
  kv: KeyValuePairs;
}

interface MilestoneScope {
  type: "milestone";
  parent: DocumentScope;
  kv: KeyValuePairs;
}

interface CodelistScope {
  type: "codelist";
  parent: DocumentScope;
  items: CodelistItem[];
}

interface CodelistMemberScope {
  type: "codelist-member";
  parent: CodelistScope;
  directives: DirectiveMap;
}

interface DomainScope {
  type: "domain";
  parent: DocumentScope;
  datasets: { [name: string]: Dataset };
  directives: DirectiveMap;
}

interface DatasetScope {
  type: "dataset";
  parent: DomainScope;
  columns: DatasetColumn[];
  directives: DirectiveMap;
}

interface InterfaceScope {
  type: "interface";
  parent: DocumentScope;
  columns: DatasetColumn[];
}

interface ColumnScope {
  type: "column";
  parent: DatasetScope | InterfaceScope;
  directives: DirectiveMap;
}

interface DirectiveScope {
  type: "directive";
  parent: ColumnScope | DomainScope | DatasetScope | CodelistMemberScope;
  args: ParsedValue[];
}

interface ParsedDirective {
  name: string;
  args: ParsedValue[];
}

interface ArgsScope {
  type: "args";
  parent: DirectiveScope;
  args: ParsedValue[];
}

interface KeyValueScope {
  type: "key-value";
  parent: StudyScope | MilestoneScope;
}

type KeyValuePairs = { [key: string]: ParsedValue };
type DirectiveMap = { [name: string]: ParsedDirective };
type ParsedValue = string;

type Scope =
  | StudyScope
  | MilestoneScope
  | CodelistScope
  | CodelistMemberScope
  | DocumentScope
  | DomainScope
  | DatasetScope
  | InterfaceScope
  | ColumnScope
  | DirectiveScope
  | ArgsScope
  | KeyValueScope;

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
  private scope: Scope = { type: "document", parent: null };

  constructor(private file: File) {
    super();
  }

  private inScope<S extends Scope>(scope: S, fn: (scope: S) => void) {
    try {
      this.scope = scope;
      fn(scope);
    } finally {
      this.scope = scope.parent ?? { type: "document", parent: null };
    }
  }

  visitStudyDefinition(node: StudyDefinition) {
    assert(this.scope.type === "document");
    this.inScope(
      { type: "study", parent: this.scope, kv: {} as KeyValuePairs },
      (scope) => {
        super.visitStudyDefinition(node);

        this.file.result.study = {
          id: scope.kv.id,
          name: scope.kv.name,
        };
      }
    );
  }

  visitMilestoneDefinition(node: MilestoneDefinition) {
    assert(this.scope.type === "document");
    this.inScope(
      { type: "milestone", parent: this.scope, kv: {} as KeyValuePairs },
      (scope) => {
        super.visitMilestoneDefinition(node);
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
    );
  }

  visitCodelistDefinition(node: CodelistDefinition) {
    assert(this.scope.type === "document");
    this.inScope(
      { type: "codelist", parent: this.scope, items: [] },
      (scope) => {
        super.visitCodelistDefinition(node);
        const codelists =
          this.file.result.codelists ?? (this.file.result.codelists = {});

        codelists[node.name.value] = {
          name: node.name.value,
          items: scope.items,
        };
      }
    );
  }

  visitCodelistMember(node: CodelistMember) {
    assert(this.scope.type === "codelist");
    this.inScope(
      {
        type: "codelist-member",
        parent: this.scope,
        directives: {} as DirectiveMap,
      },
      (scope) => {
        super.visitCodelistMember(node);
        scope.parent.items.push({
          value: node.name.value,
          description: scope.directives.desc.args[0],
        });
      }
    );
  }

  visitDomainDefinition(node: DomainDefinition) {
    assert(this.scope.type === "document");
    this.inScope(
      {
        type: "domain",
        parent: this.scope,
        datasets: {},
        directives: {} as DirectiveMap,
      },
      (scope) => {
        super.visitDomainDefinition(node);
        const domains =
          this.file.result.domains || (this.file.result.domains = {});
        domains[node.name.value] = {
          name: node.name.value,
          datasets: scope.datasets,
          abbr: scope.directives["abbr"].args[0],
        };
      }
    );
  }

  visitInterfaceDefinition(node: InterfaceDefinition) {
    assert(this.scope.type === "document");
    this.inScope({ type: "interface", parent: this.scope, columns: [] }, () => {
      super.visitInterfaceDefinition(node);
    });
  }

  visitDatasetDefinition(node: DatasetDefinition) {
    assert(this.scope.type === "domain");
    this.inScope(
      { type: "dataset", parent: this.scope, columns: [], directives: {} },
      (scope) => {
        super.visitDatasetDefinition(node);
        scope.parent.datasets[node.name.value] = {
          name: node.name.value,
          columns: scope.columns,
        };
      }
    );
  }

  visitColumnDefinition(node: ColumnDefinition) {
    assert("columns" in this.scope);
    this.inScope(
      { type: "column", parent: this.scope, directives: {} as DirectiveMap },
      (scope) => {
        super.visitColumnDefinition(node);
        scope.parent.columns.push({
          name: node.columnName.value,
          label: scope.directives.label.args[0],
          description: scope.directives.desc.args[0],
        });
      }
    );
  }

  visitDirective(node: Directive) {
    assert("directives" in this.scope);
    this.inScope(
      { type: "directive", parent: this.scope, args: [] },
      (scope) => {
        super.visitDirective(node);
        scope.parent.directives[node.name] = {
          name: node.name,
          args: scope.args,
        };
      }
    );
  }

  visitArgs(args: Args) {
    assert(this.scope.type === "directive");
    this.inScope({ type: "args", parent: this.scope, args: [] }, (scope) => {
      super.visitArgs(args);
      scope.parent.args = scope.args;
    });
  }

  visitKeyValuePair(node: KeyValuePair) {
    assert("kv" in this.scope);
    this.inScope({ type: "key-value", parent: this.scope }, (scope) => {
      super.visitKeyValuePair(node);
      if (node.rhs.type === "string") {
        scope.parent.kv[node.lhs.value] = node.rhs.value;
      }
    });
  }

  visitString(node: String) {
    super.visitString(node);

    if (this.scope.type === "args") {
      this.scope.args.push(node.value);
    }
  }

  getFile(): File {
    this.visit(this.file.ast);
    return this.file;
  }
}
