import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";
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
} from "../scanners/action-context.js";
import { findClassForTagName, findCustomElementDeclarationFromModule, JavaScriptModuleWithRef } from "../cem/cem-helpers.js";
// @ts-expect-error
import { CustomElement } from "custom-elements-manifest";
import { getFileNameFromPath } from "../fs.js";
import { getAttributeDefinitionTextSpan, getClassDefinitionTextSpan, getEventDefinitionTextSpan, getPropertyDefinitionTextSpan } from "../ast/text-span.js";
import { getCEMData } from "../export.js";
import { CustomElementsLanguageServiceRequest } from "../request.js";

// request: CustomElementsLanguageServiceRequest
export function getGoToDefinitionEntries(request: CustomElementsLanguageServiceRequest) {
    let definitionInfos: Array<ts.DefinitionInfo> = [];
    const { document, position, htmlLanguageService, projectBasePath, project } = request;

    const actionContext = resolveActionContext(htmlLanguageService, document, position);
    const cemCollection = getCEMData(project, projectBasePath);

    if (!cemCollection.hasData()) {
        return [...definitionInfos];
    }

    const matchingClass = findClassForTagName(cemCollection, actionContext.tagName);
    if (!matchingClass) {
        return [...definitionInfos];
    }

    if (matchingClass.cem.isDependency) {
        matchingClass.path = matchingClass.path.replace(/\.(js|ts)$/, ".d.ts");
    }
    const basePath = matchingClass.cem.cemFolderPath ?? projectBasePath;

    const fileName = getFileNameFromPath(matchingClass?.path);
    const classDeclaration = findCustomElementDeclarationFromModule(matchingClass);
    if (!classDeclaration) {
        return [...definitionInfos];
    }

    if (isTagAction(actionContext) || isEndTagAction(actionContext)) {
        definitionInfos = [...definitionInfos, ...getTagDefinitionsEntries(basePath, matchingClass, classDeclaration, fileName, project)];
    }

    if (isAttributeNameAction(actionContext)) {
        definitionInfos = [...definitionInfos, ...getAttributeDefinitionEntries(actionContext, basePath, matchingClass, classDeclaration, fileName, project)];
    }

    if (isPropertyNameAction(actionContext)) {
        definitionInfos = [...definitionInfos, ...getPropertyDefinitionEntries(actionContext, basePath, matchingClass, classDeclaration, fileName, project)];
    }

    if (isEventNameAction(actionContext)) {
        definitionInfos = [...definitionInfos, ...getEventDefinitionEntries(actionContext, basePath, matchingClass, classDeclaration, fileName, project)];
    }

    return [...definitionInfos];
}

function getTagDefinitionsEntries(basePath: string, matchingClass: JavaScriptModuleWithRef, classDeclaration: CustomElement, fileName: string, project: tss.server.Project) {
    const classDefinitionTextSpan = getClassDefinitionTextSpan(matchingClass, classDeclaration?.name ?? "", basePath, project);
    let packagePath = matchingClass.cem.cemFolderPath + "/" + matchingClass.path;
    // TODO: Point to the .d.ts file ? Let's try it out

    return [
        {
            name: classDeclaration?.name ?? "",
            kind: tss.ScriptElementKind.classElement,
            containerName: fileName ?? "",
            containerKind: tss.ScriptElementKind.moduleElement,
            fileName: packagePath,
            textSpan: classDefinitionTextSpan,
            contextSpan: classDefinitionTextSpan,
        },
    ];
}

function getAttributeDefinitionEntries(
    actionContext: AttributeActionContext,
    basePath: string,
    matchingClass: JavaScriptModuleWithRef,
    classDeclaration: CustomElement,
    fileName: string,
    project: tss.server.Project
) {
    const attributeDefinitionTextSpan = getAttributeDefinitionTextSpan(matchingClass, actionContext.attributeName ?? "", basePath, project);
    const packagePath = matchingClass.cem.cemFolderPath + "/" + matchingClass.path;

    return [
        {
            name: classDeclaration?.name ?? "",
            kind: tss.ScriptElementKind.classElement,
            containerName: fileName ?? "",
            containerKind: tss.ScriptElementKind.moduleElement,
            fileName: packagePath,
            textSpan: attributeDefinitionTextSpan,
            contextSpan: attributeDefinitionTextSpan,
        },
    ];
}

function getPropertyDefinitionEntries(
    actionContext: PropertyActionContext,
    basePath: string,
    matchingClass: JavaScriptModuleWithRef,
    classDeclaration: CustomElement,
    fileName: string,
    project: tss.server.Project
) {
    const propertyDefinitionTextSpan = getPropertyDefinitionTextSpan(matchingClass, actionContext.propertyName ?? "", basePath, project);
    const packagePath = matchingClass.cem.cemFolderPath + "/" + matchingClass.path;

    return [
        {
            name: classDeclaration?.name ?? "",
            kind: tss.ScriptElementKind.classElement,
            containerName: fileName ?? "",
            containerKind: tss.ScriptElementKind.moduleElement,
            fileName: packagePath,
            textSpan: propertyDefinitionTextSpan,
            contextSpan: propertyDefinitionTextSpan,
        },
    ];
}

function getEventDefinitionEntries(
    actionContext: EventActionContext,
    basePath: string,
    matchingClass: JavaScriptModuleWithRef,
    classDeclaration: CustomElement,
    fileName: string,
    project: tss.server.Project
) {
    const eventDefinitionTextSpan = getEventDefinitionTextSpan(matchingClass, actionContext.eventName ?? "", basePath, project);
    const packagePath = matchingClass.cem.cemFolderPath + "/" + matchingClass.path;

    return [
        {
            name: classDeclaration?.name ?? "",
            kind: tss.ScriptElementKind.classElement,
            containerName: fileName ?? "",
            containerKind: tss.ScriptElementKind.moduleElement,
            fileName: packagePath,
            textSpan: eventDefinitionTextSpan,
            contextSpan: eventDefinitionTextSpan,
        },
    ];
}
