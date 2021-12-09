import { createSlice, PayloadAction, freeze, original } from "@reduxjs/toolkit";
import { ParseDiagnostic } from "..";
import { Document } from "../../astTypes";

export interface FilesState {
  [filename: string]: File;
}

const initialState: FilesState = {};

const { actions, reducer } = createSlice({
  name: "files",
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<File>) => {
      state[action.payload.name] = freeze(action.payload);
    },
    removeFile: (state, action: PayloadAction<string>) => {
      delete state[action.payload];
    },
    addDependency: (
      state,
      {
        payload: { filename, dependencyFilename },
      }: PayloadAction<{ filename: string; dependencyFilename: string }>
    ) => {
      const file = state[filename];
      const dependencyFile = original(state)![dependencyFilename];
      const fileIsAlreadyDependency = file.dependencies
        .map(({ name }) => name)
        .includes(dependencyFilename);
      const dependsOnSelf = filename === dependencyFilename;

      if (!dependsOnSelf && !fileIsAlreadyDependency) {
        file.dependencies.push(dependencyFile);
      }
    },
  },
});

export interface File {
  name: string;
  ast: Document | null;
  source: string;
  dependencies: File[];
  parseDiagnostics: ParseDiagnostic[];
}

export type FilesAction = ReturnType<typeof actions[keyof typeof actions]>;

export { actions as filesActions, reducer as filesReducer };
