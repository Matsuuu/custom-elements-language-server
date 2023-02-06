import { CustomElement, JavaScriptModule } from "custom-elements-manifest";
import { TemplateContext } from "typescript-template-language-service-decorator";
import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import { getAttributeIdentifier, getClassIdentifier, getEventIdentifier, getPropertyIdentifier } from "../ast/identifier.js";
import { findClassForTagName, findCustomElementDeclarationFromModule } from "../cem/cem-helpers.js";
import { AttributeActionContext, EventActionContext, isAttributeNameAction, isEndTagAction, isEventNameAction, isPropertyNameAction, isTagAction, PropertyActionContext, resolveActionContext, TagActionContext } from "../scanners/completion-context.js";
import { getFileNameFromPath } from "../fs.js";
import { getProjectBasePath } from "../template-context.js";
import { getSourceFile } from "../ts/sourcefile.js";
import { getAttributeDefinitionTextSpan, getClassDefinitionTextSpan, getEventDefinitionTextSpan, getPropertyDefinitionTextSpan } from "../ast/text-span.js";
import { attributeNameVariantBuilder } from "../ast/ast.js";
import { getCEMData } from "../export.js";

export function getQuickInfo(context: TemplateContext, position: tss.LineAndCharacter, htmlLanguageService: HtmlLanguageService): tss.QuickInfo | undefined {
    const basePath = getProjectBasePath(context);
    const actionContext = resolveActionContext(htmlLanguageService, context, position);
    const cemCollection = getCEMData(context.fileName);

    if (!cemCollection.hasData()) {
        return undefined;
    }

    const matchingClass = findClassForTagName(cemCollection, actionContext.tagName);
    if (!matchingClass) {
        return undefined;
    }

    const fileName = getFileNameFromPath(matchingClass?.path);
    const fileFullText = getSourceFile(basePath, matchingClass.path)?.getFullText() ?? '';
    const classDeclaration = findCustomElementDeclarationFromModule(matchingClass);
    if (!classDeclaration) {
        return undefined;
    }

    if (isTagAction(actionContext) || isEndTagAction(actionContext)) {
        return getTagQuickInfo(basePath, matchingClass, classDeclaration, actionContext, fileFullText);
    }

    if (isAttributeNameAction(actionContext)) {
        return getAttributeQuickInfo(basePath, matchingClass, classDeclaration, actionContext, fileName, fileFullText);
    }

    if (isPropertyNameAction(actionContext)) {
        return getPropertyQuickInfo(basePath, matchingClass, classDeclaration, actionContext, fileName, fileFullText);
    }

    if (isEventNameAction(actionContext)) {
        return getEventQuickInfo(basePath, matchingClass, classDeclaration, actionContext, fileName, fileFullText);
    }

    return undefined;
}

function getTagQuickInfo(basePath: string, matchingClass: JavaScriptModule, classDeclaration: CustomElement, actionContext: TagActionContext, fileFullText: string): tss.QuickInfo | undefined {
    const classIdentifier = getClassIdentifier(matchingClass.path, classDeclaration?.name, basePath,);
    const cemClass = findClassForTagName(getCEMData(matchingClass.path), actionContext.tagName);
    // TODO: Do the docs with the CEMClass instead of the classDeclaration if classDeclaration is missing.
    // TODO: Implement this everywhere

    let quickInfo: string = "";
    let className: string = "";

    const classDeclarationNode = classIdentifier?.parent;
    if (classDeclarationNode) {
        const commentRanges = ts.getLeadingCommentRanges(fileFullText, classDeclarationNode.pos);
        quickInfo = commentRangesToStringArray(commentRanges, fileFullText);
        className = classIdentifier.getText();
    } else {
        const classDeclaration = cemClass?.declarations?.find(decl => decl.kind === "class");
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
    if (!attributeDeclaration) {
        return undefined;
    }

    const commentRanges = ts.getLeadingCommentRanges(fileFullText, attributeDeclaration.pos);
    const quickInfo = commentRangesToStringArray(commentRanges, fileFullText);

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
    if (!propertyDeclaration) {
        return undefined;
    }

    const commentRanges = ts.getLeadingCommentRanges(fileFullText, propertyDeclaration.pos);
    const quickInfo = commentRangesToStringArray(commentRanges, fileFullText);

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
    if (!eventDeclaration) {
        return undefined;
    }

    const commentRanges = ts.getLeadingCommentRanges(fileFullText, eventDeclaration.pos);
    const quickInfo = commentRangesToStringArray(commentRanges, fileFullText);

    const attributeNameDocumentation = [
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

