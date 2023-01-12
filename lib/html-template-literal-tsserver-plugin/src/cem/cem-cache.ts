import { getDependencyPackagesWithCEMs, getImportedDependencies } from "../dependencies/dependency-package-resolver.js";
import { HTMLTemplateLiteralPlugin } from "../index.js";
import { getOrCreateProgram } from "../ts/sourcefile.js";
import { CEMInstance } from "./cem-data.js";
import { JavaScriptModule } from "custom-elements-manifest";

export class CEMCollection {
    public cems: Array<CEMInstance> = [];
    public localCEM: CEMInstance | undefined;
    private _modules: Array<JavaScriptModule> | undefined;

    constructor(openFilePath: string) {
        const basePath = HTMLTemplateLiteralPlugin.projectDirectory;
        const program = getOrCreateProgram(openFilePath);
        const sourceFiles = program.getSourceFiles();
        // const dependencyPackages = getImportedDependencies(sourceFiles);
        const dependencyPackages = getDependencyPackagesWithCEMs(basePath + "/node_modules");
        // const test = getDependencyPackagesWithCEMs(basePath + "/node_modules");

        const cemData = CEMInstance.fromLocalPath(basePath);
        const dependencyCems = Object.values(dependencyPackages)
            .map(CEMInstance.fromDependency)
            .filter(cemIsNotUndefined)
            .filter(cemInstance => cemInstance.isValid());

        this.localCEM = cemData;
        this.cems = [cemData, ...dependencyCems].filter(cemIsNotUndefined);
    }

    public get modules() {
        if (!this._modules) {
            this._modules = this.cems.flatMap(instance => instance.cem?.modules ?? []);
        }
        return this._modules;
    }

    // TODO: Have modules but with references to which CEM they are from
    public get modulesWithReferences() {
        return [];

    }

    public refreshLocal() {
        this.localCEM?.refresh();
        this._modules = undefined;
    }

    public refresh() {
        this.cems.forEach(cem => cem.refresh());
        this._modules = undefined;
    }

    public hasData() {
        return this.modules.length > 0;
    }
}

let CACHED_COLLECTION: CEMCollection | undefined = undefined;

export function getCEMData(openFilePath: string) {
    if (!CACHED_COLLECTION) {
        CACHED_COLLECTION = new CEMCollection(openFilePath);
    }
    CACHED_COLLECTION.refreshLocal();
    // TODO: Figure out when dependencyCEM's might need updating
    return CACHED_COLLECTION;
}

function cemIsNotUndefined(cemInstance: CEMInstance | undefined): cemInstance is CEMInstance {
    return cemInstance !== undefined;
}
