import { createSlice, PayloadAction, freeze } from "@reduxjs/toolkit";
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
  },
});

export interface File {
  name: string;
  ast: Document;
  source: string;
}

export type FilesAction = ReturnType<typeof actions[keyof typeof actions]>;

export { actions as filesActions, reducer as filesReducer };
