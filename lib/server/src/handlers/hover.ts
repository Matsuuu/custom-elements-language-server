import { HoverParams, Hover } from "vscode-languageserver";
import { quickInfoToHover, textDocumentDataToUsableData } from "../transformers";
import { documents } from "../text-documents";
import { getQuickInfo } from "custom-elements-languageserver-core";
import { createCustomElementsLanguageServiceRequestFromQueryData } from "../language-services/request";
import { generateLanguageServiceQueryData } from "./handler-helper";

export function hoverHandler(hoverInfo: HoverParams): Hover | undefined {
    const usableData = textDocumentDataToUsableData(documents, hoverInfo);
    const queryData = generateLanguageServiceQueryData(usableData, hoverInfo);

    if (!queryData.isValid) {
        return undefined;
    }

    const request = createCustomElementsLanguageServiceRequestFromQueryData(queryData);
    const quickInfo = getQuickInfo(request);

    return quickInfoToHover(usableData.fileName, quickInfo);
}

