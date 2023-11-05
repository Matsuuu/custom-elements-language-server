import { HoverParams, Hover } from "vscode-languageserver";
import { quickInfoToHover, textDocumentDataToUsableData } from "../transformers";
import { documents } from "../text-documents";
import { getLanguageService, getProjectBasePath, getProjectForCurrentFile } from "../language-services/language-services";
import { Handler, isJavascriptFile } from "./handler";
import { getQuickInfo } from "custom-elements-languageserver-core";
import { createCustomElementsLanguageServiceRequest, createCustomElementsLanguageServiceRequestFromQueryData } from "../language-services/request";
import { generateLanguageServiceQueryData } from "./handler-helper";

export const HoverHandler: Handler<HoverParams, Hover> = {
    handle: (hoverInfo: HoverParams) => {
        if (isJavascriptFile(hoverInfo)) {
            return HoverHandler.onJavascriptFile(hoverInfo);
        } else {
            return HoverHandler.onHTMLOrOtherFile(hoverInfo);
        }
    },
    onJavascriptFile: (hoverInfo: HoverParams) => {
        const usableData = textDocumentDataToUsableData(documents, hoverInfo);
        const queryData = generateLanguageServiceQueryData(usableData, hoverInfo);
        const languageService = getLanguageService(usableData.fileName, usableData.fileContent);

        let quickInfo = languageService?.getQuickInfoAtPosition(usableData.fileName, usableData.position);
        if (quickInfo === undefined) {
            if (!queryData.isValid) {
                return undefined;
            }

            const request = createCustomElementsLanguageServiceRequestFromQueryData(queryData);
            quickInfo = getQuickInfo(request);
        }

        return quickInfoToHover(usableData.fileName, quickInfo);
    },
    onHTMLOrOtherFile: (hoverInfo: HoverParams) => {
        const usableData = textDocumentDataToUsableData(documents, hoverInfo);
        const queryData = generateLanguageServiceQueryData(usableData, hoverInfo);

        if (!queryData.isValid) {
            return undefined;
        }

        const request = createCustomElementsLanguageServiceRequestFromQueryData(queryData);
        const quickInfo = getQuickInfo(request);

        return quickInfoToHover(usableData.fileName, quickInfo);
    }
}

