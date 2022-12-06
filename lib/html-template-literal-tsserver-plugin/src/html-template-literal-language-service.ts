import tss from "typescript/lib/tsserverlibrary.js";
import { TemplateContext, TemplateLanguageService } from "typescript-template-language-service-decorator";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import { getDocumentRegions } from "./embedded-support.js";
import { createTextDocumentFromContext } from "./text-document.js";
import { completionItemToCompletionEntry } from "./interop.js";
import { getLatestCEM } from "./cem/cem-instance.js";
import { findCustomElementTagLike, findDeclarationForTagName } from "./cem/cem-helpers.js";
import { isAttributeNameCompletion, isEndTagCompletion, isEventNameCompletion, isPropertyNameCompletion, isTagCompletion, resolveCompletionContext } from "./completion-context.js";
import { getGoToDefinitionEntries } from "./handlers/go-to-definition.js";

export class HTMLTemplateLiteralLanguageService implements TemplateLanguageService {

    constructor(
        private readonly typescript: typeof tss,
        private readonly htmlLanguageService: HtmlLanguageService
    ) {

    }

    getDefinitionAtPosition(context: TemplateContext, position: ts.LineAndCharacter): ts.DefinitionInfo[] {
        return getGoToDefinitionEntries(context, position, this.htmlLanguageService);
    }

    public getQuickInfoAtPosition(context: TemplateContext, position: tss.LineAndCharacter): tss.QuickInfo | undefined {
        console.log("Fetching quick info");
        return undefined;
    }

    public getCompletionsAtPosition(
        context: TemplateContext,
        position: tss.LineAndCharacter
    ): tss.CompletionInfo {
        console.log("On completions");

        const htmlLSCompletions = this.getCompletionItems(context, position);
        const defaultCompletionItems = htmlLSCompletions.items.map(completionItemToCompletionEntry);

        const completionContext = resolveCompletionContext(this.htmlLanguageService, context, position);

        const cem = getLatestCEM();
        let cemCompletions: tss.CompletionEntry[] = [];

        if (cem) {
            // TODO: Clean all of this stuff inside the if (cem)
            // TODO: Move this elsewhere from the main method

            if (isTagCompletion(completionContext)) {
                const similiarTags = findCustomElementTagLike(cem, completionContext.tagName);
                similiarTags.forEach(tag => {
                    cemCompletions.push({ name: tag, kind: tss.ScriptElementKind.memberVariableElement, sortText: tag })
                })
            }

            if (isEndTagCompletion(completionContext)) {
                // NOTE: This is done by vscode automatically?
                // Check if it's done everywhere and then do a check on completions if 
                // the closing tag is already present.
                //
                /*const similiarTags = findCustomElementTagLike(cem, completionContext.tagName);
                const closingPrefix = "/";
                similiarTags.forEach(tag => {
                    const tagWithPrefix = closingPrefix + tag;
                    cemCompletions.push({ name: tagWithPrefix, kind: tss.ScriptElementKind.classElement, sortText: tagWithPrefix })
                })*/
            }

            if (isAttributeNameCompletion(completionContext)) {
                const classDeclaration = findDeclarationForTagName(cem, completionContext.tagName);
                if (classDeclaration) {
                    const attributes = classDeclaration.attributes;
                    attributes?.forEach(attr => {
                        cemCompletions.push({ name: attr.name, kind: tss.ScriptElementKind.memberVariableElement, sortText: attr.name });
                    });
                }
            }

            if (isEventNameCompletion(completionContext)) {
                const classDeclaration = findDeclarationForTagName(cem, completionContext.tagName);
                if (classDeclaration) {
                    const events = classDeclaration.events;
                    events?.forEach(event => {
                        const eventNameWithAtSign = "@" + event.name;
                        cemCompletions.push({ name: eventNameWithAtSign, kind: tss.ScriptElementKind.memberVariableElement, sortText: eventNameWithAtSign });
                    })
                }
            }

            if (isPropertyNameCompletion(completionContext)) {
                const classDeclaration = findDeclarationForTagName(cem, completionContext.tagName);
                if (classDeclaration) {
                    const properties = classDeclaration?.members?.filter(mem => mem.kind === "field") ?? [];
                    properties?.forEach(prop => {
                        const propertyNameWithPeriodPrefix = "." + prop.name;
                        cemCompletions.push({ name: prop.name, kind: tss.ScriptElementKind.memberVariableElement, sortText: propertyNameWithPeriodPrefix });
                    })
                }
            }
        }

        return {
            isGlobalCompletion: false,
            isMemberCompletion: false,
            isNewIdentifierLocation: false,
            entries: [...defaultCompletionItems, ...cemCompletions]
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
