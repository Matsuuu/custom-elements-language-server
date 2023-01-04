export interface ImportedDependency {
    path: string;
    name: string;
}

export function getImportedDependencies(sourceFiles: readonly ts.SourceFile[]) {
    const packages: Record<string, ImportedDependency> = {};
    for (const sourceFile of sourceFiles) {
        const path = sourceFile.fileName;
        if (!path.includes("node_modules")) {
            continue;
        }

        const pathMatcher = new RegExp(/.*node_modules\/(?<packageName>.*?)\//, "gi");
        const result = pathMatcher.exec(path);

        const packagePath = result?.[0];
        const dependencyName = result?.groups?.packageName;

        if (!packagePath || !dependencyName) {
            continue;
        }

        if (packages[packagePath]) {
            continue;
        }

        packages[packagePath] = {
            path: packagePath,
            name: dependencyName
        };
    }

    debugger;
    return packages;
}
