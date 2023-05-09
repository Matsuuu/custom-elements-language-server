import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { CustomElementsLanguageServiceRequest } from "custom-elements-languageserver-core/dist/request";
import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";

export function createCustomElementsLanguageServiceRequest(filePath: string, basePath: string, document: HTMLLanguageService.TextDocument, position: ts.LineAndCharacter, project: tss.server.Project): CustomElementsLanguageServiceRequest {
    const htmlLanguageService = HTMLLanguageService.getLanguageService()
    return {
        filePath,
        projectBasePath: basePath,
        document,
        position,
        htmlLanguageService,
        project
    };
}
