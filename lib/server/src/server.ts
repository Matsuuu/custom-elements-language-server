import {
    createConnection,
    DidChangeConfigurationNotification,
    DidChangeConfigurationParams,
    DidChangeTextDocumentParams,
    InitializeParams,
    InitializeResult,
    ProposedFeatures,
    TextDocumentSyncKind,
    Diagnostic
} from "vscode-languageserver/node.js";
import tss from "typescript/lib/tsserverlibrary.js";

console.log("NODE VERSION: ", process.version);

import { TextDocument } from "vscode-languageserver-textdocument";
import { getCompletionItemInfo, getCompletionItems } from "./completion.js";
import { validateTextDocument } from "./analyzer.js";
import { DEFAULT_SETTINGS, LanguageServerSettings, setCapabilities, setGlobalSettings } from "./settings.js";
import { getLanguageService, initializeLanguageServiceForFile } from "./language-services/language-services.js";
import { documentSpanToLocation, quickInfoToHover, textDocumentDataToUsableData, tsDiagnosticToDiagnostic } from "./transformers.js";
import { documents, documentSettings } from "./text-documents.js";
import { getReferencesAtPosition } from "./handlers/references.js";

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
    const usableData = textDocumentDataToUsableData(documents, referencesEvent);
    const references = getReferencesAtPosition(referencesEvent);
    const languageService = getLanguageService(usableData.fileName, usableData.fileContent);

    const lspReferences = languageService?.getReferencesAtPosition(usableData.fileName, usableData.position) ?? [];
    // Here we can't utilize the template literal language service

    return [...references, ...lspReferences.map(documentSpanToLocation)];
    // return references?.map(documentSpanToLocation) ?? [];
    /*return [{
        uri: "file:///home/matsu/Projects/custom-elements-language-server/lib/html-template-literal-tsserver-plugin/example/src/foo.ts",
        range: Range.create(Position.create(0, 0), Position.create(0, 10))
    }]*/
});

// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// Listen on the connection
connection.listen();

function onInitialize(params: InitializeParams) {
    let capabilities = params.capabilities;

    console.log("Initialize start");
    // TODO: Figure out these
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

    documents.onDidClose(e => {
        documentSettings.delete(e.document.uri);
    });

    documents.onDidOpen(e => {
        console.log("Opened text doc");

        const fileName = e.document.uri.replace("file://", "");
        initializeLanguageServiceForFile(fileName, e.document.getText());
    });

    connection.onShutdown(() => { });

    const result: InitializeResult = {
        capabilities: {
            textDocumentSync: TextDocumentSyncKind.Full,
            // Tell the client that this server supports code completion.
            completionProvider: {
                resolveProvider: true,
            },
            hoverProvider: true,
            declarationProvider: true,
            referencesProvider: true,
            definitionProvider: true,
            // diagnosticProvider: {
            //     interFileDependencies: false,
            //     workspaceDiagnostics: false
            // }
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

    // Revalidate all open text documents
    documents.all().forEach(textDocument => validateTextDocument(connection, textDocument, documentSettings));
}

connection.onDidChangeTextDocument((params: DidChangeTextDocumentParams) => {
    // TODO: Diagnostiscs might get a bit mis-aligned
    console.log("OnDidChangeTextDocument");
    const docRef = params.textDocument;
    const changes = params.contentChanges;
    const textDoc = documents.get(docRef.uri);
    if (!textDoc) return;

    const updatedDoc = TextDocument.update(textDoc, changes, textDoc?.version ?? 0 + 1);

    validateTextDocument(connection, textDoc, documentSettings);

    const fileName = params.textDocument.uri.replace("file://", "");
    const languageService = getLanguageService(fileName, updatedDoc.getText());
    const diagnostics = languageService?.getSemanticDiagnostics(fileName);
    const sendableDiagnostics: Array<Diagnostic> = diagnostics?.map(tsDiagnosticToDiagnostic)
        .filter((diag): diag is Diagnostic => diag !== undefined) ?? []; // Stupid ts types

    connection.sendDiagnostics({ uri: updatedDoc.uri, diagnostics: sendableDiagnostics });
});
