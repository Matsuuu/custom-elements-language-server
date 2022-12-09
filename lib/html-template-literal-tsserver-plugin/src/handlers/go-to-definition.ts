import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import tss from "typescript/lib/tsserverlibrary.js";
import { getProjectBasePath } from "../template-context.js";
import { AttributeCompletionContext, isAttributeNameCompletion, isTagCompletion, resolveCompletionContext, TagCompletionContext } from "../completion-context.js";
import { getLatestCEM } from "../cem/cem-instance.js";
import { findClassForTagName, findCustomElementDeclarationFromModule } from "../cem/cem-helpers.js";
import { Package } from "custom-elements-manifest";
import { getAttributeDefinitionTextSpan, getClassDefinitionTextSpan, ZERO_TEXT_SPAN } from "../typescript-analyzer.js";
import { TemplateContext } from "typescript-template-language-service-decorator";
import { getFileNameFromPath } from "../fs.js";

export function getGoToDefinitionEntries(context: TemplateContext, position: ts.LineAndCharacter, htmlLanguageService: HtmlLanguageService) {
    const basePath = getProjectBasePath(context);
    let definitionInfos: Array<ts.DefinitionInfo> = [];
    const completionContext = resolveCompletionContext(htmlLanguageService, context, position);
    const cem = getLatestCEM();

    if (!cem) {
        return [];
    }

    if (cem) {
        // TODO: Clean all of this stuff inside the if (cem)
        if (isTagCompletion(completionContext)) {
            definitionInfos = [...definitionInfos, ...getTagDefinitionsEntries(cem, completionContext, basePath)];
        }

        if (isAttributeNameCompletion(completionContext)) {
            definitionInfos = [...definitionInfos, ...getAttributeDefinitionEntries(cem, completionContext, basePath)];
        }
    }

    return [...definitionInfos];
}

function getTagDefinitionsEntries(cem: Package, completionContext: TagCompletionContext, basePath: string) {
    const matchingClass = findClassForTagName(cem, completionContext.tagName);
    if (!matchingClass) {
        return [];
    }

    const classDeclaration = findCustomElementDeclarationFromModule(matchingClass);
    if (!classDeclaration) {
        return [];
    }

    const classDefinitionTextSpan = getClassDefinitionTextSpan(matchingClass, classDeclaration?.name ?? '', basePath);
    const fileName = getFileNameFromPath(matchingClass?.path);

    return [{
        name: classDeclaration?.name ?? '',
        kind: tss.ScriptElementKind.classElement,
        containerName: fileName ?? '',
        containerKind: tss.ScriptElementKind.moduleElement,
        fileName: basePath + "/" + matchingClass?.path ?? '',
        textSpan: classDefinitionTextSpan ?? ZERO_TEXT_SPAN,
        contextSpan: classDefinitionTextSpan ?? ZERO_TEXT_SPAN,
    }];
}

function getAttributeDefinitionEntries(cem: Package, completionContext: AttributeCompletionContext, basePath: string) {
    const matchingClass = findClassForTagName(cem, completionContext.tagName);
    if (!matchingClass) {
        return [];
    }

    const classDeclaration = findCustomElementDeclarationFromModule(matchingClass);
    if (!classDeclaration) {
        return [];
    }

    const attributeDefinitionTextSpan = getAttributeDefinitionTextSpan(matchingClass, completionContext.attributeName ?? '', basePath);
    const fileName = getFileNameFromPath(matchingClass?.path);

    return [{
        name: classDeclaration?.name ?? '',
        kind: tss.ScriptElementKind.classElement,
        containerName: fileName ?? '',
        containerKind: tss.ScriptElementKind.moduleElement,
        fileName: basePath + "/" + matchingClass?.path ?? '',
        textSpan: attributeDefinitionTextSpan ?? ZERO_TEXT_SPAN,
        contextSpan: attributeDefinitionTextSpan ?? ZERO_TEXT_SPAN,
    }];
}
