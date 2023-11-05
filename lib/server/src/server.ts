import {
    DidChangeTextDocumentParams,
} from "vscode-languageserver";

console.log("NODE VERSION: ", process.version);
console.log("Startup at ", new Date());

import { TextDocument } from "vscode-languageserver-textdocument";
import { documents } from "./text-documents.js";
import { ReferenceHandler } from "./handlers/references.js";
import { CodeActionHandler } from "./handlers/code-actions.js";
import { HoverHandler } from "./handlers/hover.js";
import { DefinitionHandler } from "./handlers/definition.js";
import { CompletionsHandler } from "./handlers/completions.js";
import { CodeActionResolveHandler } from "./handlers/code-action-resolve.js";
import { connection, initConnection } from "./connection.js";
import { runDiagnostics } from "./diagnostics.js";
import { CEMUpdatedEvent, LanguageServerEventHost } from "custom-elements-languageserver-core";

initConnection();

connection.onCompletion(CompletionsHandler.handle);
connection.onHover(HoverHandler.handle);
connection.onDefinition(DefinitionHandler.handle);
connection.onReferences(ReferenceHandler.handle);
connection.onCodeAction(CodeActionHandler.handle)
connection.onCodeActionResolve(CodeActionResolveHandler.handle);

connection.onDidChangeTextDocument((params: DidChangeTextDocumentParams) => {
    const docRef = params.textDocument;
    const changes = params.contentChanges;
    const textDoc = documents.get(docRef.uri);
    if (!textDoc) return;

    const updatedDoc = TextDocument.update(textDoc, changes, textDoc?.version ?? 0 + 1);

    runDiagnostics(params.textDocument.uri, updatedDoc);
});

LanguageServerEventHost.getInstance().addEventListener("cem-updated", (event: Event) => {
    if (!(event instanceof CEMUpdatedEvent)) {
        return;
    }

    const docs = documents.all();
    docs.forEach((doc) => {
        runDiagnostics(doc.uri, doc);
    });
    // RUN DIAG
});
