import ts from "typescript";

import path from "path";
import fs from "fs";

export function initializeVirtualFileSystemMap(): Map<string, string> {
    // TODO: These need to be put somewhere as we can't expect the
    // user to have these in their project
    function loadTypescriptLibFile(filename: string) {
        const libDir = path.dirname(require.resolve("typescript"));
        return fs.readFileSync(path.resolve(libDir, filename), "utf-8");
    }
    const fsMap = new Map<string, string>();

    const libDirectory = path.dirname(require.resolve("typescript"));
    const libFiles = fs.readdirSync(libDirectory);

    libFiles
        .filter(libFile => libFile.startsWith("lib") && libFile.endsWith(".d.ts"))
        .forEach(libFile => {
            fsMap.set("/" + libFile, loadTypescriptLibFile(libFile))
        })

    return fsMap;
}


export class VirtualSystem implements ts.System {
    args: string[] = [];
    newLine: string = "\n";
    useCaseSensitiveFileNames: boolean = true;

    files: Map<string, string> = new Map();

    constructor() {
        // this.files = initializeVirtualFileSystemMap()
    }

    directoryExists(dirName: string): boolean {
        return [...this.files.keys()].some(path => path.startsWith(dirName));
    }
    fileExists(fileName: string): boolean {
        return this.files.has(fileName);
    }
    getCurrentDirectory(): string {
        return "/";
    }
    getDirectories(): string[] {
        return [];
    }
    readDirectory(path: string): string[] {
        return [...this.files.keys()];
    }
    readFile(fileName: string): string | undefined {
        return this.files.get(fileName);
    }
    resolvePath(path: string): string {
        return path;
    }
    writeFile(fileName: string, data: string): void {
        this.files.set(fileName, data);
    }



    write(s: string): void {
        throw new Error("Not implemented: write");
    }
    getExecutingFilePath(): string {
        throw new Error("Not implemented: getExecutingFilePath");
    }
    exit(exitCode?: number | undefined): void {
        throw new Error("Not implemented: exit");
    }
    createDirectory(path: string): void {
        throw new Error("Not implemented: createDirectory");
    }

}

