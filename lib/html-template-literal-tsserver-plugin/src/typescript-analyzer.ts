import { JavaScriptModule } from "custom-elements-manifest";
import ts from "typescript";

export function getClassDefinitionTextSpan(mod: JavaScriptModule, className: string, basePath: string): ts.TextSpan {
    const classPath = basePath + "/" + mod.path;
    const program = ts.createProgram({
        rootNames: [classPath],
        options: {}
    });

    const sourceFile = program.getSourceFile(classPath);

    if (!sourceFile) {
        return ts.createTextSpan(0, 0);
    }

    const classIdentifier = findClassIdentifierByName(sourceFile, className);
    if (!classIdentifier) {
        return ts.createTextSpan(0, 0);
    }

    return {
        start: classIdentifier.pos,
        length: classIdentifier.end - classIdentifier.pos
    }
}

function findClassIdentifierByName(sourceFile: ts.SourceFile, className: string): ts.Identifier | undefined {
    let foundClassIdentifier: ts.Node | undefined = undefined;
    function findClassIdentifier(node: ts.Node) {
        if (ts.isIdentifier(node) && node.escapedText === className) {
            foundClassIdentifier = node;
            return;
        }
        ts.forEachChild(node, findClassIdentifier);
    }
    findClassIdentifier(sourceFile);

    return foundClassIdentifier;
}
