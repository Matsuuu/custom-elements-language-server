import { Package } from "custom-elements-manifest";
import * as fs from "fs";

export interface CEMData {
    cem: Package;
    paths: {
        cem: string;
        project: string;
    }
    packageName: string;
}

interface CEMInstanceBuilderData {
    cemPath: string,
    packagePath: string,
    packageName: string,
    packageJsonPath: string,
}

export class CEMInstance {
    public cem: Package | undefined;
    public cemPath: string | undefined;
    public packagePath: string | undefined;
    public packageName: string | undefined;
    public packageJsonPath: string | undefined;
    public packageJson: Object | undefined;

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
        this.cemPath = builderData.cemPath;
        this.packagePath = builderData.packagePath;
        this.packageName = builderData.packageName;
        this.packageJsonPath = builderData.packageJsonPath;
        this.packageJson = packageJson;
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
        let cemPath = projectPath + "/" + packageJson.customElements;
        if (!fs.existsSync(cemPath)) {
            cemPath = projectPath + "/" + "custom-elements.json";
        }

        if (!fs.existsSync(cemPath)) {
            return;
        }

        return new CEMInstance({
            cemPath,
            packagePath: projectPath,
            packageJsonPath,
            packageName
        })
    }

    static fromDependency(filePath: string) {

    }
}
