import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import tss from "typescript/lib/tsserverlibrary.js";
import { getProjectBasePath } from "../template-context.js";
import { AttributeCompletionContext, isAttributeNameCompletion, isTagCompletion, resolveCompletionContext, TagCompletionContext } from "../completion-context.js";
import { getLatestCEM } from "../cem/cem-instance.js";
import { findClassForTagName, findCustomElementDeclarationFromModule } from "../cem/cem-helpers.js";
import { CustomElement, Package } from "custom-elements-manifest";
import { getAttributeDefinitionTextSpan, getClassDefinitionTextSpan } from "../typescript-analyzer.js";
import { TemplateContext } from "typescript-template-language-service-decorator";

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
            definitionInfos = [...definitionInfos, ...getTagCompletionEntries(cem, completionContext, basePath)];
        }

        if (isAttributeNameCompletion(completionContext)) {
            definitionInfos = [...definitionInfos, ...getAttributeCompletionEntries(cem, completionContext, basePath)];
        }
    }

    return [...definitionInfos];
}

function getTagCompletionEntries(cem: Package, completionContext: TagCompletionContext, basePath: string) {
    const matchingClass = findClassForTagName(cem, completionContext.tagName);
    if (!matchingClass) {
        return [];
    }

    const classDeclaration = findCustomElementDeclarationFromModule(matchingClass);
    if (!classDeclaration) {
        return [];
    }

    const classDefinitionTextSpan = getClassDefinitionTextSpan(matchingClass, classDeclaration?.name ?? '', basePath);
    const fileName = matchingClass?.path.split("/").slice(-1)[0];

    return [{
        name: classDeclaration?.name ?? '',
        kind: tss.ScriptElementKind.classElement,
        containerName: fileName ?? '',
        containerKind: tss.ScriptElementKind.moduleElement,
        fileName: basePath + "/" + matchingClass?.path ?? '',
        textSpan: classDefinitionTextSpan ?? tss.createTextSpan(0, 0),
        contextSpan: classDefinitionTextSpan ?? tss.createTextSpan(0, 0),
    }];
}

function getAttributeCompletionEntries(cem: Package, completionContext: AttributeCompletionContext, basePath: string) {
    const matchingClass = findClassForTagName(cem, completionContext.tagName);

    if (!matchingClass) {
        return [];
    }
    const classDeclaration = findCustomElementDeclarationFromModule(matchingClass);
    if (!classDeclaration) {
        return [];
    }

    getAttributeDefinitionTextSpan(matchingClass, completionContext.attributeName ?? '', basePath);

    // TODO: Find the attribute declaration
    // and put it's position into textspan
    return [{
        name: classDeclaration?.name ?? '',
        kind: tss.ScriptElementKind.classElement,
        containerName: matchingClass?.path ?? '',
        containerKind: tss.ScriptElementKind.moduleElement,
        fileName: basePath + "/" + matchingClass?.path ?? '',
        textSpan: tss.createTextSpan(0, 0)
    }];
}
