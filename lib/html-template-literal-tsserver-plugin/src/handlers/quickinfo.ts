import { CustomElement, JavaScriptModule } from "custom-elements-manifest";
import { TemplateContext } from "typescript-template-language-service-decorator";
import tss from "typescript/lib/tsserverlibrary.js";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import { findClassForTagName, findCustomElementDeclarationFromModule } from "../cem/cem-helpers.js";
import { getLatestCEM } from "../cem/cem-instance.js";
import { isAttributeNameAction, isEndTagAction, isEventNameAction, isPropertyNameAction, isTagAction, resolveActionContext } from "../completion-context.js";
import { getFileNameFromPath } from "../fs.js";
import { getProjectBasePath } from "../template-context.js";

export function getQuickInfo(context: TemplateContext, position: tss.LineAndCharacter, htmlLanguageService: HtmlLanguageService) {
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
    const classDeclaration = findCustomElementDeclarationFromModule(matchingClass);
    if (!classDeclaration) {
        return undefined;
    }

    if (isTagAction(actionContext) || isEndTagAction(actionContext)) {
        return getTagQuickInfo(basePath, matchingClass, classDeclaration, fileName);
    }

    if (isAttributeNameAction(actionContext)) {
    }

    if (isPropertyNameAction(actionContext)) {
    }

    if (isEventNameAction(actionContext)) {
    }

    return undefined;
}

function getTagQuickInfo(basePath: string, matchingClass: JavaScriptModule, classDeclaration: CustomElement, fileName: string) {
    return undefined;
}
