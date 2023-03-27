import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { CustomElementsLanguageServiceRequest } from "custom-elements-languageserver-core/dist/request";
import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";

export function createCustomElementsLanguageServiceRequest(basePath: string, document: HTMLLanguageService.TextDocument, position: ts.LineAndCharacter, project: tss.server.Project): CustomElementsLanguageServiceRequest {
    const htmlLanguageService = HTMLLanguageService.getLanguageService()
    return {
        projectBasePath: basePath,
        document,
        position,
        htmlLanguageService,
        // @ts-ignore
        project
    }
}