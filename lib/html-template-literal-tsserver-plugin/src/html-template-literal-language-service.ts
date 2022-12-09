import tss from "typescript/lib/tsserverlibrary.js";
import { TemplateContext, TemplateLanguageService } from "typescript-template-language-service-decorator";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import { getDocumentRegions } from "./embedded-support.js";
import { createTextDocumentFromContext } from "./text-document.js";
import { completionItemToCompletionEntry } from "./interop.js";
import { getLatestCEM } from "./cem/cem-instance.js";
import { findCustomElementTagLike, findDeclarationForTagName } from "./cem/cem-helpers.js";
import { isAttributeNameAction, isEndTagAction, isEventNameAction, isPropertyNameAction, isTagAction, resolveActionContext } from "./completion-context.js";
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

        const actionContext = resolveActionContext(this.htmlLanguageService, context, position);

        const cem = getLatestCEM();
        let cemCompletions: tss.CompletionEntry[] = [];

        if (cem) {
            // TODO: Clean all of this stuff inside the if (cem)
            // TODO: Move this elsewhere from the main method

            if (isTagAction(actionContext)) {
                const similiarTags = findCustomElementTagLike(cem, actionContext.tagName);
                similiarTags.forEach(tag => {
                    cemCompletions.push({ name: tag, kind: tss.ScriptElementKind.memberVariableElement, sortText: tag })
                })
            }

            if (isEndTagAction(actionContext)) {
                // NOTE: This is done by vscode automatically?
                // Check if it's done everywhere and then do a check on completions if 
                // the closing tag is already present.
                //
            }

            if (isAttributeNameAction(actionContext)) {
                const classDeclaration = findDeclarationForTagName(cem, actionContext.tagName);
                if (classDeclaration) {
                    const attributes = classDeclaration.attributes;
                    attributes?.forEach(attr => {
                        cemCompletions.push({ name: attr.name, kind: tss.ScriptElementKind.memberVariableElement, sortText: attr.name });
                    });
                }
            }

            if (isEventNameAction(actionContext)) {
                const classDeclaration = findDeclarationForTagName(cem, actionContext.tagName);
                if (classDeclaration) {
                    const events = classDeclaration.events;
                    events?.forEach(event => {
                        const eventNameWithAtSign = "@" + event.name;
                        cemCompletions.push({ name: eventNameWithAtSign, kind: tss.ScriptElementKind.memberVariableElement, sortText: eventNameWithAtSign });
                    })
                }
            }

            if (isPropertyNameAction(actionContext)) {
                const classDeclaration = findDeclarationForTagName(cem, actionContext.tagName);
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
