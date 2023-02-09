import {
    createConnection,
    DidChangeConfigurationNotification,
    DidChangeConfigurationParams,
    DidChangeTextDocumentParams,
    InitializeParams,
    InitializeResult,
    ProposedFeatures,
    TextDocumentSyncKind,
    Diagnostic,
    CodeActionParams,
    CodeAction
} from "vscode-languageserver/node.js";
import tss from "typescript/lib/tsserverlibrary.js";

console.log("NODE VERSION: ", process.version);

import { TextDocument } from "vscode-languageserver-textdocument";
import { getCompletionItemInfo, getCompletionItems } from "./completion.js";
import { DEFAULT_SETTINGS, LanguageServerSettings, setCapabilities, setGlobalSettings } from "./settings.js";
import { getLanguageService, updateLanguageServiceForFile } from "./language-services/language-services.js";
import { documentSpanToLocation, quickInfoToHover, textDocumentDataToUsableData, tsDiagnosticToDiagnostic } from "./transformers.js";
import { documents, documentSettings } from "./text-documents.js";
import { getReferencesAtPosition } from "./handlers/references.js";
import { getCodeActionsForParams } from "./handlers/code-actions.js";

const connection = createConnection(ProposedFeatures.all);

// Only keep settings for open documents
let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize(onInitialize);
connection.onInitialized(onInitialized);
connection.onDidChangeConfiguration(onDidChangeConfiguration);
connection.onDidChangeWatchedFiles(_change => {
    console.log("File changed");
    // Monitored files have change in VS Code
    connection.console.log("We received a file change event");
});

connection.onHover(hoverInfo => {
    console.log("Hover NEW");
    const usableData = textDocumentDataToUsableData(documents, hoverInfo);
    const languageService = getLanguageService(usableData.fileName, usableData.fileContent);

    const quickInfo = languageService?.getQuickInfoAtPosition(usableData.fileName, usableData.position);
    if (quickInfo?.kind !== tss.ScriptElementKind.string) {
        return undefined;
    }
    return quickInfoToHover(usableData.fileName, quickInfo);
});

// This handler provides the initial list of the completion items.
connection.onCompletion(getCompletionItems);
// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(getCompletionItemInfo);

connection.onDefinition(definitionEvent => {
    const usableData = textDocumentDataToUsableData(documents, definitionEvent);
    const languageService = getLanguageService(usableData.fileName, usableData.fileContent);
    const definitions = languageService?.getDefinitionAtPosition(usableData.fileName, usableData.position);

    const definitionLocations = definitions?.map(documentSpanToLocation) ?? [];
    return definitionLocations;
});

connection.onReferences((referencesEvent) => {
    const references = getReferencesAtPosition(referencesEvent);

    return [...references];
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

documents.onDidClose(e => {
    documentSettings.delete(e.document.uri);
});

documents.onDidOpen(e => {
    console.log("Opened text doc");
    const fileName = e.document.uri.replace("file://", "");
    updateLanguageServiceForFile(fileName, e.document.getText());

    runDiagnostics(e.document.uri, e.document);
});

// Listen on the connection
connection.listen();

function onInitialize(params: InitializeParams) {
    let capabilities = params.capabilities;

    console.log("Initialize start");
    // Does the client support the `workspace/configuration` request?
    // If not, we fall back using global settings.
    hasConfigurationCapability = !!(capabilities.workspace && !!capabilities.workspace.configuration);
    hasWorkspaceFolderCapability = !!(capabilities.workspace && !!capabilities.workspace.workspaceFolders);
    hasDiagnosticRelatedInformationCapability = !!(
        capabilities.textDocument &&
        capabilities.textDocument.publishDiagnostics &&
        capabilities.textDocument.publishDiagnostics.relatedInformation
    );

    setCapabilities({
        hasConfigurationCapability,
        hasWorkspaceFolderCapability,
        hasDiagnosticRelatedInformationCapability,
    });

    connection.onShutdown(() => { });

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            completionProvider: {
                resolveProvider: true,
            },
            hoverProvider: true,
            declarationProvider: true,
            referencesProvider: true,
            definitionProvider: true,
            codeActionProvider: true
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
}

function onInitialized() {
    console.log("Initialized");
    if (hasConfigurationCapability) {
        // Register for all configuration changes.
        connection.client.register(DidChangeConfigurationNotification.type, undefined);
    }
    if (hasWorkspaceFolderCapability) {
        connection.workspace.onDidChangeWorkspaceFolders(_event => {
            connection.console.log("Workspace folder change event received.");
        });
    }
}

function onDidChangeConfiguration(change: DidChangeConfigurationParams) {
    // console.log("onDidChangeConfiguration");
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    } else {
        setGlobalSettings(<LanguageServerSettings>(change.settings.languageServerExample || DEFAULT_SETTINGS));
    }
}

connection.onDidChangeTextDocument((params: DidChangeTextDocumentParams) => {
    console.log("OnDidChangeTextDocument");
    const docRef = params.textDocument;
    const changes = params.contentChanges;
    const textDoc = documents.get(docRef.uri);
    if (!textDoc) return;

    const updatedDoc = TextDocument.update(textDoc, changes, textDoc?.version ?? 0 + 1);

    runDiagnostics(params.textDocument.uri, updatedDoc);
});

async function runDiagnostics(uri: string, textDoc: TextDocument) {

    const fileName = uri.replace("file://", "");
    const languageService = getLanguageService(fileName, textDoc.getText());

    const diagnostics = languageService?.getSemanticDiagnostics(fileName);
    const sendableDiagnostics: Array<Diagnostic> = diagnostics?.map((diag: ts.Diagnostic) => tsDiagnosticToDiagnostic(diag, textDoc))
        .filter((diag: unknown): diag is Diagnostic => diag !== undefined) ?? []; // Stupid ts types

    connection.sendDiagnostics({ uri: textDoc.uri, diagnostics: sendableDiagnostics });
}

connection.onCodeActionResolve((codeAction: CodeAction) => {
    const edit = codeAction.edit;
    if (edit && edit.changes) {
        const files = Object.keys(edit.changes);
        for (const file of files) {
            const textDoc = documents.get(file);
            if (!textDoc) continue;

            runDiagnostics(file, textDoc);
        }
    }

    return codeAction;
})

connection.onCodeAction((params: CodeActionParams) => {
    const doc = params.textDocument;
    const textDoc = documents.get(doc.uri);
    if (!textDoc) {
        return undefined;
    }

    const codeActions = getCodeActionsForParams(params, textDoc);

    return codeActions;
})
