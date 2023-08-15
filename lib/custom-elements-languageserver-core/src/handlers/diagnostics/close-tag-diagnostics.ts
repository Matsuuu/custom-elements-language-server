import tss from "typescript/lib/tsserverlibrary.js";
import { Node } from "vscode-html-languageservice/lib/esm/htmlLanguageService.js";
import { getCustomElementTagsInContext } from "../../scanners/tag-scanner.js";
import { getSourceFile } from "../../ts/sourcefile.js";
import { CODE_ACTIONS } from "../enum/code-actions.js";
import { CustomElementsLanguageServiceRequest } from "../../request.js";

export function getMissingCloseTagDiagnostics(nodeOffset: number, request: CustomElementsLanguageServiceRequest): tss.Diagnostic[] {
    const { document, htmlLanguageService, filePath, project } = request;
    const customElementTagNodes = getCustomElementTagsInContext(htmlLanguageService, document);
    const sourceFile = getSourceFile(filePath, undefined, project);

    return customElementTagNodes
        .filter(nodeIsNotClosed)
        .map(node => nonClosedTagToDiagnostic(node, sourceFile, nodeOffset));
}

function nodeIsNotClosed(node: Node) {
    return node.endTagStart === undefined;
}

function nonClosedTagToDiagnostic(node: Node, sourceFile: tss.SourceFile | undefined, htmlContextOffset: number): tss.Diagnostic {
    const startTagEnd = node.startTagEnd ?? node.start;
    const closingSnippet = `Add closing tag </${node.tag}>`;
    const isNotJavascriptFile = htmlContextOffset === 0;
    const closingTagOffset = (node.startTagEnd || 0) + (isNotJavascriptFile ? 0 : 1); // HTML Files don't need to +1 bump for some reason
    return {
        category: tss.DiagnosticCategory.Warning,
        code: CODE_ACTIONS.CLOSE_TAG,
        file: sourceFile,
        start: node.start,
        length: startTagEnd - node.start,
        messageText: `Tag ${node.tag} doesn't have a closing tag.`,
        relatedInformation: [{
            category: tss.DiagnosticCategory.Suggestion,
            code: 0,
            file: undefined,
            start: htmlContextOffset + closingTagOffset,
            length: (node.tag?.length || 0) + 3, // <, > and /
            messageText: closingSnippet,
        }]
    };
}
