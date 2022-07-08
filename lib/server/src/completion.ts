import { CompletionItem, CompletionItemKind, CompletionList, TextDocumentPositionParams } from "vscode-languageserver/node";
import Parser = require("web-tree-sitter");
import { cursorIsCreatingAttribute, cursorIsCreatingHtmlTag, cursorIsInsideHtmlTag } from "./checkers.js";
import { getWordUnderCursor } from "./lsp-util.js";
import { documents } from "./settings.js";


let parser: Parser;

function wait(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function initializeTreeSitter() {
    if (parser) return;

    // We are going to have to deal with the tree sitter javascript wasm for now
    // since the node bindings seem to be in deep a development hell of not having a 
    // properly functioning version with node 18 / vscode / anything really
    await Parser.init();
    parser = new Parser();
    console.log(__dirname);
    const Javascript = await Parser.Language.load(__dirname + '/../tree-sitter-javascript.wasm');
    parser.setLanguage(Javascript);

    const tree = parser.parse('let x = 1;');
    console.log(tree.rootNode.toString());
}

export async function getCompletionItems(textDocumentPosition: TextDocumentPositionParams): Promise<CompletionList> {
    await wait(50); // Wait for the documents to update
    await initializeTreeSitter();
    console.log("On Completion");
    const doc = documents.get(textDocumentPosition.textDocument.uri);
    if (!doc) return CompletionList.create();

    const offset = doc.offsetAt(textDocumentPosition.position);
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
