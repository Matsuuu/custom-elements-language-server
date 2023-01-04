import ts from "typescript";
import { findCustomElementDeclarations } from "../ast/identifier.js";
import { benchmarkStart } from "../benchmark.js";

const compilerHost = ts.createCompilerHost({}, true);

export function getSourceFile(baseOrFullPath: string, classPath?: string) {
    // TODO: Make some of these static / final ?
    // TODO: Yeah we need to really cache this shit
    // TODO: Does `setParentNodes` slow this down much
    const fullClassPath = classPath === undefined ?
        baseOrFullPath :
        [baseOrFullPath, classPath].filter(p => p.trim().length > 0).join("/");

    const program = getProgram(fullClassPath);

    // NOTE: this makes everything slow as shit
    // program.getDeclarationDiagnostics();

    return program.getSourceFile(fullClassPath);
}

export function getProgram(fullPath: string) {
    const program = ts.createProgram({
        rootNames: [fullPath],
        options: {
            allowJs: true
        },
        host: compilerHost,
    });
    return program;
}
