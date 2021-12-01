import { CompilationResult } from ".";
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
import { ConfigBuilder } from "./configBuilder";
import {
  CodelistDef,
  DefBuilder,
  File,
  NamedDefMap,
  StudyDef,
} from "./defBuilder";
import { CompilerError, CompilerErrorCode, CompilerErrorScope } from "./errors";

export interface CompilerOptions {}

interface ParsedFileMap {
  [filename: string]: File;
}

type ErrorsByCode<Code extends CompilerErrorCode> = Map<
  Code,
  (CompilerError & { code: Code })[]
>;

export class Compiler {
  public get errors(): CompilerError[] {
    return Array.from(this.errorsByCode.values()).flat();
  }
  public result: CompilationResult;

  private files: ParsedFileMap = {};
  private errorsByCode: ErrorsByCode<CompilerErrorCode> = new Map();

  private get studyDefs(): StudyDef[] {
    return Object.values(this.files)
      .map((file) => file.studyDefs)
      .flat();
  }
  private get codelistDefs(): NamedDefMap<CodelistDef> {
    return Object.fromEntries(
      Object.values(this.files)
        .map((file) => Object.entries(file.codelistDefs))
        .flat()
    );
  }

  constructor(public options: CompilerOptions) {
    this.checkForGlobalErrors();
    this.result = this.getResult();
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

  private getResult(): CompilationResult {
    let result: CompilationResult = {
      study: {
        id: "",
        name: "",
      },
      milestones: {},
      codelists: {},
      domains: {},
    };

    for (const { result: partialResult } of Object.values(this.files)) {
      result = {
        study: {
          ...result.study,
          ...partialResult.study,
        },
        milestones: { ...result.milestones, ...partialResult.milestones },
        codelists: { ...result.codelists, ...partialResult.codelists },
        domains: { ...result.domains, ...partialResult.domains },
      };
    }

    return result;
  }

  set(filename: string, source: string | null): void {
    if (source != null) {
      this.files[filename] = new ConfigBuilder(
        new DefBuilder({
          name: filename,
          ast: stringToAST(source),
          result: {},
          studyDefs: [],
          milestoneDefs: {},
          codelistDefs: {},
          interfaceDefs: {},
          domainDefs: {},
        }).getFile(),
        { getCodelistDefs: () => this.codelistDefs }
      ).getFile();
    } else {
      delete this.files[filename];
    }

    this.checkForGlobalErrors();
    this.result = this.getResult();
  }
}
