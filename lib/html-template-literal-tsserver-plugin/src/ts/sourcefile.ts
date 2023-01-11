import ts from "typescript";

const PROGRAM_CACHE = new Map<string, ts.Program>();

const compilerHost = ts.createCompilerHost({}, true);

export function getSourceFile(baseOrFullPath: string, classPath?: string) {
    // TODO: Make some of these static / final ?
    // TODO: Yeah we need to really cache this shit
    // TODO: Does `setParentNodes` slow this down much
    const fullClassPath = classPath === undefined ?
        baseOrFullPath :
        [baseOrFullPath, classPath].filter(p => p.trim().length > 0).join("/");


    const program = getOrCreateProgram(fullClassPath);

    // NOTE: this makes everything slow as shit
    // program.getDeclarationDiagnostics();

    return program.getSourceFile(fullClassPath);
}

export function getOrCreateProgram(fullPath: string) {
    if (PROGRAM_CACHE.has(fullPath)) {
        console.log("Cache hit on getOrCreateProgram");
        return PROGRAM_CACHE.get(fullPath) as ts.Program;
    }

    const program = ts.createProgram({
        rootNames: [fullPath],
        options: {
            allowJs: true
        },
        host: compilerHost,
    });

    PROGRAM_CACHE.set(fullPath, program);

    return program;
}
