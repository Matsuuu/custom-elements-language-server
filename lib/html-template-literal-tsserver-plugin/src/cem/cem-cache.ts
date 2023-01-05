import { getImportedDependencies } from "../dependencies/dependency-package-resolver.js";
import { getProgram } from "../ts/sourcefile.js";
import { CEMData } from "./cem-data.js";
import { getDependencyCEM } from "./cem-fetcher.js";
import { getLatestCEM } from "./cem-instance.js";

export class CEMCollection {
    public cems: Array<CEMData> = [];
    public localCEM: CEMData | undefined;

    constructor(openFilePath: string) {
        const program = getProgram(openFilePath);
        const sourceFiles = program.getSourceFiles();
        const sourceFileNames = sourceFiles.map(sf => sf.fileName);
        const dependencyPackages = getImportedDependencies(sourceFiles);

        const cemData = getLatestCEM();
        const dependencyCems = Object.values(dependencyPackages)
            .map((dependencyPackage) => getDependencyCEM(dependencyPackage))
            .filter(cemIsNotUndefined);

        this.localCEM = cemData;
        this.cems = [cemData, ...dependencyCems].filter(cemIsNotUndefined);
    }

}

let CACHED_COLLECTION: CEMCollection | undefined = undefined;

export function getCEMData(openFilePath: string) {
    if (!CACHED_COLLECTION) {
        CACHED_COLLECTION = new CEMCollection(openFilePath);
    }
}

function cemIsNotUndefined(cemData: CEMData | undefined): cemData is CEMData {
    return cemData !== undefined;
}
