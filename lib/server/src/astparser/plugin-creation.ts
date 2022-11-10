import * as tss from "typescript/lib/tsserverlibrary";
import { ProjectService } from "../language-services/project-service";
import { ServerHost } from "../language-services/server-host";

export function getPluginCreateInfo(projectService: ProjectService): tss.server.PluginCreateInfo | undefined {

    const projectNamesIterator = projectService.configuredProjects.keys();
    const projectNames: string[] = [];
    let round = undefined;
    while (!(round = projectNamesIterator.next()).done) {
        projectNames.push(round.value);
    }
    const configuredProjects = projectService.configuredProjects;
    const project = configuredProjects.get(projectNames[0]);

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
