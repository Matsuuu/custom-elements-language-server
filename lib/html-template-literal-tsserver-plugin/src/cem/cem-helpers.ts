import { CustomElementDeclaration, Declaration, Export, Module, Package } from "custom-elements-manifest";

// Map<tagName, ClassModule>
const CEMCache: Map<string, Module> = new Map();


export function findClassForTagName(manifest: Package, tagName: string) {
    const declarationModule = manifest.modules.find(mod => moduleHasCustomElementExportByName(mod, tagName));
    if (!declarationModule) return undefined;

    const declarationExport = declarationModule.exports?.find(exp => exportHasCustomElementExportByName(exp, tagName));
    if (!declarationExport) return undefined;

    const declaration = declarationExport.declaration;
    const classPath = declaration.module;

    if (!classPath) return undefined;

    const mod = findModuleByPath(manifest, classPath);
    if (!mod) return undefined;

    CEMCache.set(tagName, mod);
    return mod;
}

export function moduleHasCustomElementExportByName(mod: Module, tagName: string) {
    return mod.exports?.some(exp => exportHasCustomElementExportByName(exp, tagName));
}

export function exportHasCustomElementExportByName(modExport: Export, tagName: string) {
    return modExport.kind === "custom-element-definition" && modExport.name === tagName;
}

export function findModuleByPath(manifest: Package, path: string) {
    return manifest.modules.find(mod => modulePathEquals(mod, path));
}

export function modulePathEquals(mod: Module, path: string) {
    const modulePath = mod.path;
    const modulePathAsJs = modulePath.replace(".ts", ".js");
    const withTrailingSlash = modulePath.startsWith("/") ? modulePath : "/" + modulePath;
    const withTrailingSlashAsJs = withTrailingSlash.replace(".ts", ".js");
    // TODO: Ugly
    return path === modulePath
        || path === modulePathAsJs
        || path === withTrailingSlash
        || path === withTrailingSlashAsJs;
}

export function isCustomElementDeclaration(dec: Declaration): dec is CustomElementDeclaration {
    return (dec as CustomElementDeclaration).customElement !== undefined && (dec as CustomElementDeclaration).customElement;
}
