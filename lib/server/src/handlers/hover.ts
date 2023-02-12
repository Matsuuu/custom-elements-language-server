import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { HoverParams, Hover } from "vscode-languageserver";
import { quickInfoToHover, textDocumentDataToUsableData } from "../transformers";
import { documents } from "../text-documents";
import { getLanguageService, getProjectBasePath } from "../language-services/language-services";
import { Handler, isJavascriptFile } from "./handler";
import { getQuickInfo } from "html-template-literal-tsserver-plugin";

export const HoverHandler: Handler<HoverParams, Hover> = {
    handle: (hoverInfo: HoverParams) => {
        console.log("Hover");
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
        const languageService = HTMLLanguageService.getLanguageService();
        const doc = documents.get(hoverInfo.textDocument.uri);
        if (!doc) {
            return undefined;
        }
        // const node = htmlDoc.findNodeAt(usableData.position);
        const basePath = getProjectBasePath(usableData.fileName);
        const quickInfo = getQuickInfo(basePath, usableData.fileName, doc, hoverInfo.position, languageService);

        return quickInfoToHover(usableData.fileName, quickInfo);
    }
}
