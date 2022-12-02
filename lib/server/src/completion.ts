import { CompletionItem, CompletionItemKind, CompletionList, TextDocumentPositionParams } from "vscode-languageserver/node.js";
import { documents } from "./settings.js";
import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";
import { getLanguageService } from "./language-services/language-services.js";

function wait(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCompletionItems(textDocumentPosition: TextDocumentPositionParams): Promise<CompletionList> {
    // TODO: Get rid of this wait
    await wait(50); // Wait for the documents to update
    console.log("On Completion");
    const doc = documents.get(textDocumentPosition.textDocument.uri);
    if (!doc) return CompletionList.create();

    const fileName = doc.uri.replace("file://", "");

    const languageServiceTools = getLanguageService(fileName, doc.getText());
    const p = languageServiceTools?.project;
    // @ts-ignore
    const a = p?.getSourceFile(fileName);
    const b = p?.readFile(fileName);

    debugger;

    const completionsOpts: ts.GetCompletionsAtPositionOptions = {};
    const completions = languageServiceTools?.languageService?.getCompletionsAtPosition(fileName, doc.offsetAt(textDocumentPosition.position), completionsOpts);

    return completionsToList(completions);
}

function completionsToList(completions: ts.WithMetadata<ts.CompletionInfo> | undefined) {
    if (!completions) return CompletionList.create();
    return CompletionList.create(completions.entries.map(completionEntryToCompletionItem));
}

function completionEntryToCompletionItem(completionsEntry: ts.CompletionEntry): CompletionItem {
    // TODO: Fill the rest
    return {
        label: completionsEntry.name,
        kind: CompletionItemKind.Class
    }
}
/*

export interface CompletionItem {
    label: string;
    labelDetails?: CompletionItemLabelDetails;
    kind?: CompletionItemKind;
    tags?: CompletionItemTag[];
    detail?: string;
    documentation?: string | MarkupContent;
    preselect?: boolean;
    sortText?: string;
    filterText?: string;
    insertText?: string;
    insertTextFormat?: InsertTextFormat;
    insertTextMode?: InsertTextMode;
    textEdit?: TextEdit | InsertReplaceEdit;
    textEditText?: string;
    additionalTextEdits?: TextEdit[];
    commitCharacters?: string[];
    command?: Command;
   data?: LSPAny;
}
    */

export function getCompletionItemInfo(item: CompletionItem): CompletionItem {
    if (item.data === 1) {
        item.detail = "TypeScript details";
        item.documentation = "TypeScript documentation";
    } else if (item.data === 2) {
        item.detail = "JavaScript details";
        item.documentation = "JavaScript documentation";
    }
    return item;
}
