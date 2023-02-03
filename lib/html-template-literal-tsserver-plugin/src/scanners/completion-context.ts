import { TemplateContext } from "typescript-template-language-service-decorator";
import * as tss from "typescript/lib/tsserverlibrary.js";
import { Position, LanguageService } from "vscode-html-languageservice";
import { createTextDocumentFromContext } from "../text-document.js";
import pkg from "vscode-html-languageservice";
const { TokenType } = pkg;

// Some of the context checks were borrowed from https://github.com/microsoft/vscode-html-languageservice/blob/main/src/services/htmlCompletion.ts

export function resolveActionContext(languageService: LanguageService, context: TemplateContext, position: Position): ActionContext {
    const document = createTextDocumentFromContext(context);
    const scanner = languageService.createScanner(document.getText());
    const offset = document.offsetAt(position);

    let currentTag = "";
    let token = scanner.scan();
    while (token !== TokenType.EOS && scanner.getTokenOffset() <= offset) {
        const tokenInfo = {
            offset: scanner.getTokenOffset(),
            length: scanner.getTokenLength(),
            end: scanner.getTokenEnd(),
            text: scanner.getTokenText(),
            type: scanner.getTokenType(),
            error: scanner.getTokenError(),
            state: scanner.getScannerState(),
        };
        const tokenOffset = scanner.getTokenOffset();
        const tokenLength = scanner.getTokenLength();

        const textSpan: tss.TextSpan = { start: tokenOffset, length: tokenLength };

        switch (token) {
            case TokenType.StartTag:
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
            case TokenType.AttributeName:
                if (scanner.getTokenOffset() <= offset && offset <= scanner.getTokenEnd()) {
                    const attributeName = scanner.getTokenText();
                    return resolveAttributeKind(attributeName, currentTag, textSpan);
                }
                break;
            case TokenType.AttributeValue:
                if (scanner.getTokenOffset() <= offset && offset <= scanner.getTokenEnd()) {
                    console.log("Attribute value");
                    // TODO: Can we hit this?
                }
                break;
            case TokenType.EndTag:
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

export interface ActionContext {
    kind: ActionContextKind;
    tagName: string;
    textSpan: tss.TextSpan;
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
