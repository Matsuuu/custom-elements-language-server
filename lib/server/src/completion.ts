import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";
import { CompletionItem, CompletionItemKind, CompletionList, TextDocumentPositionParams } from "vscode-languageserver/node.js";
import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";

import { getLanguageService } from "./language-services/language-services.js";
import { documents } from "./text-documents.js";
import { wait } from "./wait.js";
import { resolveActionContext } from "html-template-literal-tsserver-plugin";
import { textDocumentDataToUsableData } from "./transformers.js";

export async function getCompletionItems(textDocumentPosition: TextDocumentPositionParams): Promise<CompletionList> {
    console.log("On Completion");
    await wait(50);
    const doc = documents.get(textDocumentPosition.textDocument.uri);
    if (!doc) return CompletionList.create();

    const usableData = textDocumentDataToUsableData(documents, textDocumentPosition);
    const lang = HTMLLanguageService.getLanguageService();
    if (doc) {
        const htmlDoc = lang.parseHTMLDocument(doc);
        const a = lang.doHover(doc, textDocumentPosition.position, htmlDoc);
        const node = htmlDoc.findNodeAt(usableData.position);
        const actionContext = resolveActionContext(lang, doc, textDocumentPosition.position);
    }

    const fileName = doc.uri.replace("file://", "");

    const languageService = getLanguageService(fileName, doc.getText());

    const completionsOpts: ts.GetCompletionsAtPositionOptions = {};
    const completions = languageService?.getCompletionsAtPosition(fileName, doc.offsetAt(textDocumentPosition.position), completionsOpts);

    return completionsToList(completions);
}

function completionsToList(completions: ts.WithMetadata<ts.CompletionInfo> | undefined) {
    if (!completions) return CompletionList.create();
    return CompletionList.create(completions.entries.map(completionEntryToCompletionItem));
}

function completionEntryToCompletionItem(completionsEntry: ts.CompletionEntry): CompletionItem {
    let insertText = completionsEntry.name;
    if (insertText.startsWith("/")) {
        insertText = insertText.substring(1);
    }
    if (insertText.match(/^@\w+-/)) {
        const match = insertText.match(/^@\w+-/);
        insertText = insertText.replace(match?.at(0) || '', "");

    }
    // TODO: Fill the rest
    return {
        label: completionsEntry.name,
        kind: CompletionItemKind.Class,
        documentation: completionsEntry.labelDetails?.description,
        insertText: insertText
    };
}

export function getCompletionItemInfo(item: CompletionItem): CompletionItem {
    console.log(item);
    //const doc = documents.get(textDocumentPosition.textDocument.uri);
    //if (!doc) return CompletionItem.create();

    //const fileName = doc.uri.replace("file://", "");

    //const languageService = getLanguageService(fileName, doc.getText());
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
