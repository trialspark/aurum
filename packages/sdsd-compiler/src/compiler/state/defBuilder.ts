import { createSlice, PayloadAction, freeze } from "@reduxjs/toolkit";
import {
  CodelistDefinition,
  DatasetDefinition,
  InterfaceDefinition,
  MilestoneDefinition,
  StudyDefinition,
  Document,
} from "../../astTypes";

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
      state.interfaceDefs[action.payload.name] = freeze(action.payload);
    },
    addMilestoneDef: (state, action: PayloadAction<MilestoneDef>) => {
      state.milestoneDefs[action.payload.name] = freeze(action.payload);
    },
    addCodelistDef: (state, action: PayloadAction<CodelistDef>) => {
      state.codelistDefs[action.payload.name] = freeze(action.payload);
    },
    addDatasetDef: (state, action: PayloadAction<DatasetDef>) => {
      state.datasetDefs[action.payload.name] = freeze(action.payload);
    },
  },
});

export type DefBuilderAction = ReturnType<typeof actions[keyof typeof actions]>;

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

export { actions as defBuilderActions, reducer as defBuilderReducer };
