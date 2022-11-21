import { Package } from "custom-elements-manifest";
import * as tss from "typescript/lib/tsserverlibrary.js";
import * as fs from "fs";

export class CEMInstantiator {

    public static _instance: CEMInstantiator | undefined;

    public static init(pluginInfo: tss.server.PluginCreateInfo) {
        CEMInstantiator._instance = new CEMInstantiator(pluginInfo);
    }

    private _projectDirectory: string | undefined;
    private _cem: Package | undefined;

    constructor(pluginInfo: tss.server.PluginCreateInfo) {

        this._projectDirectory = pluginInfo.project.getCurrentDirectory();
        this.refreshCEM();
    }

    private analyzeCEM(): Package | undefined {
        const packagePath = this._projectDirectory + "/package.json";
        if (!fs.existsSync(packagePath)) return;

        const packageJsonFile = fs.readFileSync(packagePath, "utf8");

        const packageJson = JSON.parse(packageJsonFile);
        if (!packageJson.customElements) return;

        const cemFilePath = this._projectDirectory + "/" + packageJson.customElements;
        const cemFile = fs.readFileSync(cemFilePath, "utf8");

        return JSON.parse(cemFile);
    }

    public getCEM() {
        return this._cem;
    }

    public refreshCEM() {
        // TODO:
        this._cem = this.analyzeCEM();
    }
}

export function getCEMInstantiator() {
    return CEMInstantiator._instance;
}

export function getLatestCEM() {
    return getCEMInstantiator()?.getCEM();
}

export function refreshCEM() {
    getCEMInstantiator()?.refreshCEM();
}
