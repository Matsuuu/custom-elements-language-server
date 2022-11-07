import { CompletionItem, CompletionList, TextDocumentPositionParams } from "vscode-languageserver/node";
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
    parser.parseNodes(doc.uri);
    console.log("Parsed nodes");
    const map = new Map<string, string>();
    map.set(doc.uri, doc.getText());


    return CompletionList.create();
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
