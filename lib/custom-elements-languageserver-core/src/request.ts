import tss from "typescript/lib/tsserverlibrary.js";
import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";

export interface CustomElementsLanguageServiceRequest {
    projectBasePath: string;
    document: HTMLLanguageService.TextDocument;
    position: CursorPosition; // tss.LineAndCharacter
    htmlLanguageService: HTMLLanguageService.LanguageService;
    project: tss.server.Project;
}

export interface CursorPosition {
    line: number;
    character: number;
}
