import * as HTMLLanguageService from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { LanguageService, Node } from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";

export function getCustomElementTagsInContext(languageService: LanguageService, document: HTMLLanguageService.TextDocument): Array<Node> {
    // TODO: Cache these too. Some kind of a WeakMap with the document.
    // This will be called multiple times per diagnostics call
    const scannedDocument = languageService.parseHTMLDocument(document);

    const rootNodes = scannedDocument.roots;
    let customElementNodes: Array<Node> = [];

    function findCustomElementNodes(nodes: Array<Node>) {
        if (nodes.length <= 0) return;

        customElementNodes = [
            ...customElementNodes,
            ...nodes.filter(node => node.tag?.includes("-"))
        ];

        const children = nodes.flatMap(node => node.children);
        findCustomElementNodes(children);
    }
    findCustomElementNodes(rootNodes);

    return customElementNodes;
}
