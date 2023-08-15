// @ts-expect-error
import { CustomElement, CustomElementDeclaration, Declaration, Export, JavaScriptModule, Module } from "custom-elements-manifest";
import { getPathAsJsFile } from "../ts/filepath-transformers.js";
import { CEMCollection } from "./cem-cache.js";
import { CEMInstance } from "./cem-data.js";

const CEMClassCache: Map<string, Module> = new Map();
// TODO: Make this a map with Map<string, CustomElementDeclaration> or something similiar
// if there's a perf benefit from it
let CEMCustomElementTagCache = new Map<string, TagDeclarationInfo>();

export interface TagDeclarationInfo {
    module: JavaScriptModule, // TODO: Change to JavaScriptModuleWithRef ?
    tagName: string;
    classInfo?: CustomElementDeclaration;
}

interface CEMRef {
    cem: CEMInstance;
}

export type JavaScriptModuleWithRef = JavaScriptModule & CEMRef;
export type CustomElementWithRef = CustomElement & CEMRef;

export function findClassForTagName(cemCollection: CEMCollection, tagName: string): JavaScriptModuleWithRef | undefined {
    // TODO: Cache?
    const declarationModule = cemCollection.modules.find(mod => moduleHasCustomElementExportOrDefinitionByName(mod, tagName));
    if (!declarationModule) return undefined;

    const declarationExport = declarationModule.exports?.find(exp => exportHasCustomElementExportByName(exp, tagName));
    // if (!declarationExport) return undefined;

    const classPath = declarationExport?.declaration?.module ?? declarationModule.path;
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

export function findCustomElementTagLike(cemCollection: CEMCollection, tagNamePart: string): TagDeclarationInfo[] {
    const customElementTags = getCustomElementTags(cemCollection);
    // TODO: This stuff could maybe be cached so it doens't need to be parsed every time
    return customElementTags.filter(declInfo => declInfo.tagName.includes(tagNamePart));
}

interface CEMTagInfo {
    tagName: string,
    module: JavaScriptModule
    classInfo: CustomElementDeclaration | undefined;
}

export function getCustomElementTags(cemCollection: CEMCollection): CEMTagInfo[] {
    const customElementDeclarations = cemCollection.modules.filter(mod => moduleHasCustomElementExport(mod));

    return customElementDeclarations.map(mod => {
        const tagName = getModuleTagName(mod);
        if (tagName) {
            const classInfo = findClassForTagName(cemCollection, tagName);
            const classDeclaration = classInfo?.declarations
                ?.filter(isCustomElementDeclaration)
                .filter(decl => decl.tagName === tagName)[0];

            return {
                tagName,
                module: mod,
                classInfo: classDeclaration
            };
        }
        return undefined;
    }).filter((entry): entry is CEMTagInfo => entry !== undefined);
}

function getModuleTagName(mod: JavaScriptModule) {
    return mod.exports?.filter(exportHasCustomElementExport).map(exp => exp.name)[0]
        ?? mod.declarations?.filter(isCustomElementDeclaration).map(decl => decl.tagName)[0];
}

export function findCustomElementDefinitionModule(cemCollection: CEMCollection, tagName: string): JavaScriptModuleWithRef | undefined {
    return cemCollection.modulesWithReferences?.filter(mod =>
        mod.kind === "javascript-module" &&
        moduleHasTagDeclaration(mod, tagName)
    )?.[0] ?? undefined
}

export function moduleHasTagDeclaration(mod: JavaScriptModule, tagName: string): boolean {
    return (mod.exports?.some(exp => exportHasCustomElementExportByName(exp, tagName))
        || mod.declarations?.some(decl => declarationHasCustomElementDeclarationByName(decl, tagName)))
        ?? false;
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
    return mod.exports?.some(exp => exportHasCustomElementExport(exp)) || mod.declarations?.some(decl => (decl as CustomElementDeclaration).customElement === true);
}

export function exportHasCustomElementExport(modExport: Export) {
    return modExport.kind === "custom-element-definition";
}

export function moduleHasCustomElementExportOrDefinitionByName(mod: Module, tagName: string) {
    return mod.exports?.some(exp => exportHasCustomElementExportByName(exp, tagName))
        || mod.declarations?.some(decl => declarationHasCustomElementDeclarationByName(decl, tagName));
}

export function exportHasCustomElementExportByName(modExport: Export, tagName: string) {
    return modExport.kind === "custom-element-definition" && modExport.name === tagName;
}

export function declarationHasCustomElementDeclarationByName(modDeclaration: Declaration, tagName: string) {
    return isCustomElementDeclaration(modDeclaration) && modDeclaration.tagName === tagName;
}

export function findModuleByPath(cemCollection: CEMCollection, path: string) {
    return cemCollection.modulesWithReferences.find(mod => modulePathEquals(mod, path));
}

export function modulePathEquals(mod: Module, path: string) {
    const modulePath = mod.path;
    const modulePathAsJs = getPathAsJsFile(modulePath);
    const withTrailingSlash = modulePath.startsWith("/") ? modulePath : "/" + modulePath;
    const withTrailingSlashAsJs = getPathAsJsFile(withTrailingSlash);

    return [modulePath, modulePathAsJs, withTrailingSlash, withTrailingSlashAsJs].some(p => p === path);
}

export function isCustomElementDeclaration(dec?: Declaration): dec is CustomElementDeclaration {
    if (!dec) return false;
    return (dec as CustomElementDeclaration).customElement !== undefined && (dec as CustomElementDeclaration).customElement;
}

export function addReferenceToModule(mod: JavaScriptModule, cem: CEMInstance): JavaScriptModuleWithRef {
    return {
        ...mod,
        cem
    }
}
