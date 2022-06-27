import {
    CompletionItem,
    CompletionItemKind,
    createConnection,
    Diagnostic,
    DiagnosticSeverity,
    DidChangeConfigurationNotification,
    DidChangeConfigurationParams,
    DidChangeTextDocumentParams,
    InitializeParams,
    InitializeResult,
    ProposedFeatures,
    TextDocumentItem,
    TextDocumentPositionParams,
    TextDocuments,
    TextDocumentSyncKind,
    VersionedTextDocumentIdentifier,
} from "vscode-languageserver/node.js";

import { TextDocument } from "vscode-languageserver-textdocument";
import { getCompletionItemInfo, getCompletionItems } from "./completion";

interface LanguageServerSettings { }

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

let defaultSettings: LanguageServerSettings = {};
let globalSettings: LanguageServerSettings = defaultSettings;

const documentSettings = new Map<string, LanguageServerSettings>();
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
        globalSettings = <LanguageServerSettings>(
            (change.settings.languageServerExample || defaultSettings)
        );
    }

    // Revalidate all open text documents
    documents.all().forEach(validateTextDocument);
}

async function getDocumentSettings(
    resource: string
): Promise<LanguageServerSettings> {
    if (!hasConfigurationCapability) {
        return Promise.resolve(globalSettings);
    }
    let result = documentSettings.get(resource);
    if (!result) {
        result = connection.workspace.getConfiguration({
            scopeUri: resource,
            section: "customElementsLanguageServer",
        });
        documentSettings.set(resource, result);
    }
    return result;
}

async function validateTextDocument(textDocument: TextDocument): Promise<void> {
    console.log("ValidateTextDocument");
    // In this simple example we get the settings for every validate run.
    let settings = await getDocumentSettings(textDocument.uri);

    // The validator creates diagnostics for all uppercase words length 2 and more
    let text = textDocument.getText();
    let pattern = /<[^\/].*?-.*?>/g; // Starting html tag with dash
    let m: RegExpExecArray | null;

    let diagnostics: Diagnostic[] = [];
    while ((m = pattern.exec(text))) {
        console.log("Mathes: ", m);
        let diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Warning,
            range: {
                start: textDocument.positionAt(m.index),
                end: textDocument.positionAt(m.index + m[0].length),
            },
            message: `${m[0]} is a Custom Element!`,
            source: "Custom Elements Language Service",
        };
        if (hasDiagnosticRelatedInformationCapability) {
            diagnostic.relatedInformation = [
                {
                    location: {
                        uri: textDocument.uri,
                        range: Object.assign({}, diagnostic.range),
                    },
                    message: "This is pretty neat",
                },
                {
                    location: {
                        uri: textDocument.uri,
                        range: Object.assign({}, diagnostic.range),
                    },
                    message: "2022 year of Custom Element LSP",
                },
            ];
        }
        diagnostics.push(diagnostic);
    }

    // Send the computed diagnostics to VS Code.
    connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
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

    validateTextDocument(textDoc);
});
