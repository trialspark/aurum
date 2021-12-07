import { CompilationResult } from ".";
import { combineReducers } from "@reduxjs/toolkit";
import { stringToAST } from "..";
import {
  CodelistDefinition,
  Document,
  DomainDefinition,
  InterfaceDefinition,
  MilestoneDefinition,
  Node,
  StudyDefinition,
} from "../astTypes";
import {
  Phase1ConfigBuilder,
  configBuilderActions,
  configBuilderReducer,
  SuperAccessor,
  configBuilders,
} from "./configBuilder";
import {
  CodelistDef,
  DefBuilder,
  defBuilderActions,
  defBuilderReducer,
  File,
  InterfaceDef,
  NamedDefMap,
  StudyDef,
} from "./defBuilder";
import { CompilerError, CompilerErrorCode, CompilerErrorScope } from "./errors";
import { ObjectValues } from "../utils";

const reducer = combineReducers({
  defBuilder: defBuilderReducer,
  configBuilder: configBuilderReducer,
});

type ReducerState = ReturnType<typeof reducer>;
type Action = ReturnType<
  ObjectValues<typeof defBuilderActions & typeof configBuilderActions>
>;

export interface AttributableAction {
  action: Action;
  file: File;
}

export interface CompilerOptions {}

type ErrorsByCode<Code extends CompilerErrorCode> = Map<
  Code,
  (CompilerError & { code: Code })[]
>;

export class Compiler {
  private state: ReducerState = this.getInitialState();
  private actions: AttributableAction[] = [];

  public get errors(): CompilerError[] {
    return Array.from(this.errorsByCode.values()).flat();
  }
  public get result(): CompilationResult {
    return this.state.configBuilder.result;
  }

  private errorsByCode: ErrorsByCode<CompilerErrorCode> = new Map();

  private get studyDefs(): StudyDef[] {
    return this.state.defBuilder.studyDefs;
  }
  private get codelistDefs(): NamedDefMap<CodelistDef> {
    return this.state.defBuilder.codelistDefs;
  }

  private get interfaceDefs(): ReducerState["configBuilder"]["interfaces"] {
    return this.state.configBuilder.interfaces;
  }

  constructor(public options: CompilerOptions) {
    this.checkForGlobalErrors();
  }

  private getInitialState(): ReducerState {
    return reducer(undefined, { type: "@@init" });
  }

  private errorIf(predicate: boolean, error: CompilerError) {
    if (predicate) {
      this.errorsByCode.set(error.code, [error]);
    } else {
      this.errorsByCode.delete(error.code);
    }
  }

  private checkForGlobalErrors() {
    this.errorIf(this.studyDefs.length === 0, {
      code: CompilerErrorCode.MISSING_STUDY_DEF,
      scope: CompilerErrorScope.GLOBAL,
      loc: null,
      message:
        "Missing study definition, e.g.:\n" +
        "\n" +
        "study {\n" +
        '  id: "STUDY-ID"\n' +
        '  name: "Longer name for my study"\n' +
        "}",
    });
  }

  private removeActionsForFiles(names: Set<string>) {
    const remainingActions = this.actions.filter(
      ({ file }) => !names.has(file.name)
    );

    this.actions = [];
    this.state = this.getInitialState();
    this.applyActions(remainingActions);
  }

  private applyActions(actions: AttributableAction[]) {
    this.state = actions
      .map(({ action }) => action)
      .reduce(reducer, this.state);
    this.actions = [...this.actions, ...actions];
  }

  updateFiles(filesMap: { [filename: string]: string | null }): void {
    const filenames = new Set(Object.keys(filesMap));
    const files = Object.entries(filesMap)
      .filter(([, value]) => value !== null)
      .map(
        ([filename, value]): File => ({
          name: filename,
          ast: stringToAST(value!),
        })
      );

    const accessors: SuperAccessor = {
      getCodelistDefs: () => this.codelistDefs,
      getInterfaceDefs: () => this.interfaceDefs,
      getMilestones: () => this.result.milestones,
      getDatasets: () =>
        Object.fromEntries(
          Object.values(this.result.domains).flatMap((domain) =>
            Object.values(domain.datasets).map((dataset) => [
              dataset.name,
              { domain, dataset },
            ])
          )
        ),
    };

    // Clear out any actions for these files since we're updating them
    this.removeActionsForFiles(filenames);

    // Build defs
    this.applyActions(new DefBuilder(files).getActions());

    // Build config in phases
    for (const ConfigBuilder of configBuilders) {
      this.applyActions(new ConfigBuilder(files, accessors).getActions());
    }

    this.checkForGlobalErrors();
  }
}
