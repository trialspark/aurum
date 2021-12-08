import { createSlice, PayloadAction, freeze, original } from "@reduxjs/toolkit";
import { NamedDefMap } from ".";
import {
  Codelist,
  CompilationResult,
  DatasetMapping,
  Diagnostic,
  Domain,
  Interface,
  Milestone,
  StudyInfo,
} from "..";

export interface ConfigBuilderState {
  result: CompilationResult;
  interfaces: NamedDefMap<Interface>;
  diagnostics: Diagnostic[];
}

const initialState: ConfigBuilderState = {
  result: {
    study: {
      id: "",
      name: "",
    },
    milestones: {},
    codelists: {},
    domains: {},
  },
  interfaces: {},
  diagnostics: [],
};

const { reducer, actions } = createSlice({
  initialState,
  name: "configBuilder",
  reducers: {
    setStudy: (state, action: PayloadAction<StudyInfo>) => {
      state.result.study = freeze(action.payload);
    },
    addMilestone: (state, action: PayloadAction<Milestone>) => {
      state.result.milestones[action.payload.name!] = freeze(action.payload);
    },
    addInterface: (state, action: PayloadAction<Interface>) => {
      state.interfaces[action.payload.name] = freeze(action.payload);
    },
    addCodelist: (state, action: PayloadAction<Codelist>) => {
      state.result.codelists[action.payload.name] = freeze(action.payload);
    },
    addDomain: (state, action: PayloadAction<Domain>) => {
      state.result.domains[action.payload.name] = freeze(action.payload);
    },
    addDatasetMapping: (
      state,
      action: PayloadAction<{
        dataset: string;
        mappings: DatasetMapping[];
      }>
    ) => {
      const datasetName = action.payload.dataset;
      const domainName = Object.entries(original(state)!.result.domains).find(
        ([, value]) => datasetName in value.datasets
      )?.[0];

      if (domainName) {
        state.result.domains[domainName].datasets[datasetName].mappings.push(
          ...action.payload.mappings
        );
      }
    },
    addDiagnostic: (state, action: PayloadAction<Diagnostic>) => {
      state.diagnostics.push(action.payload);
    },
  },
});

export type ConfigBuilderAction = ReturnType<
  typeof actions[keyof typeof actions]
>;

export { actions as configBuilderActions, reducer as configBuilderReducer };
