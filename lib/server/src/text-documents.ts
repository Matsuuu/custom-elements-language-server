import { TextDocument } from "vscode-languageserver-textdocument";
import tss from "typescript/lib/tsserverlibrary.js";
import { getCapabilities, getGlobalSettings, LanguageServerSettings } from "./settings.js";
import { TextDocuments, _Connection } from "vscode-languageserver";
import { isJavascriptFile } from "./handlers/handler.js";
import { updateLanguageServiceForFile } from "./language-services/language-services.js";
import { runDiagnostics } from "./diagnostics.js";
import { connection } from "./connection.js";

export const documentSettings = new Map<string, LanguageServerSettings>();
export let documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

export function initDocuments() {
    documents = new TextDocuments(TextDocument);
    // Only keep settings for open documents
    documents.listen(connection);


    documents.onDidClose(e => {
        documentSettings.delete(e.document.uri);
    });

    documents.onDidOpen(e => {
        const fileName = e.document.uri.replace("file://", "");
        if (isJavascriptFile(e.document.uri)) {
            updateLanguageServiceForFile(fileName, e.document.getText());
        }

        runDiagnostics(e.document.uri, e.document);
    });
}

export function scanDocument(uri: string): TextDocument {
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
