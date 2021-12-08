import { createSlice, PayloadAction, freeze } from "@reduxjs/toolkit";
import { Document } from "../../astTypes";

export interface FilesState {
  [filename: string]: File | null;
}

const initialState: FilesState = {};

const { actions, reducer } = createSlice({
  name: "files",
  initialState,
  reducers: {
    addFile: (state, action: PayloadAction<File>) => {
      state[action.payload.name] = freeze(action.payload);
    },
    addFiles: (state, action: PayloadAction<File[]>) => {
      for (const file of action.payload) {
        state[file.name] = freeze(file);
      }
    },
  },
});

export interface File {
  name: string;
  ast: Document;
  source: string;
}

export type FilesAction = ReturnType<typeof actions[keyof typeof actions]>;

export { actions as filesActions, reducer as filesReducer };
