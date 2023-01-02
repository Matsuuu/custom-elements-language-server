import tss from "typescript/lib/tsserverlibrary.js";
import { ReferenceParams } from "vscode-languageserver";
import { documents } from "../text-documents.js";
import { textDocumentDataToUsableData } from "../transformers.js";

export function getReferencesAtPosition(referenceParams: ReferenceParams) {
    const usableData = textDocumentDataToUsableData(documents, referenceParams);
    //const cem = getLatestCEM();
    debugger;
}
