import { createSlice, PayloadAction, freeze } from "@reduxjs/toolkit";
import { AttributableAction } from ".";
import {
  CodelistDefinition,
  DatasetDefinition,
  Document,
  DomainDefinition,
  InterfaceDefinition,
  MilestoneDefinition,
  StudyDefinition,
} from "../astTypes";
import { Action, defBuilderActions, File } from "./state";
import { DocumentVisitor } from "./visitor";

export class DefBuilder extends DocumentVisitor {
  private currentFile: File | null = null;

  constructor(private files: File[]) {
    super();
  }

  private withFile<R>(file: File, fn: () => R): R {
    try {
      this.currentFile = file;
      return fn();
    } finally {
      this.currentFile = null;
    }
  }

  visitStudyDefinition(node: StudyDefinition): Action[] {
    return [
      defBuilderActions.addStudyDef({
        ast: node,
        file: this.currentFile!,
      }),
    ];
  }

  visitInterfaceDefinition(node: InterfaceDefinition): Action[] {
    return [
      defBuilderActions.addInterfaceDef({
        name: node.name.value,
        ast: node,
        file: this.currentFile!,
      }),
    ];
  }

  visitMilestoneDefinition(node: MilestoneDefinition): Action[] {
    return [
      defBuilderActions.addMilestoneDef({
        name: node.name.value,
        ast: node,
        file: this.currentFile!,
      }),
    ];
  }

  visitCodelistDefinition(node: CodelistDefinition): Action[] {
    return [
      defBuilderActions.addCodelistDef({
        name: node.name.value,
        ast: node,
        file: this.currentFile!,
      }),
    ];
  }

  visitDomainDefinition(node: DomainDefinition): Action[] {
    return node.children.flatMap((child) => child.accept(this));
  }

  visitDatasetDefinition(node: DatasetDefinition): Action[] {
    return [
      defBuilderActions.addDatasetDef({
        name: node.name.value,
        ast: node,
        file: this.currentFile!,
      }),
    ];
  }

  visit(node: Document): Action[] {
    return node.children.flatMap((child) => {
      const actions = child.accept(this);

      if (Array.isArray(actions)) {
        return actions;
      }

      return [];
    });
  }

  getActions(): AttributableAction[] {
    return this.files.flatMap((file) =>
      this.withFile(file, () => this.visit(file.ast)).map((action) => ({
        file,
        action,
      }))
    );
  }
}
