import { getImportDiagnostics, getMissingCloseTagDiagnostics } from "custom-elements-languageserver-core";
import ts from "typescript";
import url from "url";
import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { connection } from "./connection";
import { getLanguageService } from "./language-services/language-services";
import { textDocumentToUsableData, tsDiagnosticToDiagnostic } from "./transformers";
import { createCustomElementsLanguageServiceRequestFromQueryData } from "./language-services/request";
import { generateLanguageServiceQueryDataForDiagnostics } from "./handlers/handler-helper";

export async function runDiagnostics(uri: string, textDoc: TextDocument) {
    handleDiagnostics(uri, textDoc);
}

function handleDiagnostics(uri: string, textDoc: TextDocument) {
    const fileName = url.fileURLToPath(uri);
    const usableData = textDocumentToUsableData(textDoc);
    const queryData = generateLanguageServiceQueryDataForDiagnostics(usableData, textDoc.uri);

    if (!queryData.isValid) {
        return;
    }

    const request = createCustomElementsLanguageServiceRequestFromQueryData(queryData);

    const importDiagnostics = getImportDiagnostics(request);
    const nonClosedTagDiagnostics = getMissingCloseTagDiagnostics(0, request);

    // TODO: Filter diagnostics calls by filetype. No need for imports for md etc.? Or is there?
    const diagnostics = [...importDiagnostics, ...nonClosedTagDiagnostics];

    try {
        const sendableDiagnostics: Array<Diagnostic> = diagnostics
            ?.map((diag: ts.Diagnostic) => tsDiagnosticToDiagnostic(diag, textDoc))
            .filter((diag: unknown): diag is Diagnostic => diag !== undefined) ?? [];

        connection.sendDiagnostics({ uri: textDoc.uri, diagnostics: sendableDiagnostics });
    } catch (ex) { }
}
