import { CompilationResult, DatasetColumn } from ".";
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
  columns: DatasetColumn[];
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

export type NamedDefMap<Def> = { [name: string]: Def };

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

  visitStudyDefinition(node: StudyDefinition) {
    this.file.studyDefs.push({
      ast: node,
      file: this.file,
    });
  }

  visitCodelistDefinition(node: CodelistDefinition) {
    this.file.codelistDefs[node.name.value] = {
      name: node.name.value,
      ast: node,
      file: this.file,
    };
  }

  getFile(): File {
    this.visit(this.file.ast);
    return this.file;
  }
}