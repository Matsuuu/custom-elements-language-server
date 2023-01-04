import ts from "typescript";
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
    // '/home/matsu/Projects/custom-elements-language-server/lib/html-template-literal-tsserver-plugin/example/package.json'
    const program = ts.createProgram({
        rootNames: [fullPath],
        options: {
            allowJs: true
        },
        host: compilerHost,
    });
    return program;
}

export function getSourceFileWithImports(fullPath: string): Array<ts.SourceFile> {
    const program = getProgram(fullPath);

    const getSourceFilesBench = benchmarkStart("Get Sourcefiles");
    const sourceFiles = program.getSourceFiles();
    getSourceFilesBench();

    const getSingleSourceBench = benchmarkStart("Get Sourcefiles");
    const baseSourceFile = program.getSourceFile(fullPath);
    getSingleSourceBench();

    sourceFiles.forEach((sf) => {
        const getTextBench = benchmarkStart("Get Full Text");
        const a = sf.getFullText();
        console.log(a.length);
        getTextBench();
    })

    function fetchAndAddSourceFiles(importingSourceFile: ts.SourceFile | undefined) {
        if (!importingSourceFile) return;

        /*const info = ts.preProcessFile(importingSourceFile?.getFullText() ?? "", true, true);
        info.importedFiles.forEach(importedFile => {
            const sf = getSourceFile(fullPath + "/" + importedFile.fileName);
            sourceFiles.push(sf);
            fetchAndAddSourceFiles(sf);
        });*/
    }

    fetchAndAddSourceFiles(baseSourceFile);


    return [];
}
