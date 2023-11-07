import ts from "typescript";
import { CompletionList, CompletionParams, CompletionItem } from "vscode-languageserver";
import { textDocumentDataToUsableData } from "../transformers";
import { documents } from "../text-documents";
import { wait } from "../wait";
import { elementKindToCompletionKind, getCompletionEntries } from "custom-elements-languageserver-core";
import { createCustomElementsLanguageServiceRequest, createCustomElementsLanguageServiceRequestFromQueryData } from "../language-services/request";
import { generateLanguageServiceQueryData } from "./handler-helper";

export async function completionsHandler(completionParams: CompletionParams): Promise<CompletionList> {
    await wait(50); // TODO: Can we like. Not rely on this?

    const usableData = textDocumentDataToUsableData(documents, completionParams);
    const queryData = generateLanguageServiceQueryData(usableData, completionParams);

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
    let completions = getCompletionEntries(request);

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
