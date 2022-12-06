import { TextDocument } from "vscode-languageserver-textdocument";
import tss from "typescript/lib/tsserverlibrary.js";
import { getCapabilities, getGlobalSettings, LanguageServerSettings } from "./settings.js";
import { TextDocuments, _Connection } from "vscode-languageserver";

export const documentSettings = new Map<string, LanguageServerSettings>();
export const documents: TextDocuments<TextDocument> = new TextDocuments(TextDocument);

export function scanDocument(uri: string): TextDocument {
    const languageId = "ts"; // TODO
    const content = tss.sys.readFile(uri, "utf8") ?? '';
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

