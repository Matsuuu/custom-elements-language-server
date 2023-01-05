import { Package } from "custom-elements-manifest";
import * as tss from "typescript/lib/tsserverlibrary.js";
import * as fs from "fs";
import { scanCustomElementTagNames } from "./cem-helpers.js";
import { CEMData } from "./cem-data.js";

export class CEMInstantiator {
    public static _instance: CEMInstantiator | undefined;

    public static init(pluginInfo: tss.server.PluginCreateInfo) {
        CEMInstantiator._instance = new CEMInstantiator(pluginInfo);
    }

    private _packageName: string | undefined;
    private _projectDirectory: string | undefined;
    private _cemPath: string | undefined;
    private _cem: Package | undefined;
    private _cemData: CEMData | undefined;

    constructor(pluginInfo: tss.server.PluginCreateInfo) {
        this._projectDirectory = pluginInfo.project.getCurrentDirectory();
        this.refreshCEM();
        if (this._cem && this._cemPath && this._packageName) {
            this._cemData = {
                cem: this._cem,
                paths: {
                    cem: this._cemPath,
                    project: this._projectDirectory
                },
                packageName: this._packageName
            }
        }
    }

    public getProjectDirectory() {
        return this._projectDirectory;
    }

    private analyzeCEM(): Package | undefined {
        const packagePath = this._projectDirectory + "/package.json";
        if (!fs.existsSync(packagePath)) {
            return undefined;
        }

        const packageJsonFile = fs.readFileSync(packagePath, "utf8");

        const packageJson = JSON.parse(packageJsonFile);
        this._packageName = packageJson.name;
        // if (!packageJson.customElements) return;
        // TODO: Give a warning of missing entry, ask to add

        this._cemPath = this._projectDirectory + "/" + packageJson.customElements;
        if (!fs.existsSync(this._cemPath)) {
            this._cemPath = this._projectDirectory + "/" + "custom-elements.json";
        }
        if (!fs.existsSync(this._cemPath)) {
            return undefined;
        }
        const cemFile = fs.readFileSync(this._cemPath, "utf8");

        if (!cemFile) {
            // TODO: Logger.
            console.log("Could not find custom-elements.json file");
            return undefined;
        }

        return JSON.parse(cemFile);
    }

    public getCEM() {
        return this._cemData;
    }

    public refreshCEM() {
        // TODO:
        this._cem = this.analyzeCEM();
    }
}

export function getCEMInstantiator() {
    return CEMInstantiator._instance;
}

export function getCEMBasePath() {
    return getCEMInstantiator()?.getProjectDirectory() ?? "";
}

export function getLatestCEM() {
    const cem = getCEMInstantiator()?.getCEM();
    if (cem) {
        // TODO: Refresh?
        scanCustomElementTagNames(cem);
    }
    return cem;
}

export function refreshCEM() {
    getCEMInstantiator()?.refreshCEM();
}
