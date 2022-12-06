import tss from "typescript/lib/tsserverlibrary.js";
import { TemplateContext, TemplateLanguageService } from "typescript-template-language-service-decorator";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import { getDocumentRegions } from "./embedded-support.js";
import { createTextDocumentFromContext } from "./text-document.js";
import { completionItemToCompletionEntry } from "./interop.js";
import { getLatestCEM } from "./cem/cem-instance.js";
import { findClassForTagName, findCustomElementDeclarationFromModule, findCustomElementTagLike, findDeclarationForTagName } from "./cem/cem-helpers.js";
import { isAttributeNameCompletion, isEndTagCompletion, isEventNameCompletion, isPropertyNameCompletion, isTagCompletion, resolveCompletionContext } from "./completion-context.js";
import { CustomElement } from "custom-elements-manifest";
import { getProjectBasePath } from "./template-context.js";
import { getClassDefinitionTextSpan } from "./typescript-analyzer.js";

export class HTMLTemplateLiteralLanguageService implements TemplateLanguageService {

    constructor(
        private readonly typescript: typeof tss,
        private readonly htmlLanguageService: HtmlLanguageService
    ) {

    }

    getDefinitionAtPosition(context: TemplateContext, position: ts.LineAndCharacter): ts.DefinitionInfo[] {
        console.log("Get definition!");

        const htmlLSCompletions = this.getCompletionItems(context, position);
        const defaultCompletionItems = htmlLSCompletions.items.map(completionItemToCompletionEntry);

        const basePath = getProjectBasePath(context);

        const definitionInfos: Array<ts.DefinitionInfo> = [];

        const completionContext = resolveCompletionContext(this.htmlLanguageService, context, position);
        const cem = getLatestCEM();
        if (cem) {
            // TODO: Clean all of this stuff inside the if (cem)
            if (isTagCompletion(completionContext)) {
                const matchingClass = findClassForTagName(cem, completionContext.tagName);
                let classDeclaration: CustomElement | undefined;
                if (matchingClass) {
                    classDeclaration = findCustomElementDeclarationFromModule(matchingClass);
                }

                // TODO: Make these if horriblities into early exit functions when moving
                let classDefinitionTextSpan: tss.TextSpan | undefined;
                if (matchingClass && classDeclaration) {
                    classDefinitionTextSpan = getClassDefinitionTextSpan(matchingClass, classDeclaration?.name ?? '', basePath);
                }

                const fileNameSplit = matchingClass?.path.split("/");
                const fileName = fileNameSplit?.[fileNameSplit?.length - 1];


                // TODO: Find the class declaration
                // and put it's position into textspan
                definitionInfos.push({
                    name: classDeclaration?.name ?? '',
                    kind: tss.ScriptElementKind.classElement,
                    containerName: fileName ?? '',
                    containerKind: tss.ScriptElementKind.moduleElement,
                    fileName: basePath + "/" + matchingClass?.path ?? '',
                    textSpan: classDefinitionTextSpan ?? tss.createTextSpan(0, 0),
                    contextSpan: classDefinitionTextSpan ?? tss.createTextSpan(0, 0),
                });
            }

            if (isAttributeNameCompletion(completionContext)) {
                const matchingClass = findClassForTagName(cem, completionContext.tagName);
                let classDeclaration: CustomElement | undefined;
                if (matchingClass) {
                    classDeclaration = findCustomElementDeclarationFromModule(matchingClass);
                }
                // TODO: Find the attribute declaration
                // and put it's position into textspan
                definitionInfos.push({
                    name: classDeclaration?.name ?? '',
                    kind: tss.ScriptElementKind.classElement,
                    containerName: matchingClass?.path ?? '',
                    containerKind: tss.ScriptElementKind.moduleElement,
                    fileName: basePath + "/" + matchingClass?.path ?? '',
                    textSpan: tss.createTextSpan(0, 0)
                });
            }
        }

        return [...definitionInfos];
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
