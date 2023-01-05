import { CustomElement, CustomElementDeclaration, Declaration, Export, JavaScriptModule, Module, Package } from "custom-elements-manifest";
import { CEMCollection } from "./cem-cache.js";
import { CEMInstance } from "./cem-data.js";

// Map<tagName, ClassModule>
const CEMClassCache: Map<string, Module> = new Map();
// TODO: Make this a map with Map<string, CustomElementDeclaration> or something similiar
// if there's a perf benefit from it
let CEMCustomElementTagCache: Array<string> = [];

interface CEMRef {
    cem: CEMInstance;
}

export type JavaScriptModuleWithRef = JavaScriptModule & CEMRef;
export type CustomElementWithRef = CustomElement & CEMRef;

export function findClassForTagName(cemCollection: CEMCollection, tagName: string): JavaScriptModule | undefined {
    const declarationModule = cemCollection.modules.find(mod => moduleHasCustomElementExportByName(mod, tagName));
    if (!declarationModule) return undefined;

    const declarationExport = declarationModule.exports?.find(exp => exportHasCustomElementExportByName(exp, tagName));
    if (!declarationExport) return undefined;

    const declaration = declarationExport.declaration;
    const classPath = declaration.module;

    if (!classPath) return undefined;

    const mod = findModuleByPath(cemCollection, classPath);
    if (!mod) return undefined;

    CEMClassCache.set(tagName, mod);
    return mod;
}

export function findCustomElementDeclarationFromModule(mod: Module): CustomElement | undefined {
    const classDeclaration = mod.declarations?.find(d => (d as CustomElement).customElement);
    if (!isCustomElementDeclaration(classDeclaration)) {
        return undefined;
    }
    return classDeclaration;
}

export function findDeclarationForTagName(cemCollection: CEMCollection, tagName: string): CustomElement | undefined {
    const tagModule = findClassForTagName(cemCollection, tagName);
    const classDeclaration = tagModule?.declarations?.find(d => (d as CustomElement).tagName === tagName);
    if (!isCustomElementDeclaration(classDeclaration)) {
        return undefined;
    }
    return classDeclaration;
}

export function findCustomElementTagLike(cemCollection: CEMCollection, tagNamePart: string) {
    // TODO: Memoize this or something. Weakmaps maybe?
    scanCustomElementTagNames(cemCollection);
    return CEMCustomElementTagCache.filter(tag => tag.includes(tagNamePart));
}

export function scanCustomElementTagNames(cemCollection: CEMCollection) {
    const customElementDeclarations = cemCollection.modules.filter(mod => moduleHasCustomElementExport(mod));
    CEMCustomElementTagCache = customElementDeclarations.flatMap(decl => {
        return decl.exports?.filter(exportHasCustomElementExport).map(exp => exp.name) ?? [];
    });
}

export function findCustomElementDefinitionModule(manifest: Package, tagName: string) {
    return manifest.modules?.filter(mod =>
        mod.kind === "javascript-module" &&
        mod.exports?.some(exp =>
            exp.kind === "custom-element-definition" &&
            exp.name === tagName
        )
    )?.[0] ?? undefined
}

export function findTagNameForClass(cemCollection: CEMCollection, className: string) {
    return cemCollection.modules.filter(mod =>
        mod.kind === "javascript-module" &&
        mod.exports?.some(exp =>
            exp.kind === "custom-element-definition" &&
            exp.declaration.name === className
        )
    )?.[0] ?? undefined
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

export function findModuleByPath(cemCollection: CEMCollection, path: string) {
    return cemCollection.modules.find(mod => modulePathEquals(mod, path));
}

export function modulePathEquals(mod: Module, path: string) {
    const modulePath = mod.path;
    const modulePathAsJs = modulePath.replace(".ts", ".js");
    const withTrailingSlash = modulePath.startsWith("/") ? modulePath : "/" + modulePath;
    const withTrailingSlashAsJs = withTrailingSlash.replace(".ts", ".js");
    // TODO: Ugly
    return path === modulePath || path === modulePathAsJs || path === withTrailingSlash || path === withTrailingSlashAsJs;
}

export function isCustomElementDeclaration(dec?: Declaration): dec is CustomElementDeclaration {
    if (!dec) return false;
    return (dec as CustomElementDeclaration).customElement !== undefined && (dec as CustomElementDeclaration).customElement;
}
