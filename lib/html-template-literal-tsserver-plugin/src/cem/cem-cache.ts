import { getImportedDependencies } from "../dependencies/dependency-package-resolver.js";
import { HTMLTemplateLiteralPlugin } from "../index.js";
import { getProgram } from "../ts/sourcefile.js";
import { CEMData, CEMInstance } from "./cem-data.js";

export class CEMCollection {
    public cems: Array<CEMInstance> = [];
    public localCEM: CEMInstance | undefined;

    constructor(openFilePath: string) {
        const program = getProgram(openFilePath);
        const sourceFiles = program.getSourceFiles();
        const sourceFileNames = sourceFiles.map(sf => sf.fileName);
        const dependencyPackages = getImportedDependencies(sourceFiles);

        const basePath = HTMLTemplateLiteralPlugin.projectDirectory;
        const cemData = CEMInstance.fromLocalPath(basePath);
        const dependencyCems = Object.values(dependencyPackages)
            .map(CEMInstance.fromDependency)
            .filter(cemIsNotUndefined)
            .filter(cemInstance => cemInstance.isValid());

        this.localCEM = cemData;
        this.cems = [cemData, ...dependencyCems].filter(cemIsNotUndefined);
    }

}

let CACHED_COLLECTION: CEMCollection | undefined = undefined;

export function getCEMData(openFilePath: string) {
    if (!CACHED_COLLECTION) {
        CACHED_COLLECTION = new CEMCollection(openFilePath);
    }
    CACHED_COLLECTION.localCEM?.refresh();
    // TODO: Figure out when dependencyCEM's might need updating
    return CACHED_COLLECTION;
}

function cemIsNotUndefined(cemInstance: CEMInstance | undefined): cemInstance is CEMInstance {
    return cemInstance !== undefined;
}
