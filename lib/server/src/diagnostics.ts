import { getImportDiagnostics, getMissingCloseTagDiagnostics } from "custom-elements-languageserver-core";
import ts from "typescript";
import url from "url";
import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { connection } from "./connection";
import { isJavascriptFile } from "./handlers/handler";
import { getLanguageService } from "./language-services/language-services";
import { textDocumentDataToUsableDataFromUri, textDocumentToUsableData, tsDiagnosticToDiagnostic } from "./transformers";
import { createCustomElementsLanguageServiceRequestFromQueryData } from "./language-services/request";
import { documents } from "./text-documents";
import { generateLanguageServiceQueryDataForDiagnostics } from "./handlers/handler-helper";

export async function runDiagnostics(uri: string, textDoc: TextDocument) {
    if (isJavascriptFile(uri)) {
        handleJavascriptDiagnostics(uri, textDoc);
    } else {
        handleHTMLOrOtherFileDiagnostics(uri, textDoc);
    }
}

function handleJavascriptDiagnostics(uri: string, textDoc: TextDocument) {
    const fileName = url.fileURLToPath(uri);
    const languageService = getLanguageService(fileName, textDoc.getText());
    const usableData = textDocumentToUsableData(textDoc);
    const queryData = generateLanguageServiceQueryDataForDiagnostics(usableData, textDoc.uri);

    try {
        let diagnostics = languageService?.getSemanticDiagnostics(fileName);
        if (diagnostics === undefined) {
            if (queryData.isValid) {
                const request = createCustomElementsLanguageServiceRequestFromQueryData(queryData);

                const importDiagnostics = getImportDiagnostics(request);
                const nonClosedTagDiagnostics = getMissingCloseTagDiagnostics(0, request);

                diagnostics = [...importDiagnostics, ...nonClosedTagDiagnostics];
            }
        }
        const sendableDiagnostics: Array<Diagnostic> = diagnostics
            ?.map((diag: ts.Diagnostic) => tsDiagnosticToDiagnostic(diag, textDoc))
            .filter((diag: unknown): diag is Diagnostic => diag !== undefined) ?? [];

        connection.sendDiagnostics({ uri: textDoc.uri, diagnostics: sendableDiagnostics });
    } catch (ex) {

    }

}

function handleHTMLOrOtherFileDiagnostics(uri: string, textDoc: TextDocument) {
    const usableData = textDocumentDataToUsableDataFromUri(documents, uri);
    const queryData = generateLanguageServiceQueryDataForDiagnostics(usableData, textDoc.uri);
    if (!queryData.isValid) {
        return;
    }

    const request = createCustomElementsLanguageServiceRequestFromQueryData(queryData);

    const missingTagDiagnostics = getMissingCloseTagDiagnostics(0, request);

    const diagnostics = [
        ...missingTagDiagnostics
    ];

    const sendableDiagnostics: Array<Diagnostic> = diagnostics?.map((diag: ts.Diagnostic) => tsDiagnosticToDiagnostic(diag, textDoc))
        .filter((diag: unknown): diag is Diagnostic => diag !== undefined) ?? []; // Stupid ts types

    connection.sendDiagnostics({ uri: textDoc.uri, diagnostics: sendableDiagnostics });
}
