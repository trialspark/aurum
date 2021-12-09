import { combineReducers } from "@reduxjs/toolkit";
import { enableMapSet } from "immer";
import { ConfigBuilderAction, configBuilderReducer } from "./configBuilder";
import { DefBuilderAction, defBuilderReducer } from "./defBuilder";
import { filesReducer, FilesAction } from "./files";

enableMapSet();

export * from "./defBuilder";
export * from "./files";
export * from "./configBuilder";

export const reducer = combineReducers({
  defBuilder: defBuilderReducer,
  configBuilder: configBuilderReducer,
  files: filesReducer,
});

export type ReducerState = ReturnType<typeof reducer>;

export type Action = DefBuilderAction | ConfigBuilderAction | FilesAction;
