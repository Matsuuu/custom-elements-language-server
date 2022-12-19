export function getFileNameFromPath(path?: string): string {
    if (!path) {
        return "";
    }
    return path.split("/").slice(-1)[0];
}
