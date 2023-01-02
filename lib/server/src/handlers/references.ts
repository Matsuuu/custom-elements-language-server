import { findClassForTagName, findTagNameForClass, getLatestCEM } from "html-template-literal-tsserver-plugin";
import tss from "typescript/lib/tsserverlibrary.js";
import { ReferenceParams } from "vscode-languageserver";
import { documents } from "../text-documents.js";
import { textDocumentDataToUsableData } from "../transformers.js";

export function getReferencesAtPosition(referenceParams: ReferenceParams) {
    const usableData = textDocumentDataToUsableData(documents, referenceParams);
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
    debugger;
    return undefined;
}
