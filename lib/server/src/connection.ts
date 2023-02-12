import { createConnection, DidChangeConfigurationNotification, DidChangeConfigurationParams, InitializeParams, InitializeResult, ProposedFeatures, TextDocumentSyncKind, WorkspaceFolder } from "vscode-languageserver/node.js";
import { DEFAULT_SETTINGS, LanguageServerSettings, setCapabilities, setGlobalSettings } from "./settings";
import { documentSettings, initDocuments } from "./text-documents";
import { uriToFileName } from "./transformers";
import fs from "fs";
import path from "path";
import { updateLanguageServiceForFile } from "./language-services/language-services";

export let connection = createConnection(ProposedFeatures.all);

export function initConnection() {
    connection = createConnection(ProposedFeatures.all);

    connection.onInitialize(onInitialize);
    connection.onInitialized(onInitialized);
    connection.onDidChangeConfiguration(onDidChangeConfiguration);
    connection.onDidChangeWatchedFiles(_change => {
        console.log("File changed");
    });

    // Listen on the connection
    connection.listen();
    initDocuments();
}

let hasConfigurationCapability: boolean = false;
let hasWorkspaceFolderCapability: boolean = false;
let hasDiagnosticRelatedInformationCapability: boolean = false;


// Make the text document manager listen on the connection
// for open, change and close text document events
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
                // resolveProvider: true,
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

    initializeProjectsInWorkSpaceFolders(params.workspaceFolders || []);

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
            // TODO
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



interface PackageJsonLike {
    main: string;
    module: string;
}

async function initializeProjectsInWorkSpaceFolders(workspaceFolders: WorkspaceFolder[]) {
    workspaceFolders?.forEach(workSpaceFolder => {
        let fileName = uriToFileName(workSpaceFolder.uri);
        const packageJsonPath = fileName + "/package.json";
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as PackageJsonLike;
                const mainFileName = packageJson.main ?? packageJson.module;
                const mainFilePath = path.resolve(fileName, mainFileName);
                updateLanguageServiceForFile(mainFilePath, undefined);
            } catch (ex) {
                console.warn("Couldn't open project " + fileName, ex);
            }
        }
    })
}

