import HTMLTemplateLiteralTSServerPlugin from "html-template-literal-tsserver-plugin/out/index.js";
import ts from "typescript";
import tss, { server } from "typescript/lib/tsserverlibrary.js";

import { getPluginCreateInfo } from "./plugin-creation.js";
import { getProjectService } from "./project-service.js";
import { ServerHost } from "./server-host.js";

const serverHost = new ServerHost();
const projectService = getProjectService(serverHost);

export class LanguageServiceManager {

    static _instance?: LanguageServiceManager;

    private _languageServiceCache: Map<string, tss.LanguageService> = new Map();

    /**
     * Try to get the plugged in language service instance of project
     * using the config file path (e.g. /home/matsu/Project/foo/tsconfig.json).
     * */
    private getOrCreateLanguageService(projectConfigFilePath: string) {
        if (this._languageServiceCache.has(projectConfigFilePath)) {
            return this._languageServiceCache.get(projectConfigFilePath);
        }

        const pluginCreateInfo = getPluginCreateInfo(projectService);
        if (!pluginCreateInfo) {
            throw new Error("Failed to initialize Plugin Creation Info");
        }

        const templateLiteralTSServerPlugin = HTMLTemplateLiteralTSServerPlugin({ typescript: tss });
        const languageService = templateLiteralTSServerPlugin.create(pluginCreateInfo);

        if (!languageService) {
            // TODO: Throw error?
            console.error("Language service init failed");
            return undefined;
        }

        this._languageServiceCache.set(projectConfigFilePath, languageService);
        return languageService;
    }

    public getLanguageServiceForCurrentFile(fileName: string): tss.LanguageService | undefined {

        const project = projectService.openAndGetProjectForFile(fileName);
        if (!project) {
            return undefined;
        }

        const resolvedProjectIsConfiguredProject = isConfiguredProject(project);
        if (!resolvedProjectIsConfiguredProject) {
            // TODO: Can we do anything with a project that's not configured?
            return undefined;
        }

        const configFilePath = project.canonicalConfigFilePath;

        return this.getOrCreateLanguageService(configFilePath);
    }
}

// Here we have some short hand handlers for our language service instance

export function getLanguageServiceManagerInstance() {
    if (!LanguageServiceManager._instance) {
        LanguageServiceManager._instance = new LanguageServiceManager();
    }
    return LanguageServiceManager._instance;
}

export function getLanguageService(fileName: string) {
    return getLanguageServiceManagerInstance().getLanguageServiceForCurrentFile(fileName);
}

export function initializeLanguageServiceForFile(fileName: string) {
    getLanguageServiceManagerInstance().getLanguageServiceForCurrentFile(fileName);
}

export function getLanguageServiceForCurrentFile(fileName: string) {
    return getLanguageServiceManagerInstance().getLanguageServiceForCurrentFile(fileName);
}

export function syncFile(filePath: string, fileContents: string) {
    const languageService = getLanguageService(filePath);
    // @ts-ignore
    languageService?.getProgram().writeFile(filePath, fileContents);
}

export function isConfiguredProject(project: tss.server.Project): project is tss.server.ConfiguredProject {
    return project instanceof tss.server.ConfiguredProject;
}
