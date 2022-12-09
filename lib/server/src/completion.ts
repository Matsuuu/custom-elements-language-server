import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";
import {
    CompletionItem,
    CompletionItemKind,
    CompletionList,
    TextDocumentPositionParams
} from "vscode-languageserver/node.js";

import { getLanguageService } from "./language-services/language-services.js";
import { documents } from "./text-documents.js";

function wait(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCompletionItems(
    textDocumentPosition: TextDocumentPositionParams): Promise<CompletionList> {
    // TODO: Get rid of this wait
    await wait(50); // Wait for the documents to update
    console.log("On Completion");
    const doc = documents.get(textDocumentPosition.textDocument.uri);
    if (!doc)
        return CompletionList.create();

    const fileName = doc.uri.replace("file://", "");

    const languageService = getLanguageService(fileName, doc.getText());

    const completionsOpts: ts.GetCompletionsAtPositionOptions = {};
    const completions = languageService?.getCompletionsAtPosition(
        fileName, doc.offsetAt(textDocumentPosition.position), completionsOpts);

    return completionsToList(completions);
}

function completionsToList(completions: ts.WithMetadata<ts.CompletionInfo> |
    undefined) {
    if (!completions)
        return CompletionList.create();
    return CompletionList.create(
        completions.entries.map(completionEntryToCompletionItem));
}

function completionEntryToCompletionItem(completionsEntry: ts.CompletionEntry):
    CompletionItem {
    // TODO: Fill the rest
    return { label: completionsEntry.name, kind: CompletionItemKind.Class }
}

export function getCompletionItemInfo(item: CompletionItem): CompletionItem {
    // TODO: Resolve these from items
    if (item.data === 1) {
        item.detail = "TypeScript details";
        item.documentation = "TypeScript documentation";
    } else if (item.data === 2) {
        item.detail = "JavaScript details";
        item.documentation = "JavaScript documentation";
    }
    return item;
}
