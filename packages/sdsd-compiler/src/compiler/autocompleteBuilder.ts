
import { createSlice, PayloadAction, freeze } from "@reduxjs/toolkit";
import {
  CodelistDefinition,
  DatasetDefinition,
  Document,
  DomainDefinition,
  InterfaceDefinition,
  MilestoneDefinition,
  StudyDefinition,
  KeyValuePair,
  Identifier,
} from "../astTypes";
import { Action, defBuilderActions, File } from "./state";
import { DocumentVisitor } from "./visitor";

export interface CompletionItem {
  label: string;
  data: number;
}

export enum CompletionDataValue {
  Identifier = 0,
  Value = 1,
}

export class AutocompleteBuilder extends DocumentVisitor {
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

  visitStudyDefinition(node: StudyDefinition): CompletionItem[] {
    return node.children.flatMap((child) => child.accept(this));
    // return [
    //   // defBuilderActions.addStudyDef({
    //   //   ast: node,
    //   //   file: this.currentFile!,
    //   // }),
    // ];
  }

  visitIdentifier(node: Identifier): CompletionItem {
    // console.log('identifier: ', node); // TODO: Delete 
    return {label: node.value, data: CompletionDataValue.Identifier};
  }

  visitKeyValuePair(node: KeyValuePair): CompletionItem[] {
    console.log('node right hand: ', node.rhs); // TODO: Delete 
    return [ node.lhs.accept(this), { label: node.rhs.toString(), data: CompletionDataValue.Value }];
  }

  visitInterfaceDefinition(node: InterfaceDefinition): CompletionItem[] {
    return [
      // defBuilderActions.addInterfaceDef({
      //   name: node.name.value,
      //   ast: node,
      //   file: this.currentFile!,
      // }),
    ];
  }

  visitMilestoneDefinition(node: MilestoneDefinition): CompletionItem[] {
    return [
      // defBuilderActions.addMilestoneDef({
      //   name: node.name.value,
      //   ast: node,
      //   file: this.currentFile!,
      // }),
    ];
  }

  visitCodelistDefinition(node: CodelistDefinition): CompletionItem[] {
    return [
      // defBuilderActions.addCodelistDef({
      //   name: node.name.value,
      //   ast: node,
      //   file: this.currentFile!,
      // }),
    ];
  }

  visitDomainDefinition(node: DomainDefinition): CompletionItem[] {
    return node.children.flatMap((child) => child.accept(this));
  }

  visitDatasetDefinition(node: DatasetDefinition): CompletionItem[] {
    return [
      // defBuilderActions.addDatasetDef({
      //   name: node.name.value,
      //   ast: node,
      //   file: this.currentFile!,
      // }),
    ];
  }

  visit(node: Document): CompletionItem[] {
    return node.children.flatMap((child) => {
      const actions = child.accept(this);

      if (Array.isArray(actions)) {
        return actions;
      }

      return [];
    });
  }

  getAutocompleteResults(): CompletionItem[] {
    return this.files.flatMap((file) =>
      this.withFile(file, () => this.visit(file.ast))
    );
  }
}
