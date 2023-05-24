// @ts-expect-error
import { create, ts } from "@custom-elements-manifest/analyzer";
// @ts-ignore
import { JavaScriptExport, Package } from "custom-elements-manifest";
// TODO: Can we fix these imports?
import tss from "typescript/lib/tsserverlibrary.js";
import fs from "fs";
import path from "path";

// Pathing to ${projectPath}/node_modules/.cache/custom-elements-language-server
const CEM_CACHE_DIR = "/node_modules/.cache/custom-elements-language-server";
const CEM_CACHE_NAME = "custom-elements.json";
const CEM_CONFIG_FILE_NAME = "custom-elements-manifest.config";

export interface AnalyzerOutput {
    filePath: string;
    manifest: Package;
}

export async function analyzeLocalProject(project: tss.server.Project): Promise<AnalyzerOutput> {

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

    const projectConfig = await getPossibleProjectConfig(basePath);
    const frameworkPlugins = await getFrameworkPlugins(projectConfig);

    const plugins = [...(projectConfig?.plugins || []), ...frameworkPlugins]

    console.log(plugins.length + " plugins enabled in CEM generation.");

    const manifest: Package = create({
        modules: modifiedSourceFiles,
        plugins: plugins,
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
    const manifestAsString = JSON.stringify(manifest);
    fs.writeFileSync(savePath, manifestAsString, "utf8");

    console.log("Manifest size: ", manifestAsString.length);

    return savePath;
}

async function getPossibleProjectConfig(basePath: string) {
    const possibleConfigPaths = [
        basePath + "/" + CEM_CONFIG_FILE_NAME + ".js",
        basePath + "/" + CEM_CONFIG_FILE_NAME + ".mjs",
        basePath + "/" + CEM_CONFIG_FILE_NAME + ".cjs",
    ]

    let importedConfig;
    for (const possibleConfigPath of possibleConfigPaths) {
        if (fs.existsSync(possibleConfigPath)) {
            console.log("Found CEM config at ", possibleConfigPath);
            importedConfig = await import(possibleConfigPath);
            break;
        }
    }

    if (!importedConfig) {
        return undefined;
    }

    const config = importedConfig.default;

    return config;
}

// https://github.com/open-wc/custom-elements-manifest/blob/master/packages/analyzer/src/utils/cli-helpers.js#L88

async function getFrameworkPlugins(options: any) {
    let plugins: any[] = [];
    // TODO: We can't have them dynamically imported. Just import them at the top
    // of the file and set them here.
    if (options?.litelement) {
        // @ts-expect-error
        const { litPlugin } = await import('@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js');
        plugins = [...(litPlugin() || [])]
    }

    if (options?.fast) {
        // @ts-expect-error
        const { fastPlugin } = await import('@custom-elements-manifest/analyzer/src/features/framework-plugins/fast/fast.js');
        plugins = [...(fastPlugin() || [])]
    }

    if (options?.stencil) {
        // @ts-expect-error
        const { stencilPlugin } = await import('@custom-elements-manifest/analyzer/src/features/framework-plugins/stencil/stencil.js');
        plugins.push(stencilPlugin());
    }

    if (options?.catalyst) {
        // @ts-expect-error
        const { catalystPlugin } = await import('@custom-elements-manifest/analyzer/src/features/framework-plugins/catalyst/catalyst.js');
        plugins = [...(catalystPlugin() || [])]
    }

    if (options?.['catalyst-major-2']) {
        // @ts-expect-error
        const { catalystPlugin2 } = await import('@custom-elements-manifest/analyzer/src/features/framework-plugins/catalyst-major-2/catalyst.js');
        plugins = [...(catalystPlugin2() || [])]
    }

    return plugins;
}

