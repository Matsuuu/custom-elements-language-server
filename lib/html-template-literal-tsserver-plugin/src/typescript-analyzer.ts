import { JavaScriptModule } from "custom-elements-manifest";
import ts from "typescript";

const ZERO_TEXT_SPAN = ts.createTextSpan(0, 0);

export function getClassDefinitionTextSpan(mod: JavaScriptModule, className: string, basePath: string): ts.TextSpan {
    const sourceFile = getSourceFile(basePath, mod.path);
    if (!sourceFile) {
        return ZERO_TEXT_SPAN;
    }

    const classIdentifier = findClassIdentifierByName(sourceFile, className);
    if (!classIdentifier) {
        return ZERO_TEXT_SPAN;
    }

    return {
        start: classIdentifier.pos,
        length: classIdentifier.end - classIdentifier.pos
    }
}

export function getAttributeDefinitionTextSpan(mod: JavaScriptModule, attributeName: string, basePath: string): ts.TextSpan {
    const sourceFile = getSourceFile(basePath, mod.path);
    if (!sourceFile) {
        return ts.createTextSpan(0, 0);
    }

    const propertyIdentifier = findAttributeIdentifierByName(sourceFile, attributeName);

    return ZERO_TEXT_SPAN;
}

function getSourceFile(basePath: string, classPath: string) {
    // TODO: Make some of these static / final ?
    const fullClassPath = basePath + "/" + classPath;
    const compilerHost = ts.createCompilerHost({}, true);
    const program = ts.createProgram({
        rootNames: [fullClassPath],
        options: {},
        host: compilerHost
    });

    return program.getSourceFile(classPath);
}

function findClassIdentifierByName(sourceFile: ts.SourceFile, className: string): ts.Identifier | undefined {
    let foundClassIdentifier: ts.Node | undefined = undefined;
    function findClassIdentifier(node: ts.Node) {
        if (ts.isIdentifier(node) && node.escapedText === className) {
            debugger;
            foundClassIdentifier = node;
            return;
        }
        ts.forEachChild(node, findClassIdentifier);
    }
    findClassIdentifier(sourceFile);

    return foundClassIdentifier;
}

function findAttributeIdentifierByName(sourceFile: ts.SourceFile, className: string): ts.Identifier | undefined {

    return undefined;
}

