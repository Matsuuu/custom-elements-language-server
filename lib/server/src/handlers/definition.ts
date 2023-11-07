import { getGoToDefinitionEntries } from "custom-elements-languageserver-core";
import { DefinitionParams, Location } from "vscode-languageserver";
import { documents } from "../text-documents";
import { documentSpanToLocation, textDocumentDataToUsableData } from "../transformers";
import { createCustomElementsLanguageServiceRequestFromQueryData } from "../language-services/request";
import { generateLanguageServiceQueryData } from "./handler-helper";

export function definitionHandler(definitionParams: DefinitionParams): Location[] | undefined {
    const usableData = textDocumentDataToUsableData(documents, definitionParams);
    const queryData = generateLanguageServiceQueryData(usableData, definitionParams);

    if (!queryData.isValid) {
        return undefined;
    }

    const request = createCustomElementsLanguageServiceRequestFromQueryData(queryData);
    const definitions = getGoToDefinitionEntries(request);

    const definitionLocations = definitions?.map(documentSpanToLocation) ?? [];
    return definitionLocations;
}
