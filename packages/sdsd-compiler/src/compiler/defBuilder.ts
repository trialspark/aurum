import { createSlice, PayloadAction, freeze, original } from "@reduxjs/toolkit";
import assert from "assert";
import { AttributableAction, CompilationResult, DatasetColumn } from ".";
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
    assert(this.currentFile != null);
    return [
      actions.addStudyDef({
        ast: node,
        file: this.currentFile,
      }),
    ];
  }

  visitCodelistDefinition(node: CodelistDefinition): Action[] {
    assert(this.currentFile != null);
    return [
      actions.addCodelistDef({
        name: node.name.value,
        ast: node,
        file: this.currentFile,
      }),
    ];
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
