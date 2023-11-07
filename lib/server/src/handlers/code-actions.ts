import { CODE_ACTIONS } from "custom-elements-languageserver-core";
import tss from "typescript/lib/tsserverlibrary.js";
import { CodeAction, CodeActionParams, Diagnostic, Range, WorkspaceEdit } from "vscode-languageserver";
import { TextDocument } from "vscode-languageserver-textdocument";
import { documents } from "../text-documents.js";
import { offsetToPosition } from "../transformers.js";

export function codeActionHandler(codeActionParams: CodeActionParams): CodeAction[] {
    const doc = codeActionParams.textDocument;
    const textDoc = documents.get(doc.uri);
    if (!textDoc) {
        return [];
    }

    return getCodeActionsForParams(codeActionParams, textDoc);
}

export function getCodeActionsForParams(params: CodeActionParams, textDoc: TextDocument) {
    const codeActions: Array<CodeAction> = [];

    for (const diagnostic of params.context.diagnostics) {
        if (diagnostic.source !== "Custom Elements Language Server") {
            continue;
        }

        switch (diagnostic.code) {
            case CODE_ACTIONS.IMPORT:
                codeActions.push(generateImportCodeAction(diagnostic, params, textDoc));
                break;
            case CODE_ACTIONS.CLOSE_TAG:
                codeActions.push(generateCloseTagCodeAction(diagnostic, params, textDoc));
                break;
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


function generateCloseTagCodeAction(diagnostic: Diagnostic, params: CodeActionParams, textDoc: TextDocument) {
    // TODO: Make type safe
    const diagnosticData = diagnostic.data[0] as tss.DiagnosticRelatedInformation;

    const tagPositionOffset = diagnosticData.start ?? 0;
    const messageText = diagnosticData.messageText as string;
    // TODO: Figure a better way to pass this info between these layers. Maybe more 
    // DiagnosticRelatedInformation objects with one for the message and one for 
    // the actual payload
    const tag = messageText.substring(messageText.indexOf("<"), messageText.indexOf(">") + 1);

    const workSpaceEdit: WorkspaceEdit = {
        changes: {
            [params.textDocument.uri]: [
                {
                    range: Range.create(offsetToPosition(textDoc, tagPositionOffset), offsetToPosition(textDoc, tagPositionOffset)),
                    newText: tag
                }
            ]
        }
    }

    return {
        title: messageText,
        edit: workSpaceEdit
    };
}
