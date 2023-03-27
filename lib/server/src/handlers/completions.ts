import ts from "typescript";
import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { CompletionList, CompletionParams, CompletionItem, CompletionItemKind } from "vscode-languageserver";
import { textDocumentDataToUsableData } from "../transformers";
import { documents } from "../text-documents";
import { getLanguageService, getProjectBasePath } from "../language-services/language-services";
import { Handler, isJavascriptFile } from "./handler";
import { wait } from "../wait";
import { getCompletionEntries } from "custom-elements-languageserver-core";

export const CompletionsHandler: Handler<CompletionParams, CompletionList> = {
    handle: (completionParams: CompletionParams) => {
        return new Promise(async (resolve) => {
            await wait(50);
            if (isJavascriptFile(completionParams)) {
                resolve(CompletionsHandler.onJavascriptFile(completionParams));
            } else {
                resolve(CompletionsHandler.onHTMLOrOtherFile(completionParams));
            }
        });
    },
    onJavascriptFile: (completionParams: CompletionParams) => {
        const usableData = textDocumentDataToUsableData(documents, completionParams);
        const languageService = getLanguageService(usableData.fileName, usableData.fileContent);

        const completionsOpts: ts.GetCompletionsAtPositionOptions = {};
        const completions = languageService?.getCompletionsAtPosition(usableData.fileName, usableData.position, completionsOpts);

        return completionsToList(completions);
    },
    onHTMLOrOtherFile: (completionParams: CompletionParams) => {
        const usableData = textDocumentDataToUsableData(documents, completionParams);
        const languageService = HTMLLanguageService.getLanguageService();
        const doc = documents.get(completionParams.textDocument.uri);
        if (!doc) {
            return CompletionList.create();
        }
        const basePath = getProjectBasePath(usableData.fileName);

        const completions = getCompletionEntries(doc, basePath, completionParams.position, languageService);

        return completionsToList(completions);
    }
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
