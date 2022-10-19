import * as ts from "typescript";

const COMPILER_OPTIONS: ts.CompilerOptions = {};

export class ASTParser {

    program: ts.Program = ts.createProgram([], {});

    private nodes: Map<string, Array<ts.Node>> = new Map(); // Preliminary base structure for queryable nodes, improve as we go


    constructor(fileNames: Array<string>) {
        this.program = ts.createProgram(fileNames, COMPILER_OPTIONS);

    }

    public parseNodes(fileName: string) {
        const sourceFile = this.getSourceFile(fileName);
        if (!sourceFile) return;


        // TODO: Parse nodes and map them to this.nodes
        // Could we just save the 'pos' of every node and sort them by it, getting the pos that is closest
        // to the cursor position, while not going over it?
    }

    public getSourceFile(fileName: string) {
        return this.program.getSourceFile(fileName);
    }
}

export function initParser(fileNames: Array<string>): ASTParser {
    const parser = new ASTParser(fileNames);

    return parser;
}
