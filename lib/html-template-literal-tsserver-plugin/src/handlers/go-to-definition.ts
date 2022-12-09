import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import tss from "typescript/lib/tsserverlibrary.js";
import { getProjectBasePath } from "../template-context.js";
import { AttributeActionContext, isAttributeNameAction, isEndTagAction, isPropertyNameAction, isTagAction, PropertyActionContext, resolveActionContext, TagActionContext } from "../completion-context.js";
import { getLatestCEM } from "../cem/cem-instance.js";
import { findClassForTagName, findCustomElementDeclarationFromModule } from "../cem/cem-helpers.js";
import { CustomElement, JavaScriptModule, Package } from "custom-elements-manifest";
import { getAttributeDefinitionTextSpan, getClassDefinitionTextSpan, getPropertyDefinitionTextSpan, ZERO_TEXT_SPAN } from "../typescript-analyzer.js";
import { TemplateContext } from "typescript-template-language-service-decorator";
import { getFileNameFromPath } from "../fs.js";

export function getGoToDefinitionEntries(context: TemplateContext, position: tss.LineAndCharacter, htmlLanguageService: HtmlLanguageService) {
    const basePath = getProjectBasePath(context);
    let definitionInfos: Array<ts.DefinitionInfo> = [];
    const actionContext = resolveActionContext(htmlLanguageService, context, position);
    const cem = getLatestCEM();

    if (!cem) {
        return [...definitionInfos];
    }

    const matchingClass = findClassForTagName(cem, actionContext.tagName);
    if (!matchingClass) {
        return [...definitionInfos];
    }

    const fileName = getFileNameFromPath(matchingClass?.path);
    const classDeclaration = findCustomElementDeclarationFromModule(matchingClass);
    if (!classDeclaration) {
        return [...definitionInfos];
    }


    if (isTagAction(actionContext) || isEndTagAction(actionContext)) {
        definitionInfos = [...definitionInfos, ...getTagDefinitionsEntries(basePath, matchingClass, classDeclaration, fileName)];
    }

    if (isAttributeNameAction(actionContext)) {
        definitionInfos = [...definitionInfos, ...getAttributeDefinitionEntries(actionContext, basePath, matchingClass, classDeclaration, fileName)];
    }

    if (isPropertyNameAction(actionContext)) {
        definitionInfos = [...definitionInfos, ...getPropertyDefinitionEntries(actionContext, basePath, matchingClass, classDeclaration, fileName)];
    }

    return [...definitionInfos];
}

function getTagDefinitionsEntries(basePath: string, matchingClass: JavaScriptModule, classDeclaration: CustomElement, fileName: string) {
    const classDefinitionTextSpan = getClassDefinitionTextSpan(matchingClass, classDeclaration?.name ?? '', basePath);

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

function getAttributeDefinitionEntries(actionContext: AttributeActionContext, basePath: string, matchingClass: JavaScriptModule, classDeclaration: CustomElement, fileName: string) {
    const attributeDefinitionTextSpan = getAttributeDefinitionTextSpan(matchingClass, actionContext.attributeName ?? '', basePath);

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

function getPropertyDefinitionEntries(actionContext: PropertyActionContext, basePath: string, matchingClass: JavaScriptModule, classDeclaration: CustomElement, fileName: string) {
    const propertyDefinitionTextSpan = getPropertyDefinitionTextSpan(matchingClass, actionContext.propertyName ?? '', basePath);

    return [{
        name: classDeclaration?.name ?? '',
        kind: tss.ScriptElementKind.classElement,
        containerName: fileName ?? '',
        containerKind: tss.ScriptElementKind.moduleElement,
        fileName: basePath + "/" + matchingClass?.path ?? '',
        textSpan: propertyDefinitionTextSpan ?? ZERO_TEXT_SPAN,
        contextSpan: propertyDefinitionTextSpan ?? ZERO_TEXT_SPAN,
    }];
}
