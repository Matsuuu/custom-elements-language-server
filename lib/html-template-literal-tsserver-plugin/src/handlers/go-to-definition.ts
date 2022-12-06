import { LanguageService as HtmlLanguageService } from "vscode-html-languageservice";
import tss from "typescript/lib/tsserverlibrary.js";
import { getProjectBasePath } from "../template-context.js";
import { isAttributeNameCompletion, isTagCompletion, resolveCompletionContext } from "../completion-context.js";
import { getLatestCEM } from "../cem/cem-instance.js";
import { findClassForTagName, findCustomElementDeclarationFromModule } from "../cem/cem-helpers.js";
import { CustomElement } from "custom-elements-manifest";
import { getClassDefinitionTextSpan } from "../typescript-analyzer.js";
import { TemplateContext } from "typescript-template-language-service-decorator";

export function getGoToDefinitionEntries(context: TemplateContext, position: ts.LineAndCharacter, htmlLanguageService: HtmlLanguageService) {
    const basePath = getProjectBasePath(context);

    const definitionInfos: Array<ts.DefinitionInfo> = [];

    const completionContext = resolveCompletionContext(htmlLanguageService, context, position);
    const cem = getLatestCEM();
    if (cem) {
        // TODO: Clean all of this stuff inside the if (cem)
        if (isTagCompletion(completionContext)) {
            const matchingClass = findClassForTagName(cem, completionContext.tagName);
            let classDeclaration: CustomElement | undefined;
            if (matchingClass) {
                classDeclaration = findCustomElementDeclarationFromModule(matchingClass);
            }

            // TODO: Make these if horriblities into early exit functions when moving
            let classDefinitionTextSpan: tss.TextSpan | undefined;
            if (matchingClass && classDeclaration) {
                classDefinitionTextSpan = getClassDefinitionTextSpan(matchingClass, classDeclaration?.name ?? '', basePath);
            }

            const fileNameSplit = matchingClass?.path.split("/");
            const fileName = fileNameSplit?.[fileNameSplit?.length - 1];


            // TODO: Find the class declaration
            // and put it's position into textspan
            definitionInfos.push({
                name: classDeclaration?.name ?? '',
                kind: tss.ScriptElementKind.classElement,
                containerName: fileName ?? '',
                containerKind: tss.ScriptElementKind.moduleElement,
                fileName: basePath + "/" + matchingClass?.path ?? '',
                textSpan: classDefinitionTextSpan ?? tss.createTextSpan(0, 0),
                contextSpan: classDefinitionTextSpan ?? tss.createTextSpan(0, 0),
            });
        }

        if (isAttributeNameCompletion(completionContext)) {
            const matchingClass = findClassForTagName(cem, completionContext.tagName);
            let classDeclaration: CustomElement | undefined;
            if (matchingClass) {
                classDeclaration = findCustomElementDeclarationFromModule(matchingClass);
            }
            // TODO: Find the attribute declaration
            // and put it's position into textspan
            definitionInfos.push({
                name: classDeclaration?.name ?? '',
                kind: tss.ScriptElementKind.classElement,
                containerName: matchingClass?.path ?? '',
                containerKind: tss.ScriptElementKind.moduleElement,
                fileName: basePath + "/" + matchingClass?.path ?? '',
                textSpan: tss.createTextSpan(0, 0)
            });
        }
    }

    return [...definitionInfos];
}

