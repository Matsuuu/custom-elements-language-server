import { TemplateContext } from "typescript-template-language-service-decorator";
import tss from "typescript/lib/tsserverlibrary.js";
import { LanguageService as HtmlLanguageService, Node } from "vscode-html-languageservice";
import { getCEMData } from "../../cem/cem-cache.js";
import { findCustomElementDefinitionModule } from "../../cem/cem-helpers.js";
import { getImportedDependencies } from "../../dependencies/dependency-package-resolver.js";
import { HTMLTemplateLiteralPlugin } from "../../index.js";
import { resolveCustomElementTags } from "../../scanners/tag-scanner.js";
import { getOrCreateProgram } from "../../ts/sourcefile.js";
import * as path from "path";

export async function getImportDiagnostics(context: TemplateContext, htmlLanguageService: HtmlLanguageService) {
    const filePath = context.fileName;
    const filePathWithoutFile = filePath.substring(0, filePath.lastIndexOf("/"));
    const program = getOrCreateProgram(filePath);
    const sourceFiles = program.getSourceFiles();
    const sourceFileNames = sourceFiles.map(sf => sf.fileName);
    const dependencyPackages = getImportedDependencies(sourceFiles);

    // TODO: Somehow create a collection out of the CEM's and have them contain
    // the dependencyinformation. Then iterate through them, searching for the actual information

    const cemCollection = getCEMData(filePath);
    if (!cemCollection.hasData()) {
        return [];
    }

    const customElementTagNodes = resolveCustomElementTags(htmlLanguageService, context);
    const basePath = HTMLTemplateLiteralPlugin.projectDirectory;

    const notDefinedTags: Array<NotDefinedTagInformation> = [];

    for (const customElementTag of customElementTagNodes) {
        if (!customElementTag.tag) {
            continue;
        }

        const definition = findCustomElementDefinitionModule(cemCollection, customElementTag.tag);
        if (!definition) {
            continue;
        }
        const fullImportPath = basePath + "/" + definition.path;
        if (!sourceFileNames.includes(fullImportPath)) {

            const relativeImportPath = resolveImportPath(fullImportPath, filePathWithoutFile);

            // TODO: Okay now here we need the CEM to tell us the package it's for.
            // So that we can document the fullImportPath and relativeImportPath to work 
            // with node modulized paths.
            //
            // CEM cache and the dependency loader already do the scanning and 
            // checking for CEM packages so it should be kinda easy to implement there
            // somewhere where we scan the CEM's

            notDefinedTags.push({
                node: customElementTag,
                fullImportPath: fullImportPath,
                relativeImportPath: relativeImportPath
            });
        }
    }

    return notDefinedTags;
}

function resolveImportPath(fullImportPath: string, filePathWithoutFile: string) {

    const importPathWithoutFile = fullImportPath.substring(0, fullImportPath.lastIndexOf("/"));
    const importFileName = fullImportPath.substring(fullImportPath.lastIndexOf("/"));
    const importFileNameAsJs = importFileName.replace(".ts", ".js");
    let relativePathToImport = path.relative(filePathWithoutFile, importPathWithoutFile);
    if (relativePathToImport.length <= 0) {
        relativePathToImport = ".";
    }

    const relativeImportPath = relativePathToImport + importFileNameAsJs;

    return relativeImportPath;
}

interface NotDefinedTagInformation {
    node: Node;
    fullImportPath: string;
    relativeImportPath: string;
}
