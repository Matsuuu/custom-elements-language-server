import { getSourceFile } from "../ts/sourcefile.js";
import ts from "typescript";
import {
    attributeEscapedTextMatchesVariant,
    attributeNameVariantBuilder,
    attributeNodeParentIsLikelyDeclaration,
    CheckerFunction,
    eventNameMatches,
    nodeIsEventDeclaration,
} from "./ast.js";

export function getClassIdentifier(classPath: string, className: string, basePath: string): ts.Identifier | undefined {
    const sourceFile = getSourceFile(basePath, classPath);
    if (!sourceFile) {
        return undefined;
    }

    return findClassIdentifierByName(sourceFile, className);
}

export function findIdentifiers(classPath: string, basePath: string): Array<ts.Identifier> {
    const sourceFile = getSourceFile(basePath, classPath);
    if (!sourceFile) {
        return [];
    }
    return findNodesByCondition(sourceFile, (node) => ts.isIdentifier(node));
}

export function findTemplateExpressions(classPath: string, basePath: string): Array<ts.Node> {
    const sourceFile = getSourceFile(basePath, classPath);
    if (!sourceFile) {
        return [];
    }
    return findNodesByCondition(sourceFile, nodeIsTemplateLiteral);
}

function nodeIsTemplateLiteral(node: ts.Node) {
    return ts.isTemplateLiteral(node) ||
        ts.isNoSubstitutionTemplateLiteral(node) ||
        ts.isTemplateExpression(node);
}

export function getAttributeIdentifier(classPath: string, attributeName: string, basePath: string): ts.Identifier | undefined {
    const sourceFile = getSourceFile(basePath, classPath);
    if (!sourceFile) {
        return undefined;
    }

    return findAttributeIdentifierByName(sourceFile, attributeName);
}

export function getPropertyIdentifier(classPath: string, propertyName: string, basePath: string): ts.Identifier | undefined {
    const sourceFile = getSourceFile(basePath, classPath);
    if (!sourceFile) {
        return undefined;
    }

    return findPropertyIdentifierByName(sourceFile, propertyName);
}

export function getEventIdentifier(classPath: string, eventName: string, basePath: string): ts.Identifier | undefined {
    const sourceFile = getSourceFile(basePath, classPath);
    if (!sourceFile) {
        return undefined;
    }

    return findEventIdentifierByName(sourceFile, eventName);
}

function findClassIdentifierByName(sourceFile: ts.SourceFile, className: string): ts.Identifier | undefined {
    const conditions = (node: ts.Node) => {
        return ts.isIdentifier(node) && node.escapedText === className && ts.isClassDeclaration(node.parent);
    };
    return findNodeByCondition(sourceFile, conditions);
}

function findAttributeIdentifierByName(sourceFile: ts.SourceFile, attributeName: string): ts.Identifier | undefined {
    const attributeVariants = attributeNameVariantBuilder(attributeName);
    const conditions = (node: ts.Node) => {
        return (
            ts.isIdentifier(node) &&
            attributeEscapedTextMatchesVariant(node.escapedText as string, attributeVariants) &&
            attributeNodeParentIsLikelyDeclaration(node)
        );
    };
    return findNodeByCondition(sourceFile, conditions);
}

function findPropertyIdentifierByName(sourceFile: ts.SourceFile, propertyName: string): ts.Identifier | undefined {
    const conditions = (node: ts.Node) => {
        return ts.isIdentifier(node) && node.escapedText === propertyName && attributeNodeParentIsLikelyDeclaration(node);
    };
    return findNodeByCondition(sourceFile, conditions);
}

function findEventIdentifierByName(sourceFile: ts.SourceFile, eventName: string): ts.Identifier | undefined {
    const conditions = (node: ts.Node) => {
        return ts.isIdentifier(node) && nodeIsEventDeclaration(node) && eventNameMatches(node, eventName);
    };
    return findNodeByCondition(sourceFile, conditions);
}

function findNodeByCondition<T>(sourceFile: ts.SourceFile, checkerFunction: CheckerFunction): T | undefined {
    let foundNode: ts.Node | undefined = undefined;
    function findNodeWithCondition(node: ts.Node) {
        if (checkerFunction.apply(null, [node])) {
            foundNode = node;
            return;
        }
        ts.forEachChild(node, findNodeWithCondition);
    }
    findNodeWithCondition(sourceFile);

    return foundNode;
}

function findNodesByCondition<T>(sourceFile: ts.SourceFile, checkerFunction: CheckerFunction): Array<T> {
    let foundNodes: Array<T> = [];
    function findNodeWithCondition(node: ts.Node) {
        if (checkerFunction.apply(null, [node])) {
            foundNodes.push(node as T);
        }
        ts.forEachChild(node, findNodeWithCondition);
    }
    findNodeWithCondition(sourceFile);

    return foundNodes;
}
