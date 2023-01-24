import { CODE_ACTIONS } from "html-template-literal-tsserver-plugin";
import tss from "typescript/lib/tsserverlibrary.js";
import { CodeAction, CodeActionParams, Diagnostic, Range, WorkspaceEdit } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { offsetToPosition } from "../transformers.js";

export function getCodeActionsForParams(params: CodeActionParams, textDoc: TextDocument) {
    const codeActions: Array<CodeAction> = [];

    for (const diagnostic of params.context.diagnostics) {
        if (diagnostic.source !== "Custom Elements Language Server") {
            continue;
        }

        switch (diagnostic.code) {
            case CODE_ACTIONS.IMPORT:
                codeActions.push(generateImportCodeAction(diagnostic, params, textDoc))
        }
    }

    return codeActions;
}

function generateImportCodeAction(diagnostic: Diagnostic, params: CodeActionParams, textDoc: TextDocument) {
    // TODO: Make type safe
    const diagnosticData = diagnostic.data[0] as tss.DiagnosticRelatedInformation;

    const importPositionOffset = diagnosticData.start ?? 0;
    const messageText = diagnosticData.messageText as string;

    const workSpaceEdit: WorkspaceEdit = {
        changes: {
            [params.textDocument.uri]: [
                {
                    range: Range.create(offsetToPosition(textDoc, importPositionOffset), offsetToPosition(textDoc, importPositionOffset)),
                    newText: messageText
                }
            ]
        }
    }
    const packagePath = messageText.match(/\".*\"/);

    return {
        title: `Import component from ${packagePath}`,
        edit: workSpaceEdit
    };
}
