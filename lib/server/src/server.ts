import {
    DidChangeTextDocumentParams,
} from "vscode-languageserver";

console.log("NODE VERSION: ", process.version);
console.log("Startup at ", new Date());

import { TextDocument } from "vscode-languageserver-textdocument";
import { documents } from "./text-documents.js";
import { referenceHandler } from "./handlers/references.js";
import { definitionHandler } from "./handlers/definition.js";
import { connection, initConnection } from "./connection.js";
import { runDiagnostics } from "./diagnostics.js";
import { CEMUpdatedEvent, LanguageServerEventHost } from "custom-elements-languageserver-core";
import { completionsHandler } from "./handlers/completions.js";
import { codeActionHandler } from "./handlers/code-actions.js";
import { codeActionResolveHandler } from "./handlers/code-action-resolve.js";
import { hoverHandler } from "./handlers/hover.js";

initConnection();

connection.onCompletion(completionsHandler);
connection.onHover(hoverHandler);
connection.onDefinition(definitionHandler);
connection.onReferences(referenceHandler);
connection.onCodeAction(codeActionHandler)
connection.onCodeActionResolve(codeActionResolveHandler);

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
});
