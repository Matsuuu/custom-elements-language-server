import * as ts from "typescript";
import * as tss from "typescript/lib/tsserverlibrary";
import { ServerHost } from "./server-host";
import * as HTMLTemplateLiteralTSServerPlugin from "html-template-literal-tsserver-plugin";
import { getProjectService } from "./project-service";
import { getPluginCreateInfo } from "./plugin-creation";


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

    public get languageService() {
        return this._languageService;
    }

    constructor() {
        const serverHost = new ServerHost();

        const templateLiteralTSServerPlugin = HTMLTemplateLiteralTSServerPlugin({ typescript: tss });
        const projectService = getProjectService(serverHost);

        const result = projectService.openClientFile(TEST_INPUT_FILE);

        // TODO: Do we need a cached map of Map<Project, tss.LanguageService> ?
        // Should the key be a simple like Map<String, tss.LanguageService> where String is 
        // the file passed to `openClientFile`. Maybe it could be the tsconfig/jsconfig file?
        // As the TS completions won't work without one either. I think?
        //
        const pluginCreateInfo = getPluginCreateInfo(projectService);
        if (!pluginCreateInfo) {
            throw new Error("Failed to initialize Plugin Creation Info");
        }

        this._languageService = templateLiteralTSServerPlugin.create(pluginCreateInfo);

        if (this._languageService) {
            console.log(this._languageService);
            console.log("Init successful");
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
