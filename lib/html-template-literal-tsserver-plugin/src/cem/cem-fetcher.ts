import { ImportedDependency } from "../dependencies/dependency-package-resolver.js";
import * as fs from "fs";
import { CEMData } from "./cem-data.js";

export function getDependencyCEM(dependency: ImportedDependency): CEMData | undefined {
    // TODO: Cache
    const packageJsonPath = dependency.path + "package.json";
    if (!fs.existsSync(packageJsonPath)) {
        return undefined;
    }

    let packageJsonAsJson;
    try {
        packageJsonAsJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    } catch (ex) {
        console.warn("Couldn't find a package.json for dependency " + dependency.name + ". This shouldn't happen.");
        return undefined;
    }

    const customElementsManifestPath = packageJsonAsJson["customElements"];
    if (!customElementsManifestPath) {
        return undefined;
    }

    const cemPath = dependency.path + customElementsManifestPath;
    let cem;
    try {
        cem = JSON.parse(fs.readFileSync(cemPath, "utf-8"));
    } catch (ex) {
        console.warn("customElements -entry  found but file wasn't found. Path: " + cemPath);
        return undefined;
    }

    return {
        cem,
        paths: {
            cem: cemPath,
            project: dependency.path
        },
        packageName: dependency.name
    }
}
