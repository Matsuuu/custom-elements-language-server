import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { getMissingCloseTagDiagnostics } from "html-template-literal-tsserver-plugin";
import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { connection } from "./connection";
import { isJavascriptFile } from "./handlers/handler";
import { getLanguageService } from "./language-services/language-services";
import { documents } from "./text-documents";
import { textDocumentDataToUsableData, tsDiagnosticToDiagnostic, uriToFileName } from "./transformers";

export async function runDiagnostics(uri: string, textDoc: TextDocument) {
    if (isJavascriptFile(uri)) {
        handleJavascriptDiagnostics(uri, textDoc);
    } else {
        handleHTMLOrOtherFileDiagnostics(uri, textDoc);
    }
}

function handleJavascriptDiagnostics(uri: string, textDoc: TextDocument) {
    const fileName = uriToFileName(uri);
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
    const fileName = uriToFileName(uri);
    const languageService = HTMLLanguageService.getLanguageService();

    const missingTagDiagnostics = getMissingCloseTagDiagnostics(fileName, textDoc, languageService, 0);

    const diagnostics = [
        ...missingTagDiagnostics
    ];

    const sendableDiagnostics: Array<Diagnostic> = diagnostics?.map((diag: ts.Diagnostic) => tsDiagnosticToDiagnostic(diag, textDoc))
        .filter((diag: unknown): diag is Diagnostic => diag !== undefined) ?? []; // Stupid ts types

    connection.sendDiagnostics({ uri: textDoc.uri, diagnostics: sendableDiagnostics });
}
