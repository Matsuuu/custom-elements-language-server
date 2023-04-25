import tss from "typescript/lib/tsserverlibrary.js";
import { CustomElementsLanguageServiceRequest } from "../../request";

export function getTypingDiagnostics(request: CustomElementsLanguageServiceRequest): tss.Diagnostic[] {
    console.log(request.project)

    const project = request.project;

    return [];

}
