import { Export, Module, Package } from "custom-elements-manifest";

// Map<tagName, ClassModule>
const CEMCache: Map<string, Module> = new Map();


export function findClassForTagName(manifest: Package, tagName: string) {
    const declarationModule = manifest.modules.find(mod => moduleHasCustomElementExportByName(mod, tagName));
    if (!declarationModule) return undefined;

    const declarationExport = declarationModule.exports?.find(exp => exportHasCustomElementExportByName(exp, tagName));
    if (!declarationExport) return undefined;

    const declaration = declarationExport.declaration;
    const className = declaration.name;
    const classPath = declaration.module;

    return undefined;
}

export function moduleHasCustomElementExportByName(mod: Module, tagName: string) {
    return mod.exports?.some(exp => exportHasCustomElementExportByName(exp, tagName));
}

export function exportHasCustomElementExportByName(modExport: Export, tagName: string) {
    return modExport.kind === "custom-element-definition" && modExport.name === tagName;
}
