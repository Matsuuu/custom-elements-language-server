import * as ts from "typescript";
import * as tss from "typescript/lib/tsserverlibrary";

const COMPILER_OPTIONS: ts.CompilerOptions = {};

export class ASTParser {
    program: ts.Program = ts.createProgram([], {});
    languageService?: ts.LanguageService;
    languageServiceHost?: LanguageServiceHost;

    private nodes: Map<string, Array<ts.Node>> =
        new Map(); // Preliminary base structure for queryable nodes, improve as
    // we go

    constructor(fileNames: Array<string>) {
        this.program = ts.createProgram(fileNames, COMPILER_OPTIONS);
    }

    public parseNodes(fileName: string) {
        const sourceFile = this.getSourceFile(fileName);

        const files: ts.MapLike<{ version: number }> = { [fileName]: { version: 0 } };
        // TODO: Parse nodes and map them to this.nodes
        // Could we just save the 'pos' of every node and sort them by it, getting
        // the pos that is closest to the cursor position, while not going over it?

        createProjectService();

        // ===== THIS IS JUST SOME SCAFFOLDING CODE TO TEST STUFF
        // CLASSIFY LATER
        const lang = new LanguageServiceContext();
        this.languageService = lang.service;
        this.languageServiceHost = lang.serviceHost;

        // TODO: Figure out how we could build these. This would allow us to 
        // augment the language service with out plugin IF I'M READING INTO THIS RIGHT
        // Could we use tss.server.ConfiguredProject ?
        const project: tss.server.Project = {} as tss.server.Project;
        const serverHost: tss.server.ServerHost = {} as tss.server.ServerHost;

        const pluginCreateInfo: tss.server.PluginCreateInfo = {
            project: project,
            languageService: this.languageService,
            languageServiceHost: this.languageServiceHost,
            serverHost: serverHost,
            config: {}
        }

        this.languageService = conf.create();

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

function createProjectService() {
    const logger: new tss.server.Logger = null;
    new tss.server.ProjectService({

    });
}
