import { CompilationResult } from ".";
import {
  CodelistDefinition,
  Document,
  DomainDefinition,
  InterfaceDefinition,
  MilestoneDefinition,
  StudyDefinition,
} from "../astTypes";
import { DocumentVisitor } from "./visitor";

export interface StudyDef {
  ast: StudyDefinition;
  file: File;
}

export interface InterfaceDef {
  name: string;
  ast: InterfaceDefinition;
  file: File;
}

export interface MilestoneDef {
  name: string;
  ast: MilestoneDefinition;
  file: File;
}

export interface CodelistDef {
  name: string;
  ast: CodelistDefinition;
  file: File;
}

export interface DomainDef {
  name: string;
  ast: DomainDefinition;
  file: File;
}

type NamedDefMap<Def> = { [name: string]: Def };

export interface File {
  name: string;
  ast: Document;
  result: Partial<CompilationResult>;
  studyDefs: StudyDef[];
  interfaceDefs: NamedDefMap<InterfaceDef>;
  milestoneDefs: NamedDefMap<MilestoneDef>;
  codelistDefs: NamedDefMap<CodelistDef>;
  domainDefs: NamedDefMap<DomainDef>;
}

export class DefBuilder extends DocumentVisitor {
  constructor(private file: File) {
    super();
  }

  onVisitStudyDefinition(node: StudyDefinition) {
    this.file.studyDefs.push({
      ast: node,
      file: this.file,
    });
  }

  onVisitArgs() {}

  onVisitCodelistDefinition() {}

  onVisitCodelistMember() {}

  onVisitColumnDefinition() {}

  onVisitDatasetDefinition() {}

  onVisitDirective() {}

  onVisitDomainDefinition() {}

  onVisitKeyValuePair() {}

  onVisitMilestoneDefinition() {}

  onVisitString() {}

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
