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

export class DocumentVisitor {
  visitArgs(node: Args) {
    for (const arg of node.args) {
      accept(arg, this);
    }
  }

  visitBothWindow(node: BothWindow) {
    accept(node.days, this);
  }

  visitCodelistDefinition(node: CodelistDefinition) {
    accept(node.name, this);
    for (const member of node.members) {
      accept(member, this);
    }
  }

  visitCodelistExtension(node: CodelistExtension) {
    accept(node.extends, this);
    for (const member of node.members) {
      accept(member, this);
    }
  }

  visitCodelistMember(node: CodelistMember) {
    accept(node.name, this);
    for (const directive of node.directives) {
      accept(directive, this);
    }
  }

  visitColumnDefinition(node: ColumnDefinition) {
    accept(node.columnName, this);
    accept(node.columnType, this);
    for (const directive of node.directives) {
      accept(directive, this);
    }
  }

  visitColumnMapping(node: ColumnMapping) {
    accept(node.column, this);
    for (const source of node.sources) {
      accept(source, this);
    }
    if (node.computation) {
      accept(node.computation, this);
    }
  }

  visitColumnMappingSource(node: ColumnMappingSource) {
    accept(node.source, this);
    if (node.variable) {
      accept(node.variable, this);
    }
    accept(node.code, this);
  }

  visitDatasetDefinition(node: DatasetDefinition) {
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
  }

  visitDatasetExtension(node: DatasetExtension) {
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
  }

  visitDatasetMapping(node: DatasetMapping) {
    accept(node.dataset, this);
    for (const variableMapping of node.variables) {
      accept(variableMapping, this);
    }
    for (const column of node.columns) {
      accept(column, this);
    }
  }

  visitDayExpression(node: DayExpression) {}

  visitDirective(node: Directive) {
    if (node.args) {
      accept(node.args, this);
    }
  }

  visitDomainDefinition(node: DomainDefinition) {
    accept(node.name, this);
    for (const directive of node.directives) {
      accept(directive, this);
    }
    for (const child of node.children) {
      accept(child, this);
    }
  }

  visitDomainExtension(node: DomainExtension) {
    accept(node.extends, this);
    for (const directive of node.directives) {
      accept(directive, this);
    }
    for (const child of node.children) {
      accept(child, this);
    }
  }

  visitHourExpression(node: HourExpression) {}

  visitIdentifier(node: Identifier) {}

  visitIdentifierList(node: IdentifierList) {
    for (const identifier of node.identifiers) {
      accept(identifier, this);
    }
  }

  visitInterfaceDefinition(node: InterfaceDefinition) {
    accept(node.name, this);
    for (const column of node.columns) {
      accept(column, this);
    }
  }

  visitKeyValuePair(node: KeyValuePair) {
    accept(node.lhs, this);
    accept(node.rhs, this);
  }

  visitMilestoneDefinition(node: MilestoneDefinition) {
    accept(node.name, this);
    for (const child of node.children) {
      accept(child, this);
    }
  }

  visitNegativeWindow(node: NegativeWindow) {
    accept(node.days, this);
  }

  visitPath(node: Path) {
    for (const part of node.parts) {
      accept(part, this);
    }
  }

  visitPathList(node: PathList) {
    for (const path of node.paths) {
      accept(path, this);
    }
  }

  visitPositiveWindow(node: PositiveWindow) {
    accept(node.days, this);
  }

  visitSourceCode(node: SourceCode) {}

  visitString(node: String) {}

  visitStudyDay(node: StudyDay) {
    accept(node.day, this);
    if (node.window) {
      accept(node.window, this);
    }
  }

  visitStudyDefinition(node: StudyDefinition) {
    for (const child of node.children) {
      accept(child, this);
    }
  }

  visitTimeExpression(node: TimeExpression) {
    accept(node.rhs, this);
    accept(node.operator, this);
  }

  visitTimeList(node: TimeList) {
    for (const item of node.items) {
      accept(item, this);
    }
    for (const hour of node.at ?? []) {
      accept(hour, this);
    }
  }

  visitTimeOperator(node: TimeOperator) {}

  visitTimeRange(node: TimeRange) {
    accept(node.start, this);
    accept(node.end, this);
  }

  visitTimeconf(node: Timeconf) {
    accept(node.value, this);
  }

  visitTypeExpression(node: TypeExpression) {
    for (const member of node.members) {
      accept(member, this);
    }
  }

  visitTypeExpressionMember(node: TypeExpressionMember) {
    accept(node.value, this);
  }

  visitVariableMapping(node: VariableMapping) {
    accept(node.variable, this);
    accept(node.values, this);
  }

  visitWindow(node: Window) {
    for (const window of node.window) {
      accept(window, this);
    }
  }

  visit(node: Document) {
    for (const child of node.children) {
      accept(child, this);
    }
  }
}
