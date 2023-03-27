import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import tss from "typescript/lib/tsserverlibrary.js";
import { LanguageService as HtmlLanguageService, Node } from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { getCEMData } from "../../cem/cem-cache.js";
import { findCustomElementDefinitionModule } from "../../cem/cem-helpers.js";
import { getCustomElementTagsInContext } from "../../scanners/tag-scanner.js";
import { getAllFilesAssociatedWithSourceFile, getSourceFile } from "../../ts/sourcefile.js";
import { SourceFile } from "typescript";
import { getFilePathFolder, resolveImportPath } from "./imports.js";
import { CODE_ACTIONS } from "../enum/code-actions.js";
import { getPathAsDtsFile, getPathAsJsFile, getPathAsTsFile } from "../../ts/filepath-transformers.js";

export function getImportDiagnostics(filePath: string, projectBasePath: string, document: HTMLLanguageService.TextDocument, htmlLanguageService: HtmlLanguageService): tss.Diagnostic[] {
    console.log("Get import diagnostics");
    const filePathWithoutFile = getFilePathFolder(filePath);
    const basePath = "" // TODO: HTMLTemplateLiteralPlugin.projectDirectory;
    const sourceFile = getSourceFile(filePath);

    if (!sourceFile) {
        return [];
    }

    // TODO: This part needs to be supported by html files too
    const associatedFiles = getAllFilesAssociatedWithSourceFile(sourceFile, basePath);
    // TODO: Might be that this gets all sourcefiles in the project
    // and not just relative to the file. Needs some checking.
    // Might lead to some false negatives.
    const sourceFileNames = associatedFiles;

    const cemCollection = getCEMData(projectBasePath);
    if (!cemCollection.hasData()) {
        return [];
    }

    const customElementTagNodes = getCustomElementTagsInContext(htmlLanguageService, document);

    const notDefinedTags: Array<NotDefinedTagInformation> = [];

    for (const customElementTag of customElementTagNodes) {
        if (!customElementTag.tag) {
            continue;
        }

        const definition = findCustomElementDefinitionModule(cemCollection, customElementTag.tag);
        if (!definition) {
            continue;
        }
        const cemInstanceRef = definition.cem;
        const fullImportPath = `${cemInstanceRef.cemFolderPath}/${definition.path}`;
        if (!sourceFilesContainFilePath(sourceFileNames, fullImportPath)) {

            const relativeImportPath = resolveImportPath(fullImportPath, filePathWithoutFile);

            notDefinedTags.push({
                node: customElementTag,
                fullImportPath: fullImportPath,
                relativeImportPath: relativeImportPath
            });
        }
    }
    const importOffset = findImportDeclarationDestination(sourceFile);

    const diagnostics = notDefinedTags.map(tag => notDefinedTagToDiagnostic(tag, sourceFile, importOffset));

    return diagnostics;
}

function sourceFilesContainFilePath(sourceFiles: string[], fileToFind: string) {
    const jsVariant = getPathAsJsFile(fileToFind);
    const tsVariant = getPathAsTsFile(fileToFind);
    const dtsVariant = getPathAsDtsFile(fileToFind);

    return sourceFiles.includes(jsVariant) || sourceFiles.includes(tsVariant) || sourceFiles.includes(dtsVariant);
}

function findImportDeclarationDestination(sourceFile: SourceFile) {
    const root = sourceFile.getChildAt(0);
    const rootLevelChildren = root.getChildren();
    let lastImportStatementEnd = 0;
    for (const child of rootLevelChildren) {
        if (child.kind === tss.SyntaxKind.ImportDeclaration) {
            lastImportStatementEnd = child.end;
            continue;
        }
        break;
    }

    return lastImportStatementEnd;
}

function notDefinedTagToDiagnostic(notDefinedTag: NotDefinedTagInformation, sourceFile: tss.SourceFile, importOffset: number): tss.Diagnostic {
    const startTagEnd = notDefinedTag.node.startTagEnd ?? notDefinedTag.node.start;
    const importStatement = `\nimport "${notDefinedTag.relativeImportPath}";`;
    return {
        category: tss.DiagnosticCategory.Warning,
        code: CODE_ACTIONS.IMPORT,
        file: sourceFile,
        start: notDefinedTag.node.start,
        length: startTagEnd - notDefinedTag.node.start,
        messageText: `Tag ${notDefinedTag.node.tag} has not been imported.`,
        relatedInformation: [{
            category: tss.DiagnosticCategory.Suggestion,
            code: 0,
            file: undefined,
            start: importOffset,
            length: importStatement.length,
            messageText: importStatement,
        }]
    };
}

interface NotDefinedTagInformation {
    node: Node;
    fullImportPath: string;
    relativeImportPath: string;
}