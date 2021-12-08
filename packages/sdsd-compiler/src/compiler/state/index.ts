import { combineReducers } from "@reduxjs/toolkit";
import { ConfigBuilderAction, configBuilderReducer } from "./configBuilder";
import { DefBuilderAction, defBuilderReducer } from "./defBuilder";

export * from "./defBuilder";
export * from "./configBuilder";

export const reducer = combineReducers({
  defBuilder: defBuilderReducer,
  configBuilder: configBuilderReducer,
});

export type ReducerState = ReturnType<typeof reducer>;

export type Action = DefBuilderAction | ConfigBuilderAction;
