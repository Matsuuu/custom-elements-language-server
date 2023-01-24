import { TemplateContext } from "typescript-template-language-service-decorator";
import tss from "typescript/lib/tsserverlibrary.js";
import { LanguageService as HtmlLanguageService, Node } from "vscode-html-languageservice";
import { getCEMData } from "../../cem/cem-cache.js";
import { findCustomElementDefinitionModule } from "../../cem/cem-helpers.js";
import { HTMLTemplateLiteralPlugin } from "../../index.js";
import { resolveCustomElementTags } from "../../scanners/tag-scanner.js";
import { getAllFilesAssociatedWithSourceFile, getSourceFile } from "../../ts/sourcefile.js";
import { SourceFile } from "typescript";
import { getFilePathFolder, resolveImportPath } from "./imports.js";
import { CODE_ACTIONS } from "../enum/code-actions.js";
import { getPathAsJsFile, getPathAsTsFile } from "../../ts/filepath-transformers.js";

export function getImportDiagnostics(context: TemplateContext, htmlLanguageService: HtmlLanguageService) {
    const filePath = context.fileName;
    const filePathWithoutFile = getFilePathFolder(filePath);
    const basePath = HTMLTemplateLiteralPlugin.projectDirectory;
    const sourceFile = getSourceFile(filePath);

    if (!sourceFile) {
        return [];
    }

    const associatedFiles = getAllFilesAssociatedWithSourceFile(sourceFile, basePath);
    // TODO: Might be that this gets all sourcefiles in the project
    // and not just relative to the file. Needs some checking.
    // Might lead to some false negatives.
    const sourceFileNames = associatedFiles;

    if (!sourceFile) {
        return [];
    }

    const cemCollection = getCEMData(filePath);
    if (!cemCollection.hasData()) {
        return [];
    }

    const customElementTagNodes = resolveCustomElementTags(htmlLanguageService, context);

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

    return sourceFiles.includes(jsVariant) || sourceFiles.includes(tsVariant);
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
        code: CODE_ACTIONS.IMPORT, // TODO: What is this?
        file: sourceFile,
        start: notDefinedTag.node.start,
        length: startTagEnd - notDefinedTag.node.start,
        messageText: `Tag ${notDefinedTag.node.tag} has not been imported.`,
        relatedInformation: [{
            category: tss.DiagnosticCategory.Suggestion,
            code: 0, // TODO: What is this?
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
