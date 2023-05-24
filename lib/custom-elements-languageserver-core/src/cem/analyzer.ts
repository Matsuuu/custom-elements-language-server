// @ts-expect-error
import { create, ts } from "@custom-elements-manifest/analyzer";
// @ts-expect-error
import { JavaScriptExport, Package } from "custom-elements-manifest";
// TODO: Can we fix these imports?
import tss from "typescript/lib/tsserverlibrary.js";
import fs from "fs";
import path from "path";
// TODO: Awaiting typing fix
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

    const plugins = [...(projectConfig.plugins || []), ...frameworkPlugins]


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
    fs.writeFileSync(savePath, JSON.stringify(manifest), "utf8");

    return savePath;
}

async function getPossibleProjectConfig(basePath: string) {
    const config = await readConfig("custom-elements-manifest.config", undefined, basePath);
    // TODO: Go through the config and get the good bits like in https://github.com/open-wc/custom-elements-manifest/blob/master/packages/analyzer/cli.js#LL34C19-L34C19
    console.log("=== CEM CONFIG", config);

    return config;
}

// https://github.com/open-wc/custom-elements-manifest/blob/master/packages/analyzer/src/utils/cli-helpers.js#L88

async function getFrameworkPlugins(options: any) {
    let plugins: any[] = [];
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

