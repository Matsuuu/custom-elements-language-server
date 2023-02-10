import tss from "typescript/lib/tsserverlibrary.js";
import { TemplateContext, TemplateLanguageService } from "typescript-template-language-service-decorator";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { getGoToDefinitionEntries } from "./handlers/go-to-definition.js";
import { getCompletionEntries } from "./handlers/completion.js";
import { getQuickInfo } from "./handlers/quickinfo.js";
import { getImportDiagnostics } from "./handlers/diagnostics/import-diagnostics.js";
import { getMissingCloseTagDiagnostics } from "./handlers/diagnostics/close-tag-diagnostics.js";
import { createTextDocumentFromContext } from "./text-document.js";
import { getProjectBasePath } from "./template-context.js";

export class HTMLTemplateLiteralLanguageService implements TemplateLanguageService {
    public static project: tss.server.Project;

    constructor(private readonly typescript: typeof tss, private readonly htmlLanguageService: HtmlLanguageService, project: tss.server.Project) {
        HTMLTemplateLiteralLanguageService.project = project;
    }

    getDefinitionAtPosition(context: TemplateContext, position: ts.LineAndCharacter): ts.DefinitionInfo[] {
        const document = createTextDocumentFromContext(context);
        const basePath = getProjectBasePath(context);
        const filePath = context.fileName;

        return getGoToDefinitionEntries(basePath, filePath, document, position, this.htmlLanguageService);
    }

    public getQuickInfoAtPosition(context: TemplateContext, position: tss.LineAndCharacter): tss.QuickInfo | undefined {
        const document = createTextDocumentFromContext(context);
        const basePath = getProjectBasePath(context);
        const filePath = context.fileName;

        return getQuickInfo(basePath, filePath, document, position, this.htmlLanguageService);
    }

    public getCompletionsAtPosition(context: TemplateContext, position: tss.LineAndCharacter): tss.CompletionInfo {
        return getCompletionEntries(context, position, this.htmlLanguageService);
    }

    public getCompletionEntryDetails?(context: TemplateContext, position: ts.LineAndCharacter, name: string): ts.CompletionEntryDetails {

        return {
            name: "",
            kind: tss.ScriptElementKind.parameterElement,
            kindModifiers: "0",
            displayParts: []
        }
    }

    public getSemanticDiagnostics(context: TemplateContext): tss.Diagnostic[] {
        const importDiagnostics = getImportDiagnostics(context, this.htmlLanguageService);
        const nonClosedTagDiagnostics = getMissingCloseTagDiagnostics(context, this.htmlLanguageService);

        return [
            ...importDiagnostics,
            ...nonClosedTagDiagnostics
        ];
    }
}
