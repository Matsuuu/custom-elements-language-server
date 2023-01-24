import ts from "typescript";
import { getFilePathFolder, isDependencyImport, resolveImportPath } from "../handlers/diagnostics/imports.js";
import * as path from "path";

const PROGRAM_CACHE = new Map<string, ts.Program>();

export function getOrCreateProgram(fullPath: string) {
    if (PROGRAM_CACHE.has(fullPath)) {
        return PROGRAM_CACHE.get(fullPath) as ts.Program;
    }

    const program = ts.createProgram({
        rootNames: [fullPath],
        options: {
            allowJs: true
        },
        host: ts.createCompilerHost({}, true),
    });

    PROGRAM_CACHE.set(fullPath, program);

    return program;
}

export function getSourceFile(baseOrFullPath: string, classPath?: string) {
    // TODO: Does `setParentNodes` slow this down much
    const fullClassPath = classPath === undefined ?
        baseOrFullPath :
        [baseOrFullPath, classPath].filter(p => p.trim().length > 0).join("/");


    const program = getOrCreateProgram(fullClassPath);

    // NOTE: this makes everything slow as shit
    // program.getDeclarationDiagnostics();

    return program.getSourceFile(fullClassPath);
}

export function getAllFilesAssociatedWithSourceFile(sourceFile: ts.SourceFile, basePath: string) {

    const analyzedFiles: Record<string, ts.SourceFile> = {};

    function processFileAndAddImports(currentSourceFile: ts.SourceFile) {
        if (analyzedFiles[currentSourceFile.fileName]) {
            return;
        }
        analyzedFiles[currentSourceFile.fileName] = currentSourceFile;
        const fileInfo = ts.preProcessFile(currentSourceFile.getFullText());
        const imports = fileInfo.importedFiles;
        for (const importReference of imports) {
            const importFilePath = importReference.fileName
            const absoluteImportPath = resolveAbsoluteFileToImport(importFilePath, basePath, currentSourceFile);

            debugger;

            const importSourceFile = getSourceFile(absoluteImportPath);
            if (!importSourceFile) {
                continue;
            }

            processFileAndAddImports(importSourceFile);
        }
    }

    processFileAndAddImports(sourceFile);
}

function resolveAbsoluteFileToImport(importFilePath: string, basePath: string, sourceFile: ts.SourceFile) {

    if (isDependencyImport(importFilePath)) {
        // TODO: Handle dependency packages.
        // One handler for base import, other for file imports
        if (importFilePath.includes(".js")) {
            return path.resolve(basePath, "node_modules", importFilePath);
        } else {
            return ""; // TODO: Resolve base import file from package.json main/module
        }
    } else {
        return path.resolve(getFilePathFolder(sourceFile.fileName), importFilePath);
    }
}

