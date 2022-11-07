import * as ts from "typescript";
import * as tss from "typescript/lib/tsserverlibrary";
import { createProjectService } from "./project-service";
import { ServerHost } from "./server-host";
import * as LangServerConfig from "html-template-literal-tsserver-plugin";

const COMPILER_OPTIONS: ts.CompilerOptions = {};

const TEST_INPUT_FILE = "test-project/src/test.ts";

export class ASTParser {
    program: ts.Program = ts.createProgram([], {});
    languageService: ts.LanguageService | undefined;

    private nodes: Map<string, Array<ts.Node>> =
        new Map(); // Preliminary base structure for queryable nodes, improve as
    // we go

    constructor(fileNames: Array<string>) {
        this.program = ts.createProgram(fileNames, COMPILER_OPTIONS);
    }

    public parseFile(fileName: string) {
        fileName = fileName.replace("file://", "");
        const sourceFile = this.getSourceFile(fileName);

        const files: ts.MapLike<{ version: number }> = { [fileName]: { version: 0 } };
        // TODO: Parse nodes and map them to this.nodes
        // Could we just save the 'pos' of every node and sort them by it, getting
        // the pos that is closest to the cursor position, while not going over it?

        // TODO: Figure out how we could build these. This would allow us to 
        // augment the language service with out plugin IF I'M READING INTO THIS RIGHT
        // Could we use tss.server.ConfiguredProject ?
        const serverHost = new ServerHost();

        const conf = LangServerConfig({ typescript: tss });
        const projectService = createProjectService(serverHost);

        // TODO: CONTINUE HERE: Somehow try to either open a client file, generating a ConfiguredProject or 
        // try and open a externalProject from a tsconfig/jsconfig file.
        // ... Maybe better to use the file if there is not tsconfig/jsconfig and it might not work.
        const result = projectService.openClientFile(fileName);
        const configuredProjects = projectService.configuredProjects;

        console.log("==================");
        console.log("RESULT ", result);
        console.log("CONFIGURED ", configuredProjects);
        console.log("==================");

        const projectNamesIterator = projectService.configuredProjects.keys();
        const projectNames: string[] = [];
        let round = undefined;
        while (!(round = projectNamesIterator.next()).done) {
            projectNames.push(round.value);
        }
        console.log("Project names: ", projectNames);

        const project = configuredProjects.get(projectNames[0]);
        if (!project) {
            return;
        }

        // ===== THIS IS JUST SOME SCAFFOLDING CODE TO TEST STUFF
        // CLASSIFY LATER

        const pluginCreateInfo: tss.server.PluginCreateInfo = {
            project: project,
            languageService: project.getLanguageService(),
            languageServiceHost: project,
            serverHost: serverHost,
            config: {}
        }

        this.languageService = conf.create(pluginCreateInfo);

        console.log("FUCK YEAH, WE DID IT!")
        console.log(this.languageService);

        // ============
    }

    /**
     * @param cursorIndex { number } Position of cursor as a index from the start
     *     of the file
     * */
    public findNodeUnderCursor(cursorIndex: number) {
        // TODO: For now, let's just find the node which has the pos closes to the
        // cursor position, while not going over it
    }

    public getSourceFile(fileName: string) {
        return this.program.getSourceFile(fileName);
    }
}

export function initParser(fileNames: Array<string>): ASTParser {
    const parser = new ASTParser(fileNames);

    return parser;
}
