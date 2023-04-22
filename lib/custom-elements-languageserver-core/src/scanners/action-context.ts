import * as tss from "typescript/lib/tsserverlibrary.js";
import { Position, LanguageService, TextDocument } from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";

// Some of the context checks were borrowed from https://github.com/microsoft/vscode-html-languageservice/blob/main/src/services/htmlCompletion.ts

export function resolveActionContext(languageService: LanguageService, document: TextDocument, position: Position): ActionContext {
    const scanner = languageService.createScanner(document.getText());
    const offset = document.offsetAt(position);

    let currentTag = "";
    let currentAttribute;
    let token = scanner.scan();
    while (token !== HTMLLanguageService.TokenType.EOS && scanner.getTokenOffset() <= offset) {
        const tokenOffset = scanner.getTokenOffset();
        const tokenLength = scanner.getTokenLength();

        const textSpan: tss.TextSpan = { start: tokenOffset, length: tokenLength };

        switch (token) {
            case HTMLLanguageService.TokenType.StartTag:
                const tagName = scanner.getTokenText();
                currentTag = tagName;

                if (scanner.getTokenOffset() <= offset && offset <= scanner.getTokenEnd()) {
                    return {
                        kind: ActionContextKind.Tag,
                        tagName,
                        textSpan
                    } as TagActionContext;
                }
                break;
            case HTMLLanguageService.TokenType.AttributeName:
                const attributeName = scanner.getTokenText();
                currentAttribute = attributeName;
                if (scanner.getTokenOffset() <= offset && offset <= scanner.getTokenEnd()) {
                    return resolveAttributeKind(attributeName, currentTag, textSpan);
                }
                break;
            case HTMLLanguageService.TokenType.AttributeValue:
                if (scanner.getTokenOffset() <= offset && offset <= scanner.getTokenEnd()) {
                    const attributeValue = scanner.getTokenText(); // TODO: Utilize
                    return resolveAttributeValueKind(currentAttribute ?? "", currentTag, textSpan);
                }
                break;
            case HTMLLanguageService.TokenType.EndTag:
                if (offset <= scanner.getTokenEnd()) {
                    const tagName = scanner.getTokenText();
                    return {
                        kind: ActionContextKind.EndTag,
                        tagName,
                        textSpan
                    } as TagActionContext;
                }
                break;
            default:
                break;
        }

        token = scanner.scan();
    }

    return {
        kind: ActionContextKind.NOOP,
        tagName: "",
        textSpan: ZERO_TEXTSPAN
    };
}

function resolveAttributeKind(attributeName: string, currentTag: string, textSpan: tss.TextSpan) {
    const tagName = currentTag;

    if (attributeName.startsWith("@")) {
        return {
            kind: ActionContextKind.AtEvent,
            eventName: attributeName.substring(1),
            tagName,
            textSpan
        } as EventActionContext;
    }

    if (attributeName.startsWith("on")) {
        return {
            kind: ActionContextKind.Event,
            eventName: attributeName,
            tagName,
            textSpan
        } as EventActionContext;
    }

    if (attributeName.startsWith(".")) {
        return {
            kind: ActionContextKind.PropertyName,
            propertyName: attributeName.substring(1),
            tagName,
            textSpan
        } as PropertyActionContext;
    }

    return {
        kind: ActionContextKind.AttributeName,
        attributeName,
        tagName,
        textSpan
    } as AttributeActionContext;
}

function resolveAttributeValueKind(attributeName: string, currentTag: string, textSpan: tss.TextSpan) {
    const tagName = currentTag;

    if (attributeName.startsWith("@")) {
        // TODO: Do something?
        return {
            kind: ActionContextKind.NOOP,
            tagName: "",
            textSpan: ZERO_TEXTSPAN
        };
    }

    if (attributeName.startsWith("on")) {
        // TODO: Do something?
        return {
            kind: ActionContextKind.NOOP,
            tagName: "",
            textSpan: ZERO_TEXTSPAN
        };
    }

    if (attributeName.startsWith(".")) {
        return {
            kind: ActionContextKind.PropertyValue,
            propertyName: attributeName.substring(1),
            tagName,
            textSpan,
            propertyValue: "" // TODO
        } as PropertyValueActionContext;
    }

    return {
        kind: ActionContextKind.AttributeValue,
        attributeName,
        tagName,
        textSpan,
        attributeValue: "" // TODO
    } as AttributeValueActionContext;
}

const ZERO_TEXTSPAN: tss.TextSpan = { start: 0, length: 0 };

export function isTagAction(context: ActionContext): context is TagActionContext {
    return context.kind === ActionContextKind.Tag;
}

export function isEndTagAction(context: ActionContext): context is TagActionContext {
    return context.kind === ActionContextKind.EndTag;
}

export function isAttributeNameAction(context: ActionContext): context is AttributeActionContext {
    return context.kind === ActionContextKind.AttributeName;
}

export function isPropertyNameAction(context: ActionContext): context is PropertyActionContext {
    return context.kind === ActionContextKind.PropertyName;
}

export function isEventNameAction(context: ActionContext): context is EventActionContext {
    return context.kind === ActionContextKind.Event || context.kind === ActionContextKind.AtEvent;
}

export function isAttributeValueAction(context: ActionContext): context is AttributeValueActionContext {
    return context.kind === ActionContextKind.AttributeValue;
}

export function isPropertyValueAction(context: ActionContext): context is PropertyValueActionContext {
    return context.kind === ActionContextKind.PropertyValue;
}

export interface ActionContext {
    kind: ActionContextKind;
    tagName: string;
    textSpan: tss.TextSpan;
}

export interface TagActionContext extends ActionContext { }

export interface AttributeLikeActionContext extends ActionContext { }

export interface AttributeActionContext extends AttributeLikeActionContext {
    attributeName: string;
}

export interface PropertyActionContext extends AttributeLikeActionContext {
    propertyName: string;
}

export interface EventActionContext extends AttributeLikeActionContext {
    eventName: string;
}

export interface AttributeValueActionContext extends ActionContext {
    attributeName: string;
    attributeValue: string;
}

export interface PropertyValueActionContext extends ActionContext {
    propertyName: string;
    propertyValue: string;
}

export enum ActionContextKind {
    Tag,
    EndTag,
    AttributeName,
    AttributeValue,
    Event,
    AtEvent,
    PropertyName,
    PropertyValue,
    NOOP,
}
