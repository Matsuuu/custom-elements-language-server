import { getGoToDefinitionEntries } from "custom-elements-languageserver-core";
import { DefinitionParams, Location } from "vscode-languageserver";
import { getLanguageService, getProjectBasePath, getProjectForCurrentFile } from "../language-services/language-services";
import { documents } from "../text-documents";
import { documentSpanToLocation, textDocumentDataToUsableData } from "../transformers";
import { Handler, isJavascriptFile } from "./handler";
import { createCustomElementsLanguageServiceRequest, createCustomElementsLanguageServiceRequestFromQueryData } from "../language-services/request";
import { generateLanguageServiceQueryData } from "./handler-helper";

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
        const queryData = generateLanguageServiceQueryData(usableData, definitionParams);
        const languageService = getLanguageService(usableData.fileName, usableData.fileContent);
        let definitions = languageService?.getDefinitionAtPosition(usableData.fileName, usableData.position);
        if (definitions === undefined) {
            if (!queryData.isValid) {
                return undefined;
            }
            const request = createCustomElementsLanguageServiceRequestFromQueryData(queryData);
            definitions = getGoToDefinitionEntries(request);
        }

        const definitionLocations = definitions?.map(documentSpanToLocation) ?? [];
        return definitionLocations;
    },
    onHTMLOrOtherFile: (definitionParams) => {
        const usableData = textDocumentDataToUsableData(documents, definitionParams);
        const queryData = generateLanguageServiceQueryData(usableData, definitionParams);

        const request = createCustomElementsLanguageServiceRequestFromQueryData(queryData);
        const definitions = getGoToDefinitionEntries(request);

        const definitionLocations = definitions?.map(documentSpanToLocation) ?? [];
        return definitionLocations;
    },
}
