import * as path from "path";

export function resolveImportPath(fullImportPath: string, filePathWithoutFile: string) {

    const importPathWithoutFile = fullImportPath.substring(0, fullImportPath.lastIndexOf("/"));
    const importFileName = fullImportPath.substring(fullImportPath.lastIndexOf("/"));
    const importFileNameAsJs = importFileName.replace(".ts", ".js");
    let relativePathToImport = path.relative(filePathWithoutFile, importPathWithoutFile);
    if (relativePathToImport.length <= 0) {
        relativePathToImport = ".";
    }

    let relativeImportPath = relativePathToImport + importFileNameAsJs;

    if (relativeImportPath.includes("node_modules")) {
        relativeImportPath = relativeImportPath.substring(relativeImportPath.indexOf("node_modules") + "node_modules/".length);
    }

    return relativeImportPath;
}

export function getFilePathFolder(filePath: string) {
    return filePath.substring(0, filePath.lastIndexOf("/"));
}

export function isDependencyImport(importPath: string) {
    return importPath.substring(0, 1).match(/[a-zA-Z]/) !== null;
}
