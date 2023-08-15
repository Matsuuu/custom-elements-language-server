import { getDependencyPackagesWithCEMs } from "../dependencies/dependency-package-resolver.js";
import { CEMInstance } from "./cem-data.js";
// @ts-expect-error
import { JavaScriptModule } from "custom-elements-manifest";
import { addReferenceToModule, JavaScriptModuleWithRef } from "./cem-helpers.js";
import tss from "typescript/lib/tsserverlibrary.js";

export class CEMCollection {
    public id: number = Date.now() + Math.floor(Math.random() * 999);
    private _cems: Array<CEMInstance> = [];
    private _localCEM: CEMInstance | undefined;
    private _modules: Array<JavaScriptModule> | undefined;
    private _modulesWithRefs: Array<JavaScriptModuleWithRef> | undefined;

    constructor(private project: tss.server.Project, private basePath: string) {
        this.initializeCEMs();
    }

    private async initializeCEMs() {
        const dependencyPackages = getDependencyPackagesWithCEMs(this.basePath + "/node_modules");

        const cemData = await CEMInstance.fromLocalPath(this.project, this.basePath);
        const dependencyCems = Object.values(dependencyPackages)
            .map(CEMInstance.fromDependency)
            .filter(cemIsNotUndefined)
            .filter(cemInstance => cemInstance.isValid());

        this._localCEM = cemData;
        this._cems = [cemData, ...dependencyCems].filter(cemIsNotUndefined);
    }

    public get modules(): Array<JavaScriptModule> {
        if (!this._modules) {
            console.log("Re-sourcing modules. ");
            this._modules = this.cems.flatMap(instance => instance.cem?.modules ?? []);
        }
        return this._modules;
    }

    public get cems(): Array<CEMInstance> {
        if (!this._localCEM) {
            return [...this._cems];
        }
        return [this._localCEM, ...this._cems];
    }

    // TODO: Do we need both of these module getters? we should prefer this one
    public get modulesWithReferences(): Array<JavaScriptModuleWithRef> {
        if (!this._modulesWithRefs) {
            this._modulesWithRefs = this.cems.flatMap(instance => {
                const modules = instance.cem?.modules ?? [];
                return modules.map(mod => addReferenceToModule(mod, instance));
            });
        }
        return this._modulesWithRefs;
    }

    public refreshLocal() {
        this._localCEM?.refresh();
        this._modules = undefined;
        this._modulesWithRefs = undefined;
    }

    public refresh() {
        this.cems.forEach(cem => cem.refresh());
        this._modules = undefined;
        this._modulesWithRefs = undefined;
    }

    public hasData() {
        return this.modules.length > 0;
    }
}

const CEM_COLLECTION_CACHE = new Map<string, CEMCollection>();

export function getCEMData(project: tss.server.Project, projectBasePath: string): CEMCollection {
    const existingCollection = CEM_COLLECTION_CACHE.get(projectBasePath);
    console.log("Fetch CEM");
    if (existingCollection) {
        // TODO: Do this through a watcher instead of on every request?
        // TODO: This is now needed more than before since we need to have 
        // the asynchronous context in here.
        // existingCollection?.refreshLocal();
        return existingCollection;
    }

    const cemCollection = new CEMCollection(project, projectBasePath);
    CEM_COLLECTION_CACHE.set(projectBasePath, cemCollection);
    return cemCollection;
}

export function refreshCEMData(projectBasePath: string) {
    const existingCollection = CEM_COLLECTION_CACHE.get(projectBasePath);
    if (!existingCollection) {
        console.warn("Tried to refresh a non-existant cache. Attempted " + projectBasePath + ", but the only ones available are: ", [...CEM_COLLECTION_CACHE.keys()]);
        return;
    }
    console.log("REFRESH CEM DATA");
    existingCollection?.refreshLocal();
}

function cemIsNotUndefined(cemInstance: CEMInstance | undefined): cemInstance is CEMInstance {
    return cemInstance !== undefined;
}
