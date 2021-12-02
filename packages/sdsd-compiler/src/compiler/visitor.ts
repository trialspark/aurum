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

export abstract class DocumentVisitor {
  visitArgs(node: Args): unknown {
    return null;
  }

  visitBothWindow(node: BothWindow): unknown {
    return null;
  }

  visitCodelistDefinition(node: CodelistDefinition): unknown {
    return null;
  }

  visitCodelistExtension(node: CodelistExtension): unknown {
    return null;
  }

  visitCodelistMember(node: CodelistMember): unknown {
    return null;
  }

  visitColumnDefinition(node: ColumnDefinition): unknown {
    return null;
  }

  visitColumnMapping(node: ColumnMapping): unknown {
    return null;
  }

  visitColumnMappingSource(node: ColumnMappingSource): unknown {
    return null;
  }

  visitDatasetDefinition(node: DatasetDefinition): unknown {
    return null;
  }

  visitDatasetExtension(node: DatasetExtension): unknown {
    return null;
  }

  visitDatasetMapping(node: DatasetMapping): unknown {
    return null;
  }

  visitDayExpression(node: DayExpression): unknown {
    return null;
  }

  visitDirective(node: Directive): unknown {
    return null;
  }

  visitDomainDefinition(node: DomainDefinition): unknown {
    return null;
  }

  visitDomainExtension(node: DomainExtension): unknown {
    return null;
  }

  visitHourExpression(node: HourExpression): unknown {
    return null;
  }

  visitIdentifier(node: Identifier): unknown {
    return null;
  }

  visitIdentifierList(node: IdentifierList): unknown {
    return null;
  }

  visitInterfaceDefinition(node: InterfaceDefinition): unknown {
    return null;
  }

  visitKeyValuePair(node: KeyValuePair): unknown {
    return null;
  }

  visitMilestoneDefinition(node: MilestoneDefinition): unknown {
    return null;
  }

  visitNegativeWindow(node: NegativeWindow): unknown {
    return null;
  }

  visitPath(node: Path): unknown {
    return null;
  }

  visitPathList(node: PathList): unknown {
    return null;
  }

  visitPositiveWindow(node: PositiveWindow): unknown {
    return null;
  }

  visitSourceCode(node: SourceCode): unknown {
    return null;
  }

  visitString(node: String): unknown {
    return null;
  }

  visitStudyDay(node: StudyDay): unknown {
    return null;
  }

  visitStudyDefinition(node: StudyDefinition): unknown {
    return null;
  }

  visitTimeExpression(node: TimeExpression): unknown {
    return null;
  }

  visitTimeList(node: TimeList): unknown {
    return null;
  }

  visitTimeOperator(node: TimeOperator): unknown {
    return null;
  }

  visitTimeRange(node: TimeRange): unknown {
    return null;
  }

  visitTimeconf(node: Timeconf): unknown {
    return null;
  }

  visitTypeExpression(node: TypeExpression): unknown {
    return null;
  }

  visitTypeExpressionMember(node: TypeExpressionMember): unknown {
    return null;
  }

  visitVariableMapping(node: VariableMapping): unknown {
    return null;
  }

  visitWindow(node: Window): unknown {
    return null;
  }

  visit(node: Document): unknown {
    for (const child of node.children) {
      child.accept(this);
    }
    return null;
  }
}
