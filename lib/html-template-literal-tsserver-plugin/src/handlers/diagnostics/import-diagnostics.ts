import { TemplateContext } from "typescript-template-language-service-decorator";
import tss from "typescript/lib/tsserverlibrary.js";
import { LanguageService as HtmlLanguageService, Node } from "vscode-html-languageservice";
import { getCEMData } from "../../cem/cem-cache.js";
import { findCustomElementDefinitionModule } from "../../cem/cem-helpers.js";
import { getImportedDependencies } from "../../dependencies/dependency-package-resolver.js";
import { HTMLTemplateLiteralPlugin } from "../../index.js";
import { resolveCustomElementTags } from "../../scanners/tag-scanner.js";
import { getOrCreateProgram } from "../../ts/sourcefile.js";

export async function getImportDiagnostics(context: TemplateContext, htmlLanguageService: HtmlLanguageService) {
    const filePath = context.fileName;
    const program = getOrCreateProgram(filePath);
    const sourceFiles = program.getSourceFiles();
    const sourceFileNames = sourceFiles.map(sf => sf.fileName);
    const dependencyPackages = getImportedDependencies(sourceFiles);

    // TODO: Somehow create a collection out of the CEM's and have them contain
    // the dependencyinformation. Then iterate through them, searching for the actual information

    getCEMData(filePath);

    const customElementTagNodes = resolveCustomElementTags(htmlLanguageService, context);
    const basePath = HTMLTemplateLiteralPlugin.projectDirectory;

    const notDefinedTags: Array<Node> = [];

    /*if (cemData) {
        for (const customElementTag of customElementTagNodes) {
            if (!customElementTag.tag) continue;

            const definition = findCustomElementDefinitionModule(cemData.cem, customElementTag.tag);
            const fullImportPath = basePath + "/" + definition.path;
            if (!sourceFileNames.includes(fullImportPath)) {
                notDefinedTags.push(customElementTag);
            }
        }
    }*/

    return [];
}
