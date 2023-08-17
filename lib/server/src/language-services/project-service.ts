import { Logger } from "./logger.js";
import tss from "typescript/lib/tsserverlibrary.js";
import path from "path";
import { normalizePath } from "custom-elements-languageserver-core";

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

    public openAndGetProjectForFile(fileName: string, fileContent: string | undefined) {
        const fileOpenResult = this.openClientFile(fileName, fileContent);

        const scriptInfo = this.getScriptInfoForNormalizedPath(normalizePath(fileName));
        return scriptInfo?.containingProjects[0];
    }
}

