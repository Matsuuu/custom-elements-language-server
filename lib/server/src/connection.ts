import { createConnection, DidChangeConfigurationNotification, DidChangeConfigurationParams, InitializeParams, InitializeResult, ProposedFeatures, TextDocumentSyncKind, WorkspaceFolder } from "vscode-languageserver";
import { DEFAULT_SETTINGS, LanguageServerSettings, setCapabilities, setGlobalSettings } from "./settings";
import { documentSettings, initDocuments } from "./text-documents";
import fs from "fs";
import path from "path";
import url from "url";
import { updateLanguageServiceForFile } from "./language-services/language-services";

// @ts-ignore
export let connection = createConnection(ProposedFeatures.all);

export function initConnection() {
    console.log("Initializing connection");
    // @ts-ignore
    connection = createConnection(ProposedFeatures.all);

    connection.onInitialize(onInitialize);
    connection.onInitialized(onInitialized);
    connection.onDidChangeConfiguration(onDidChangeConfiguration);
    connection.onDidChangeWatchedFiles(_change => {
        //
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
    console.log("Connection initialized");
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
    console.log("Initializing workspaces.");
    workspaceFolders?.forEach(workSpaceFolder => {
        console.log("Initializing workspace " + workSpaceFolder.name + " @ " + decodeURI(workSpaceFolder.uri));
        let fileName = url.fileURLToPath(workSpaceFolder.uri);
        const packageJsonPath = path.resolve(fileName, "package.json");
        console.log("Package JSON path ", packageJsonPath);
        if (fs.existsSync(packageJsonPath)) {
            try {
                const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as PackageJsonLike;
                const mainFileName = packageJson.main ?? packageJson.module;
                if (mainFileName) {
                    const mainFilePath = path.resolve(fileName, mainFileName);
                    updateLanguageServiceForFile(mainFilePath, undefined);
                } else {
                    console.warn("Could not find a main or module file");
                }
            } catch (ex) {
                console.warn("Couldn't open project " + fileName, ex);
            }
        } else {
            console.warn("Did not find package.json for project");
        }
    })
}

