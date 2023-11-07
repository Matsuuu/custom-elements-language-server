import { getImportDiagnostics, getMissingCloseTagDiagnostics } from "custom-elements-languageserver-core";
import ts from "typescript";
import url from "url";
import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { connection } from "./connection";
import { textDocumentToUsableData, tsDiagnosticToDiagnostic } from "./transformers";
import { createCustomElementsLanguageServiceRequestFromQueryData } from "./language-services/request";
import { generateLanguageServiceQueryDataForDiagnostics } from "./handlers/handler-helper";

const DISABLE_FLAGS = {
    DISABLE_ALL: "cels-disable-diagnostics",
    DISABLE_MISSING_CLOSED: "cels-disable-missing-closed",
    DISABLE_IMPORT_CHECK: "cels-disable-import-check"
}

export async function runDiagnostics(uri: string, textDoc: TextDocument) {
    handleDiagnostics(uri, textDoc);
}

function handleDiagnostics(uri: string, textDoc: TextDocument) {
    const fileName = url.fileURLToPath(uri);
    const usableData = textDocumentToUsableData(textDoc);
    const queryData = generateLanguageServiceQueryDataForDiagnostics(usableData, textDoc.uri);
    const text = textDoc.getText();
    const disableDiagnostics = text.includes(DISABLE_FLAGS.DISABLE_ALL);


    if (disableDiagnostics) {
        connection.sendDiagnostics({ uri: textDoc.uri, diagnostics: [] });
        return;
    }

    if (!queryData.isValid) {
        return;
    }

    const request = createCustomElementsLanguageServiceRequestFromQueryData(queryData);

    let diagnostics: ts.Diagnostic[] = [];

    if (!text.includes(DISABLE_FLAGS.DISABLE_MISSING_CLOSED)) {
        diagnostics = [...diagnostics, ...getMissingCloseTagDiagnostics(request)];
    }
    if (!text.includes(DISABLE_FLAGS.DISABLE_IMPORT_CHECK)) {
        diagnostics = [...diagnostics, ...getImportDiagnostics(request)];
    }

    try {
        const sendableDiagnostics: Array<Diagnostic> = diagnostics
            ?.map((diag: ts.Diagnostic) => tsDiagnosticToDiagnostic(diag, textDoc))
            .filter((diag: unknown): diag is Diagnostic => diag !== undefined) ?? [];

        connection.sendDiagnostics({ uri: textDoc.uri, diagnostics: sendableDiagnostics });
    } catch (ex) { }
}
