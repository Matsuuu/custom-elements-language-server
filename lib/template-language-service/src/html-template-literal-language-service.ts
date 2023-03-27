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
} from "custom-elements-languageserver-core";
import { CustomElementsLanguageServiceRequest } from "custom-elements-languageserver-core/dist/request";

function createCustomElementsLanguageServiceRequest(context: TemplateContext, position: ts.LineAndCharacter, htmlLanguageService: HtmlLanguageService): CustomElementsLanguageServiceRequest {
    const document = createTextDocumentFromContext(context);
    const projectBasePath = getProjectBasePath(context);

    return {
        projectBasePath,
        document,
        position,
        htmlLanguageService,
        // @ts-ignore // TODO: Fix typing
        project: HTMLTemplateLiteralLanguageService.project,
    }
}

export class HTMLTemplateLiteralLanguageService implements TemplateLanguageService {
    public static project: tss.server.Project;

    constructor(private readonly typescript: typeof tss, private readonly htmlLanguageService: HtmlLanguageService, project: tss.server.Project) {
        HTMLTemplateLiteralLanguageService.project = project;
    }

    getDefinitionAtPosition(context: TemplateContext, position: ts.LineAndCharacter): ts.DefinitionInfo[] {
        const document = createTextDocumentFromContext(context);
        const basePath = getProjectBasePath(context);

        return getGoToDefinitionEntries(basePath, document, position, this.htmlLanguageService);
    }

    public getQuickInfoAtPosition(context: TemplateContext, position: tss.LineAndCharacter): tss.QuickInfo | undefined {
        console.log("getQuickInfoAtPosition");
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
        const document = createTextDocumentFromContext(context);
        const filePath = context.fileName;
        const basePath = getProjectBasePath(context);

        const importDiagnostics = getImportDiagnostics(filePath, basePath, document, this.htmlLanguageService);
        const nonClosedTagDiagnostics = getMissingCloseTagDiagnostics(filePath, document, this.htmlLanguageService, context.node.pos);

        return [...importDiagnostics, ...nonClosedTagDiagnostics] as tss.Diagnostic[]; // TODO: Fix typing
    }
}

export function getProjectBasePath(context: TemplateContext) {
    // Where is StandardTemplateContext?
    // @ts-ignore until we can find a typing for this
    return context?.helper?.project?.currentDirectory ?? "";
    // TODO: Is the currentdirectory the best way to get the base path?
}
