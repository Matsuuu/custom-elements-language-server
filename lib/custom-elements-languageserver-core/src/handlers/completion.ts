import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import tss from "typescript/lib/tsserverlibrary.js";
import { isAttributeNameAction, isEndTagAction, isEventNameAction, isPropertyNameAction, isTagAction, resolveActionContext } from "../scanners/action-context.js";
import { findCustomElementTagLike, findDeclarationForTagName } from "../cem/cem-helpers.js";
import { getCEMData } from "../export.js";
import { completionItemToCompletionEntry } from "../interop.js";
// @ts-expect-error
import { ClassField } from "custom-elements-manifest";
import { CustomElementsLanguageServiceRequest } from "../request.js";

export function getCompletionEntries(request: CustomElementsLanguageServiceRequest) {

    const { project, projectBasePath, htmlLanguageService, document, position } = request;

    const actionContext = resolveActionContext(htmlLanguageService, document, position);

    const htmlLSCompletions = getDefaultCompletionItems(document, position, htmlLanguageService);
    // const defaultCompletionItems = htmlLSCompletions.items.map(completionItemToCompletionEntry);

    const cemCollection = getCEMData(project, projectBasePath);
    let cemCompletions: tss.CompletionEntry[] = [];

    if (!cemCollection) {
        return {
            isGlobalCompletion: false,
            isMemberCompletion: false,
            isNewIdentifierLocation: false,
            // entries: [...defaultCompletionItems],
            entries: [],
        };
    }

    if (isTagAction(actionContext)) {

        const similiarTags = findCustomElementTagLike(cemCollection, actionContext.tagName);
        similiarTags.forEach(tag => {
            // TODO: This tag documentation stuff is ugly

            const tagDocumentationParts = [
                "```html",
                "<" + tag.tagName + ">",
                "```",
            ]

            if (tag.classInfo?.summary) {
                tagDocumentationParts.push(tag.classInfo?.summary);
            }
            if (tag.classInfo?.description) {
                if (tag.classInfo?.summary) {
                    tagDocumentationParts.push("\n\n");
                }
                tagDocumentationParts.push(tag.classInfo?.description);
            }

            const tagDocumentation = tagDocumentationParts.join("\n");

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
                const defaultValueDocumentation = attr.default ? `(Default: ${attr.default})` : "";
                const documentationParts = [
                    "```javascript",
                    `${attr.name}="${attr.type?.text}"`,
                    defaultValueDocumentation,
                    "```",
                ];
                const documentation = documentationParts.filter(row => row.length > 0).join("\n");
                cemCompletions.push({ name: attr.name, kind: tss.ScriptElementKind.memberVariableElement, sortText: attr.name, labelDetails: { description: documentation } });
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
            const properties = classDeclaration?.members?.filter((mem): mem is ClassField => mem.kind === "field") ?? [];
            properties?.forEach(prop => {
                const propertyNameWithPeriodPrefix = "." + prop.name;

                const defaultValueDocumentation = prop.default ? `(Default: ${prop.default})` : "";
                const documentationParts = [
                    "```javascript",
                    `${prop.name}="${prop.type?.text}"`,
                    defaultValueDocumentation,
                    "```",
                ];
                const documentation = documentationParts.filter(row => row.length > 0).join("\n");

                cemCompletions.push({ name: prop.name, kind: tss.ScriptElementKind.memberVariableElement, sortText: propertyNameWithPeriodPrefix, labelDetails: { description: documentation } });
            });
        }
    }

    return {
        isGlobalCompletion: false,
        isMemberCompletion: false,
        isNewIdentifierLocation: false,
        // entries: [...defaultCompletionItems, ...cemCompletions],
        entries: [...cemCompletions],
    };
}

function getDefaultCompletionItems(document: HTMLLanguageService.TextDocument, position: tss.LineAndCharacter, htmlLanguageService: HtmlLanguageService) {
    const htmlDoc = htmlLanguageService.parseHTMLDocument(document);
    const htmlCompletions = htmlLanguageService.doComplete(document, position, htmlDoc);
    // TODO: Cache

    return htmlCompletions;
}
