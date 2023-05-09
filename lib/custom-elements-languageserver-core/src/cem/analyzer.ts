// @ts-expect-error
import { create, ts } from "@custom-elements-manifest/analyzer";
// @ts-expect-error
import { litPlugin } from "@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js";
// @ts-expect-error
import { Package } from "custom-elements-manifest";
// TODO: Can we fix these imports?
import tss from "typescript/lib/tsserverlibrary.js";
import fs from "fs";
import path from "path";

// Pathing to ${projectPath}/node_modules/.cache/custom-elements-language-server
const CEM_CACHE_DIR = "/node_modules/.cache/custom-elements-language-server";
const CEM_CACHE_NAME = "custom-elements.json";

export function analyzeLocalProject(project: tss.server.Project) {

    console.log("Building manifest");

    const basePath = project.getCurrentDirectory();
    const rootFiles = project.getRootFiles();
    const sourceFiles = rootFiles
        // @ts-ignore
        .map(rf => project.getSourceFile(rf as tss.Path))
        .filter(sf => sf !== undefined) as tss.SourceFile[];

    const modifiedSourceFiles = sourceFiles.map(sf => {
        return ts.createSourceFile(
            sf.fileName,
            sf.getFullText(),
            ts.ScriptTarget.ES2015,
            true
        )
    })

    const manifest: Package = create({
        modules: modifiedSourceFiles,
        plugins: [...litPlugin()],
        context: { dev: true }
    });

    normalizeManifest(manifest, basePath);

    console.log("Building manifest done, writing to file.");
    console.log("Manifest size: ", JSON.stringify(manifest).length);
    const savePath = cacheCurrentCEM(basePath, manifest);
    console.log("Manifest file wroitten to ", savePath);

    return manifest;
}

function normalizeManifest(manifest: Package, basePath: string) {
    manifest.modules?.forEach((mod) => {
        mod.path = mod.path.replace(basePath + "/", "");
    });
}

function cacheCurrentCEM(projectPath: string, manifest: Package) {
    const cachePath = path.join(projectPath, CEM_CACHE_DIR);
    if (!fs.existsSync(cachePath)) {
        console.log("Creating cache path ", cachePath);
        fs.mkdirSync(cachePath, { recursive: true });
    }
    const savePath = path.resolve(cachePath, CEM_CACHE_NAME);
    fs.writeFileSync(savePath, JSON.stringify(manifest), "utf8");

    return savePath;
}
