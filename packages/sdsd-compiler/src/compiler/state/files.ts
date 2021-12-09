import { createSlice, PayloadAction, freeze, original } from "@reduxjs/toolkit";
import { ParseDiagnostic } from "..";
import { Document } from "../../astTypes";

export interface FilesState {
  [filename: string]: File | undefined;
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
      const dependsOnSelf = filename === dependencyFilename;

      if (file && !dependsOnSelf) {
        file.dependencies = new Set([
          ...Array.from(file.dependencies),
          dependencyFilename,
        ]);
      }
    },
    removeAsDependencies: (
      state,
      { payload: depsToRemove }: PayloadAction<Set<string>>
    ) => {
      const files = Object.values(state);

      for (const file of files) {
        if (file) {
          const currentDependencies = original(file)!.dependencies;
          file.dependencies = new Set(
            Array.from(currentDependencies).filter(
              (dependency) => !depsToRemove.has(dependency)
            )
          );
        }
      }
    },
  },
});

export interface File {
  name: string;
  ast: Document | null;
  source: string;
  dependencies: Set<string>;
  parseDiagnostics: ParseDiagnostic[];
}

export type FilesAction = ReturnType<typeof actions[keyof typeof actions]>;

export { actions as filesActions, reducer as filesReducer };
