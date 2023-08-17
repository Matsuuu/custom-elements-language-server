import * as path from "path";
import { getPathAsJsFile } from "../../ts/filepath-transformers.js";
import { normalizePath } from "../../interop.js";

export function resolveImportPath(fullImportPath: string, filePathWithoutFile: string) {

    const importPathWithoutFile = fullImportPath.substring(0, fullImportPath.lastIndexOf("/"));
    const importFileName = fullImportPath.substring(fullImportPath.lastIndexOf("/"));
    const importFileNameAsJs = getPathAsJsFile(importFileName);
    let relativePathToImport = path.relative(filePathWithoutFile, importPathWithoutFile);
    if (relativePathToImport.length <= 0) {
        relativePathToImport = ".";
    }

    let relativeImportPath = relativePathToImport + importFileNameAsJs;

    if (relativeImportPath.includes("node_modules")) {
        relativeImportPath = relativeImportPath.substring(relativeImportPath.indexOf("node_modules") + "node_modules/".length);
        return normalizePath(relativeImportPath);
    } else if (!relativeImportPath.startsWith(".")) {
        relativeImportPath = "./" + relativeImportPath;
    }

    return relativeImportPath;
}

export function getFilePathFolder(filePath: string) {
    return filePath.substring(0, filePath.lastIndexOf("/"));
}

export function isDependencyImport(importPath: string) {
    return importPath.substring(0, 1).match(/[a-zA-Z@]/) !== null;
}
