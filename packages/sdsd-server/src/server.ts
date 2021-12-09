/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import {
  createConnection,
  TextDocuments,
  Diagnostic,
  DiagnosticSeverity,
  ProposedFeatures,
  InitializeParams,
  DidChangeConfigurationNotification,
  CompletionItem,
  CompletionItemKind,
  TextDocumentPositionParams,
  TextDocumentSyncKind,
  InitializeResult,
  Position,
} from "vscode-languageserver/node";

import { TextDocument } from "vscode-languageserver-textdocument";
import { Compiler } from "sdsd-compiler";
import nearley from "nearley";

// const grammar = nearley.Grammar.fromCompiled(require("../grammar.js"));

// Create a connection for the server, using Node's IPC as a transport.
// Also include all preview / proposed LSP features.
const connection = createConnection(ProposedFeatures.all);
const compiler = new Compiler({});

// Create a simple text document manager.
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

let hasConfigurationCapability = false;
let hasWorkspaceFolderCapability = false;
let hasDiagnosticRelatedInformationCapability = false;

connection.onInitialize((params: InitializeParams) => {
  const capabilities = params.capabilities;

  // Does the client support the `workspace/configuration` request?
  // If not, we fall back using global settings.
  hasConfigurationCapability = !!(
    capabilities.workspace && !!capabilities.workspace.configuration
  );
  hasWorkspaceFolderCapability = !!(
    capabilities.workspace && !!capabilities.workspace.workspaceFolders
  );
  hasDiagnosticRelatedInformationCapability = !!(
    capabilities.textDocument &&
    capabilities.textDocument.publishDiagnostics &&
    capabilities.textDocument.publishDiagnostics.relatedInformation
  );

  const result: InitializeResult = {
    capabilities: {
      textDocumentSync: TextDocumentSyncKind.Incremental,
      // Tell the client that this server supports code completion.
      completionProvider: {
        resolveProvider: true,
      },
    },
  };
  if (hasWorkspaceFolderCapability) {
    result.capabilities.workspace = {
      workspaceFolders: {
        supported: true,
      },
    };
  }
  return result;
});

connection.onInitialized(() => {
  connection.console.log("onInitialized called");
  if (hasConfigurationCapability) {
    // Register for all configuration changes.
    connection.client.register(
      DidChangeConfigurationNotification.type,
      undefined
    );
  }
  if (hasWorkspaceFolderCapability) {
    connection.workspace.onDidChangeWorkspaceFolders((_event) => {
      connection.console.log("Workspace folder change event received.");
    });
  }
});

// The example settings
interface ExampleSettings {
  maxNumberOfProblems: number;
}

// The global settings, used when the `workspace/configuration` request is not supported by the client.
// Please note that this is not the case when using this server with the client provided in this example
// but could happen with other clients.
const defaultSettings: ExampleSettings = { maxNumberOfProblems: 1000 };
let globalSettings: ExampleSettings = defaultSettings;

// Cache the settings of all open documents
const documentSettings: Map<string, Thenable<ExampleSettings>> = new Map();

connection.onDidChangeConfiguration((change) => {
  connection.console.log("didchangeconfig");
  if (hasConfigurationCapability) {
    // Reset all cached document settings
    documentSettings.clear();
  } else {
    globalSettings = <ExampleSettings>(
      (change.settings.languageServerExample || defaultSettings)
    );
  }

  // Revalidate all open text documents
  documents.all().forEach(validateTextDocument);
});

function getDocumentSettings(resource: string): Thenable<ExampleSettings> {
  connection.console.log("getDocumentSettings");
  if (!hasConfigurationCapability) {
    return Promise.resolve(globalSettings);
  }
  let result = documentSettings.get(resource);
  if (!result) {
    result = connection.workspace.getConfiguration({
      scopeUri: resource,
      section: "languageServerExample",
    });
    documentSettings.set(resource, result);
  }
  return result;
}

// Only keep settings for open documents
documents.onDidClose((e) => {
  connection.console.log("document closed");
  documentSettings.delete(e.document.uri);
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
  compiler.updateFiles({ [change.document.uri]: change.document.getText() });
  connection.console.log("didchangecontent");
  validateTextDocument(change.document);
});

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
  // In this simple example we get the settings for every validate run.
  const settings = await getDocumentSettings(textDocument.uri);
  textDocument.positionAt(2);

  // The validator creates diagnostics for all uppercase words length 2 and more
  const text = textDocument.getText();
  const diagnostics: Diagnostic[] = [];

  // const parser = new nearley.Parser(grammar, { keepHistory: true });
  try {
    // [{"code":"not_found","scope":"local","loc":{"start":{"line":61,"col":66},"end":{"line":61,"col":74},"filename":"file:///Users/evan/sdsd/packages/sdsd-vscode/single_file.sdsd"},"message":"Could not find milestone with name \"BASELINEZ\". Please add it:\n\nmilestone BASELINEZ {\n  at: t\"d7 +-2\"\n}","defType":"milestone","name":"BASELINEZ"}
    const diagnostics: Diagnostic[] = compiler.diagnostics.map(
      ({ code, scope, loc, message }) => ({
        message,
        code,
        range: {
          start: Position.create(
            (loc?.start.line ?? 1) - 1,
            (loc?.start.col ?? 0) - 1
          ),
          end: Position.create(
            (loc?.end.line ?? Infinity) - 1,
            loc?.end.col ?? Infinity
          ),
        },
      })
    );
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
  } catch (err: any) {
    connection.console.error(err);
  }
}

connection.onDidChangeWatchedFiles((_change) => {
  // Monitored files have change in VSCode
  connection.console.log("We received an file change event");
});

// This handler provides the initial list of the completion items.
connection.onCompletion(
  (textDocumentPosition: TextDocumentPositionParams): any[] => {
    // connection.console.log(JSON.stringify(documents.keys()));
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    const document = documents.get(textDocumentPosition.textDocument.uri);
    if (!document) return [];
    console.log(document.getText())
    const completionResults = compiler.getCompletionItems(textDocumentPosition.position.line, textDocumentPosition.position.character, document.getText()).map(item => ({...item, kind: CompletionItemKind.Text, detail: 'Hello' }));
    connection.console.log(JSON.stringify(completionResults));
    return completionResults
  }
);

// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
  console.log("onCompletionResolve");
  if (item.label === "foo") {
    item.detail = "foo details";
    item.documentation = "foo documentation";
  } else if (item.label === "fooz") {
    item.detail = "fooz details";
    item.documentation = "fooz documentation";
  }
  return item;
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();
