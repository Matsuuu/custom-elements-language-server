import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary";

export function resolveModule(modulePath: string, sourceFilePath: string, project: tss.server.Project) {
    return ts.resolveModuleName(modulePath, sourceFilePath, project.getCompilerOptions(), project.projectService.host);
}
