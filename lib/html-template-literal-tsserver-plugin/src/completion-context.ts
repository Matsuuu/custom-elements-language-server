import { TemplateContext } from "typescript-template-language-service-decorator";
import { createTextDocumentFromContext } from "./text-document.js";
import {
    Position,
    LanguageService
} from 'vscode-html-languageservice';
import pkg from 'vscode-html-languageservice';
const { TokenType } = pkg;

export function resolveCompletionContext(languageService: LanguageService, context: TemplateContext, position: Position): CompletionContext {
    const document = createTextDocumentFromContext(context);
    const scanner = languageService.createScanner(document.getText());
    const offset = document.offsetAt(position);

    let token = scanner.scan();
    while (token !== TokenType.EOS && scanner.getTokenOffset() <= offset) {
        switch (token) {
            case TokenType.StartTag:
                if (scanner.getTokenOffset() <= offset && offset <= scanner.getTokenEnd()) {
                    const tagName = scanner.getTokenText();
                    return {
                        kind: CompletionContextKind.Tag,
                        tagName
                    } as TagCompletionContext;
                }
                break;
            case TokenType.AttributeName:
                if (scanner.getTokenOffset() <= offset && offset <= scanner.getTokenEnd()) {
                    const attributeName = scanner.getTokenText();
                    const tagName = "TODO";
                    return {
                        kind: CompletionContextKind.AttributeName,
                        attributeName,
                        tagName
                    } as AttributeCompletionContext;
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

export interface CompletionContext {
    kind: CompletionContextKind;
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
    propertyName: string;
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
