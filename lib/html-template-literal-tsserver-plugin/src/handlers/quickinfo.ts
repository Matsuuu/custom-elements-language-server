import { TemplateContext } from "typescript-template-language-service-decorator";
import tss from "typescript/lib/tsserverlibrary.js";
import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import { getLatestCEM } from "../cem/cem-instance.js";
import { isAttributeNameAction, isEndTagAction, isEventNameAction, isPropertyNameAction, isTagAction, resolveActionContext } from "../completion-context.js";
import { getProjectBasePath } from "../template-context.js";

export function getQuickInfo(context: TemplateContext, position: tss.LineAndCharacter, htmlLanguageService: HtmlLanguageService) {
    const basePath = getProjectBasePath(context);
    const actionContext = resolveActionContext(htmlLanguageService, context, position);
    const cem = getLatestCEM();

    if (isTagAction(actionContext) || isEndTagAction(actionContext)) {

    }

    if (isAttributeNameAction(actionContext)) {

    }

    if (isPropertyNameAction(actionContext)) {

    }

    if (isEventNameAction(actionContext)) {

    }

    debugger;
    return undefined;
}
