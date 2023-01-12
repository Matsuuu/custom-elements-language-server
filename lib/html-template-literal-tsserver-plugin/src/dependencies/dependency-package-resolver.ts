import * as fs from "fs";

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

        const pathMatcher = new RegExp(/.*node_modules\/(?<packageName>[^@].*?|@.*?\/.*?)\//, "gi");
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

    return packages;
}

// TODO: This is just a quickly done PoC. Refactor and make good
export function getDependencyPackagesWithCEMs(nodeModulesPath: string) {
    const packageDirectories = fs.readdirSync(nodeModulesPath);
    let packages: Record<string, ImportedDependency> = {};

    debugger;

    for (const packageDir of packageDirectories) {
        const dependenciesWithinNamespace = [];
        const packageBase = `${nodeModulesPath}/${packageDir}/`;
        if (packageBase.includes("node_modules/@")) {
            const namespacedPackages = fs.readdirSync(packageBase);
            for (const namespacedPackage of namespacedPackages) {
                const namespacedPackagePath = `${packageBase}${namespacedPackage}/`;
                const dependencyName = getPackageName(namespacedPackagePath);
                if (dependencyName) {
                    dependenciesWithinNamespace.push({
                        name: dependencyName,
                        path: namespacedPackagePath
                    })
                }
            }
        } else {
            const dependencyName = getPackageName(packageBase);
            if (dependencyName) {
                dependenciesWithinNamespace.push({
                    name: dependencyName,
                    path: packageBase
                })
            }
        }

        for (const dep of dependenciesWithinNamespace) {
            const dependencyWithCEM = getImportedDependencyWithCEMIfPresent(dep.path, dep.name);
            if (!dependencyWithCEM) {
                continue;
            }

            packages[packageBase] = dependencyWithCEM;
        }
    }

    return packages;
}

function getPackageName(packagePath: string) {
    const pathMatcher = new RegExp(/.*node_modules\/(?<packageName>[^@].*?|@.*?\/.*?)\//, "gi");
    const result = pathMatcher.exec(packagePath);

    return result?.groups?.packageName;
}

function getImportedDependencyWithCEMIfPresent(packageBase: string, dependencyName: string) {
    try {
        const packageJson = fs.readFileSync(packageBase + "/package.json", "utf8");
        const packageJsonJson = JSON.parse(packageJson);
        if (packageJsonJson.customElements) {

            if (!dependencyName) {
                return undefined;
            }

            return {
                path: packageBase,
                name: dependencyName
            }
        }
        return undefined;
    } catch (err) {
        console.error("Couldn't read file in dependency. ", err);
        return undefined;
    }
}
