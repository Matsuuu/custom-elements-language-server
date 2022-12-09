import ts from "typescript";

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
