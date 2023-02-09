import { TemplateContext } from "typescript-template-language-service-decorator";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import tss from "typescript/lib/tsserverlibrary.js";
import { createTextDocumentFromContext } from "../text-document.js";
import { completionItemToCompletionEntry } from "../interop.js";
import { isAttributeNameAction, isEndTagAction, isEventNameAction, isPropertyNameAction, isTagAction, resolveActionContext } from "../scanners/action-context.js";
import { findCustomElementTagLike, findDeclarationForTagName } from "../cem/cem-helpers.js";
import { getCEMData } from "../export.js";

export function getCompletionEntries(context: TemplateContext, position: tss.LineAndCharacter, htmlLanguageService: HtmlLanguageService) {
    console.log("On completions");

    const htmlLSCompletions = getDefaultCompletionItems(context, position, htmlLanguageService);
    const defaultCompletionItems = htmlLSCompletions.items.map(completionItemToCompletionEntry);

    const document = createTextDocumentFromContext(context);
    const actionContext = resolveActionContext(htmlLanguageService, document, position);

    const cemCollection = getCEMData(context.fileName);
    let cemCompletions: tss.CompletionEntry[] = [];

    if (!cemCollection) {
        return {
            isGlobalCompletion: false,
            isMemberCompletion: false,
            isNewIdentifierLocation: false,
            entries: [...defaultCompletionItems],
        };
    }

    if (isTagAction(actionContext)) {

        const similiarTags = findCustomElementTagLike(cemCollection, actionContext.tagName);
        similiarTags.forEach(tag => {
            // TODO: This tag documentation stuff is ugly
            let tagDocumentation = "";
            if (tag.classInfo?.summary) {
                tagDocumentation += tag.classInfo?.summary;
            }
            if (tag.classInfo?.description) {
                if (tagDocumentation.length > 0) {
                    tagDocumentation += "\n\n";
                }
                tagDocumentation += tag.classInfo?.description;
            }
            //
            // TODO: LabelDetails to other stuff too. 
            // TODO: And format it
            cemCompletions.push({ name: tag.tagName, kind: tss.ScriptElementKind.memberVariableElement, sortText: tag.tagName, labelDetails: { description: tagDocumentation } });
        });
    }

    if (isEndTagAction(actionContext)) {
        // NOTE: This is done by vscode automatically?
        // Check if it's done everywhere and then do a check on completions if
        // the closing tag is already present.
    }

    if (isAttributeNameAction(actionContext)) {
        const classDeclaration = findDeclarationForTagName(cemCollection, actionContext.tagName);
        if (classDeclaration) {
            const attributes = classDeclaration.attributes;
            attributes?.forEach(attr => {
                cemCompletions.push({ name: attr.name, kind: tss.ScriptElementKind.memberVariableElement, sortText: attr.name });
            });
        }
    }

    if (isEventNameAction(actionContext)) {
        const classDeclaration = findDeclarationForTagName(cemCollection, actionContext.tagName);
        if (classDeclaration) {
            const events = classDeclaration.events;
            events?.forEach(event => {
                const eventNameWithAtSign = "@" + event.name;
                cemCompletions.push({ name: eventNameWithAtSign, kind: tss.ScriptElementKind.memberVariableElement, sortText: eventNameWithAtSign });
            });
        }
    }

    if (isPropertyNameAction(actionContext)) {
        const classDeclaration = findDeclarationForTagName(cemCollection, actionContext.tagName);
        if (classDeclaration) {
            const properties = classDeclaration?.members?.filter(mem => mem.kind === "field") ?? [];
            properties?.forEach(prop => {
                const propertyNameWithPeriodPrefix = "." + prop.name;
                cemCompletions.push({ name: prop.name, kind: tss.ScriptElementKind.memberVariableElement, sortText: propertyNameWithPeriodPrefix });
            });
        }
    }

    return {
        isGlobalCompletion: false,
        isMemberCompletion: false,
        isNewIdentifierLocation: false,
        entries: [...defaultCompletionItems, ...cemCompletions],
    };
}

function getDefaultCompletionItems(context: TemplateContext, position: tss.LineAndCharacter, htmlLanguageService: HtmlLanguageService) {
    const document = createTextDocumentFromContext(context);
    const htmlDoc = htmlLanguageService.parseHTMLDocument(document);
    const htmlCompletions = htmlLanguageService.doComplete(document, position, htmlDoc);
    // TODO: Cache

    return htmlCompletions;
}
