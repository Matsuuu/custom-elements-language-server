import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { connection } from "./connection";
import { isJavascriptFile } from "./handlers/handler";
import { getLanguageService } from "./language-services/language-services";
import { tsDiagnosticToDiagnostic, uriToFileName } from "./transformers";

export async function runDiagnostics(uri: string, textDoc: TextDocument) {

    if (!isJavascriptFile(uri)) {
        return; // TODO. Implement for html files too
    }
    const fileName = uriToFileName(uri);
    const languageService = getLanguageService(fileName, textDoc.getText());

    const diagnostics = languageService?.getSemanticDiagnostics(fileName);
    const sendableDiagnostics: Array<Diagnostic> = diagnostics?.map((diag: ts.Diagnostic) => tsDiagnosticToDiagnostic(diag, textDoc))
        .filter((diag: unknown): diag is Diagnostic => diag !== undefined) ?? []; // Stupid ts types

    connection.sendDiagnostics({ uri: textDoc.uri, diagnostics: sendableDiagnostics });
}

