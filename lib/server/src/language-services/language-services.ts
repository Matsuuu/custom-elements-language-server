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

    public getProjectForCurrentFile(fileName: string, fileContent: string, specificity: ProjectSpecificity) {
        let project = projectService.openAndGetProjectForFile(fileName, fileContent);
        // TODO: Okay so this hack doesn't really function as it breaks import checks. Either 
        // Rewrite import checks or make this better
        if (project && !isConfiguredProject(project) && specificity === ProjectSpecificity.PROJECT_LEVEL) {
            const configuredProjects = [...projectService.configuredProjects.entries()];
            // This is a hack to support other file formats, which don't automatically have a 
            // configuredproject. The `projectService.configFileForOpenFiles` API is marked as internal
            // and therefore shouldn't be accessed. Needs more research on this but this works for now.
            // @ts-ignore
            const configFileMap = projectService.configFileForOpenFiles;
            const currentFileConfigFile = configFileMap.get(fileName);
            const matchingProject = configuredProjects.find(entry => {
                const configPath = entry[0];
                return configPath === currentFileConfigFile
            })
            project = matchingProject?.[1];
        }
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
    return getLanguageServiceManagerInstance().getProjectForCurrentFile(fileName, fileContent, ProjectSpecificity.FILE_LEVEL);
}

export function getProjectForCurrentContext(fileName: string, fileContent: string) {
    return getLanguageServiceManagerInstance().getProjectForCurrentFile(fileName, fileContent, ProjectSpecificity.PROJECT_LEVEL);
}

export function isConfiguredProject(project: tss.server.Project): project is tss.server.ConfiguredProject {
    return project instanceof tss.server.ConfiguredProject;
}
