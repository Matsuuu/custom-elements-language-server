import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";
import { TemplateContext, TemplateLanguageService } from "typescript-template-language-service-decorator";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { createTextDocumentFromContext } from "./text-document";
import {
    getCompletionEntries,
    getGoToDefinitionEntries,
    getImportDiagnostics,
    getMissingCloseTagDiagnostics,
    getQuickInfo,
    getTypingDiagnostics,
} from "custom-elements-languageserver-core";
import { CustomElementsLanguageServiceRequest } from "custom-elements-languageserver-core/dist/request";

export function createCustomElementsLanguageServiceRequest(context: TemplateContext, position: ts.LineAndCharacter, htmlLanguageService: HtmlLanguageService): CustomElementsLanguageServiceRequest {
    const document = createTextDocumentFromContext(context);
    const projectBasePath = getProjectBasePath(context);

    return {
        filePath: context.fileName,
        projectBasePath,
        document,
        position,
        htmlLanguageService,
        project: HTMLTemplateLiteralLanguageService.project,
    }
}

export class HTMLTemplateLiteralLanguageService implements TemplateLanguageService {
    public static project: tss.server.Project;

    constructor(private readonly typescript: typeof tss, private readonly htmlLanguageService: HtmlLanguageService, project: tss.server.Project) {
        HTMLTemplateLiteralLanguageService.project = project;
    }

    getDefinitionAtPosition(context: TemplateContext, position: ts.LineAndCharacter): ts.DefinitionInfo[] {
        const request = createCustomElementsLanguageServiceRequest(context, position, this.htmlLanguageService);

        return getGoToDefinitionEntries(request);
    }

    public getQuickInfoAtPosition(context: TemplateContext, position: tss.LineAndCharacter): tss.QuickInfo | undefined {
        const request = createCustomElementsLanguageServiceRequest(context, position, this.htmlLanguageService);

        return getQuickInfo(request);
    }

    public getCompletionsAtPosition(context: TemplateContext, position: tss.LineAndCharacter): tss.CompletionInfo {
        const document = createTextDocumentFromContext(context);
        const basePath = getProjectBasePath(context);

        return getCompletionEntries(document, basePath, position, this.htmlLanguageService);
    }

    public getCompletionEntryDetails?(context: TemplateContext, position: ts.LineAndCharacter, name: string): ts.CompletionEntryDetails {
        return {
            name: "",
            kind: tss.ScriptElementKind.parameterElement,
            kindModifiers: "0",
            displayParts: [],
        };
    }

    public getSemanticDiagnostics(context: TemplateContext): tss.Diagnostic[] {
        const position = { line: 0, character: 0 };
        const request = createCustomElementsLanguageServiceRequest(context, position, this.htmlLanguageService);

        const importDiagnostics = getImportDiagnostics(request);
        const nonClosedTagDiagnostics = getMissingCloseTagDiagnostics(context.node.pos, request);
        const typingDiagnostics = getTypingDiagnostics(request);

        return [...importDiagnostics, ...nonClosedTagDiagnostics];
    }
}

export function getProjectBasePath(context: TemplateContext) {
    // Where is StandardTemplateContext?
    // @ts-ignore until we can find a typing for this
    return context?.helper?.project?.currentDirectory ?? "";
    // TODO: Is the currentdirectory the best way to get the base path?
}
