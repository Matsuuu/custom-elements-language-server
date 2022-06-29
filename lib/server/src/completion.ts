import { getLanguageService } from "vscode-html-languageservice";
import { CompletionItem, CompletionItemKind, CompletionList, Position, Range, TextDocumentPositionParams } from "vscode-languageserver/node";
import { cursorIsInsideCustomElementTag, getAllLinesAsText, getLineText } from "./checkers";
import { getDocumentRegions } from "./embedded-support/embedded-tools";
import { languageModes } from "./embedded-support/language-modes";
import { documents } from "./settings";
import { TextDocument } from "vscode-languageserver-textdocument";

function wait(ms = 100) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function getCompletionItems(textDocumentPosition: TextDocumentPositionParams): Promise<CompletionList> {
    await wait(50); // Wait for the documents to update
    console.log("On Completion");
    const doc = documents.get(textDocumentPosition.textDocument.uri);
    if (!doc) return CompletionList.create();

    const offset = doc.offsetAt(textDocumentPosition.position);

    const isInsideCustomElementTag = cursorIsInsideCustomElementTag(doc, offset);

    const mode = languageModes.getModeAtPosition(doc, textDocumentPosition.position);
    if (!mode || !mode.doComplete) {
        return CompletionList.create();
    }
    const textContent = doc.getText();

    let htmlContentDoc = doc;
    // TODO: Try to find a way to attach to the native HTML completions results
    if (doc.languageId !== "html") {
        const htmlTemplateMatches = Array.from(textContent.matchAll(/(?:html`)(?<htmlcontent>.*?)(?:`)/gs));
        if (!htmlTemplateMatches || htmlTemplateMatches.length <= 0) {
            return CompletionList.create();
        }

        let htmlContent = "";
        for (const match of htmlTemplateMatches) {
            htmlContent += match.groups?.["htmlcontent"] ?? "";
        }
        htmlContentDoc = TextDocument.create(doc.uri.replace("test-lit.js", "test-html.html"), "html", doc.version, htmlContent);
    }

    const cursorLineText = getLineText(doc, offset);
    const codeLines = getAllLinesAsText(htmlContentDoc);
    const correspondingLineIndex = codeLines.findIndex(line => line === cursorLineText);

    const reAdjustedPosition = Position.create(correspondingLineIndex, textDocumentPosition.position.character);

    const completions = mode?.doComplete(htmlContentDoc, reAdjustedPosition) ?? [];
    return completions;

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
