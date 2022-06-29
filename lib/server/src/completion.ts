import { CompletionItem, CompletionItemKind, CompletionList, TextDocumentPositionParams } from "vscode-languageserver/node";
import { cursorIsInsideCustomElementTag } from "./checkers";
import { languageModes } from "./embedded-support/language-modes";
import { documents } from "./settings";

export function getCompletionItems(textDocumentPosition: TextDocumentPositionParams): CompletionList {
    console.log("On Completion");
    const doc = documents.get(textDocumentPosition.textDocument.uri);
    if (!doc) return CompletionList.create();

    const offset = doc.offsetAt(textDocumentPosition.position);

    const isInsideCustomElementTag = cursorIsInsideCustomElementTag(doc, offset);
    console.log("Is inside", isInsideCustomElementTag);

    const mode = languageModes.getModeAtPosition(doc, textDocumentPosition.position);
    if (!mode || !mode.doComplete) {
        return CompletionList.create();
    }

    return mode?.doComplete(doc, textDocumentPosition.position) ?? [];

    // TODO: If in HTML context, enumerate valid custom elements into the 
    // search results
    // The pass parameter contains the position of the text document in
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    return CompletionList.create([
        {
            label: "TypeScript",
            kind: CompletionItemKind.Text,
            data: 1,
        },
        {
            label: "JavaScript",
            kind: CompletionItemKind.Text,
            data: 2,
        },
        {
            label: "Biz",
            kind: CompletionItemKind.Text,
            data: 3,
        },
    ]);
}

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
