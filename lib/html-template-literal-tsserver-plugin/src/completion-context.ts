import { TemplateContext } from "typescript-template-language-service-decorator";
import { createTextDocumentFromContext } from "./text-document.js";
import {
    Position,
    LanguageService
} from 'vscode-html-languageservice';
import pkg from 'vscode-html-languageservice';
const { TokenType } = pkg;

// Some of the context checks were borrowed from https://github.com/microsoft/vscode-html-languageservice/blob/main/src/services/htmlCompletion.ts

export function resolveCompletionContext(languageService: LanguageService, context: TemplateContext, position: Position): CompletionContext {
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
                        kind: CompletionContextKind.Tag,
                        tagName
                    } as TagCompletionContext;
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
                        kind: CompletionContextKind.EndTag,
                        tagName
                    } as TagCompletionContext;
                }
                break;
            default:
                break;
        }

        token = scanner.scan();
    }

    return {
        kind: CompletionContextKind.NOOP
    }
}

function resolveAttributeKind(attributeName: string, currentTag: string) {
    const tagName = currentTag;

    if (attributeName.startsWith("@")) {
        return {
            kind: CompletionContextKind.AtEvent,
            eventName: attributeName,
            tagName
        } as EventCompletionContext;
    }

    if (attributeName.startsWith("on")) {
        return {
            kind: CompletionContextKind.Event,
            eventName: attributeName,
            tagName
        } as EventCompletionContext;
    }

    if (attributeName.startsWith(".")) {
        return {
            kind: CompletionContextKind.PropertyName,
            propertyName: attributeName,
            tagName
        } as PropertyCompletionContext;
    }

    return {
        kind: CompletionContextKind.AttributeName,
        attributeName,
        tagName
    } as AttributeCompletionContext;
}

export interface CompletionContext {
    kind: CompletionContextKind;
}

export function isTagCompletion(context: CompletionContext): context is TagCompletionContext {
    return context.kind === CompletionContextKind.Tag;
}

export function isEndTagCompletion(context: CompletionContext): context is TagCompletionContext {
    return context.kind === CompletionContextKind.EndTag;
}

export function isAttributeNameCompletion(context: CompletionContext): context is AttributeCompletionContext {
    return context.kind === CompletionContextKind.AttributeName;
}

export function isPropertyNameCompletion(context: CompletionContext): context is PropertyCompletionContext {
    return context.kind === CompletionContextKind.PropertyName;
}

export function isEventNameCompletion(context: CompletionContext): context is EventCompletionContext {
    return context.kind === CompletionContextKind.Event || context.kind === CompletionContextKind.AtEvent;
}

export interface TagCompletionContext extends CompletionContext {
    tagName: string;
}

export interface AttributeLikeCompletionContext extends CompletionContext {
    tagName: string;
}

export interface AttributeCompletionContext extends AttributeLikeCompletionContext {
    attributeName: string;
}

export interface PropertyCompletionContext extends AttributeLikeCompletionContext {
    propertyName: string;
}

export interface EventCompletionContext extends AttributeLikeCompletionContext {
    eventName: string;
}

export enum CompletionContextKind {
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

/*
export declare enum TokenType {
    StartCommentTag = 0,
    Comment = 1,
    EndCommentTag = 2,
    StartTagOpen = 3,
    StartTagClose = 4,
    StartTagSelfClose = 5,
    StartTag = 6,
    EndTagOpen = 7,
    EndTagClose = 8,
    EndTag = 9,
    DelimiterAssign = 10,
    AttributeName = 11,
    AttributeValue = 12,
    StartDoctypeTag = 13,
    Doctype = 14,
    EndDoctypeTag = 15,
    Content = 16,
    Whitespace = 17,
    Unknown = 18,
    Script = 19,
    Styles = 20,
    EOS = 21
}
    * */
