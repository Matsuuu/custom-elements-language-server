import { ScriptElementKind } from "typescript";
import * as tss from "typescript/lib/tsserverlibrary";
import { TemplateContext, TemplateLanguageService } from "typescript-template-language-service-decorator";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import { getDocumentRegions } from "./embedded-support";
import { createTextDocumentFromContext } from "./text-document";
import { completionItemToCompletionEntry } from "./interop";

export class HTMLTemplateLiteralLanguageService implements TemplateLanguageService {

    constructor(
        private readonly typescript: typeof tss,
        private readonly htmlLanguageService: HtmlLanguageService
    ) {

    }

    getDefinitionAtPosition(context: TemplateContext, position: ts.LineAndCharacter): ts.DefinitionInfo[] {
        console.log("Get definition");
        return [];
    }

    public getCompletionsAtPosition(
        context: TemplateContext,
        position: tss.LineAndCharacter
    ): tss.CompletionInfo {

        const htmlLSCompletions = this.getCompletionItems(context, position);
        const defaultCompletionItems = htmlLSCompletions.items.map(completionItemToCompletionEntry);
        return {
            isGlobalCompletion: false,
            isMemberCompletion: false,
            isNewIdentifierLocation: false,
            entries: [{ name: "AA THIS IS A TEST", kind: ScriptElementKind.string, sortText: "AA THIS IS A TEST" }, ...defaultCompletionItems]
        };

    }

    private getCompletionItems(context: TemplateContext, position: tss.LineAndCharacter) {
        const document = createTextDocumentFromContext(context);
        const documentRegions = getDocumentRegions(this.htmlLanguageService, document);
        const languageId = documentRegions.getLanguageAtPosition(position);

        const htmlDoc = this.htmlLanguageService.parseHTMLDocument(document);
        const htmlCompletions = this.htmlLanguageService.doComplete(document, position, htmlDoc);
        // TODO: Cache

        return htmlCompletions;
    }
}
