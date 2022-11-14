// @ts-ignore
import { create } from "@custom-elements-manifest/analyzer/src/create.js";
export function generateManifest(sourceFiles) {
    return create({
        modules: sourceFiles,
        plugins: [],
        context: { dev: false }
    });
}
//# sourceMappingURL=index.js.map