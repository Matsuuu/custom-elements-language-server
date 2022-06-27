import {
    createConnection,
    DidChangeConfigurationNotification,
    DidChangeConfigurationParams,
    DidChangeTextDocumentParams,
    InitializeParams,
    InitializeResult,
    ProposedFeatures,
    TextDocuments,
    TextDocumentSyncKind,
} from "vscode-languageserver/node.js";

import { TextDocument } from "vscode-languageserver-textdocument";
import { getCompletionItemInfo, getCompletionItems } from "./completion";
import { validateTextDocument } from "./analyzer";
import { DEFAULT_SETTINGS, documentSettings, LanguageServerSettings, setCapabilities, setGlobalSettings } from "./settings";

/**
 * ==============================================================================================0
 *
 * Quite a lot of this file's code is set up following the extension guide from visual studio code docs.
 * This  is just to provide a PoC before actually going head deep into development
 *
 * ==============================================================================================0
 */

const connection = createConnection(ProposedFeatures.all);
const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

// Only keep settings for open documents
documents.onDidClose((e) => {
    documentSettings.delete(e.document.uri);
});

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;

connection.onInitialize(onInitialize);
connection.onInitialized(onInitialized);
connection.onDidChangeConfiguration(onDidChangeConfiguration);
connection.onDidChangeWatchedFiles((_change) => {
    console.log("File changed");
    // Monitored files have change in VS Code
    connection.console.log("We received a file change event");
});
// This handler provides the initial list of the completion items.
connection.onCompletion(getCompletionItems);
// This handler resolves additional information for the item selected in
// the completion list.
connection.onCompletionResolve(getCompletionItemInfo);

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

    setCapabilities({
        hasConfigurationCapability,
        hasWorkspaceFolderCapability,
        hasDiagnosticRelatedInformationCapability
    })

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
}

function onInitialized() {
    console.log("Initialized");
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

}

function onDidChangeConfiguration(change: DidChangeConfigurationParams) {
    console.log("onDidChangeConfiguration");
    if (hasConfigurationCapability) {
        // Reset all cached document settings
        documentSettings.clear();
    } else {
        setGlobalSettings(<LanguageServerSettings>(
            (change.settings.languageServerExample || DEFAULT_SETTINGS)
        ));
    }

    // Revalidate all open text documents
    documents.all().forEach(textDocument => validateTextDocument(connection, textDocument, documentSettings));
}


/*connection.onDidOpenTextDocument((params) => {
    console.log("OnDidOpenTextDocument");
    console.log(params);
    const textDocItem: TextDocumentItem = params.textDocument;

    const textDoc = TextDocument.create(
        textDocItem.uri, 
        textDocItem.languageId,
        textDocItem.version,
        textDocItem.text
    );

    validateTextDocument(textDoc);
});*/

connection.onDidChangeTextDocument((params: DidChangeTextDocumentParams) => {
    console.log("OnDidChangeTextDocument");
    const docRef = params.textDocument;
    const changes = params.contentChanges;
    const textDoc = documents.get(docRef.uri);
    if (!textDoc) return;

    console.log("Found text doc: ", textDoc);
    const updatedDoc = TextDocument.update(textDoc, changes, textDoc?.version ?? 0 + 1);
    console.log("Updated doc", updatedDoc);

    validateTextDocument(connection, textDoc, documentSettings);
});
