import { createSlice, PayloadAction, freeze, original } from "@reduxjs/toolkit";
import { CompilationResult, DatasetColumn } from ".";
import {
  CodelistDefinition,
  Document,
  DomainDefinition,
  InterfaceDefinition,
  MilestoneDefinition,
  StudyDefinition,
} from "../astTypes";
import { nonNull } from "../utils";
import { DocumentVisitor } from "./visitor";

export interface DefBuilderState {
  studyDefs: StudyDef[];
  interfaceDefs: NamedDefMap<InterfaceDef>;
  milestoneDefs: NamedDefMap<MilestoneDef>;
  codelistDefs: NamedDefMap<CodelistDef>;
  domainDefs: NamedDefMap<DomainDef>;
}

const initialState: DefBuilderState = {
  studyDefs: [],
  interfaceDefs: {},
  milestoneDefs: {},
  codelistDefs: {},
  domainDefs: {},
};

const { reducer, actions } = createSlice({
  name: "defBuilder",
  initialState,
  reducers: {
    addStudyDef: (state, action: PayloadAction<StudyDef>) => {
      state.studyDefs.push(freeze(action.payload));
    },
    addCodelistDef: (state, action: PayloadAction<CodelistDef>) => {
      state.codelistDefs[action.payload.name] = freeze(action.payload);
    },
    noop: () => {},
  },
});

type Action = ReturnType<typeof actions[keyof typeof actions]>;

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

export type NamedDefMap<Def> = { [name: string]: Def };

export interface File {
  name: string;
  ast: Document;
}

export class DefBuilder extends DocumentVisitor {
  constructor(private file: File) {
    super();
  }

  visitStudyDefinition(node: StudyDefinition): Action {
    return actions.addStudyDef({
      ast: node,
      file: this.file,
    });
  }

  visitCodelistDefinition(node: CodelistDefinition): Action {
    return actions.addCodelistDef({
      name: node.name.value,
      ast: node,
      file: this.file,
    });
  }

  visitInterfaceDefinition(): null {
    return null;
  }

  visitMilestoneDefinition(): null {
    return null;
  }

  visitDomainDefinition(): null {
    return null;
  }

  visitCodelistExtension(): null {
    return null;
  }

  visitDomainExtension(): null {
    return null;
  }

  visitDatasetMapping(): null {
    return null;
  }

  visit(node: Document): Action[] {
    return nonNull(
      node.children.map((child) => child.accept(this))
    ) as Action[];
  }

  getActions(): Action[] {
    return this.visit(this.file.ast);
  }
}

export { actions as defBuilderActions, reducer as defBuilderReducer };
