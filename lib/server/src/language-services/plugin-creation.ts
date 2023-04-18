import tss from "typescript/lib/tsserverlibrary.js";

import { ProjectService } from "../language-services/project-service.js";

export function getPluginCreateInfo(projectService: ProjectService, projectConfigFilePath: string): tss.server.PluginCreateInfo | undefined {
    const project = projectService.configuredProjects.get(projectConfigFilePath);

    if (!project) {
        return undefined;
    }

    return {
        project: project,
        languageService: project.getLanguageService(),
        languageServiceHost: project,
        serverHost: projectService.host,
        config: {},
    };
}
