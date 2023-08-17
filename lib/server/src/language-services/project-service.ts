import { Logger } from "./logger.js";
import tss from "typescript/lib/tsserverlibrary.js";
import path from "path";
import { tssIteratorToArray } from "./transformers.js";

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
        session: undefined,
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

    public openAndGetProjectForFile(fileName: string, fileContent: string | undefined) {
        console.log("Open and get project for file ", fileName);
        console.log("Filecontent: ", fileContent?.length || 0);
        
        const fileOpenResult = this.openClientFile(fileName, fileContent);

        const scriptInfo = this.getScriptInfoForNormalizedPath(tss.server.toNormalizedPath(fileName));
        console.log("Script info is undefined: ", scriptInfo === undefined);
        return scriptInfo?.containingProjects[0];
    }
}

