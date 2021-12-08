import { CompilationResult, Dataset, DefinitionType, Domain } from ".";
import { combineReducers } from "@reduxjs/toolkit";
import { stringToAST } from "..";
import {
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
  NamedDefMap,
  StudyDef,
} from "./defBuilder";
import { Diagnostic, DiagnosticCode, DiagnosticScope } from "./diagnostics";
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

export interface CompilerOptions {
  scalarTypes: string[];
}

type ErrorsByCode<Code extends DiagnosticCode> = Map<
  Code,
  (Diagnostic & { code: Code })[]
>;

type FileMap = { [filename: string]: string | null };

export class Compiler {
  private filesMap: FileMap = {};
  private state: ReducerState = this.getInitialState();
  private actions: AttributableAction[] = [];

  public options: CompilerOptions;

  public get diagnostics(): Diagnostic[] {
    return Array.from(this.errorsByCode.values()).flat();
  }
  public get result(): CompilationResult {
    return this.state.configBuilder.result;
  }

  private errorsByCode: ErrorsByCode<DiagnosticCode> = new Map();

  private get studyDefs(): StudyDef[] {
    return this.state.defBuilder.studyDefs;
  }
  private get codelistDefs(): NamedDefMap<CodelistDef> {
    return this.state.defBuilder.codelistDefs;
  }
  private get interfaceDefs(): ReducerState["configBuilder"]["interfaces"] {
    return this.state.configBuilder.interfaces;
  }
  private get datasetDefs(): NamedDefMap<{ domain: Domain; dataset: Dataset }> {
    return Object.fromEntries(
      Object.values(this.result.domains).flatMap((domain) =>
        Object.values(domain.datasets).map((dataset) => [
          dataset.name,
          { domain, dataset },
        ])
      )
    );
  }

  constructor(options: Partial<CompilerOptions>) {
    this.options = {
      scalarTypes: ["String", "Boolean", "Integer", "Float", "Null"],
      ...options,
    };
    this.checkForGlobalErrors();
  }

  private getInitialState(): ReducerState {
    return reducer(undefined, { type: "@@init" });
  }

  private errorIf(predicate: boolean, error: Diagnostic) {
    if (predicate) {
      this.errorsByCode.set(error.code, [error]);
    } else {
      this.errorsByCode.delete(error.code);
    }
  }

  private checkForGlobalErrors() {
    this.errorIf(this.studyDefs.length === 0, {
      code: DiagnosticCode.MISSING_STUDY_DEF,
      scope: DiagnosticScope.GLOBAL,
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

  private recompileIfMissingDefsHaveBeenAdded() {
    const {
      configBuilder: {
        diagnostics,
        result: { codelists, milestones },
        interfaces,
      },
    } = this.state;
    const datasets = this.datasetDefs;
    const defTypeToDef: { [T in DefinitionType]: NamedDefMap<unknown> } = {
      [DefinitionType.CODELIST]: codelists,
      [DefinitionType.DATASET]: datasets,
      [DefinitionType.INTERFACE]: interfaces,
      [DefinitionType.MILESTONE]: milestones,
      [DefinitionType.STUDY]: {},
    };
    const filenamesToRebuild = new Set(
      diagnostics.flatMap((diagnostic): string | never[] => {
        if (diagnostic.code !== DiagnosticCode.NOT_FOUND) {
          return [];
        }

        return diagnostic.name in defTypeToDef[diagnostic.defType]
          ? diagnostic.loc.filename
          : [];
      })
    );
    const filesMap = Object.fromEntries(
      Object.entries(this.filesMap).flatMap(([filename, source]) => {
        if (filenamesToRebuild.has(filename) && source != null) {
          return [[filename, source]];
        }

        return [];
      })
    );

    this.compileFiles(filesMap);
  }

  private compileFiles(filesMap: FileMap) {
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
      getOptions: () => this.options,
      getCodelistDefs: () => this.codelistDefs,
      getInterfaceDefs: () => this.interfaceDefs,
      getMilestones: () => this.result.milestones,
      getDatasets: () => this.datasetDefs,
    };

    // Clear out any actions for these files since we're updating them
    this.removeActionsForFiles(filenames);

    // Build defs
    this.applyActions(new DefBuilder(files).getActions());

    // Build config in phases
    for (const ConfigBuilder of configBuilders) {
      this.applyActions(new ConfigBuilder(files, accessors).getActions());
    }
  }

  updateFiles(filesMap: FileMap): void {
    this.filesMap = { ...this.filesMap, ...filesMap };

    this.compileFiles(filesMap);
    this.recompileIfMissingDefsHaveBeenAdded();
    this.checkForGlobalErrors();
  }
}
