import { Logger } from "./logger";
import * as tss from "typescript/lib/tsserverlibrary";


export function createProjectService(host: tss.server.ServerHost) {
    const logger = new Logger();
    return new ProjectService({
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

    constructor(options: tss.server.ProjectServiceOptions) {
        super(options);

    }
}
