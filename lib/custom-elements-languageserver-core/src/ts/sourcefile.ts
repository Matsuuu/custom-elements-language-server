import ts from "typescript";
import tss from "typescript/lib/tsserverlibrary.js";
import { getFilePathFolder, isDependencyImport } from "../handlers/diagnostics/imports.js";
import * as path from "path";
import * as fs from "fs";
import { getPathAsDtsFile, getPathAsJsFile, getPathAsTsFile } from "./filepath-transformers.js";

export function getSourceFile(baseOrFullPath: string, classPath: string | undefined, project: tss.server.Project) {
    const fullClassPath = classPath === undefined ?
        baseOrFullPath :
        [baseOrFullPath, classPath].filter(p => p.trim().length > 0).join("/");

    const program = project;

    // NOTE: this makes everything slow as shit
    // program.getDeclarationDiagnostics();

    if (!program) {
        return undefined;
    }

    // @ts-ignore
    const sourceFile = program.getSourceFile(fullClassPath);

    return sourceFile;
}

export function getAllFilesAssociatedWithSourceFile(sourceFile: ts.SourceFile, basePath: string, project: tss.server.Project) {

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

            const importSourceFile = tryGetSourceFileForImport(absoluteImportPath, project);
            if (!importSourceFile) {
                continue;
            }

            processFileAndAddImports(importSourceFile);
        }
    }

    processFileAndAddImports(sourceFile);

    return Object.keys(analyzedFiles);
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
        return path.resolve(getFilePathFolder(sourceFile.fileName), importFilePath);
    }

    if (importFilePath.includes(".js")) {
        return path.resolve(basePath, "node_modules", importFilePath);
    }

    const packagePath = path.resolve(basePath, "node_modules", importFilePath);
    const dependencyPackageJsonPath = packagePath + "/package.json";
    if (!fs.existsSync(dependencyPackageJsonPath)) {
        // TODO: Handle this? Is it needed?
        // If you end up in here. Please report this bug
        debugger;
        return undefined;
    }
    const dependencyPackageJson = JSON.parse(fs.readFileSync(dependencyPackageJsonPath, "utf8"));
    const mainFilePath: string = dependencyPackageJson.main;

    return packagePath + "/" + mainFilePath;
}

