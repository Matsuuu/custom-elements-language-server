import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import tss from "typescript/lib/tsserverlibrary.js";
import { getProjectBasePath } from "../template-context.js";
import {
    AttributeActionContext,
    EventActionContext,
    isAttributeNameAction,
    isEndTagAction,
    isEventNameAction,
    isPropertyNameAction,
    isTagAction,
    PropertyActionContext,
    resolveActionContext,
} from "../scanners/completion-context.js";
import { findClassForTagName, findCustomElementDeclarationFromModule } from "../cem/cem-helpers.js";
import { CustomElement, JavaScriptModule } from "custom-elements-manifest";
import { TemplateContext } from "typescript-template-language-service-decorator";
import { getFileNameFromPath } from "../fs.js";
import { getAttributeDefinitionTextSpan, getClassDefinitionTextSpan, getEventDefinitionTextSpan, getPropertyDefinitionTextSpan } from "../ast/text-span.js";
import { getCEMData } from "../export.js";

export function getGoToDefinitionEntries(context: TemplateContext, position: tss.LineAndCharacter, htmlLanguageService: HtmlLanguageService) {
    const basePath = getProjectBasePath(context);
    let definitionInfos: Array<ts.DefinitionInfo> = [];
    const actionContext = resolveActionContext(htmlLanguageService, context, position);
    const cemCollection = getCEMData(context.fileName);

    if (!cemCollection.hasData()) {
        return [...definitionInfos];
    }

    const matchingClass = findClassForTagName(cemCollection, actionContext.tagName);
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

    if (isEventNameAction(actionContext)) {
        definitionInfos = [...definitionInfos, ...getEventDefinitionEntries(actionContext, basePath, matchingClass, classDeclaration, fileName)];
    }

    return [...definitionInfos];
}

function getTagDefinitionsEntries(basePath: string, matchingClass: JavaScriptModule, classDeclaration: CustomElement, fileName: string) {
    const classDefinitionTextSpan = getClassDefinitionTextSpan(matchingClass, classDeclaration?.name ?? "", basePath);

    return [
        {
            name: classDeclaration?.name ?? "",
            kind: tss.ScriptElementKind.classElement,
            containerName: fileName ?? "",
            containerKind: tss.ScriptElementKind.moduleElement,
            fileName: basePath + "/" + matchingClass?.path ?? "",
            textSpan: classDefinitionTextSpan,
            contextSpan: classDefinitionTextSpan,
        },
    ];
}

function getAttributeDefinitionEntries(
    actionContext: AttributeActionContext,
    basePath: string,
    matchingClass: JavaScriptModule,
    classDeclaration: CustomElement,
    fileName: string,
) {
    const attributeDefinitionTextSpan = getAttributeDefinitionTextSpan(matchingClass, actionContext.attributeName ?? "", basePath);

    return [
        {
            name: classDeclaration?.name ?? "",
            kind: tss.ScriptElementKind.classElement,
            containerName: fileName ?? "",
            containerKind: tss.ScriptElementKind.moduleElement,
            fileName: basePath + "/" + matchingClass?.path ?? "",
            textSpan: attributeDefinitionTextSpan,
            contextSpan: attributeDefinitionTextSpan,
        },
    ];
}

function getPropertyDefinitionEntries(
    actionContext: PropertyActionContext,
    basePath: string,
    matchingClass: JavaScriptModule,
    classDeclaration: CustomElement,
    fileName: string,
) {
    const propertyDefinitionTextSpan = getPropertyDefinitionTextSpan(matchingClass, actionContext.propertyName ?? "", basePath);

    return [
        {
            name: classDeclaration?.name ?? "",
            kind: tss.ScriptElementKind.classElement,
            containerName: fileName ?? "",
            containerKind: tss.ScriptElementKind.moduleElement,
            fileName: basePath + "/" + matchingClass?.path ?? "",
            textSpan: propertyDefinitionTextSpan,
            contextSpan: propertyDefinitionTextSpan,
        },
    ];
}

function getEventDefinitionEntries(
    actionContext: EventActionContext,
    basePath: string,
    matchingClass: JavaScriptModule,
    classDeclaration: CustomElement,
    fileName: string,
) {
    const eventDefinitionTextSpan = getEventDefinitionTextSpan(matchingClass, actionContext.eventName ?? "", basePath);

    return [
        {
            name: classDeclaration?.name ?? "",
            kind: tss.ScriptElementKind.classElement,
            containerName: fileName ?? "",
            containerKind: tss.ScriptElementKind.moduleElement,
            fileName: basePath + "/" + matchingClass?.path ?? "",
            textSpan: eventDefinitionTextSpan,
            contextSpan: eventDefinitionTextSpan,
        },
    ];
}
