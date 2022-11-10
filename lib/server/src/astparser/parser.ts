import * as ts from "typescript";
import * as tss from "typescript/lib/tsserverlibrary";

const COMPILER_OPTIONS: ts.CompilerOptions = {};

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
        fileName = fileName.replace("file://", "");// TODO: Can we get the path without this stuff?

    }
}

export function initParser(fileNames: Array<string>): ASTParser {
    return new ASTParser(fileNames);
}
