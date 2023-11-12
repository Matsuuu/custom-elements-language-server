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
import fs, { readFileSync } from "fs";
import path from "path";
import url from "url";
// @ts-expect-error
import { globby } from "globby";
import { LogLevel, Logger } from "../logger/logger";

// Pathing to ${projectPath}/node_modules/.cache/custom-elements-language-server
const CEM_CACHE_DIR = "/node_modules/.cache/custom-elements-language-server";
const CEM_CACHE_NAME = "custom-elements.json";
const CEM_CACHED_CONFIG_FILE_NAME = "custom-elements-manifest.config.mjs";
const CEM_CONFIG_FILE_NAME = "custom-elements-manifest.config";

const FILE_TYPES_TO_MATCH = ["js", "ts", "jsx", "tsx", "cjs", "mjs", "cjsx", "mjsx"];

export interface AnalyzerOutput {
    filePath: string;
    manifest: Package;
}

export async function analyzeLocalProject(basePath: string): Promise<AnalyzerOutput> {


    const projectConfig = await getPossibleProjectConfig(basePath);
    const frameworkPlugins = await getFrameworkPlugins(projectConfig);
    const globs = projectConfig.globs ?? [];
    console.log("Project config: ", projectConfig);

    const plugins = [...(projectConfig?.plugins || []), ...frameworkPlugins]
    const sourceFiles = await getFilesForGlobs(globs, basePath);

    console.log("Sourcefile count ", sourceFiles.length);

    const manifest: Package = create({
        modules: sourceFiles,
        plugins: plugins,
        context: { dev: false }
    });

    normalizeManifest(basePath, manifest);

    const savePath = cacheCurrentCEM(basePath, manifest);
    console.log("Manifest file written to ", savePath);

    return {
        manifest,
        filePath: savePath
    }
}

async function getFilesForGlobs(globs: string[], basePath: string) {
    if (!globs || globs.length === 0) {
        const pattern = `./**/*.(${FILE_TYPES_TO_MATCH.join("|")})`
        globs = [pattern];
    }

    let filesForAnalyzer: string[] = [];
    try {
        filesForAnalyzer = await globby([...globs, "!node_modules"], {
            gitignore: true,
            cwd: basePath
        });
    } catch (ex) {
        console.error(ex);
    }

    const filesWithAbsolutePaths = filesForAnalyzer.map(f => path.join(basePath, f));

    const sourceFiles: ts.SourceFile[] = filesWithAbsolutePaths.map(sf => ts.createSourceFile(
        sf,
        readFileSync(sf, "utf8"), // TODO: Is there a need to make this not sync? For speed?
        ts.ScriptTarget.ES2015,
        true
    ));

    return sourceFiles;
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
    createCachePath(cachePath);

    const savePath = path.resolve(cachePath, CEM_CACHE_NAME);
    const manifestAsString = JSON.stringify(manifest);
    fs.writeFileSync(savePath, manifestAsString, "utf8");

    return savePath;
}

function cacheManifestConfigAsModule(projectPath: string, manifestFileContent: string) {
    const cachePath = path.join(projectPath, CEM_CACHE_DIR);
    createCachePath(cachePath);

    const savePath = path.resolve(cachePath, CEM_CACHED_CONFIG_FILE_NAME);
    fs.writeFileSync(savePath, manifestFileContent, "utf8");

    return savePath;
}

function createCachePath(cachePath: string) {
    if (!fs.existsSync(cachePath)) {
        // console.log("Creating cache path ", cachePath);
        fs.mkdirSync(cachePath, { recursive: true });
    }
}

async function getPossibleProjectConfig(basePath: string) {

    const pattern = `**/${CEM_CONFIG_FILE_NAME}.*`;
    const configFiles = await globby(["!node_modules", pattern], {
        gitignore: true,
        cwd: "."
    });

    const configFileDistances = configFiles
        .map(cf => ({ config: cf, distance: cf.split("/").length }))
        .sort((a, b) => a.distance - b.distance);

    const closestConfig = configFileDistances[0];

    if (!closestConfig) {
        return DEFAULT_CONFIG;
    }

    const configFileContent = fs.readFileSync(closestConfig.config, "utf8");
    const cachedManifestPath = cacheManifestConfigAsModule(basePath, configFileContent);

    // Now we have our config locally setup in a `mjs` file and can import it.
    const importedConfig = await import(cachedManifestPath + `?cachebust=${Date.now().toString()}`);

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
    stencil: true,
    fast: true,
    catalyst: true,
    'catalyst-major-2': true,
    plugins: [

    ]
}
