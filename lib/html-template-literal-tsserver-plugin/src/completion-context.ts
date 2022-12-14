import { TemplateContext } from "typescript-template-language-service-decorator";
import { createTextDocumentFromContext } from "./text-document.js";
import {
    Position,
    LanguageService
} from 'vscode-html-languageservice';
import pkg from 'vscode-html-languageservice';
const { TokenType } = pkg;

// Some of the context checks were borrowed from https://github.com/microsoft/vscode-html-languageservice/blob/main/src/services/htmlCompletion.ts

export function resolveActionContext(languageService: LanguageService, context: TemplateContext, position: Position): ActionContext {
    const document = createTextDocumentFromContext(context);
    const scanner = languageService.createScanner(document.getText());
    const offset = document.offsetAt(position);
    // NOTE: Currently there's some issues with using this scanner
    // as it breaks on tag implementations using non javascript escaped 
    // content.
    //
    // e.g. this breaks the scanner, making it only hit TokenType.EOS
    //
    // <example-project 
    //  @my-custom-event=${() => {}}
    //  pro
    // ></example-project>
    //
    // Issued ticket: https://github.com/microsoft/vscode-html-languageservice/issues/148

    let currentTag = "";
    let token = scanner.scan();
    while (token !== TokenType.EOS && scanner.getTokenOffset() <= offset) {
        switch (token) {
            case TokenType.StartTag:
                const tagName = scanner.getTokenText();
                currentTag = tagName;

                if (scanner.getTokenOffset() <= offset && offset <= scanner.getTokenEnd()) {
                    return {
                        kind: ActionContextKind.Tag,
                        tagName
                    } as TagActionContext;
                }
                break;
            case TokenType.AttributeName:
                if (scanner.getTokenOffset() <= offset && offset <= scanner.getTokenEnd()) {
                    const attributeName = scanner.getTokenText();
                    return resolveAttributeKind(attributeName, currentTag);
                }
                //currentAttributeName = scanner.getTokenText();
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
                        tagName
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
        tagName: ''
    }
}

function resolveAttributeKind(attributeName: string, currentTag: string) {
    const tagName = currentTag;

    if (attributeName.startsWith("@")) {
        return {
            kind: ActionContextKind.AtEvent,
            eventName: attributeName.substring(1),
            tagName
        } as EventActionContext;
    }

    if (attributeName.startsWith("on")) {
        return {
            kind: ActionContextKind.Event,
            eventName: attributeName,
            tagName
        } as EventActionContext;
    }

    if (attributeName.startsWith(".")) {
        return {
            kind: ActionContextKind.PropertyName,
            propertyName: attributeName.substring(1),
            tagName
        } as PropertyActionContext;
    }

    return {
        kind: ActionContextKind.AttributeName,
        attributeName,
        tagName
    } as AttributeActionContext;
}

export interface ActionContext {
    kind: ActionContextKind;
    tagName: string;
}

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

export interface TagActionContext extends ActionContext {
}

export interface AttributeLikeActionContext extends ActionContext {
}

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
    NOOP
};

