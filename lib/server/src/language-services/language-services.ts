import * as ts from "typescript";
import * as tss from "typescript/lib/tsserverlibrary";
import { ServerHost } from "./server-host";
import * as HTMLTemplateLiteralTSServerPlugin from "html-template-literal-tsserver-plugin";
import { createProjectService } from "./project-service";


// TODO: Parse nodes and map them to this.nodes
// Could we just save the 'pos' of every node and sort them by it, getting
// the pos that is closest to the cursor position, while not going over it?

// TODO: Figure out how we could build these. This would allow us to 
// augment the language service with out plugin IF I'M READING INTO THIS RIGHT
// Could we use tss.server.ConfiguredProject ?


const TEST_INPUT_FILE = "test-project/src/test.ts";

export class LanguageServices {

    static _instance?: LanguageServices;

    private _languageService?: tss.LanguageService;

    constructor() {
        const serverHost = new ServerHost();

        const templateLiteralTSServerPlugin = HTMLTemplateLiteralTSServerPlugin({ typescript: tss });
        const projectService = createProjectService(serverHost);

        //const result = projectService.openClientFile(fileName);
        // =============================
        // This part is in plugin-creation.ts and should be abstracted there.
        // However it requires some kind of a file or folder to find the typescript project
        //
        // TODO: Next steps: Find a good medium to pass to the LanguageServices instance to 
        // be able to create a plugincreateinfo 

        const projectNamesIterator = projectService.configuredProjects.keys();
        const projectNames: string[] = [];
        let round = undefined;
        while (!(round = projectNamesIterator.next()).done) {
            projectNames.push(round.value);
        }
        console.log("Project names: ", projectNames);

        const configuredProjects = projectService.configuredProjects;
        const project = configuredProjects.get(TEST_INPUT_FILE);

        if (!project) {
            return;
        }

        const pluginCreateInfo: tss.server.PluginCreateInfo = {
            project: project,
            languageService: project.getLanguageService(),
            languageServiceHost: project,
            serverHost: serverHost,
            config: {}
        }

        // ======================
        // TODO: Do we need a cached map of Map<Project, tss.LanguageService> ?
        // Should the key be a simple like Map<String, tss.LanguageService> where String is 
        // the file passed to `openClientFile`. Maybe it could be the tsconfig/jsconfig file?
        // As the TS completions won't work without one either. I think?

        this._languageService = templateLiteralTSServerPlugin.create(pluginCreateInfo);

        if (this._languageService) {
            console.log("Init successful");
            console.log(this._languageService);
        } else {
            console.log("Init failed");
        }
    }

}

export function getLanguageServiceInstance() {
    if (!LanguageServices._instance) {
        LanguageServices._instance = new LanguageServices();
    }
    return LanguageServices._instance;
}
