import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";
import { TemplateContext, TemplateLanguageService } from "typescript-template-language-service-decorator";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { createTextDocumentFromContext } from "./text-document.js";
import {
    getCEMData,
    getCompletionEntries,
    getGoToDefinitionEntries,
    getImportDiagnostics,
    getMissingCloseTagDiagnostics,
    getQuickInfo,
} from "custom-elements-languageserver-core";
import { CustomElementsLanguageServiceRequest } from "custom-elements-languageserver-core/dist/request.js";
import tss from "typescript/lib/tsserverlibrary.js";

export function createCustomElementsLanguageServiceRequest(context: TemplateContext, position: ts.LineAndCharacter, htmlLanguageService: HtmlLanguageService): CustomElementsLanguageServiceRequest {
    const document = createTextDocumentFromContext(context);
    const projectBasePath = getProjectBasePath(context);

    return {
        filePath: tss.server.toNormalizedPath(context.fileName),
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
        // For now, trigger the CEM data fetch as soon as we have a environment setup.
        // Later on we should figure a better trigger as we move to the file watcher setup.
        getCEMData(project, project.getCurrentDirectory());
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
        const request = createCustomElementsLanguageServiceRequest(context, position, this.htmlLanguageService);

        return getCompletionEntries(request);
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

        return [...importDiagnostics, ...nonClosedTagDiagnostics];
    }
}

export function getProjectBasePath(context: TemplateContext) {
    // Where is StandardTemplateContext?
    // @ts-ignore until we can find a typing for this
    return context?.helper?.project?.currentDirectory ?? "";
    // TODO: Is the currentdirectory the best way to get the base path?
}
