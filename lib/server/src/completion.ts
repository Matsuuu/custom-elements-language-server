import { CompletionItem, CompletionItemKind, CompletionList, TextDocumentPositionParams } from "vscode-languageserver/node";
import { cursorIsCreatingAttribute, cursorIsCreatingHtmlTag, cursorIsInsideHtmlTag } from "./checkers.js";
import { getWordUnderCursor } from "./lsp-util.js";
import { documents } from "./settings.js";

function wait(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCompletionItems(textDocumentPosition: TextDocumentPositionParams): Promise<CompletionList> {
    await wait(50); // Wait for the documents to update
    console.log("On Completion");
    const doc = documents.get(textDocumentPosition.textDocument.uri);
    if (!doc) return CompletionList.create();

    const position = textDocumentPosition.position;
    const offset = doc.offsetAt(textDocumentPosition.position);



    // Okay so this is what we are going to do:
    //
    // If we are in a HTML file, we will
    // - Find the current node by walking the tree and matching positions
    //  - Or possibly we could query for start_tags and attribute_name tags
    // - Check if the tree node is the one under the cursor
    // - Contextually check for html elements/attributes/events matching the word under cursor


    const wordUnderCursor = getWordUnderCursor(doc, textDocumentPosition.position);

    console.log("Lang ID: ", doc.languageId);
    const isCreatingAttribute = cursorIsCreatingAttribute(doc, offset);
    const isCreatingHtmlTag = cursorIsCreatingHtmlTag(wordUnderCursor);
    const isInsideHtmlTag = cursorIsInsideHtmlTag(doc, offset);

    // TODO: Try to find a way to attach to the native HTML completions results

    if (isCreatingHtmlTag) {
        console.log("Returning default values: ");
        return CompletionList.create([
            {
                label: "my-element",
                kind: CompletionItemKind.Text,
                data: 1,
            },
            {
                label: "my-list",
                kind: CompletionItemKind.Text,
                data: 2,
            },
            {
                label: "other-list",
                kind: CompletionItemKind.Text,
                data: 3,
            },
        ]);
    }

    if (isCreatingAttribute) {
        return CompletionList.create([
            {
                label: "attri-bute",
                kind: CompletionItemKind.Text,
                data: 1,
            },
        ])
    }

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
