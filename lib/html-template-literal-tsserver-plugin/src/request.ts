import tss from "typescript/lib/tsserverlibrary.js";
import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";

export interface CustomElementsLanguageServiceRequest {
    projectBasePath: string;
    document: HTMLLanguageService.TextDocument; // TODO: Abstract this away from dependency
    position: tss.LineAndCharacter; // TODO: Abstract this too
    htmlLanguageService: HTMLLanguageService.LanguageService;
    project: tss.server.Project;
}

