import ts from "typescript";

export interface AttributeVariants {
    camelVariant: string;
    snakeVariant: string;
}

export type CheckerFunction = (node: ts.Node) => boolean;

export function attributeEscapedTextMatchesVariant(escaped: string, variants: AttributeVariants) {
    return escaped === variants.snakeVariant || escaped === variants.camelVariant;
}

export function attributeNodeParentIsLikelyDeclaration(node: ts.Node) {
    return ts.isPropertyDeclaration(node.parent) || (ts.isPropertyAccessExpression(node.parent) && isInsideConstructor(node));
}

export function nodeIsEventDeclaration(node: ts.Node) {
    return ts.isIdentifier(node) && (node.escapedText === "CustomEvent" || node.escapedText === "Event");
}

export function eventNameMatches(node: ts.Node, eventName: string) {
    const parentNode = node.parent;
    if (!parentNode || !ts.isNewExpression(parentNode)) return false;

    const eventNameNode = parentNode.arguments?.[0];

    if (!eventNameNode) return false;

    if (ts.isStringLiteral(eventNameNode) && eventNameNode.text === eventName) return true;

    // Find event declared as a variable?
    //
    // The solution below works if we enable
    // program.getDeclarationDiagnostics();
    // but that makes a lot of stuff slow as shit
    // as it has to do a lot of analysis
    // @ts-ignore
    /*const flowNode = eventNameNode.flowNode;
    const variableEventName = flowNode.node.initializer.text;
    if (variableEventName === eventName) return true;*/

    return false;
}

export function propertyNodeParentIsLikelyDeclaration(node: ts.Node) {
    return node.parent !== undefined && (ts.isPropertyDeclaration(node.parent) || (ts.isPropertyAccessExpression(node.parent) && isInsideConstructor(node)));
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
        camelVariant,
    };
}

function snakeToCamel(str: string) {
    return str.toLowerCase().replace(/([-_][a-z])/g, group => group.toUpperCase().replace("-", "").replace("_", ""));
}

function camelToSnake(str: string) {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}
