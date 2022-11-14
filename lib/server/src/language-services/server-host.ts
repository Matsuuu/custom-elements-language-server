import tss from "typescript/lib/tsserverlibrary.js";

// TODO: Are these things actually undefined at some time?
// TODO TODO: Implement some of these methods ourselves

export class ServerHost implements tss.server.ServerHost {

    args: string[];
    newLine: string;
    useCaseSensitiveFileNames: boolean;

    constructor() {
        this.args = tss.sys.args;
        this.newLine = tss.sys.newLine
        this.useCaseSensitiveFileNames = tss.sys.useCaseSensitiveFileNames
    }

    watchFile(path: string, callback: tss.FileWatcherCallback, pollingInterval?: number | undefined, options?: tss.WatchOptions | undefined): tss.FileWatcher {
        if (!tss.sys.watchFile) throw new Error("Could not start a filewatcher");
        return tss.sys.watchFile(path, callback, pollingInterval, options);
    }
    watchDirectory(path: string, callback: tss.DirectoryWatcherCallback, recursive?: boolean | undefined, options?: tss.WatchOptions | undefined): tss.FileWatcher {
        if (!tss.sys.watchDirectory) throw new Error("Could not start a directorywatcher");
        return tss.sys.watchDirectory(path, callback, recursive, options);
    }
    setTimeout(callback: (...args: any[]) => void, ms: number, ...args: any[]) {
        if (!tss.sys.setTimeout) throw new Error("Could not run setTimeout, function not found");
        tss.sys.setTimeout(callback, ms, ...args);
    }

    clearTimeout(timeoutId: any): void {
        if (!tss.sys.clearTimeout) throw new Error("Could not run clearTimeout, function not found");
        tss.sys.clearTimeout(timeoutId);
    }
    setImmediate(callback: (...args: any[]) => void, ...args: any[]) {
        setImmediate(callback, ...args);
    }
    clearImmediate(timeoutId: any): void {
        clearImmediate(timeoutId);
    }
    write(s: string): void {
        tss.sys.write(s);
    }
    readFile(path: string, encoding?: string | undefined): string | undefined {
        // TODO: Optimize this to not oly use the ts implementation but use a cached value or something
        return tss.sys.readFile(path, encoding);
    }
    writeFile(path: string, data: string, writeByteOrderMark?: boolean | undefined): void {
        tss.sys.writeFile(path, data, writeByteOrderMark);
    }
    resolvePath(path: string): string {
        return tss.sys.resolvePath(path);
    }
    fileExists(path: string): boolean {
        return tss.sys.fileExists(path);
    }
    directoryExists(path: string): boolean {
        return tss.sys.directoryExists(path);
    }
    createDirectory(path: string): void {
        tss.sys.createDirectory(path);
    }
    getExecutingFilePath(): string {
        return tss.sys.getExecutingFilePath();
    }
    getCurrentDirectory(): string {
        return tss.sys.getCurrentDirectory();
    }
    getDirectories(path: string): string[] {
        return tss.sys.getDirectories(path);
    }
    readDirectory(path: string, extensions?: readonly string[] | undefined, exclude?: readonly string[] | undefined, include?: readonly string[] | undefined, depth?: number | undefined): string[] {
        return tss.sys.readDirectory(path, extensions, exclude, include, depth);
    }
    exit(exitCode?: number | undefined): void {
        tss.sys.exit(exitCode);
    }

}
