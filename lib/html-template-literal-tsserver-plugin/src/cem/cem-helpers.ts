import { CustomElementDeclaration, Declaration, Export, Module, Package } from "custom-elements-manifest";

// Map<tagName, ClassModule>
const CEMClassCache: Map<string, Module> = new Map();
// TODO: Make this a map with Map<string, CustomElementDeclaration> or something similiar 
// if there's a perf benefit from it
let CEMCustomElementTagCache: Array<string> = [];


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

    CEMClassCache.set(tagName, mod);
    return mod;
}

export function findCustomElementTagLike(manifest: Package, tagNamePart: string) {
    // TODO: Memoize this or something. Weakmaps maybe?
    scanCustomElementTagNames(manifest);
    return CEMCustomElementTagCache.filter(tag => tag.includes(tagNamePart));
}

export function scanCustomElementTagNames(manifest: Package) {
    const customElementDeclarations = manifest.modules.filter(mod => moduleHasCustomElementExport(mod));
    CEMCustomElementTagCache = customElementDeclarations.flatMap(decl => {
        return decl.exports
            ?.filter(exportHasCustomElementExport)
            .map(exp => exp.name) ?? [];
    });
}

export function moduleHasCustomElementExport(mod: Module) {
    return mod.exports?.some(exp => exportHasCustomElementExport(exp));
}

export function exportHasCustomElementExport(modExport: Export) {
    return modExport.kind === "custom-element-definition";
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
