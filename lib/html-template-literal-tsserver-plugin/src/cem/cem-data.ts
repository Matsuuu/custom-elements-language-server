// @ts-expect-error
import { Package } from "custom-elements-manifest";
import * as fs from "fs";
import { ImportedDependency } from "../dependencies/dependency-package-resolver.js";

interface CEMInstanceBuilderData {
    cemPath: string,
    packagePath: string,
    packageName: string,
    packageJsonPath: string,
}

export class CEMInstance {
    public cem: Package | undefined;
    public cemFolderPath: string | undefined;
    public cemPath: string | undefined;
    public packagePath: string | undefined;
    public packageName: string | undefined;
    public packageJsonPath: string | undefined;
    public packageJson: Object | undefined;
    public isDependency: boolean = false;

    constructor(builderData: CEMInstanceBuilderData) {

        const packageJsonPath = builderData.packagePath + "/package.json";
        if (!fs.existsSync(packageJsonPath)) {
            return;
        }
        const packageJsonFile = fs.readFileSync(packageJsonPath, "utf8");
        let packageJson;
        try {
            packageJson = JSON.parse(packageJsonFile);
        } catch (ex) {
            return;
        }

        const cemFile = fs.readFileSync(builderData.cemPath, "utf8");

        if (!cemFile) {
            // TODO: Logger and some message
            console.log("Could not find custom-elements.json file");
            return;
        }

        const cem = JSON.parse(cemFile);

        this.cem = cem;
        this.isDependency = builderData.packageJsonPath.includes("node_modules");
        this.cemPath = builderData.cemPath;
        this.cemFolderPath = this.cemPath.substring(0, this.cemPath.lastIndexOf("/"));
        this.packagePath = builderData.packagePath;
        this.packageName = builderData.packageName;
        this.packageJsonPath = builderData.packageJsonPath;
        this.packageJson = packageJson;
    }

    refresh() {
        if (!this.cemPath) return;

        const cemFile = fs.readFileSync(this.cemPath, "utf8");
        this.cem = JSON.parse(cemFile);
    }

    static fromLocalPath(projectPath: string) {

        const packageJsonPath = projectPath + "/package.json";
        if (!fs.existsSync(packageJsonPath)) {
            return;
        }

        const packageJsonFile = fs.readFileSync(packageJsonPath, "utf8");
        const packageJson = JSON.parse(packageJsonFile);
        const packageName = packageJson.name;
        // if (!packageJson.customElements) return;
        // TODO: Give a warning of missing entry, ask to add
        //
        let cemPath = `${projectPath}/${packageJson.customElements}`;
        if (!packageJson.customElements || !fs.existsSync(cemPath)) {
            cemPath = `${projectPath}/custom-elements.json`;
        }

        return new CEMInstance({
            cemPath,
            packagePath: projectPath,
            packageJsonPath,
            packageName
        })
    }

    static fromDependency(dependency: ImportedDependency) {
        const packageJsonPath = dependency.path + "package.json";
        if (!fs.existsSync(packageJsonPath)) {
            return undefined;
        }

        const packageJsonFile = fs.readFileSync(packageJsonPath, "utf-8");
        const packageJson = JSON.parse(packageJsonFile);
        const packageName = packageJson.name;


        const cemPath = dependency.path + packageJson.customElements;
        if (!packageJson.customElements || !fs.existsSync(cemPath)) {
            return undefined;
        }

        return new CEMInstance({
            cemPath,
            packagePath: dependency.path,
            packageJsonPath,
            packageName
        })
    }

    isValid(): boolean {
        return this.cem !== undefined;
    }
}

