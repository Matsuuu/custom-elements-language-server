import tss from "typescript/lib/tsserverlibrary.js";
import { TemplateContext, TemplateLanguageService } from "typescript-template-language-service-decorator";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import { getGoToDefinitionEntries } from "./handlers/go-to-definition.js";
import { getCompletionEntries } from "./handlers/completion.js";
import { getQuickInfo } from "./handlers/quickinfo.js";
import { getImportDiagnostics } from "./handlers/diagnostics/import-diagnostics.js";

export class HTMLTemplateLiteralLanguageService implements TemplateLanguageService {
    constructor(private readonly typescript: typeof tss, private readonly htmlLanguageService: HtmlLanguageService) { }

    getDefinitionAtPosition(context: TemplateContext, position: ts.LineAndCharacter): ts.DefinitionInfo[] {
        return getGoToDefinitionEntries(context, position, this.htmlLanguageService);
    }

    public getQuickInfoAtPosition(context: TemplateContext, position: tss.LineAndCharacter): tss.QuickInfo | undefined {
        return getQuickInfo(context, position, this.htmlLanguageService);
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

        return importDiagnostics;
    }
}
