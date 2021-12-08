import { createSlice } from "@reduxjs/toolkit";
import { Document } from "../../astTypes";

export interface FilesState {
  [filename: string]: File;
}

const initialState: FilesState = {};

const { actions, reducer } = createSlice({
  name: "files",
  initialState,
  reducers: {},
});

export interface File {
  name: string;
  ast: Document;
}

export type FilesAction = ReturnType<typeof actions[keyof typeof actions]>;

export { actions as filesActions, reducer as filesReducer };
