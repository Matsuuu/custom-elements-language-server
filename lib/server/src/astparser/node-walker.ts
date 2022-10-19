import * as ts from "typescript";

export function enumerateNodeAndChildren(sourceFile: ts.SourceFile) {
    return getChildrenRecursive(sourceFile, sourceFile);
}

function getChildrenRecursive(node: ts.Node, sourceFile: ts.SourceFile): Array<ts.Node> {
    return [
        node,
        ...node.getChildren(sourceFile).flatMap(child => getChildrenRecursive(child, sourceFile))
    ];
}
