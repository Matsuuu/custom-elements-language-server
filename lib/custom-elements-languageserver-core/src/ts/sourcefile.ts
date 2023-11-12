import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";
import { getFilePathFolder, isDependencyImport } from "../handlers/diagnostics/imports.js";
import * as path from "path";
import * as fs from "fs";
import { getPathAsDtsFile, getPathAsJsFile, getPathAsTsFile } from "./filepath-transformers.js";
import { normalizePath } from "../interop.js";

export function getSourceFile(baseOrFullPath: string, classPath: string | undefined, project: tss.server.Project) {
    const fullClassPath = classPath === undefined ?
        baseOrFullPath :
        [baseOrFullPath, classPath].filter(p => p.trim().length > 0).join("/");

    if (!project) {
        return undefined;
    }


    // @ts-ignore
    const sourceFile = project.getSourceFile(fullClassPath);

    if (false) { // DEBUG OPTION
        const fileNames = project.getFileNames(true);
        debugger;
    }

    return sourceFile;
}

export function getAllFilesAssociatedWithSourceFile(sourceFile: ts.SourceFile, basePath: string, project: tss.server.Project) {

    const analyzedFiles: Record<string, string[]> = {};

    function processFileAndAddImports(currentSourceFile: ts.SourceFile, importAlias?: string) {
        if (analyzedFiles[currentSourceFile.fileName]) {
            return;
        }
        analyzedFiles[currentSourceFile.fileName] = [currentSourceFile.fileName];
        if (importAlias) {
            analyzedFiles[currentSourceFile.fileName].push(importAlias);
        }
        const fileInfo = ts.preProcessFile(currentSourceFile.getFullText());
        const imports = fileInfo.importedFiles;

        for (const importReference of imports) {
            const moduleResolution = ts.resolveModuleName(importReference.fileName, currentSourceFile.fileName, project.getCompilerOptions(), project.projectService.host);
            // TODO: for node modules, cache the found connections
            const importFilePath = moduleResolution.resolvedModule?.resolvedFileName ?? importReference.fileName
            // No need for this anymore?
            const absoluteImportPath = resolveAbsoluteFileToImport(importFilePath, basePath, currentSourceFile);

            if (!absoluteImportPath) {
                continue;
            }
            if (analyzedFiles[absoluteImportPath]) {
                continue;
            }

            // Need for this anymore?
            const importSourceFile = tryGetSourceFileForImport(absoluteImportPath, project);
            if (!importSourceFile) {
                continue;
            }

            const alias = importReference.fileName !== importSourceFile.fileName ? importReference.fileName : undefined;
            processFileAndAddImports(importSourceFile, alias);
        }
    }

    processFileAndAddImports(sourceFile);

    return Object.values(analyzedFiles).flatMap(x => x);
}

function tryGetSourceFileForImport(absoluteImportPath: string, project: tss.server.Project) {
    return [
        getSourceFile(getPathAsJsFile(absoluteImportPath), undefined, project),
        getSourceFile(getPathAsTsFile(absoluteImportPath), undefined, project),
        getSourceFile(getPathAsDtsFile(absoluteImportPath), undefined, project)
    ].filter(file => file !== undefined)[0];
}

function resolveAbsoluteFileToImport(importFilePath: string, basePath: string, sourceFile: ts.SourceFile) {

    if (!isDependencyImport(importFilePath)) {
        return normalizePath(path.resolve(getFilePathFolder(sourceFile.fileName), importFilePath));
    }

    if (importFilePath.includes(".js")) {
        return normalizePath(path.resolve(basePath, "node_modules", importFilePath));
    }

    const packagePath = path.resolve(basePath, "node_modules", importFilePath);
    const dependencyPackageJsonPath = packagePath + "/package.json";
    if (!fs.existsSync(dependencyPackageJsonPath)) {
        return undefined;
    }
    const dependencyPackageJson = JSON.parse(fs.readFileSync(dependencyPackageJsonPath, "utf8"));
    const mainFilePath: string = dependencyPackageJson.main;

    return normalizePath(packagePath + "/" + mainFilePath);
}

