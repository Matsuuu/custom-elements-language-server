import { Diagnostic } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { isJavascriptFile } from "./handlers/handler";
import { getLanguageService } from "./language-services/language-services";
import { tsDiagnosticToDiagnostic } from "./transformers";

export async function runDiagnostics(uri: string, textDoc: TextDocument) {

    if (!isJavascriptFile(uri)) {
        return; // TODO. Implement for html files too
    }
    const fileName = uri.replace("file://", "");
    const languageService = getLanguageService(fileName, textDoc.getText());

    const diagnostics = languageService?.getSemanticDiagnostics(fileName);
    const sendableDiagnostics: Array<Diagnostic> = diagnostics?.map((diag: ts.Diagnostic) => tsDiagnosticToDiagnostic(diag, textDoc))
        .filter((diag: unknown): diag is Diagnostic => diag !== undefined) ?? []; // Stupid ts types

    connection.sendDiagnostics({ uri: textDoc.uri, diagnostics: sendableDiagnostics });
}
