import { Package } from "custom-elements-manifest";
import tss from "typescript/lib/tsserverlibrary.js";
import * as fs from "fs";
import { ImportedDependency } from "../dependencies/dependency-package-resolver.js";
import { analyzeLocalProject } from "./analyzer.js";

interface CEMInstanceBuilderData {
    cemPath: string,
    cemSourcePath?: string;
    packagePath: string,
    packageName: string,
    packageJsonPath: string,
    refresher: RefresherFunction
}

type RefresherFunction = (_this: CEMInstance) => Promise<void> | void;

export class CEMInstance {
    public cem: Package | undefined;
    // Use the cemSourcePath to have the "acutal source path" where the CEM is supposed to be.
    // This is done due to the caching that we do with some CEM's. Currently needed only for local
    // CEM. Dependency CEM is resolved as is.
    public cemSourcePath: string | undefined;
    public cemFolderPath: string | undefined;
    public cemPath: string | undefined;
    public packagePath: string | undefined;
    public packageName: string | undefined;
    public packageJsonPath: string | undefined;
    public packageJson: Object | undefined;
    public isDependency: boolean = false;
    public refresher: RefresherFunction = () => { };

    constructor(builderData: CEMInstanceBuilderData) {
        this.isDependency = builderData.packageJsonPath.includes("node_modules");

        let packageJson;
        const packageJsonPath = builderData.packagePath + "/package.json";
        if (this.isDependency) {
            if (!fs.existsSync(packageJsonPath)) {
                return;
            }
            const packageJsonFile = fs.readFileSync(packageJsonPath, "utf8");
            try {
                packageJson = JSON.parse(packageJsonFile);
            } catch (ex) {
                return;
            }
        }


        if (!fs.existsSync(builderData.cemPath)) {
            console.log("Could not find 'customElements' entry in package.json at " + builderData.packageJsonPath);
            return;
        }
        const cemFile = fs.readFileSync(builderData.cemPath, "utf8");

        if (!cemFile) {
            // TODO: Logger and some message
            console.log("Could not read custom-elements.json file in path " + builderData.cemPath);
            return;
        }

        const cem = JSON.parse(cemFile);

        this.cem = cem;
        this.cemPath = builderData.cemPath;
        this.cemFolderPath = this.cemPath.substring(0, this.cemPath.lastIndexOf("/"));
        this.cemSourcePath = builderData.cemSourcePath || this.cemFolderPath;
        this.packagePath = builderData.packagePath;
        this.packageName = builderData.packageName;
        this.packageJsonPath = builderData.packageJsonPath;
        this.packageJson = packageJson;
        this.refresher = builderData.refresher;
    }

    async refresh() {
        if (!this.cemPath) return;

        await this.refresher(this);
        const cemFile = fs.readFileSync(this.cemPath, "utf8");
        this.cem = JSON.parse(cemFile);
    }

    static async fromLocalPath(project: tss.server.Project, projectPath: string): Promise<CEMInstance | undefined> {

        const packageJsonPath = projectPath + "/package.json";
        if (!fs.existsSync(packageJsonPath)) {
            return undefined;
        }

        const packageJsonFile = fs.readFileSync(packageJsonPath, "utf8");
        const packageJson = JSON.parse(packageJsonFile);
        const packageName = packageJson.name;

        const analyzerOutput = await analyzeLocalProject(project);
        const cemSourcePath = packageJson.customElements
            ? `${projectPath}/${packageJson.customElements}`
            : `${projectPath}`;
        const cemPath = analyzerOutput.filePath;

        return new CEMInstance({
            cemPath,
            cemSourcePath,
            packagePath: projectPath,
            packageJsonPath,
            packageName,
            refresher: (_this: CEMInstance) => {
                analyzeLocalProject(project);
            }
        })
    }

    static fromDependency(dependency: ImportedDependency): CEMInstance | undefined {
        const packageJsonPath = dependency.path + "package.json";
        if (!fs.existsSync(packageJsonPath)) {
            return undefined;
        }

        const packageJsonFile = fs.readFileSync(packageJsonPath, "utf-8");
        const packageJson = JSON.parse(packageJsonFile);
        const packageName = packageJson.name;


        const cemPath = dependency.path + packageJson.customElements;

        return new CEMInstance({
            cemPath,
            packagePath: dependency.path,
            packageJsonPath,
            packageName,
            refresher: () => { } // Currently no need to refresh dependency CEM's
        })
    }

    isValid(): boolean {
        return this.cem !== undefined;
    }
}

