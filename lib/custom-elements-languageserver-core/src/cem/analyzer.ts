// @ts-ignore
import { create, ts } from "@custom-elements-manifest/analyzer";
// @ts-ignore
import { litPlugin } from "@custom-elements-manifest/analyzer/src/features/framework-plugins/lit/lit.js";

import tss from "typescript/lib/tsserverlibrary.js";

export function analyzeLocalProject(sourceFiles: (tss.SourceFile | undefined)[]) {

    console.log("Building manifest");

    // const modules = [ts.createSourceFile(
    //     'src/my-element.js',
    //     'export function foo() {}',
    //     ts.ScriptTarget.ES2015,
    //     true,
    // )];

    const modifiedSourceFiles = sourceFiles.map(sf => {
        return ts.createSourceFile(
            sf?.fileName,
            sf?.getFullText(),
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

