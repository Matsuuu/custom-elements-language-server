import { Logger } from "./logger.js";
import tss from "typescript/lib/tsserverlibrary.js";
import { tssIteratorToArray } from "./transformers.js";
import * as fs from "fs";

const logger = new Logger();

// TODO: Is it okay that this is a singleton?
export function getProjectService(host: tss.server.ServerHost) {
    return ProjectService.getInstance({
        host,
        logger,
        cancellationToken: tss.server.nullCancellationToken, // TODO: Figure out
        useSingleInferredProject: true,
        useInferredProjectPerProjectRoot: true,
        globalPlugins: [], // TODO: Add our plugin here?
        allowLocalPluginLoads: true,
        typingsInstaller: tss.server.nullTypingsInstaller, // TODO
        session: undefined
    });
}

export class ProjectService extends tss.server.ProjectService {

    private static _instance: ProjectService | undefined;

    public static getInstance(options: tss.server.ProjectServiceOptions) {
        if (!this._instance) {
            this._instance = new ProjectService(options);
        }
        return this._instance;
    }

    constructor(options: tss.server.ProjectServiceOptions) {
        super(options);
    }

    public getConfiguredProjects(): Array<string> {
        return tssIteratorToArray(this.configuredProjects.keys());
    }

    public openAndGetProjectForFile(fileName: string, fileContent: string) {

        const isHtmlFile = fileName.endsWith("html");
        if (isHtmlFile) {
            return this.openAndGetProjectForHtmlFile(fileName, fileContent);
        }

        const fileOpenResult = this.openClientFile(fileName, fileContent);

        // @ts-ignore I don't know why the typing here is so scuffed
        const scriptInfo = this.getScriptInfoForNormalizedPath(fileName);
        return scriptInfo?.containingProjects[0];
    }

    openAndGetProjectForHtmlFile(fileName: string, fileContent: string) {
        const closestConfigurationFile = findClosestConfigurationFile(fileName);
        if (!closestConfigurationFile) {
            return undefined;
        }

        const configuredProjects = this.configuredProjects
        if (!configuredProjects.has(closestConfigurationFile)) {
            return undefined;
        }


        const project = configuredProjects.get(closestConfigurationFile);
        project?.writeFile(fileName, fileContent);
        return project;
    }
}

function findClosestConfigurationFile(path: string) {
    let currentPath = path.substring(0, path.lastIndexOf("/"));
    while (currentPath.includes("/")) {
        const tsConfigPath = currentPath + "/tsconfig.json";
        const jsConfigPath = currentPath + "/jsconfig.json";

        if (fs.existsSync(tsConfigPath)) {
            return tsConfigPath;
        }
        if (fs.existsSync(jsConfigPath)) {
            return jsConfigPath;
        }

        currentPath = currentPath.substring(0, path.lastIndexOf("/"));
    }
    return undefined;
}
