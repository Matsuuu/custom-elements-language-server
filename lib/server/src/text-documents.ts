import { TextDocument } from "vscode-languageserver-textdocument";
import tss from "typescript/lib/tsserverlibrary.js";
import url from "url";
import { getCapabilities, getGlobalSettings, LanguageServerSettings } from "./settings.js";
import { TextDocuments, _Connection } from "vscode-languageserver";
import { getProjectForCurrentContext, getProjectForCurrentFile, refreshLanguageServiceForFile } from "./language-services/language-services.js";
import { runDiagnostics } from "./diagnostics.js";
import { connection } from "./connection.js";
import { textDocumentDataToUsableDataFromUri, UsableTextDocumentData } from "./transformers.js";
import { refreshCEMData } from "custom-elements-languageserver-core";
import { Logger, LogLevel } from "custom-elements-languageserver-core/src/logger/logger.js";

export const documentSettings = new Map<string, LanguageServerSettings>();
export let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

function refreshCEM(usableData: UsableTextDocumentData) {
    refreshLanguageServiceForFile(usableData.fileName, usableData.fileContent);
    const project = getProjectForCurrentContext(usableData.fileName, usableData.fileContent);

    if (project) {
        refreshCEMData(project.getCurrentDirectory());
    }
}

export function initDocuments() {
    Logger.log({ message: "Initializing documents", level: LogLevel.DEBUG });
    documents = new TextDocuments(TextDocument);
    // Only keep settings for open documents
    documents.listen(connection);

    documents.onDidSave(async (e) => {
        const usableData = textDocumentDataToUsableDataFromUri(documents, e.document.uri);
        refreshCEM(usableData);
        runDiagnostics(e.document.uri, e.document);
    })


    documents.onDidClose(e => {
        documentSettings.delete(e.document.uri);
    });

    documents.onDidOpen(async (e) => {
        const usableData = textDocumentDataToUsableDataFromUri(documents, e.document.uri);
        refreshCEM(usableData);
        runDiagnostics(e.document.uri, e.document);
    });
}

export function scanDocument(uri: string): TextDocument {
    if (uri.startsWith("file://")) {
        uri = url.fileURLToPath(uri);
    }
    const languageId = uri.split(".").slice(-1)[0];
    const content = tss.sys.readFile(uri, "utf8") ?? "";
    return TextDocument.create(uri, languageId, 0, content);
}

export async function getDocumentSettings(connection: _Connection, resource: string): Promise<LanguageServerSettings> {
    if (!getCapabilities().hasConfigurationCapability) {
        return Promise.resolve(getGlobalSettings());
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
