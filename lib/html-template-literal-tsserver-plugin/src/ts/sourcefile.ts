import ts from "typescript";

export function getSourceFile(basePath: string, classPath: string) {
    // TODO: Make some of these static / final ?
    // TODO: Yeah we need to really cache this shit
    const fullClassPath = [basePath, classPath].filter(p => p.trim().length > 0).join("/");
    const compilerHost = ts.createCompilerHost({}, true);
    const program = ts.createProgram({
        rootNames: [fullClassPath],
        options: {
            allowJs: true
        },
        host: compilerHost,
    });
    // NOTE: this makes everything slow as shit
    // program.getDeclarationDiagnostics();

    return program.getSourceFile(fullClassPath);
}

