import ts from "typescript";
import { VirtualSystem } from "./system";


export function createVirtualCompilerHost(system: VirtualSystem, compilerOptions: ts.CompilerOptions, ts: typeof import("typescript")): VirtualCompilerHost {

    return new VirtualCompilerHost(system, compilerOptions, ts);
}

export class VirtualCompilerHost implements ts.CompilerHost {

    sourceFiles: Map<string, ts.SourceFile> = new Map();

    constructor(public system: VirtualSystem, private compilerOptions: ts.CompilerOptions, private ts: typeof import("typescript")) {
    }
    writeFile(fileName: string, text: string) {
        return this.system.writeFile(fileName, text);
    }
    getCurrentDirectory(): string {
        return this.system.getCurrentDirectory();
    }
    fileExists(fileName: string): boolean {
        return this.system.fileExists(fileName);
    }
    readFile(fileName: string): string | undefined {
        return this.system.readFile(fileName);
    }

    getSourceFile(fileName: string): ts.SourceFile | undefined {
        const existing = this.sourceFiles.get(fileName);
        if (existing) {
            return existing;
        }
        return this.saveSourceFile(ts.createSourceFile(fileName, this.system.readFile(fileName)!, this.compilerOptions.target || ts.ScriptTarget.ESNext, false))
    }

    updateFile(sourceFile: ts.SourceFile) {
        const existing = this.sourceFiles.get(sourceFile.fileName);
        this.system.writeFile(sourceFile.fileName, sourceFile.text);
        this.sourceFiles.set(sourceFile.fileName, sourceFile);
        return existing;
    }

    useCaseSensitiveFileNames(): boolean {
        return this.system.useCaseSensitiveFileNames;
    }

    saveSourceFile(sourceFile: ts.SourceFile): ts.SourceFile {
        this.sourceFiles.set(sourceFile.fileName, sourceFile);
        return sourceFile;
    }

    getDirectories(path: string): string[] {
        return this.system.getDirectories();
    }

    getDefaultLibFileName(options: ts.CompilerOptions): string {
        return "/" + ts.getDefaultLibFileName(this.compilerOptions)
    }
    getCanonicalFileName(fileName: string): string {
        return fileName;
    }
    getNewLine(): string {
        return this.system.newLine;
    }
}
