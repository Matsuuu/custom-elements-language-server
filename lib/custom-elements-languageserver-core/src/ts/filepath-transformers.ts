export function getPathAsJsFile(path: string) {
    return path.replace(/\.ts$/, ".js");
}

export function getPathAsTsFile(path: string) {
    return path.replace(/\.js$/, ".ts");
}

export function getPathAsDtsFile(path: string) {
    return path.replace(/\.(js|ts)$/, ".d.ts");
}
