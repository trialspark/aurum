import assert from "assert";
import {
  Args,
  BothWindow,
  CodelistDefinition,
  CodelistExtension,
  CodelistMember,
  ColumnDefinition,
  ColumnMapping,
  ColumnMappingSource,
  DatasetDefinition,
  DatasetExtension,
  DatasetMapping,
  DayExpression,
  Directive,
  Document,
  DomainDefinition,
  DomainExtension,
  HourExpression,
  Identifier,
  IdentifierList,
  InterfaceDefinition,
  KeyValuePair,
  MilestoneDefinition,
  NegativeWindow,
  Node,
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
  TimeOperator,
  TimeRange,
  TypeExpression,
  TypeExpressionMember,
  VariableMapping,
  Window,
} from "../astTypes";
import {
  ArgsScope,
  BothWindowScope,
  CodelistExtensionScope,
  CodelistMemberScope,
  CodelistScope,
  ColumnMappingScope,
  ColumnMappingSourceScope,
  ColumnScope,
  DatasetExtensionScope,
  DatasetMappingScope,
  DatasetScope,
  DayExpressionScope,
  DirectiveScope,
  DocumentScope,
  DomainExtensionScope,
  DomainScope,
  HourExpressionScope,
  IdentifierListScope,
  IdentifierScope,
  InterfaceScope,
  isParentOf,
  KeyValueScope,
  MilestoneScope,
  NegativeWindowScope,
  PathListScope,
  PathScope,
  PositiveWindowScope,
  Scope,
  SourceCodeScope,
  StringScope,
  StudyDayScope,
  StudyScope,
  TimeconfScope,
  TimeExpressionScope,
  TimeListScope,
  TimeOperatorScope,
  TimeRangeScope,
  TypeExpressionMemberScope,
  TypeExpressionScope,
  VariableMappingScope,
  WindowScope,
} from "./scope";

export abstract class DocumentVisitor {
  private scope: Scope | null = null;

  private inScope<S extends Scope, R>(scope: S, fn: (scope: S) => R): R {
    try {
      this.scope = scope;
      return fn(scope);
    } finally {
      this.scope = scope.parent;
    }
  }

  protected abstract onVisitArgs(node: Args, scope: ArgsScope): void;

  visitArgs(node: Args) {
    assert(isParentOf("args", this.scope));
    this.inScope({ type: "args", parent: this.scope, args: [] }, (scope) => {
      for (const arg of node.args) {
        arg.accept(this);
      }
      this.onVisitArgs(node, scope);
    });
  }

  protected abstract onVisitBothWindow(
    node: BothWindow,
    scope: BothWindowScope
  ): void;

  visitBothWindow(node: BothWindow) {
    assert(isParentOf("both-window", this.scope));
    this.inScope({ type: "both-window", parent: this.scope }, (scope) => {
      node.days.accept(this);
      this.onVisitBothWindow(node, scope);
    });
  }

  protected abstract onVisitCodelistDefinition(
    node: CodelistDefinition,
    scope: CodelistScope
  ): void;

  visitCodelistDefinition(node: CodelistDefinition) {
    assert(isParentOf("codelist", this.scope));
    this.inScope(
      { type: "codelist", parent: this.scope, items: [] },
      (scope) => {
        node.name.accept(this);
        for (const member of node.members) {
          member.accept(this);
        }
        this.onVisitCodelistDefinition(node, scope);
      }
    );
  }

  protected abstract onVisitCodelistExtension(
    node: CodelistExtension,
    scope: CodelistExtensionScope
  ): void;

  visitCodelistExtension(node: CodelistExtension) {
    assert(isParentOf("codelist-extension", this.scope));
    this.inScope(
      { type: "codelist-extension", parent: this.scope, items: [] },
      (scope) => {
        node.extends.accept(this);
        for (const member of node.members) {
          member.accept(this);
        }
        this.onVisitCodelistExtension(node, scope);
      }
    );
  }

  protected abstract onVisitCodelistMember(
    node: CodelistMember,
    scope: CodelistMemberScope
  ): void;

  visitCodelistMember(node: CodelistMember) {
    assert(isParentOf("codelist-member", this.scope));
    this.inScope(
      { type: "codelist-member", parent: this.scope, directives: {} },
      (scope) => {
        node.name.accept(this);
        for (const directive of node.directives) {
          directive.accept(this);
        }
        this.onVisitCodelistMember(node, scope);
      }
    );
  }

  protected abstract onVisitColumnDefinition(
    node: ColumnDefinition,
    scope: ColumnScope
  ): void;

  visitColumnDefinition(node: ColumnDefinition) {
    assert(isParentOf("column", this.scope));
    this.inScope(
      { type: "column", parent: this.scope, directives: {}, types: [] },
      (scope) => {
        node.columnName.accept(this);
        node.columnType.accept(this);
        for (const directive of node.directives) {
          directive.accept(this);
        }
        this.onVisitColumnDefinition(node, scope);
      }
    );
  }

  protected abstract onVisitColumnMapping(
    node: ColumnMapping,
    scope: ColumnMappingScope
  ): void;

  visitColumnMapping(node: ColumnMapping) {
    assert(isParentOf("column-mapping", this.scope));
    this.inScope({ type: "column-mapping", parent: this.scope }, (scope) => {
      node.column.accept(this);
      for (const source of node.sources) {
        source.accept(this);
      }
      if (node.computation) {
        node.computation.accept(this);
      }
      this.onVisitColumnMapping(node, scope);
    });
  }

  protected abstract onVisitColumnMappingSource(
    node: ColumnMappingSource,
    scope: ColumnMappingSourceScope
  ): void;

  visitColumnMappingSource(node: ColumnMappingSource) {
    assert(isParentOf("column-mapping-source", this.scope));
    this.inScope(
      { type: "column-mapping-source", parent: this.scope },
      (scope) => {
        node.source.accept(this);
        if (node.variable) {
          node.variable.accept(this);
        }
        node.code.accept(this);
        this.onVisitColumnMappingSource(node, scope);
      }
    );
  }

  protected abstract onVisitDatasetDefinition(
    node: DatasetDefinition,
    scope: DatasetScope
  ): void;

  visitDatasetDefinition(node: DatasetDefinition) {
    assert(isParentOf("dataset", this.scope));
    this.inScope(
      { type: "dataset", parent: this.scope, columns: [], directives: {} },
      (scope) => {
        node.name.accept(this);
        if (node.interfaces) {
          node.interfaces.accept(this);
        }
        for (const directive of node.directives) {
          directive.accept(this);
        }
        for (const column of node.columns) {
          column.accept(this);
        }
        this.onVisitDatasetDefinition(node, scope);
      }
    );
  }

  protected abstract onVisitDatasetExtension(
    node: DatasetExtension,
    scope: DatasetExtensionScope
  ): void;

  visitDatasetExtension(node: DatasetExtension) {
    assert(isParentOf("dataset-extension", this.scope));
    this.inScope(
      {
        type: "dataset-extension",
        parent: this.scope,
        directives: {},
        columns: [],
      },
      (scope) => {
        node.extends.accept(this);
        if (node.interfaces) {
          node.interfaces.accept(this);
        }
        for (const directive of node.directives) {
          directive.accept(this);
        }
        for (const column of node.columns) {
          column.accept(this);
        }
        this.onVisitDatasetExtension(node, scope);
      }
    );
  }

  protected abstract onVisitDatasetMapping(
    node: DatasetMapping,
    scope: DatasetMappingScope
  ): void;

  visitDatasetMapping(node: DatasetMapping) {
    assert(isParentOf("dataset-mapping", this.scope));
    this.inScope({ type: "dataset-mapping", parent: this.scope }, (scope) => {
      node.dataset.accept(this);
      for (const variableMapping of node.variables) {
        variableMapping.accept(this);
      }
      for (const column of node.columns) {
        column.accept(this);
      }
      this.onVisitDatasetMapping(node, scope);
    });
  }

  protected abstract onVisitDayExpression(
    node: DayExpression,
    scope: DayExpressionScope
  ): void;

  visitDayExpression(node: DayExpression) {
    assert(isParentOf("day-expression", this.scope));
    this.inScope({ type: "day-expression", parent: this.scope }, (scope) => {
      this.onVisitDayExpression(node, scope);
    });
  }

  protected abstract onVisitDirective(
    node: Directive,
    scope: DirectiveScope
  ): void;

  visitDirective(node: Directive) {
    assert(isParentOf("directive", this.scope));
    this.inScope(
      { type: "directive", parent: this.scope, args: [] },
      (scope) => {
        if (node.args) {
          node.args.accept(this);
        }
        this.onVisitDirective(node, scope);
      }
    );
  }

  protected abstract onVisitDomainDefinition(
    node: DomainDefinition,
    scope: DomainScope
  ): void;

  visitDomainDefinition(node: DomainDefinition) {
    assert(isParentOf("domain", this.scope));
    this.inScope(
      { type: "domain", parent: this.scope, datasets: {}, directives: {} },
      (scope) => {
        node.name.accept(this);
        for (const directive of node.directives) {
          directive.accept(this);
        }
        for (const child of node.children) {
          child.accept(this);
        }
        this.onVisitDomainDefinition(node, scope);
      }
    );
  }

  protected abstract onVisitDomainExtension(
    node: DomainExtension,
    scope: DomainExtensionScope
  ): void;

  visitDomainExtension(node: DomainExtension) {
    assert(isParentOf("domain-extension", this.scope));
    this.inScope(
      {
        type: "domain-extension",
        parent: this.scope,
        directives: {},
        datasets: {},
      },
      (scope) => {
        node.extends.accept(this);
        for (const directive of node.directives) {
          directive.accept(this);
        }
        for (const child of node.children) {
          child.accept(this);
        }
        this.onVisitDomainExtension(node, scope);
      }
    );
  }

  protected abstract onVisitHourExpression(
    node: HourExpression,
    scope: HourExpressionScope
  ): void;

  visitHourExpression(node: HourExpression) {
    assert(isParentOf("hour-expression", this.scope));
    this.inScope({ type: "hour-expression", parent: this.scope }, (scope) => {
      this.onVisitHourExpression(node, scope);
    });
  }

  protected abstract onVisitIdentifier(
    node: Identifier,
    scope: IdentifierScope
  ): void;

  visitIdentifier(node: Identifier) {
    assert(isParentOf("identifier", this.scope));
    this.inScope({ type: "identifier", parent: this.scope }, (scope) => {
      this.onVisitIdentifier(node, scope);
    });
  }

  protected abstract onVisitIdentifierList(
    node: IdentifierList,
    scope: IdentifierListScope
  ): void;

  visitIdentifierList(node: IdentifierList) {
    this.inScope({ type: "identifier-list", parent: null }, (scope) => {
      for (const identifier of node.identifiers) {
        identifier.accept(this);
      }
      this.onVisitIdentifierList(node, scope);
    });
  }

  protected abstract onVisitInterfaceDefinition(
    node: InterfaceDefinition,
    scope: InterfaceScope
  ): void;

  visitInterfaceDefinition(node: InterfaceDefinition) {
    assert(isParentOf("interface", this.scope));
    assert(this.scope?.type === "document");
    this.inScope(
      { type: "interface", parent: this.scope, columns: [] },
      (scope) => {
        node.name.accept(this);
        for (const column of node.columns) {
          column.accept(this);
        }
        this.onVisitInterfaceDefinition(node, scope);
      }
    );
  }

  protected abstract onVisitKeyValuePair(
    node: KeyValuePair,
    scope: KeyValueScope
  ): void;

  visitKeyValuePair(node: KeyValuePair) {
    assert(isParentOf("key-value", this.scope));
    this.inScope(
      { type: "key-value", parent: this.scope, key: "", value: "" },
      (scope) => {
        node.lhs.accept(this);
        node.rhs.accept(this);
        this.onVisitKeyValuePair(node, scope);
      }
    );
  }

  protected abstract onVisitMilestoneDefinition(
    node: MilestoneDefinition,
    scope: MilestoneScope
  ): void;

  visitMilestoneDefinition(node: MilestoneDefinition) {
    assert(isParentOf("milestone", this.scope));
    this.inScope({ type: "milestone", parent: this.scope, kv: {} }, (scope) => {
      node.name.accept(this);
      for (const child of node.children) {
        child.accept(this);
      }
      this.onVisitMilestoneDefinition(node, scope);
    });
  }

  protected abstract onVisitNegativeWindow(
    node: NegativeWindow,
    scope: NegativeWindowScope
  ): void;

  visitNegativeWindow(node: NegativeWindow) {
    assert(isParentOf("negative-window", this.scope));
    this.inScope({ type: "negative-window", parent: this.scope }, (scope) => {
      node.days.accept(this);
      this.onVisitNegativeWindow(node, scope);
    });
  }

  protected abstract onVisitPath(node: Path, scope: PathScope): void;

  visitPath(node: Path) {
    assert(isParentOf("path", this.scope));
    this.inScope({ type: "path", parent: this.scope }, (scope) => {
      for (const part of node.parts) {
        part.accept(this);
      }
      this.onVisitPath(node, scope);
    });
  }

  protected abstract onVisitPathList(
    node: PathList,
    scope: PathListScope
  ): void;

  visitPathList(node: PathList) {
    assert(isParentOf("path-list", this.scope));
    this.inScope({ type: "path-list", parent: this.scope }, (scope) => {
      for (const path of node.paths) {
        path.accept(this);
      }
      this.onVisitPathList(node, scope);
    });
  }

  protected abstract onVisitPositiveWindow(
    node: PositiveWindow,
    scope: PositiveWindowScope
  ): void;

  visitPositiveWindow(node: PositiveWindow) {
    assert(isParentOf("positive-window", this.scope));
    this.inScope({ type: "positive-window", parent: this.scope }, (scope) => {
      node.days.accept(this);
      this.onVisitPositiveWindow(node, scope);
    });
  }

  protected abstract onVisitSourceCode(
    node: SourceCode,
    scope: SourceCodeScope
  ): void;

  visitSourceCode(node: SourceCode) {
    assert(isParentOf("source-code", this.scope));
    this.inScope({ type: "source-code", parent: this.scope }, (scope) => {
      this.onVisitSourceCode(node, scope);
    });
  }

  protected abstract onVisitString(node: String, scope: StringScope): void;

  visitString(node: String) {
    assert(isParentOf("string", this.scope));
    this.inScope({ type: "string", parent: this.scope }, (scope) => {
      this.onVisitString(node, scope);
    });
  }

  protected abstract onVisitStudyDay(
    node: StudyDay,
    scope: StudyDayScope
  ): void;

  visitStudyDay(node: StudyDay) {
    assert(isParentOf("study-day", this.scope));
    this.inScope(
      {
        type: "study-day",
        parent: this.scope,
        window: { before: 0, after: 0 },
      },
      (scope) => {
        node.day.accept(this);
        if (node.window) {
          node.window.accept(this);
        }
        this.onVisitStudyDay(node, scope);
      }
    );
  }

  protected abstract onVisitStudyDefinition(
    node: StudyDefinition,
    scope: StudyScope
  ): void;

  visitStudyDefinition(node: StudyDefinition) {
    assert(isParentOf("study", this.scope));
    this.inScope({ type: "study", parent: this.scope, kv: {} }, (scope) => {
      for (const child of node.children) {
        child.accept(this);
      }
      this.onVisitStudyDefinition(node, scope);
    });
  }

  protected abstract onVisitTimeExpression(
    node: TimeExpression,
    scope: TimeExpressionScope
  ): void;

  visitTimeExpression(node: TimeExpression) {
    assert(isParentOf("time-expression", this.scope));
    this.inScope(
      {
        type: "time-expression",
        parent: this.scope,
        rhs: { type: "study-day", day: 0, window: { before: 0, after: 0 } },
      },
      (scope) => {
        node.rhs.accept(this);
        node.operator.accept(this);
        this.onVisitTimeExpression(node, scope);
      }
    );
  }

  protected abstract onVisitTimeList(
    node: TimeList,
    scope: TimeListScope
  ): void;

  visitTimeList(node: TimeList) {
    assert(isParentOf("time-list", this.scope));
    this.inScope(
      { type: "time-list", parent: this.scope, members: [] },
      (scope) => {
        for (const item of node.items) {
          item.accept(this);
        }
        for (const hour of node.at ?? []) {
          hour.accept(this);
        }
        this.onVisitTimeList(node, scope);
      }
    );
  }

  protected abstract onVisitTimeOperator(
    node: TimeOperator,
    scope: TimeOperatorScope
  ): void;

  visitTimeOperator(node: TimeOperator) {
    assert(isParentOf("time-operator", this.scope));
    this.inScope({ type: "time-operator", parent: this.scope }, (scope) => {
      this.onVisitTimeOperator(node, scope);
    });
  }

  protected abstract onVisitTimeRange(
    node: TimeRange,
    scope: TimeRangeScope
  ): void;

  visitTimeRange(node: TimeRange) {
    assert(isParentOf("time-range", this.scope));
    this.inScope(
      {
        type: "time-range",
        parent: this.scope,
        start: null,
        end: null,
      },
      (scope) => {
        node.start.accept(this);
        node.end.accept(this);
        this.onVisitTimeRange(node, scope);
      }
    );
  }

  protected abstract onVisitTimeconf(
    node: Timeconf,
    scope: TimeconfScope
  ): void;

  visitTimeconf(node: Timeconf) {
    assert(isParentOf("timeconf", this.scope));
    this.inScope(
      { type: "timeconf", parent: this.scope, result: null },
      (scope) => {
        node.value.accept(this);
        this.onVisitTimeconf(node, scope);
      }
    );
  }

  protected abstract onVisitTypeExpression(
    node: TypeExpression,
    scope: TypeExpressionScope
  ): void;

  visitTypeExpression(node: TypeExpression) {
    assert(isParentOf("type-expression", this.scope));
    this.inScope(
      { type: "type-expression", parent: this.scope, types: [] },
      (scope) => {
        for (const member of node.members) {
          member.accept(this);
        }
        this.onVisitTypeExpression(node, scope);
      }
    );
  }

  protected abstract onVisitTypeExpressionMember(
    node: TypeExpressionMember,
    scope: TypeExpressionMemberScope
  ): void;

  visitTypeExpressionMember(node: TypeExpressionMember) {
    assert(isParentOf("type-expression-member", this.scope));
    this.inScope(
      { type: "type-expression-member", parent: this.scope },
      (scope) => {
        node.value.accept(this);
        this.onVisitTypeExpressionMember(node, scope);
      }
    );
  }

  protected abstract onVisitVariableMapping(
    node: VariableMapping,
    scope: VariableMappingScope
  ): void;

  visitVariableMapping(node: VariableMapping) {
    assert(isParentOf("variable-mapping", this.scope));
    this.inScope({ type: "variable-mapping", parent: this.scope }, (scope) => {
      node.variable.accept(this);
      node.values.accept(this);
      this.onVisitVariableMapping(node, scope);
    });
  }

  protected abstract onVisitWindow(node: Window, scope: WindowScope): void;

  visitWindow(node: Window) {
    assert(isParentOf("window", this.scope));
    this.inScope(
      { type: "window", parent: this.scope, before: 0, after: 0 },
      (scope) => {
        for (const window of node.window) {
          window.accept(this);
        }
        this.onVisitWindow(node, scope);
      }
    );
  }

  protected abstract onVisitDocument(
    node: Document,
    scope: DocumentScope
  ): void;

  visit(node: Document) {
    assert(this.scope === null);
    this.inScope({ type: "document", parent: this.scope }, (scope) => {
      for (const child of node.children) {
        child.accept(this);
      }
      this.onVisitDocument(node, scope);
    });
  }
}
