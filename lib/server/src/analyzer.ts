import { TextDocument } from "vscode-languageserver-textdocument";
import { Diagnostic, DiagnosticSeverity, _Connection } from "vscode-languageserver/node.js";
import { documentSettings, getCapabilities, getGlobalSettings, LanguageServerSettings } from "./settings.js";

export async function validateTextDocument(connection: _Connection, textDocument: TextDocument, documentSettings: Map<string, LanguageServerSettings>): Promise<void> {
    // In this simple example we get the settings for every validate run.
    let settings = await getDocumentSettings(it(100)zzconnection, textDocument.uri);

    // The validator creates diagnostics for all uppercase words length 2 and more
    let text = textDocument.getText();
    let pattern = /<[^\/].*?-.*?>/g; // Starting html tag with dash
    let m: RegExpExecArray | null;

    let diagnostics: Diagnostic[] = [];
    while ((m = pattern.exec(text))) {
        let diagnostic: Diagnostic = {
            severity: DiagnosticSeverity.Warning,
            range: {
                start: textDocument.positionAt(m.index),
                end: textDocument.positionAt(m.index + m[0].length),
            },
            message: `${m[0]} is a Custom Element!`,
            source: "Custom Elements Language Service",
        };
        if (getCapabilities().hasDiagnosticRelatedInformationCapability) {
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

