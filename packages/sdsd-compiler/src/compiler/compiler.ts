import {
  CompilationResult,
  Dataset,
  DefinitionType,
  Domain,
  ParseDiagnostic,
} from ".";
import { ParseError, stringToAST } from "../stringToAST";
import { Document } from "../astTypes";
import { SuperAccessor, configBuilders } from "./configBuilder";
import { DefBuilder } from "./defBuilder";
import { Diagnostic, DiagnosticCode, DiagnosticScope } from "./diagnostics";
import {
  Action,
  NamedDefMap,
  reducer,
  ReducerState,
  File,
  filesActions,
} from "./state";
import { AutocompleteBuilder, CompletionItem } from './autoCompleteBuilder'

export interface AttributableAction {
  action: Action;
  file: File | null;
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
  private state: ReducerState = this.getInitialState();
  private actions: AttributableAction[] = [];
  private compiledFilenames: Set<string> = new Set();

  public options: CompilerOptions;

  public get diagnostics(): Diagnostic[] {
    return [
      ...Object.values(this.state.files).flatMap(
        (file) => file.parseDiagnostics
      ),
      ...Array.from(this.errorsByCode.values()).flat(),
      ...this.state.configBuilder.diagnostics,
    ];
  }
  public get result(): CompilationResult {
    return this.state.configBuilder.result;
  }

  private errorsByCode: ErrorsByCode<DiagnosticCode> = new Map();

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
    this.errorIf(this.state.defBuilder.studyDefs.length === 0, {
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

  private withFreshCompiledFilenames<R>(fn: () => R): R {
    try {
      this.compiledFilenames = new Set();
      return fn();
    } finally {
      this.compiledFilenames = new Set();
    }
  }

  private removeActionsForFiles(names: Set<string>) {
    const remainingActions = this.actions.filter(
      ({ file }) => !file || !names.has(file.name)
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
    const datasets = this.state.defBuilder.datasetDefs;
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
      Object.values(this.state.files).flatMap((file) => {
        if (filenamesToRebuild.has(file.name)) {
          return [[file.name, file.source]];
        }

        return [];
      })
    );

    this.compileFiles(filesMap);
  }

  private createFile(filename: string, source: string): File {
    let ast: Document | null = null;
    let parseDiagnostics: ParseDiagnostic[] = [];

    try {
      ast = stringToAST(source);
    } catch (error) {
      if (error instanceof ParseError) {
        parseDiagnostics = [
          {
            code: DiagnosticCode.PARSE_FAILURE,
            scope: DiagnosticScope.LOCAL,
            loc: { ...error.loc, filename },
            message: error.message,
          },
        ];
      } else {
        throw error;
      }
    }

    return {
      name: filename,
      source,
      ast,
      parseDiagnostics,
      dependencies: new Set(),
    };
  }

  private updateFilesState(filesMap: FileMap) {
    this.applyActions(
      Object.entries(filesMap).map(([filename, source]): AttributableAction => {
        if (source == null) {
          return { action: filesActions.removeFile(filename), file: null };
        }

        return {
          action: filesActions.addFile(this.createFile(filename, source)),
          file: null,
        };
      })
    );
  }

  private compileFiles(filesMap: FileMap) {
    const filenames = new Set(Object.keys(filesMap));
    const files = Object.entries(filesMap)
      .filter(
        ([filename, value]) =>
          value !== null && !this.compiledFilenames.has(filename)
      )
      .map(([filename, value]) => this.createFile(filename, value!));
    const accessors: SuperAccessor = {
      getOptions: () => this.options,
      getState: () => this.state,
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
    this.withFreshCompiledFilenames(() => {
      this.updateFilesState(filesMap);
      this.compileFiles(filesMap);
      this.recompileIfMissingDefsHaveBeenAdded();
      this.checkForGlobalErrors();
    });
  }

  getCompletionItems(line: number, character: number): CompletionItem[] {
    const autoCompleteResults = new AutocompleteBuilder(Object.values(this.state.files)).getAutocompleteResults();
    // console.log('ast: ', this.state.files['study.sdsd'].ast); // TODO: Delete 
    return [
      {
        label: 'TypeScript',
        data: 1
      },
      {
        label: 'JavaScript',
        data: 2
      }
    ];
  }
}
