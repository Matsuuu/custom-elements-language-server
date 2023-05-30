// @ts-expect-error
import TemplateLanguageServicePlugin from "template-language-service";
import tss from "typescript/lib/tsserverlibrary.js";
import fs from "fs";

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
    private getOrCreateLanguageService(projectConfigFilePath: string, project: tss.server.Project) {
        if (this._languageServiceCache.has(projectConfigFilePath)) {
            return this._languageServiceCache.get(projectConfigFilePath);
        }

        const pluginCreateInfo = getPluginCreateInfo(projectService, projectConfigFilePath);
        if (!pluginCreateInfo) {
            throw new Error("Failed to initialize Plugin Creation Info");
        }

        const templateLiteralTSServerPlugin = TemplateLanguageServicePlugin({ typescript: tss, project });
        const languageService = templateLiteralTSServerPlugin.create(pluginCreateInfo);

        if (!languageService) {
            // TODO: Throw error?
            console.error("Language service init failed");
            return undefined;
        }

        this._languageServiceCache.set(projectConfigFilePath, languageService);
        return languageService;
    }

    public getLanguageServiceForCurrentFile(fileName: string, fileContent: string | undefined): tss.LanguageService | undefined {
        const project = projectService.openAndGetProjectForFile(fileName, fileContent);
        if (!project) {
            return undefined;
        }

        const resolvedProjectIsConfiguredProject = isConfiguredProject(project);
        if (!resolvedProjectIsConfiguredProject) {
            // TODO: Can we do anything with a project that's not configured?
            return undefined;
        }

        const configFilePath = project.canonicalConfigFilePath;

        const languageService = this.getOrCreateLanguageService(configFilePath, project);

        return languageService;
    }

    public getProjectForCurrentFile(fileName: string, fileContent: string) {
        return projectService.openAndGetProjectForFile(fileName, fileContent);
    }

}

// Here we have some short hand handlers for our language service instance

export function getLanguageServiceManagerInstance() {
    if (!LanguageServiceManager._instance) {
        LanguageServiceManager._instance = new LanguageServiceManager();
    }
    return LanguageServiceManager._instance;
}

export function getLanguageService(fileName: string, fileContent: string) {
    return getLanguageServiceManagerInstance().getLanguageServiceForCurrentFile(fileName, fileContent);
}

export function getProjectBasePath(fileName: string) {
    const closestConfigurationFile = findClosestConfigurationFile(fileName);
    return closestConfigurationFile?.substring(0, closestConfigurationFile?.lastIndexOf("/")) || '';
}

function findClosestConfigurationFile(path: string) {
    let currentPath = path.substring(0, path.lastIndexOf("/"));
    let i = 0;
    while (currentPath.includes("/") && currentPath.length > 1) {
        const tsConfigPath = currentPath + "/tsconfig.json";
        const jsConfigPath = currentPath + "/jsconfig.json";
        const packageJsonPath = currentPath + "/package.json";

        if (fs.existsSync(packageJsonPath)) {
            return packageJsonPath;
        }
        if (fs.existsSync(tsConfigPath)) {
            return tsConfigPath;
        }
        if (fs.existsSync(jsConfigPath)) {
            return jsConfigPath;
        }

        currentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
        i++;
        if (i > 40) {
            return "";
        }
    }
    return undefined;
}

export function updateLanguageServiceForFile(fileName: string, fileContent: string | undefined) {
    getLanguageServiceManagerInstance().getLanguageServiceForCurrentFile(fileName, fileContent);
}

export function getProjectForCurrentFile(fileName: string, fileContent: string) {
    return getLanguageServiceManagerInstance().getProjectForCurrentFile(fileName, fileContent);
}

export function isConfiguredProject(project: tss.server.Project): project is tss.server.ConfiguredProject {
    return project instanceof tss.server.ConfiguredProject;
}
