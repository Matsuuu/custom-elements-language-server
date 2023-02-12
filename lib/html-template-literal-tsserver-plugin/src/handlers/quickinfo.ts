// @ts-expect-error
import type { CustomElement, JavaScriptModule } from "custom-elements-manifest";
import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";
import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { getAttributeIdentifier, getClassIdentifier, getEventIdentifier, getPropertyIdentifier } from "../ast/identifier.js";
import { findClassForTagName, findCustomElementDeclarationFromModule } from "../cem/cem-helpers.js";
import { AttributeActionContext, EventActionContext, isAttributeNameAction, isEndTagAction, isEventNameAction, isPropertyNameAction, isTagAction, PropertyActionContext, resolveActionContext, TagActionContext } from "../scanners/action-context.js";
import { getFileNameFromPath } from "../fs.js";
import { getSourceFile } from "../ts/sourcefile.js";
import { attributeNameVariantBuilder } from "../ast/ast.js";
import { getCEMData } from "../export.js";

export function getQuickInfo(projectBasePath: string, document: HTMLLanguageService.TextDocument, position: tss.LineAndCharacter, htmlLanguageService: HTMLLanguageService.LanguageService): tss.QuickInfo | undefined {
    const actionContext = resolveActionContext(htmlLanguageService, document, position);
    const cemCollection = getCEMData(projectBasePath);

    if (!cemCollection.hasData()) {
        return undefined;
    }

    const matchingClass = findClassForTagName(cemCollection, actionContext.tagName);
    if (!matchingClass) {
        return undefined;
    }

    const fileName = getFileNameFromPath(matchingClass?.path);
    const fileFullText = getSourceFile(projectBasePath, matchingClass.path)?.getFullText() ?? '';
    const classDeclaration = findCustomElementDeclarationFromModule(matchingClass);
    if (!classDeclaration) {
        return undefined;
    }

    if (isTagAction(actionContext) || isEndTagAction(actionContext)) {
        return getTagQuickInfo(projectBasePath, matchingClass, classDeclaration, actionContext, fileFullText);
    }

    if (isAttributeNameAction(actionContext)) {
        return getAttributeQuickInfo(projectBasePath, matchingClass, classDeclaration, actionContext, fileName, fileFullText);
    }

    if (isPropertyNameAction(actionContext)) {
        return getPropertyQuickInfo(projectBasePath, matchingClass, classDeclaration, actionContext, fileName, fileFullText);
    }

    if (isEventNameAction(actionContext)) {
        return getEventQuickInfo(projectBasePath, matchingClass, classDeclaration, actionContext, fileName, fileFullText);
    }

    return undefined;
}

function getTagQuickInfo(basePath: string, matchingClass: JavaScriptModule, classDeclaration: CustomElement, actionContext: TagActionContext, fileFullText: string): tss.QuickInfo | undefined {
    const classIdentifier = getClassIdentifier(matchingClass.path, classDeclaration?.name, basePath,);

    let quickInfo: string = "";
    let className: string = "";

    const classDeclarationNode = classIdentifier?.parent;
    if (classDeclarationNode) {
        const commentRanges = ts.getLeadingCommentRanges(fileFullText, classDeclarationNode.pos);
        quickInfo = commentRangesToStringArray(commentRanges, fileFullText);
        className = classIdentifier.getText();
    } else {
        quickInfo = classDeclaration?.summary || "";
        className = classDeclaration?.name || '';
    }

    const classNameDocumentation = [
        "```typescript",
        "class " + className,
        "```"
    ].join("\n");

    return {
        kind: ts.ScriptElementKind.string,
        kindModifiers: "",
        textSpan: actionContext.textSpan,
        documentation: [
            {
                text: classNameDocumentation,
                kind: tss.SymbolDisplayPartKind.className.toString()
            },
            {
                text: quickInfo,
                kind: tss.SymbolDisplayPartKind.text.toString()
            }
        ]
    }
}

function getAttributeQuickInfo(basePath: any, matchingClass: JavaScriptModule, classDeclaration: CustomElement, actionContext: AttributeActionContext, fileName: string, fileFullText: string): tss.QuickInfo | undefined {
    const attributeName = actionContext.attributeName;
    const attributeVariants = attributeNameVariantBuilder(attributeName);
    const attributeIdentifier = getAttributeIdentifier(matchingClass.path, attributeName, basePath);
    const attributeDeclaration = attributeIdentifier?.parent;

    let quickInfo: string = "";

    if (attributeDeclaration) {
        const commentRanges = ts.getLeadingCommentRanges(fileFullText, attributeDeclaration.pos);
        quickInfo = commentRangesToStringArray(commentRanges, fileFullText);
    } else {
        const cemAttribute = classDeclaration.attributes?.find(attr => attr.name === attributeName);
        quickInfo = cemAttribute?.summary || '';
    }


    const attributeNameDocumentation = [
        "```typescript",
        "(attribute) <" + classDeclaration.tagName + " " + attributeVariants.snakeVariant + "=\"\">: string",
        "```"
    ].join("\n");

    return {
        kind: ts.ScriptElementKind.string,
        kindModifiers: "",
        textSpan: actionContext.textSpan,
        documentation: [
            {
                text: attributeNameDocumentation,
                kind: tss.SymbolDisplayPartKind.className.toString()
            },
            {
                text: quickInfo,
                kind: tss.SymbolDisplayPartKind.text.toString()
            }
        ]
    }
}

function getPropertyQuickInfo(basePath: any, matchingClass: JavaScriptModule, classDeclaration: CustomElement, actionContext: PropertyActionContext, fileName: string, fileFullText: string): tss.QuickInfo | undefined {
    const propertyName = actionContext.propertyName;
    const propertyIdentifier = getPropertyIdentifier(matchingClass.path, propertyName, basePath);
    const propertyDeclaration = propertyIdentifier?.parent;

    let quickInfo: string = "";

    if (propertyDeclaration) {
        const commentRanges = ts.getLeadingCommentRanges(fileFullText, propertyDeclaration.pos);
        quickInfo = commentRangesToStringArray(commentRanges, fileFullText);
    } else {
        const property = classDeclaration.members?.find(member => member.kind === "field" && member.name === propertyName);
        quickInfo = property?.description || '';
    }


    const propertyNameDocumentation = [
        "```typescript",
        "(property) " + classDeclaration.name + "." + propertyName + ": string",
        "```"
    ].join("\n");

    return {
        kind: ts.ScriptElementKind.string,
        kindModifiers: "",
        textSpan: actionContext.textSpan,
        documentation: [
            {
                text: propertyNameDocumentation,
                kind: tss.SymbolDisplayPartKind.className.toString()
            },
            {
                text: quickInfo,
                kind: tss.SymbolDisplayPartKind.text.toString()
            }
        ]
    }
}

function getEventQuickInfo(basePath: any, matchingClass: JavaScriptModule, classDeclaration: CustomElement, actionContext: EventActionContext, fileName: string, fileFullText: string): tss.QuickInfo | undefined {
    const eventName = actionContext.eventName;
    const eventIdentifier = getEventIdentifier(matchingClass.path, eventName, basePath);
    const eventDeclaration = eventIdentifier?.parent;

    let quickInfo: string = "";

    if (eventDeclaration) {
        const commentRanges = ts.getLeadingCommentRanges(fileFullText, eventDeclaration.pos);
        quickInfo = commentRangesToStringArray(commentRanges, fileFullText);
    } else {
        const event = classDeclaration.events?.find(event => event.name === eventName);
        quickInfo = event?.description || '';
    }


    const eventNameDocumentation = [
        "```typescript",
        "(event) " + eventName,
        "```"
    ].join("\n");

    return {
        kind: ts.ScriptElementKind.string,
        kindModifiers: "",
        textSpan: actionContext.textSpan,
        documentation: [
            {
                text: eventNameDocumentation,
                kind: tss.SymbolDisplayPartKind.className.toString()
            },
            {
                text: quickInfo,
                kind: tss.SymbolDisplayPartKind.text.toString()
            }
        ]
    }
}

function commentRangesToStringArray(commentRanges: Array<ts.CommentRange> | undefined, fileFullText: string) {
    return commentRanges?.reduce((info, range) => {
        if (info.length > 0) {
            info += "\n";
        }
        info += commentRangeToText(range, fileFullText);
        return info;
    }, "") ?? "";
}

function commentRangeToText(commentRange: ts.CommentRange, fileFullText: string) {
    const commentText = fileFullText.substring(commentRange.pos, commentRange.end);
    if (commentRange.kind === ts.SyntaxKind.SingleLineCommentTrivia) {
        return commentText.substring(2);
    }

    const commentTextSanitized = commentText.split("\n")
        .map(line => {
            let end = 2;
            if (line.trimEnd().endsWith("*/") || line.trimStart().startsWith("/**")) {
                end = line.length
            }
            return line.trimStart().substring(end)
        })
        .join("\n")
        .trim();

    return commentTextSanitized;
}

