import ts from "typescript";
import { CompletionList, CompletionParams, CompletionItem } from "vscode-languageserver";
import { textDocumentDataToUsableData } from "../transformers";
import { documents } from "../text-documents";
import { getLanguageService } from "../language-services/language-services";
import { Handler, isJavascriptFile } from "./handler";
import { wait } from "../wait";
import { elementKindToCompletionKind, getCompletionEntries } from "custom-elements-languageserver-core";
import { createCustomElementsLanguageServiceRequest } from "../language-services/request";
import { generateLanguageServiceQueryData } from "./handler-helper";

export const CompletionsHandler: Handler<CompletionParams, CompletionList> = {
    handle: (completionParams: CompletionParams) => {
        return new Promise(async resolve => {
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
        const queryData = generateLanguageServiceQueryData(usableData, completionParams);

        const completionsOpts: ts.GetCompletionsAtPositionOptions = {};
        let completions = languageService?.getCompletionsAtPosition(queryData.fileName, usableData.position, completionsOpts);
        if (completions === undefined) {
            if (!queryData.isValid) {
                return CompletionList.create();
            }
            const request = createCustomElementsLanguageServiceRequest(
                queryData.fileName,
                queryData.basePath,
                queryData.doc!,
                queryData.position,
                queryData.project!,
            );
            completions = getCompletionEntries(request);
        }

        return completionsToList(completions);
    },
    onHTMLOrOtherFile: (completionParams: CompletionParams) => {
        const usableData = textDocumentDataToUsableData(documents, completionParams);
        const queryData = generateLanguageServiceQueryData(usableData, completionParams);
        if (!queryData.isValid) {
            return CompletionList.create();
        }

        const request = createCustomElementsLanguageServiceRequest(
            queryData.fileName,
            queryData.basePath,
            queryData.doc!,
            completionParams.position,
            queryData.project!,
        );
        const completions = getCompletionEntries(request);

        return completionsToList(completions);
    },
};

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
        insertText = insertText.replace(match?.at(0) || "", "");
    }

    // TODO: Fill the rest
    return {
        label: completionsEntry.name,
        kind: elementKindToCompletionKind(completionsEntry.kind),
        documentation: {
            kind: "markdown",
            value: completionsEntry.labelDetails?.description ?? "",
        },
        insertText: insertText,
    };
}
