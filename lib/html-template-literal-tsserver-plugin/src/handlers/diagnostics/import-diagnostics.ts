import { TemplateContext } from "typescript-template-language-service-decorator";
import tss from "typescript/lib/tsserverlibrary.js";
import { LanguageService as HtmlLanguageService, Node } from "vscode-html-languageservice";
import { getDependencyCEM } from "../../cem/cem-fetcher.js";
import { findCustomElementDefinitionModule } from "../../cem/cem-helpers.js";
import { getCEMBasePath, getLatestCEM } from "../../cem/cem-instance.js";
import { getImportedDependencies } from "../../dependencies/dependency-package-resolver.js";
import { resolveCustomElementTags } from "../../scanners/tag-scanner.js";
import { getProgram } from "../../ts/sourcefile.js";

export async function getImportDiagnostics(context: TemplateContext, htmlLanguageService: HtmlLanguageService) {
    const filePath = context.fileName;
    const program = getProgram(filePath);
    const sourceFiles = program.getSourceFiles();
    const sourceFileNames = sourceFiles.map(sf => sf.fileName);
    const dependencyPackages = getImportedDependencies(sourceFiles);

    const cem = getLatestCEM();
    const dependencyCems = Object.values(dependencyPackages)
        .map((dependencyPackage) => getDependencyCEM(dependencyPackage))
        .filter(depCEM => depCEM !== undefined);

    // TODO: Somehow create a collection out of the CEM's and have them contain
    // the dependencyinformation. Then iterate through them, searching for the actual information

    debugger;

    const customElementTagNodes = resolveCustomElementTags(htmlLanguageService, context);
    const basePath = getCEMBasePath();

    const notDefinedTags: Array<Node> = [];

    if (cem) {
        for (const customElementTag of customElementTagNodes) {
            if (!customElementTag.tag) continue;

            const definition = findCustomElementDefinitionModule(cem, customElementTag.tag);
            const fullImportPath = basePath + "/" + definition.path;
            if (!sourceFileNames.includes(fullImportPath)) {
                notDefinedTags.push(customElementTag);
            }
            debugger;
        }
    }

    return [];
}
