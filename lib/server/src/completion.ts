import { CompletionItem, CompletionItemKind, CompletionList, TextDocumentPositionParams } from "vscode-languageserver/node";
import { initParser } from "./astparser/parser.js";
import { documents } from "./settings.js";
import * as ts from "typescript";

function wait(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCompletionItems(textDocumentPosition: TextDocumentPositionParams): Promise<CompletionList> {
    await wait(50); // Wait for the documents to update
    console.log("On Completion");
    const doc = documents.get(textDocumentPosition.textDocument.uri);
    if (!doc) return CompletionList.create();

    // This code is butchered just to test out some of the plugin stuff. Nothing here should be saved
    const files = documents.all().map(d => d.uri);
    const parser = initParser(files);
    parser.parseFile(doc.uri);
    console.log("Parsed nodes");
    const map = new Map<string, string>();
    map.set(doc.uri, doc.getText());
    const fileName = doc.uri.replace("file://", "");

    const completionsOpts: ts.GetCompletionsAtPositionOptions = {};
    const completions = parser.languageService?.getCompletionsAtPosition(fileName, doc.offsetAt(textDocumentPosition.position), completionsOpts);


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
