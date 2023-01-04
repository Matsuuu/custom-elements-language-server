import { TemplateContext } from "typescript-template-language-service-decorator";
import { LanguageService, Node } from "vscode-html-languageservice";
import { createTextDocumentFromContext } from "../text-document.js";

export function resolveCustomElementTags(languageService: LanguageService, context: TemplateContext): Array<Node> {
    // TODO: Cache these too. Some kind of a WeakMap with the document.
    // This will be called multiple times per diagnostics call
    const document = createTextDocumentFromContext(context);
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
