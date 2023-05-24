// @ts-expect-error
import { create, ts } from "@custom-elements-manifest/analyzer";
// @ts-expect-error
import { JavaScriptExport, Package } from "custom-elements-manifest";
// TODO: Can we fix these imports?
import tss from "typescript/lib/tsserverlibrary.js";
import fs from "fs";
import path from "path";
// @ts-expect-error
import { readConfig } from '@web/config-loader';

// Pathing to ${projectPath}/node_modules/.cache/custom-elements-language-server
const CEM_CACHE_DIR = "/node_modules/.cache/custom-elements-language-server";
const CEM_CACHE_NAME = "custom-elements.json";
const CEM_CONFIG_FILE_NAME = "custom-elements-manifest.config.js";

export interface AnalyzerOutput {
    filePath: string;
    manifest: Package;
}

export function analyzeLocalProject(project: tss.server.Project): AnalyzerOutput {

    console.log("Building manifest");

    const basePath = project.getCurrentDirectory();
    const rootFiles = project.getRootFiles();
    const sourceFiles = rootFiles
        // @ts-ignore
        .map(rf => project.getSourceFile(rf as tss.Path))
        .filter(sf => sf !== undefined) as tss.SourceFile[];

    // TODO: Is this step necessary?
    const modifiedSourceFiles: ts.SourceFile[] = sourceFiles.map(sf => {
        return ts.createSourceFile(
            sf.fileName,
            sf.getFullText(),
            ts.ScriptTarget.ES2015,
            true
        )
    });

    const projectConfig = getPossibleProjectConfig(basePath);

    const manifest: Package = create({
        modules: modifiedSourceFiles,
        plugins: [],
        context: { dev: false }
    });

    normalizeManifest(basePath, manifest);

    console.log("Building manifest done, writing to file.");
    const savePath = cacheCurrentCEM(basePath, manifest);
    console.log("Manifest file written to ", savePath);

    return {
        manifest,
        filePath: savePath
    }
}

function normalizeManifest(basePath: string, manifest: Package) {
    manifest.modules?.forEach((mod) => {
        mod.path = mod.path.replace(basePath + "/", "");
        mod.exports?.forEach(exp => {
            const moduleExport = exp as JavaScriptExport; // TODO: Can this cause trouble?
            if (moduleExport.declaration.module) {
                moduleExport.declaration.module = moduleExport.declaration.module.replace(basePath + "/", "");
            }
        });
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

function getPossibleProjectConfig(basePath: string) {
    const config = readConfig("custom-elements-manifest.config", undefined, basePath);
    // TODO: Go through the config and get the good bits like in https://github.com/open-wc/custom-elements-manifest/blob/master/packages/analyzer/cli.js#LL34C19-L34C19
    console.log(config);
}

