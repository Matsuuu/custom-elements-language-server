// @ts-expect-error
import { create, ts } from "@custom-elements-manifest/analyzer";
// TODO: Now that we're in module land, could we actually just dynamically import these? 
// Or is it still a "not packaged" problem?
// @ts-expect-error
import { litPlugin } from "@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js";
// @ts-expect-error
import { fastPlugin } from "@custom-elements-manifest/analyzer/src/features/framework-plugins/fast/fast.js";
// @ts-expect-error
import { stencilPlugin } from "@custom-elements-manifest/analyzer/src/features/framework-plugins/stencil/stencil.js";
// @ts-expect-error
import { catalystPlugin } from "@custom-elements-manifest/analyzer/src/features/framework-plugins/catalyst/catalyst.js";
// @ts-expect-error
import { catalystPlugin2 } from "@custom-elements-manifest/analyzer/src/features/framework-plugins/catalyst-major-2/catalyst.js";
// @ts-ignore
import { JavaScriptExport, Package } from "custom-elements-manifest";
// TODO: Can we fix these imports?
import tss from "typescript/lib/tsserverlibrary.js";
import fs from "fs";
import path from "path";
import url from "url";
import { LogLevel, Logger } from "../logger/logger";

// Pathing to ${projectPath}/node_modules/.cache/custom-elements-language-server
const CEM_CACHE_DIR = "/node_modules/.cache/custom-elements-language-server";
const CEM_CACHE_NAME = "custom-elements.json";
const CEM_CONFIG_FILE_NAME = "custom-elements-manifest.config";

export interface AnalyzerOutput {
    filePath: string;
    manifest: Package;
}

export async function analyzeLocalProject(project: tss.server.Project): Promise<AnalyzerOutput> {

    // console.log("Building manifest for project ", project.getCurrentDirectory());

    const basePath = project.getCurrentDirectory();
    const rootFiles = project.getRootFiles();
    const sourceFiles = rootFiles
        // @ts-ignore
        .map(rf => project.getSourceFile(rf as tss.Path))
        .filter(sf => sf !== undefined) as tss.SourceFile[];

    // TODO: Is this step necessary? Might be to hold analyzer ts version mismatch errors from happening.
    const modifiedSourceFiles: ts.SourceFile[] = sourceFiles.map(sf => {
        return ts.createSourceFile(
            sf.fileName,
            sf.getFullText(),
            ts.ScriptTarget.ES2015,
            true
        )
    });

    // console.log("Analyzing " + modifiedSourceFiles.length + " files.");

    const projectConfig = await getPossibleProjectConfig(basePath);
    const frameworkPlugins = await getFrameworkPlugins(projectConfig);

    const plugins = [...(projectConfig?.plugins || []), ...frameworkPlugins]

    // console.log(plugins.length + " plugins enabled in CEM generation.");

    const manifest: Package = create({
        modules: modifiedSourceFiles,
        plugins: plugins,
        context: { dev: false }
    });

    normalizeManifest(basePath, manifest);

    const savePath = cacheCurrentCEM(basePath, manifest);
    // console.log("Manifest file written to ", savePath);

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
    // console.log("Checking for cache path at " + cachePath);
    if (!fs.existsSync(cachePath)) {
        // console.log("Creating cache path ", cachePath);
        fs.mkdirSync(cachePath, { recursive: true });
    }

    const savePath = path.resolve(cachePath, CEM_CACHE_NAME);
    // console.log("Building manifest done, writing to file. at " + savePath);
    const manifestAsString = JSON.stringify(manifest);
    fs.writeFileSync(savePath, manifestAsString, "utf8");

    // console.log(`Manifest built to ${savePath}. Filesize: `, manifestAsString.length);

    return savePath;
}

async function getPossibleProjectConfig(basePath: string) {
    // Comment out the other possible CEM config files for now since
    // we can't support .js files with module syntax.
    const possibleConfigPaths = [
        //basePath + "/" + CEM_CONFIG_FILE_NAME + ".js",
        url.pathToFileURL(basePath + "/" + CEM_CONFIG_FILE_NAME + ".mjs"),
        url.pathToFileURL(basePath + "/" + CEM_CONFIG_FILE_NAME + ".cjs"),
    ]

    let importedConfig;
    for (const possibleConfigPath of possibleConfigPaths) {
        if (fs.existsSync(possibleConfigPath)) {
            // console.log("Found CEM config at ", possibleConfigPath);
            importedConfig = await import(possibleConfigPath.href);
            break;
        }
    }

    if (!importedConfig) {
        return DEFAULT_CONFIG;
    }

    const config = importedConfig.default;

    return config;
}

// https://github.com/open-wc/custom-elements-manifest/blob/master/packages/analyzer/src/utils/cli-helpers.js#L88

async function getFrameworkPlugins(options: any) {
    let plugins: any[] = [];

    if (options?.litelement) {
        plugins = [...(litPlugin() || [])]
    }

    if (options?.fast) {
        plugins = [...(fastPlugin() || [])]
    }

    if (options?.stencil) {
        plugins.push(stencilPlugin());
    }

    if (options?.catalyst) {
        plugins = [...(catalystPlugin() || [])]
    }

    if (options?.['catalyst-major-2']) {
        plugins = [...(catalystPlugin2() || [])]
    }

    return plugins;
}


const DEFAULT_CONFIG = {
    exclude: [],
    dependencies: true,
    dev: false,
    packagejson: true,
    litelement: true,
    plugins: [

    ]
}
