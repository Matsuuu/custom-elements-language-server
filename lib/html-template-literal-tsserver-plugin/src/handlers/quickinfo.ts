import { CustomElement, JavaScriptModule } from "custom-elements-manifest";
import { TemplateContext } from "typescript-template-language-service-decorator";
import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import { getClassIdentifier } from "../ast/identifier.js";
import { findClassForTagName, findCustomElementDeclarationFromModule } from "../cem/cem-helpers.js";
import { getLatestCEM } from "../cem/cem-instance.js";
import { isAttributeNameAction, isEndTagAction, isEventNameAction, isPropertyNameAction, isTagAction, resolveActionContext } from "../completion-context.js";
import { getFileNameFromPath } from "../fs.js";
import { getProjectBasePath } from "../template-context.js";
import { getSourceFile } from "../ts/sourcefile.js";
import { getClassDefinitionTextSpan } from "../ast/text-span.js";

export function getQuickInfo(context: TemplateContext, position: tss.LineAndCharacter, htmlLanguageService: HtmlLanguageService): tss.QuickInfo | undefined {
    const basePath = getProjectBasePath(context);
    const actionContext = resolveActionContext(htmlLanguageService, context, position);
    const cem = getLatestCEM();

    if (!cem) {
        return undefined;
    }

    const matchingClass = findClassForTagName(cem, actionContext.tagName);
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
        return getTagQuickInfo(basePath, matchingClass, classDeclaration, fileName, fileFullText);
    }

    if (isAttributeNameAction(actionContext)) {
    }

    if (isPropertyNameAction(actionContext)) {
    }

    if (isEventNameAction(actionContext)) {
    }

    return undefined;
}

function getTagQuickInfo(basePath: string, matchingClass: JavaScriptModule, classDeclaration: CustomElement, fileName: string, fileFullText: string): tss.QuickInfo | undefined {
    const classIdentifier = getClassIdentifier(matchingClass.path, classDeclaration?.name, basePath,);
    const classDeclarationNode = classIdentifier?.parent;
    if (!classDeclarationNode) {
        return undefined;
    }
    const classDefinitionTextSpan = getClassDefinitionTextSpan(matchingClass, classDeclaration?.name ?? "", basePath);

    const commentRanges = ts.getLeadingCommentRanges(fileFullText, classDeclarationNode.pos);
    const quickInfo = commentRanges?.reduce((info, range) => {
        if (info.length > 0) {
            info += "\n";
        }
        info += commentRangeToText(range, fileFullText);
        return info;
    }, "") ?? "";
    // TODO: Return class name block and possibly something else. e.g. jsdoc annotated parts in separate blocks
    // e.g. @fires foo
    const classNameDocumentation = [
        "```typescript",
        "class " + classIdentifier.getText(),
        "```"
    ].join("\n");

    return {
        kind: ts.ScriptElementKind.string,
        kindModifiers: "",
        textSpan: classDefinitionTextSpan,
        documentation: [
            {
                text: classNameDocumentation,
                kind: tss.SymbolDisplayPartKind.className.toString()
            },
            {
                text: quickInfo,
                kind: tss.SymbolDisplayPartKind.text.toString() // TODO ??
            }
        ]
    }
}

function commentRangeToText(commentRange: ts.CommentRange, fileFullText: string) {
    const commentText = fileFullText.substring(commentRange.pos, commentRange.end);
    if (commentRange.kind === ts.SyntaxKind.SingleLineCommentTrivia) {
        return commentText.substring(2);
    }

    const commentTextSanitized = commentText.split("\n")
        .map(line => {
            let end = 3;
            if (line.trimEnd().endsWith("*/") || line.trimEnd().endsWith("/**")) {
                end = line.length
            }
            return line.substring(end)
        })
        .join("\n")
        .trim();

    return commentTextSanitized;
}
