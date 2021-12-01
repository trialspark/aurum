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

export const accept = (node: Node, visitor: DocumentVisitor) => {
  switch (node.type) {
    case "args":
      return visitor.visitArgs(node);
    case "both-window":
      return visitor.visitBothWindow(node);
    case "codelist-definition":
      return visitor.visitCodelistDefinition(node);
    case "codelist-extension":
      return visitor.visitCodelistExtension(node);
    case "codelist-member":
      return visitor.visitCodelistMember(node);
    case "column-definition":
      return visitor.visitColumnDefinition(node);
    case "column-mapping":
      return visitor.visitColumnMapping(node);
    case "column-mapping-source":
      return visitor.visitColumnMappingSource(node);
    case "dataset-definition":
      return visitor.visitDatasetDefinition(node);
    case "dataset-extension":
      return visitor.visitDatasetExtension(node);
    case "dataset-mapping":
      return visitor.visitDatasetMapping(node);
    case "day-expression":
      return visitor.visitDayExpression(node);
    case "directive":
      return visitor.visitDirective(node);
    case "document":
      return visitor.visit(node);
    case "domain-definition":
      return visitor.visitDomainDefinition(node);
    case "domain-extension":
      return visitor.visitDomainExtension(node);
    case "hour-expression":
      return visitor.visitHourExpression(node);
    case "identifier":
      return visitor.visitIdentifier(node);
    case "identifier-list":
      return visitor.visitIdentifierList(node);
    case "interface-definition":
      return visitor.visitInterfaceDefinition(node);
    case "key-value-pair":
      return visitor.visitKeyValuePair(node);
    case "milestone-definition":
      return visitor.visitMilestoneDefinition(node);
    case "negative-window":
      return visitor.visitNegativeWindow(node);
    case "path":
      return visitor.visitPath(node);
    case "path-list":
      return visitor.visitPathList(node);
    case "positive-window":
      return visitor.visitPositiveWindow(node);
    case "source-code":
      return visitor.visitSourceCode(node);
    case "string":
      return visitor.visitString(node);
    case "study-day":
      return visitor.visitStudyDay(node);
    case "study-definition":
      return visitor.visitStudyDefinition(node);
    case "time-expression":
      return visitor.visitTimeExpression(node);
    case "time-list":
      return visitor.visitTimeList(node);
    case "time-operator":
      return visitor.visitTimeOperator(node);
    case "time-range":
      return visitor.visitTimeRange(node);
    case "timeconf":
      return visitor.visitTimeconf(node);
    case "type-expression":
      return visitor.visitTypeExpression(node);
    case "type-expression-member":
      return visitor.visitTypeExpressionMember(node);
    case "variable-mapping":
      return visitor.visitVariableMapping(node);
    case "window":
      return visitor.visitWindow(node);
  }

  const unhandledType: never = node;
  throw new Error(`Unhandled type: ${unhandledType}`);
};

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
        accept(arg, this);
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
      accept(node.days, this);
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
        accept(node.name, this);
        for (const member of node.members) {
          accept(member, this);
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
        accept(node.extends, this);
        for (const member of node.members) {
          accept(member, this);
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
        accept(node.name, this);
        for (const directive of node.directives) {
          accept(directive, this);
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
      { type: "column", parent: this.scope, directives: {} },
      (scope) => {
        accept(node.columnName, this);
        accept(node.columnType, this);
        for (const directive of node.directives) {
          accept(directive, this);
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
      accept(node.column, this);
      for (const source of node.sources) {
        accept(source, this);
      }
      if (node.computation) {
        accept(node.computation, this);
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
        accept(node.source, this);
        if (node.variable) {
          accept(node.variable, this);
        }
        accept(node.code, this);
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
        accept(node.name, this);
        if (node.interfaces) {
          accept(node.interfaces, this);
        }
        for (const directive of node.directives) {
          accept(directive, this);
        }
        for (const column of node.columns) {
          accept(column, this);
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
        accept(node.extends, this);
        if (node.interfaces) {
          accept(node.interfaces, this);
        }
        for (const directive of node.directives) {
          accept(directive, this);
        }
        for (const column of node.columns) {
          accept(column, this);
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
      accept(node.dataset, this);
      for (const variableMapping of node.variables) {
        accept(variableMapping, this);
      }
      for (const column of node.columns) {
        accept(column, this);
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
          accept(node.args, this);
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
        accept(node.name, this);
        for (const directive of node.directives) {
          accept(directive, this);
        }
        for (const child of node.children) {
          accept(child, this);
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
        accept(node.extends, this);
        for (const directive of node.directives) {
          accept(directive, this);
        }
        for (const child of node.children) {
          accept(child, this);
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
        accept(identifier, this);
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
        accept(node.name, this);
        for (const column of node.columns) {
          accept(column, this);
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
    this.inScope({ type: "key-value", parent: this.scope }, (scope) => {
      accept(node.lhs, this);
      accept(node.rhs, this);
      this.onVisitKeyValuePair(node, scope);
    });
  }

  protected abstract onVisitMilestoneDefinition(
    node: MilestoneDefinition,
    scope: MilestoneScope
  ): void;

  visitMilestoneDefinition(node: MilestoneDefinition) {
    assert(isParentOf("milestone", this.scope));
    this.inScope({ type: "milestone", parent: this.scope, kv: {} }, (scope) => {
      accept(node.name, this);
      for (const child of node.children) {
        accept(child, this);
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
      accept(node.days, this);
      this.onVisitNegativeWindow(node, scope);
    });
  }

  protected abstract onVisitPath(node: Path, scope: PathScope): void;

  visitPath(node: Path) {
    assert(isParentOf("path", this.scope));
    this.inScope({ type: "path", parent: this.scope }, (scope) => {
      for (const part of node.parts) {
        accept(part, this);
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
        accept(path, this);
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
      accept(node.days, this);
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
    this.inScope({ type: "study-day", parent: this.scope }, (scope) => {
      accept(node.day, this);
      if (node.window) {
        accept(node.window, this);
      }
      this.onVisitStudyDay(node, scope);
    });
  }

  protected abstract onVisitStudyDefinition(
    node: StudyDefinition,
    scope: StudyScope
  ): void;

  visitStudyDefinition(node: StudyDefinition) {
    assert(isParentOf("study", this.scope));
    this.inScope({ type: "study", parent: this.scope, kv: {} }, (scope) => {
      for (const child of node.children) {
        accept(child, this);
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
    this.inScope({ type: "time-expression", parent: this.scope }, (scope) => {
      accept(node.rhs, this);
      accept(node.operator, this);
      this.onVisitTimeExpression(node, scope);
    });
  }

  protected abstract onVisitTimeList(
    node: TimeList,
    scope: TimeListScope
  ): void;

  visitTimeList(node: TimeList) {
    assert(isParentOf("time-list", this.scope));
    this.inScope({ type: "time-list", parent: this.scope }, (scope) => {
      for (const item of node.items) {
        accept(item, this);
      }
      for (const hour of node.at ?? []) {
        accept(hour, this);
      }
      this.onVisitTimeList(node, scope);
    });
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
    this.inScope({ type: "time-range", parent: this.scope }, (scope) => {
      accept(node.start, this);
      accept(node.end, this);
      this.onVisitTimeRange(node, scope);
    });
  }

  protected abstract onVisitTimeconf(
    node: Timeconf,
    scope: TimeconfScope
  ): void;

  visitTimeconf(node: Timeconf) {
    assert(isParentOf("timeconf", this.scope));
    this.inScope({ type: "timeconf", parent: this.scope }, (scope) => {
      accept(node.value, this);
      this.onVisitTimeconf(node, scope);
    });
  }

  protected abstract onVisitTypeExpression(
    node: TypeExpression,
    scope: TypeExpressionScope
  ): void;

  visitTypeExpression(node: TypeExpression) {
    assert(isParentOf("type-expression", this.scope));
    this.inScope({ type: "type-expression", parent: this.scope }, (scope) => {
      for (const member of node.members) {
        accept(member, this);
      }
      this.onVisitTypeExpression(node, scope);
    });
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
        accept(node.value, this);
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
      accept(node.variable, this);
      accept(node.values, this);
      this.onVisitVariableMapping(node, scope);
    });
  }

  protected abstract onVisitWindow(node: Window, scope: WindowScope): void;

  visitWindow(node: Window) {
    assert(isParentOf("window", this.scope));
    this.inScope({ type: "window", parent: this.scope }, (scope) => {
      for (const window of node.window) {
        accept(window, this);
      }
      this.onVisitWindow(node, scope);
    });
  }

  protected abstract onVisitDocument(
    node: Document,
    scope: DocumentScope
  ): void;

  visit(node: Document) {
    assert(this.scope === null);
    this.inScope({ type: "document", parent: this.scope }, (scope) => {
      for (const child of node.children) {
        accept(child, this);
      }
      this.onVisitDocument(node, scope);
    });
  }
}
