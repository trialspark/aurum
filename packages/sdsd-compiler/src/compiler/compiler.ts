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
  ConfigBuilder,
  configBuilderActions,
  configBuilderReducer,
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

interface AttributableAction {
  action: Action;
  file: File;
}

export interface CompilerOptions {}

interface ParsedFileMap {
  [filename: string]: File;
}

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

  private files: ParsedFileMap = {};
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

  private applyActions(state: ReducerState, actions: Action[]): ReducerState {
    return actions.reduce(reducer, state);
  }

  updateFiles(files: { [filename: string]: string | null }): void {
    for (const [filename, source] of Object.entries(files)) {
      // Remove any actions from the last time this file was compiled
      this.actions = this.actions.filter(
        (action) => action.file.name !== filename
      );

      if (source != null) {
        // If we have new file contents to compile
        const newActions: Action[] = [];
        const file: File = {
          name: filename,
          ast: stringToAST(source),
        };
        newActions.push(...new DefBuilder(file).getActions());
        newActions.push(
          ...new ConfigBuilder(file, {
            getCodelistDefs: () => this.codelistDefs,
            getInterfaceDefs: () => this.interfaceDefs,
            getMilestones: () => this.result.milestones,
            getDatasets: () =>
              Object.fromEntries(
                Object.values(this.result.domains).flatMap((domain) =>
                  Object.entries(domain.datasets).map(
                    ([datasetName, dataset]) => [
                      datasetName,
                      { domain, dataset },
                    ]
                  )
                )
              ),
          }).getActions()
        );
        this.actions = [
          ...this.actions,
          ...newActions.map((action) => ({ file, action })),
        ];
      }

      this.state = this.applyActions(
        this.getInitialState(),
        this.actions.map(({ action }) => action)
      );
    }

    this.checkForGlobalErrors();
  }
}
