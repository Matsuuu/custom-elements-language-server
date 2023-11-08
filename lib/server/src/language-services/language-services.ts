import tss from "typescript/lib/tsserverlibrary.js";
import fs from "fs";
import { getProjectService } from "./project-service.js";

const projectService = getProjectService();

export enum ProjectSpecificity {
    FILE_LEVEL = "file_level",
    PROJECT_LEVEL = "project_level"
}

export class LanguageServiceManager {
    static _instance?: LanguageServiceManager;

    public async refreshFileForLanguageService(fileName: string, fileContent: string | undefined) {
        getProjectForCurrentFile(fileName, fileContent ?? '');
    }

    public getProjectForCurrentFile(fileName: string, fileContent: string) {
        let project = projectService.openAndGetProjectForFile(fileName, fileContent);
        return project;
    }

}

// Here we have some short hand handlers for our language service instance

export function getLanguageServiceManagerInstance() {
    if (!LanguageServiceManager._instance) {
        LanguageServiceManager._instance = new LanguageServiceManager();
    }
    return LanguageServiceManager._instance;
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

export function refreshLanguageServiceForFile(fileName: string, fileContent: string | undefined) {
    getLanguageServiceManagerInstance().refreshFileForLanguageService(fileName, fileContent);
}

export function getProjectForCurrentFile(fileName: string, fileContent: string) {
    return getLanguageServiceManagerInstance().getProjectForCurrentFile(fileName, fileContent);
}

export function getProjectForCurrentContext(fileName: string, fileContent: string) {
    return getLanguageServiceManagerInstance().getProjectForCurrentFile(fileName, fileContent);
}

export function isConfiguredProject(project: tss.server.Project): project is tss.server.ConfiguredProject {
    return project instanceof tss.server.ConfiguredProject;
}
