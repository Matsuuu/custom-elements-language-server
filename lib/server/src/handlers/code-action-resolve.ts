import { CodeAction } from "vscode-languageserver";
import { runDiagnostics } from "../diagnostics";
import { documents } from "../text-documents";

export function codeActionResolveHandler(codeAction: CodeAction): CodeAction {
    // TODO: What do we want to do here?
    const edit = codeAction.edit;
    if (edit && edit.changes) {
        const files = Object.keys(edit.changes);
        for (const file of files) {
            const textDoc = documents.get(file);
            if (!textDoc) continue;

            runDiagnostics(file, textDoc);
        }
    }

    return codeAction;
}
