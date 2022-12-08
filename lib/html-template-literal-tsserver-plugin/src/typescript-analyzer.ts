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
        start: classIdentifier.getStart(),
        length: classIdentifier.getWidth()
    }
}

export function getAttributeDefinitionTextSpan(mod: JavaScriptModule, attributeName: string, basePath: string): ts.TextSpan {
    const sourceFile = getSourceFile(basePath, mod.path);
    if (!sourceFile) {
        return ts.createTextSpan(0, 0);
    }

    const propertyIdentifier = findAttributeIdentifierByName(sourceFile, attributeName);
    if (!propertyIdentifier) {
        return ZERO_TEXT_SPAN;
    }

    return {
        start: propertyIdentifier.getStart(),
        length: propertyIdentifier.getWidth()
    };
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

    return program.getSourceFile(fullClassPath);
}

type CheckerFunction = (node: ts.Node) => boolean;

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

function findClassIdentifierByName(sourceFile: ts.SourceFile, className: string): ts.Identifier | undefined {
    const conditions = (node: ts.Node) => {
        return ts.isIdentifier(node)
            && node.escapedText === className
            && ts.isClassDeclaration(node.parent);
    }
    return findNodeByCondition(sourceFile, conditions);
}

function findAttributeIdentifierByName(sourceFile: ts.SourceFile, attributeName: string): ts.Identifier | undefined {
    const attributeVariants = attributeNameVariantBuilder(attributeName);
    const conditions = (node: ts.Node) => {
        return ts.isIdentifier(node)
            && attributeEscapedTextMatchesVariant(node.escapedText as string, attributeVariants)
            && attributeNodeParentIsLikelyDeclaration(node)
    }
    return findNodeByCondition(sourceFile, conditions);
}

// TODO: Move these function below somewhere

export interface AttributeVariants {
    camelVariant: string;
    snakeVariant: string;
}

export function attributeEscapedTextMatchesVariant(escaped: string, variants: AttributeVariants) {
    return escaped === variants.snakeVariant || escaped === variants.camelVariant;
}

export function attributeNodeParentIsLikelyDeclaration(node: ts.Node) {
    return ts.isPropertyDeclaration(node.parent)
        || (ts.isPropertyAccessExpression(node.parent) && isInsideConstructor(node));
}

export function isInsideConstructor(node: ts.Node) {
    const parentList = getNodeParentList(node);
    return parentList.some(ts.isConstructorDeclaration);
}

export function getNodeParentList(node: ts.Node) {
    let parentList: Array<ts.Node> = [];
    let current = node;
    while (current.parent) {
        parentList.push(current.parent);
        current = current.parent;
    }

    return parentList;
}

export function attributeNameVariantBuilder(attributeName: string) {
    const isSnake = attributeName.includes("-");

    let snakeVariant = isSnake ? attributeName : camelToSnake(attributeName);
    let camelVariant = isSnake ? snakeToCamel(attributeName) : attributeName;

    return {
        snakeVariant,
        camelVariant
    }
}

function snakeToCamel(str: string) {
    return str.toLowerCase().replace(/([-_][a-z])/g, group =>
        group
            .toUpperCase()
            .replace('-', '')
            .replace('_', '')
    );
}

function camelToSnake(str: string) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
