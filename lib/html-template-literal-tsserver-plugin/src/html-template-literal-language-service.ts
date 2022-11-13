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
        console.log("Get definition!");

        const MOCK_FOOTER_DEF_NAME = "MyFooter";
        const MOCK_FOOTER_DEF_URI = "/home/matsu/Projects/custom-elements-language-server/lib/server/test-project/src/my-footer.ts";

        return [{
            name: MOCK_FOOTER_DEF_NAME,
            kind: tss.ScriptElementKind.classElement,
            containerName: "my-footer.ts",
            containerKind: tss.ScriptElementKind.moduleElement,
            fileName: MOCK_FOOTER_DEF_URI,
            textSpan: tss.createTextSpan(0, 8)
        }];
    }

    public getQuickInfoAtPosition(context: TemplateContext, position: tss.LineAndCharacter): tss.QuickInfo | undefined {
        console.log("Fetching quick info");
        return undefined;
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
            entries: [{ name: "This is a custom completion", kind: ScriptElementKind.string, sortText: "This is a custom completion" }, ...defaultCompletionItems]
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
