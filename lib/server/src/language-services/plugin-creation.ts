import tss from "typescript/lib/tsserverlibrary.js";

import { ProjectService } from "../language-services/project-service.js";
import { ServerHost } from "../language-services/server-host.js";

export function getPluginCreateInfo(projectService: ProjectService):
    tss.server.PluginCreateInfo | undefined {

    const projectNames = projectService.getConfiguredProjects();
    const project = projectService.configuredProjects.get(projectNames[0]);

    const serverHost = new ServerHost();
    if (!project) {
        return undefined;
    }

    return {
        project: project,
        languageService: project.getLanguageService(),
        languageServiceHost: project,
        serverHost: serverHost,
        config: {}
    }
}
