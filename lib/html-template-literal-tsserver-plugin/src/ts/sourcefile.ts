import ts from "typescript";
import { getFilePathFolder, isDependencyImport, resolveImportPath } from "../handlers/diagnostics/imports.js";
import * as path from "path";
import * as fs from "fs";
import { getPathAsJsFile, getPathAsTsFile } from "./filepath-transformers.js";
import { HTMLTemplateLiteralLanguageService } from "../html-template-literal-language-service.js";

const PROGRAM_CACHE = new Map<string, ts.Program>();
const PACKAGE_MAIN_FILE_CACHE = new Map<string, string>();

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

    // TODO: Make sure everything is fine with this
    const program = HTMLTemplateLiteralLanguageService.project;

    // NOTE: this makes everything slow as shit
    // program.getDeclarationDiagnostics();

    // @ts-ignore
    const sourceFile = program.getSourceFile(fullClassPath);

    return sourceFile;
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
            // TODO: for node modules, cache the found connections
            const importFilePath = importReference.fileName
            const absoluteImportPath = resolveAbsoluteFileToImport(importFilePath, basePath, currentSourceFile);
            if (!absoluteImportPath) {
                continue;
            }
            if (analyzedFiles[absoluteImportPath]) {
                continue;
            }

            const importSourceFile = tryGetSourceFileForImport(absoluteImportPath);
            if (!importSourceFile) {
                continue;
            }

            processFileAndAddImports(importSourceFile);
        }
    }

    processFileAndAddImports(sourceFile);

    return Object.keys(analyzedFiles);
}

function tryGetSourceFileForImport(absoluteImportPath: string) {
    return [
        getSourceFile(getPathAsJsFile(absoluteImportPath)),
        getSourceFile(getPathAsTsFile(absoluteImportPath))
    ].filter(file => file !== undefined)[0];
}

function resolveAbsoluteFileToImport(importFilePath: string, basePath: string, sourceFile: ts.SourceFile) {

    if (!isDependencyImport(importFilePath)) {
        return path.resolve(getFilePathFolder(sourceFile.fileName), importFilePath);
    }

    if (importFilePath.includes(".js")) {
        return path.resolve(basePath, "node_modules", importFilePath);
    }

    const packagePath = path.resolve(basePath, "node_modules", importFilePath);
    const dependencyPackageJsonPath = packagePath + "/package.json";
    if (!fs.existsSync(dependencyPackageJsonPath)) {
        // TODO: Handle this? Is it needed?
        debugger;
        return undefined;
    }
    const dependencyPackageJson = JSON.parse(fs.readFileSync(dependencyPackageJsonPath, "utf8"));
    const mainFilePath: string = dependencyPackageJson.main;

    return packagePath + "/" + mainFilePath;
}

