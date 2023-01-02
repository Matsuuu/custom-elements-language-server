import { findTagNameForClass, findTemplateExpressions, getLatestCEM } from "html-template-literal-tsserver-plugin";
import tss from "typescript/lib/tsserverlibrary.js";
import { ReferenceParams } from "vscode-languageserver";
import { getProjectForCurrentFile } from "../language-services/language-services.js";
import { documents } from "../text-documents.js";
import { textDocumentDataToUsableData } from "../transformers.js";

export function getReferencesAtPosition(referenceParams: ReferenceParams) {
    const usableData = textDocumentDataToUsableData(documents, referenceParams);
    const project = getProjectForCurrentFile(usableData.fileName, usableData.fileContent);
    const cem = getLatestCEM();
    if (!cem) {
        return [];
    }
    const tagNameModule = findTagNameForClass(cem, "ExampleProject");

    const definition = tagNameModule.exports?.filter(exp => exp.kind === "custom-element-definition")?.[0];
    if (!definition) {
        return [];
    }

    const tagName = definition.name;
    const declaration = definition.declaration;

    const fileContentMap: any = {};

    const files = project?.getRootScriptInfos().filter(file => {
        const templateExpressions = findTemplateExpressions(file.path, "");
        const contentAreas = templateExpressions.map(exp => exp.getText());
        const contains = contentAreas.some(area => area.includes("<" + tagName));
        if (contains) {
            fileContentMap[file.path] = {
                templateExpressions
            }
        }
        return contains;
    });

    return undefined;
}
