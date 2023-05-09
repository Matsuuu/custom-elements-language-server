import { getGoToDefinitionEntries } from "custom-elements-languageserver-core";
import { DefinitionParams, Location } from "vscode-languageserver";
import { getLanguageService, getProjectBasePath, getProjectForCurrentFile } from "../language-services/language-services";
import { documents } from "../text-documents";
import { documentSpanToLocation, textDocumentDataToUsableData } from "../transformers";
import { Handler, isJavascriptFile } from "./handler";
import { createCustomElementsLanguageServiceRequest } from "../language-services/request";

export const DefinitionHandler: Handler<DefinitionParams, Location[] | undefined> = {
    handle: (definitionParams) => {
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
        const doc = documents.get(definitionParams.textDocument.uri);
        if (!doc) {
            return undefined;
        }
        // const node = htmlDoc.findNodeAt(usableData.position);
        const project = getProjectForCurrentFile(usableData.fileName, usableData.fileContent);
        const basePath = getProjectBasePath(usableData.fileName);
        if (!project) {
            return undefined;
        }

        const request = createCustomElementsLanguageServiceRequest(usableData.fileName, basePath, doc, definitionParams.position, project);
        const definitions = getGoToDefinitionEntries(request);

        const definitionLocations = definitions?.map(documentSpanToLocation) ?? [];
        return definitionLocations;
    },
}
