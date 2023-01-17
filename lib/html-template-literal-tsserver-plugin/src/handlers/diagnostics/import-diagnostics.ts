import { TemplateContext } from "typescript-template-language-service-decorator";
import tss from "typescript/lib/tsserverlibrary.js";
import { LanguageService as HtmlLanguageService, Node } from "vscode-html-languageservice";
import { getCEMData } from "../../cem/cem-cache.js";
import { findCustomElementDefinitionModule } from "../../cem/cem-helpers.js";
import { HTMLTemplateLiteralPlugin } from "../../index.js";
import { resolveCustomElementTags } from "../../scanners/tag-scanner.js";
import { getOrCreateProgram } from "../../ts/sourcefile.js";
import * as path from "path";
import { SourceFile } from "typescript";

export function getImportDiagnostics(context: TemplateContext, htmlLanguageService: HtmlLanguageService) {
    const filePath = context.fileName;
    const filePathWithoutFile = filePath.substring(0, filePath.lastIndexOf("/"));
    const program = getOrCreateProgram(filePath);
    const sourceFile = program.getSourceFile(filePath);
    // TODO: Might be that this gets all sourcefiles in the project
    // and not just relative to the file. Needs some checking.
    // Might lead to some false negatives.
    const sourceFiles = program.getSourceFiles();
    const sourceFileNames = sourceFiles.map(sf => sf.fileName);

    getAllImportedSourceFiles(sourceFile);

    if (!sourceFile) {
        return [];
    }

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
        const cemInstanceRef = definition.cem;
        const fullImportPath = `${cemInstanceRef.cemFolderPath}/${definition.path}`;
        if (!sourceFileNames.includes(fullImportPath)) {

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
        code: 0, // TODO: What is this?
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

function resolveImportPath(fullImportPath: string, filePathWithoutFile: string) {

    const importPathWithoutFile = fullImportPath.substring(0, fullImportPath.lastIndexOf("/"));
    const importFileName = fullImportPath.substring(fullImportPath.lastIndexOf("/"));
    const importFileNameAsJs = importFileName.replace(".ts", ".js");
    let relativePathToImport = path.relative(filePathWithoutFile, importPathWithoutFile);
    if (relativePathToImport.length <= 0) {
        relativePathToImport = ".";
    }

    let relativeImportPath = relativePathToImport + importFileNameAsJs;

    if (relativeImportPath.includes("node_modules")) {
        relativeImportPath = relativeImportPath.substring(relativeImportPath.indexOf("node_modules") + "node_modules/".length);
    }

    return relativeImportPath;
}

interface NotDefinedTagInformation {
    node: Node;
    fullImportPath: string;
    relativeImportPath: string;
}

function getAllImportedSourceFiles(sourceFile: SourceFile | undefined) {
    if (!sourceFile) return [];
    // TODO: Figure out what files / imports are in scope and what are not.
    //
    // Could tss.preProcessFile be used?

    return []
}

