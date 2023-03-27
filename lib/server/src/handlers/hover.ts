import { HoverParams, Hover } from "vscode-languageserver";
import { quickInfoToHover, textDocumentDataToUsableData } from "../transformers";
import { documents } from "../text-documents";
import { getLanguageService, getProjectBasePath, getProjectForCurrentFile } from "../language-services/language-services";
import { Handler, isJavascriptFile } from "./handler";
import { getQuickInfo } from "custom-elements-languageserver-core";
import { createCustomElementsLanguageServiceRequest } from "../language-services/request";

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
        const languageService = getLanguageService(usableData.fileName, usableData.fileContent);

        const quickInfo = languageService?.getQuickInfoAtPosition(usableData.fileName, usableData.position);

        return quickInfoToHover(usableData.fileName, quickInfo);
    },
    onHTMLOrOtherFile: (hoverInfo: HoverParams) => {
        const usableData = textDocumentDataToUsableData(documents, hoverInfo);
        const doc = documents.get(hoverInfo.textDocument.uri);
        if (!doc) {
            return undefined;
        }

        const project = getProjectForCurrentFile(usableData.fileName, usableData.fileContent);
        const basePath = getProjectBasePath(usableData.fileName);
        if (!project) {
            return undefined;
        }


        const request = createCustomElementsLanguageServiceRequest(basePath, doc, hoverInfo.position, project);
        const quickInfo = getQuickInfo(request);

        return quickInfoToHover(usableData.fileName, quickInfo);
    }
}

