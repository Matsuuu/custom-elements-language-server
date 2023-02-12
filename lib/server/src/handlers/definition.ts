import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { getGoToDefinitionEntries } from "html-template-literal-tsserver-plugin";
import { DefinitionParams, Location } from "vscode-languageserver";
import { getLanguageService, getProjectBasePath } from "../language-services/language-services";
import { documents } from "../text-documents";
import { documentSpanToLocation, textDocumentDataToUsableData } from "../transformers";
import { Handler, isJavascriptFile } from "./handler";

export const DefinitionHandler: Handler<DefinitionParams, Location[] | undefined> = {
    handle: (definitionParams) => {
        console.log("Definition");
        if (isJavascriptFile(definitionParams)) {
            return DefinitionHandler.onJavascriptFile(definitionParams);
        } else {
            return DefinitionHandler.onHTMLOrOtherFile(definitionParams);
        }
    },
    onJavascriptFile: (definitionParams) => {
        const usableData = textDocumentDataToUsableData(documents, definitionParams);
        const languageService = getLanguageService(usableData.fileName, usableData.fileContent);
        const definitions = languageService?.getDefinitionAtPosition(usableData.fileName, usableData.position);

        const definitionLocations = definitions?.map(documentSpanToLocation) ?? [];
        return definitionLocations;
    },
    onHTMLOrOtherFile: (definitionParams) => {
        const usableData = textDocumentDataToUsableData(documents, definitionParams);
        const languageService = HTMLLanguageService.getLanguageService();
        const doc = documents.get(definitionParams.textDocument.uri);
        if (!doc) {
            return undefined;
        }
        // const node = htmlDoc.findNodeAt(usableData.position);
        const basePath = getProjectBasePath(usableData.fileName);

        const definitions = getGoToDefinitionEntries(basePath, usableData.fileName, doc, definitionParams.position, languageService);

        const definitionLocations = definitions?.map(documentSpanToLocation) ?? [];
        return definitionLocations;
    },
}
