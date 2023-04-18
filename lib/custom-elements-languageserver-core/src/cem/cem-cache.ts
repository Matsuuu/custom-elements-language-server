import { getDependencyPackagesWithCEMs } from "../dependencies/dependency-package-resolver.js";
import { CEMInstance } from "./cem-data.js";
// @ts-expect-error
import { JavaScriptModule } from "custom-elements-manifest";
import { addReferenceToModule, JavaScriptModuleWithRef } from "./cem-helpers.js";

export class CEMCollection {
    public cems: Array<CEMInstance> = [];
    public localCEM: CEMInstance | undefined;
    private _modules: Array<JavaScriptModule> | undefined;
    private _modulesWithRefs: Array<JavaScriptModuleWithRef> | undefined;

    constructor(basePath: string) {
        const dependencyPackages = getDependencyPackagesWithCEMs(basePath + "/node_modules");

        const cemData = CEMInstance.fromLocalPath(basePath);
        const dependencyCems = Object.values(dependencyPackages)
            .map(CEMInstance.fromDependency)
            .filter(cemIsNotUndefined)
            .filter(cemInstance => cemInstance.isValid());

        this.localCEM = cemData;
        this.cems = [cemData, ...dependencyCems].filter(cemIsNotUndefined);
    }

    public get modules(): Array<JavaScriptModule> {
        if (!this._modules) {
            this._modules = this.cems.flatMap(instance => instance.cem?.modules ?? []);
        }
        return this._modules;
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
        this.localCEM?.refresh();
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

export function getCEMData(projectBasePath: string): CEMCollection {
    const existingCollection = CEM_COLLECTION_CACHE.get(projectBasePath);
    if (existingCollection) {
        existingCollection?.refreshLocal();
        return existingCollection;
    }

    const cemCollection = new CEMCollection(projectBasePath);
    CEM_COLLECTION_CACHE.set(projectBasePath, cemCollection);
    return cemCollection;
}

function cemIsNotUndefined(cemInstance: CEMInstance | undefined): cemInstance is CEMInstance {
    return cemInstance !== undefined;
}
