import * as tss from "typescript/lib/tsserverlibrary";
import { ProjectService } from "../language-services/project-service";
import { ServerHost } from "../language-services/server-host";

export function getPluginCreateInfo(projectService: ProjectService): tss.server.PluginCreateInfo | undefined {

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
