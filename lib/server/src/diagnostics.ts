import { getMissingCloseTagDiagnostics } from "custom-elements-languageserver-core";
import ts from "typescript";
import url from "url";
import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { connection } from "./connection";
import { isJavascriptFile } from "./handlers/handler";
import { getLanguageService, getProjectBasePath, getProjectForCurrentFile } from "./language-services/language-services";
import { textDocumentDataToUsableDataFromUri, tsDiagnosticToDiagnostic } from "./transformers";
import { createCustomElementsLanguageServiceRequest } from "./language-services/request";
import { documents } from "./text-documents";

export async function runDiagnostics(uri: string, textDoc: TextDocument) {
    console.log("Running diagnostics for ", uri);
    if (isJavascriptFile(uri)) {
        handleJavascriptDiagnostics(uri, textDoc);
    } else {
        handleHTMLOrOtherFileDiagnostics(uri, textDoc);
    }
}

function handleJavascriptDiagnostics(uri: string, textDoc: TextDocument) {
    const fileName = url.fileURLToPath(uri);
    const languageService = getLanguageService(fileName, textDoc.getText());

    try {
        const diagnostics = languageService?.getSemanticDiagnostics(fileName);
        const sendableDiagnostics: Array<Diagnostic> = diagnostics?.map((diag: ts.Diagnostic) => tsDiagnosticToDiagnostic(diag, textDoc))
            .filter((diag: unknown): diag is Diagnostic => diag !== undefined) ?? []; // Stupid ts types

        connection.sendDiagnostics({ uri: textDoc.uri, diagnostics: sendableDiagnostics });
    } catch (ex) {

    }

}

function handleHTMLOrOtherFileDiagnostics(uri: string, textDoc: TextDocument) {
    const usableData = textDocumentDataToUsableDataFromUri(documents, uri);
    const doc = documents.get(uri);

    const project = getProjectForCurrentFile(usableData.fileName, usableData.fileContent);
    const basePath = getProjectBasePath(usableData.fileName);

    if (!doc || !project) {
        return;
    }

    const request = createCustomElementsLanguageServiceRequest(usableData.fileName, basePath, doc, { line: 0, character: 0 }, project);

    const missingTagDiagnostics = getMissingCloseTagDiagnostics(0, request);

    const diagnostics = [
        ...missingTagDiagnostics
    ];

    const sendableDiagnostics: Array<Diagnostic> = diagnostics?.map((diag: ts.Diagnostic) => tsDiagnosticToDiagnostic(diag, textDoc))
        .filter((diag: unknown): diag is Diagnostic => diag !== undefined) ?? []; // Stupid ts types

    connection.sendDiagnostics({ uri: textDoc.uri, diagnostics: sendableDiagnostics });
}
