// @ts-ignore
import { create, ts } from "@custom-elements-manifest/analyzer";
// @ts-ignore
import { litPlugin } from "@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js";

import tss from "typescript/lib/tsserverlibrary.js";

export function analyzeLocalProject(project: tss.server.Project) {

    console.log("Building manifest");

    const rootFiles = project.getRootFiles();
    const sourceFiles = rootFiles
        // @ts-ignore
        .map(rf => project.getSourceFile(rf as tss.Path))
        .filter(sf => sf !== undefined) as tss.SourceFile[];

    const modifiedSourceFiles = sourceFiles.map(sf => {
        return ts.createSourceFile(
            sf.fileName,
            sf.getFullText(),
            ts.ScriptTarget.ES2015,
            true
        )
    })

    const manifest = create({
        modules: modifiedSourceFiles,
        plugins: [...litPlugin()],
        context: { dev: true }
    });

    console.log("Building manifest done");

    debugger;

    return manifest;
}
