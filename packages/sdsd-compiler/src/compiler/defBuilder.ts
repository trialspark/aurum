import { createSlice, PayloadAction, freeze } from "@reduxjs/toolkit";
import assert from "assert";
import { AttributableAction } from ".";
import {
  CodelistDefinition,
  DatasetDefinition,
  Document,
  DomainDefinition,
  InterfaceDefinition,
  MilestoneDefinition,
  StudyDefinition,
} from "../astTypes";
import { DocumentVisitor } from "./visitor";

export interface DefBuilderState {
  studyDefs: StudyDef[];
  interfaceDefs: NamedDefMap<InterfaceDef>;
  milestoneDefs: NamedDefMap<MilestoneDef>;
  codelistDefs: NamedDefMap<CodelistDef>;
  datasetDefs: NamedDefMap<DatasetDef>;
}

const initialState: DefBuilderState = {
  studyDefs: [],
  interfaceDefs: {},
  milestoneDefs: {},
  codelistDefs: {},
  datasetDefs: {},
};

const { reducer, actions } = createSlice({
  name: "defBuilder",
  initialState,
  reducers: {
    addStudyDef: (state, action: PayloadAction<StudyDef>) => {
      state.studyDefs.push(freeze(action.payload));
    },
    addInterfaceDef: (state, action: PayloadAction<InterfaceDef>) => {
      state.interfaceDefs[action.payload.name] = action.payload;
    },
    addMilestoneDef: (state, action: PayloadAction<MilestoneDef>) => {
      state.milestoneDefs[action.payload.name] = action.payload;
    },
    addCodelistDef: (state, action: PayloadAction<CodelistDef>) => {
      state.codelistDefs[action.payload.name] = freeze(action.payload);
    },
    addDatasetDef: (state, action: PayloadAction<DatasetDef>) => {
      state.datasetDefs[action.payload.name] = action.payload;
    },
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

export interface DatasetDef {
  name: string;
  ast: DatasetDefinition;
  file: File;
}

export type NamedDefMap<Def> = { [name: string]: Def | undefined };

export interface File {
  name: string;
  ast: Document;
}

export class DefBuilder extends DocumentVisitor {
  private currentFile: File | null = null;

  constructor(private files: File[]) {
    super();
  }

  private withFile<R>(file: File, fn: () => R): R {
    try {
      this.currentFile = file;
      return fn();
    } finally {
      this.currentFile = null;
    }
  }

  visitStudyDefinition(node: StudyDefinition): Action[] {
    return [
      actions.addStudyDef({
        ast: node,
        file: this.currentFile!,
      }),
    ];
  }

  visitInterfaceDefinition(node: InterfaceDefinition): Action[] {
    return [
      actions.addInterfaceDef({
        name: node.name.value,
        ast: node,
        file: this.currentFile!,
      }),
    ];
  }

  visitMilestoneDefinition(node: MilestoneDefinition): Action[] {
    return [
      actions.addMilestoneDef({
        name: node.name.value,
        ast: node,
        file: this.currentFile!,
      }),
    ];
  }

  visitCodelistDefinition(node: CodelistDefinition): Action[] {
    return [
      actions.addCodelistDef({
        name: node.name.value,
        ast: node,
        file: this.currentFile!,
      }),
    ];
  }

  visitDomainDefinition(node: DomainDefinition): Action[] {
    return node.children.flatMap((child) => child.accept(this));
  }

  visitDatasetDefinition(node: DatasetDefinition): Action[] {
    return [
      actions.addDatasetDef({
        name: node.name.value,
        ast: node,
        file: this.currentFile!,
      }),
    ];
  }

  visit(node: Document): Action[] {
    return node.children.flatMap((child) => {
      const actions = child.accept(this);

      if (Array.isArray(actions)) {
        return actions;
      }

      return [];
    });
  }

  getActions(): AttributableAction[] {
    return this.files.flatMap((file) =>
      this.withFile(file, () => this.visit(file.ast)).map((action) => ({
        file,
        action,
      }))
    );
  }
}

export { actions as defBuilderActions, reducer as defBuilderReducer };
