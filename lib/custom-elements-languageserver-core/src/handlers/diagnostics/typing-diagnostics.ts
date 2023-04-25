import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";
import { CustomElementsLanguageServiceRequest } from "../../request";
import { VirtualSystem } from "../../ts/virtual/system";
import { createVirtualCompilerHost } from "../../ts/virtual/compiler-host";

export function getTypingDiagnostics(request: CustomElementsLanguageServiceRequest): tss.Diagnostic[] {

    const project = request.project;

    const system = new VirtualSystem();
    const host = createVirtualCompilerHost(system, project.getCompilerOptions(), ts);

    const typecheckProgram = ts.createProgram({
        rootNames: [...project.getRootFiles()],
        options: project.getCompilerOptions(),
        host
    });

    debugger;

    return [];

}
