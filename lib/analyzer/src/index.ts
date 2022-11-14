// @ts-ignore
import { create } from "@custom-elements-manifest/analyzer/src/create.js";
import ts from "typescript";

export function generateManifest(sourceFiles: Array<ts.SourceFile>) {
    return create({
        modules: sourceFiles,
        plugins: [],
        context: { dev: false }
    })
}

