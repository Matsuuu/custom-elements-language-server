import * as ts from "typescript";
import * as tss from "typescript/lib/tsserverlibrary";
// @ts-ignore
import * as LangServerConfig from "html-template-literal-tsserver-plugin";

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
        console.log("parseNodes: " + fileName)
        const sourceFile = this.getSourceFile(fileName);
        console.log("Source file", sourceFile);
        /*if (!sourceFile) return;
    
        const nodes = enumerateNodeAndChildren(sourceFile);
        const sortedNodes = nodes.sort((a, b) => a.pos - b.pos);
    
        sortedNodes.forEach((n) =>
            console.log(n.pos + " - " + n.end + " == " + n.kind)
                           );*/

        const files: ts.MapLike<{ version: number }> = { [fileName]: { version: 0 } };
        const conf = LangServerConfig({ typescript: ts });
        // TODO: Parse nodes and map them to this.nodes
        // Could we just save the 'pos' of every node and sort them by it, getting
        // the pos that is closest to the cursor position, while not going over it?

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

/*
 * Language Service Implementation borrowed from
 * https://github.com/google/playground-elements/blob/d50dc9b5f4fdc6640a11eb6ae4112fc96e6fe678/src/typescript-worker/language-service-context.ts#L67
 * just for test purposes. If LS setup is needed for this project, rewrite this
 * implementation
 * */

const compilerOptions: ts.CompilerOptions = {
    target: ts.ScriptTarget.ES2017,
    module: ts.ModuleKind.ESNext,
    experimentalDecorators: true,
    skipDefaultLibCheck: true,
    skipLibCheck: true,
    allowJs: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    jsx: ts.JsxEmit.React,
    lib: ['dom', 'esnext'],
}

export class LanguageServiceContext {
    readonly compilerOptions = compilerOptions;

    readonly serviceHost = new LanguageServiceHost("", compilerOptions);

    readonly service =
        ts.createLanguageService(this.serviceHost, ts.createDocumentRegistry());
}

interface VersionedFile {
    version: number;
    content: string;
}

class LanguageServiceHost implements ts.LanguageServiceHost {
    readonly compilerOptions: ts.CompilerOptions;
    readonly packageRoot: string;
    readonly files: Map<string, VersionedFile> = new Map<string, VersionedFile>();

    constructor(packageRoot: string, compilerOptions: ts.CompilerOptions) {
        this.packageRoot = packageRoot;
        this.compilerOptions = compilerOptions;
    }

    /*
     *  When a new new "process" command is received, we iterate through all of
     * the files, and update files accordingly depending on if they have new
     * content or not.
     *
     *  With how the TS API works, we can use simple versioning to tell the
     *  Language service that a file has been updated
     *
     *  If the file submitted is a new file, we add it to our collection
     */
    updateFileContentIfNeeded(fileName: string, content: string) {
        const file = this.files.get(fileName);
        if (file && file.content !== content) {
            file.content = content;
            file.version += 1;
        } else {
            this.files.set(fileName, { content, version: 0 });
        }
    }

    /**
     * Sync up the freshly acquired project files.
     * In the syncing process files yet to be added are added, and versioned.
     * Files that existed already but are modified are updated, and their version
     * number gets bumped fo that the languageservice knows to update these files.
     * */
    sync(files: Map<string, string>) {
        files.forEach((file, fileName) =>
            this.updateFileContentIfNeeded(fileName, file));
        this._removeDeletedFiles(files);
    }

    private _removeDeletedFiles(files: Map<string, string>) {
        this.getScriptFileNames().forEach((fileName) => {
            // Do not delete the dependency files, as then they will get re-applied
            // every compilation. This is because the compilation step is aware of
            // these files, but the completion step isn't.
            if (!fileName.includes('node_modules') && !files.has(fileName)) {
                this.files.delete(fileName);
            }
        });
    }

    getCompilationSettings(): ts.CompilerOptions { return this.compilerOptions; }

    getScriptFileNames(): string[] { return [...this.files.keys()]; }

    getScriptVersion(fileName: string) {
        return this.files.get(fileName)?.version.toString() ?? '-1';
    }

    fileExists(fileName: string): boolean { return this.files.has(fileName); }

    readFile(fileName: string): string | undefined {
        return this.files.get(fileName)?.content;
    }

    getScriptSnapshot(fileName: string): ts.IScriptSnapshot | undefined {
        if (!this.fileExists(fileName)) {
            return undefined;
        }
        return ts.ScriptSnapshot.fromString(this.readFile(fileName)!);
    }

    getCurrentDirectory(): string { return this.packageRoot; }

    getDefaultLibFileName(): string { return '__lib.d.ts'; }
}
