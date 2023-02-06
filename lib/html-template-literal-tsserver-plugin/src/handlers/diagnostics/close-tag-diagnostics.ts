import { TemplateContext } from "typescript-template-language-service-decorator";
import tss from "typescript/lib/tsserverlibrary.js";
import { LanguageService as HtmlLanguageService, Node } from "vscode-html-languageservice";
import { getCustomElementTagsInContext } from "../../scanners/tag-scanner.js";
import { getSourceFile } from "../../ts/sourcefile.js";
import { CODE_ACTIONS } from "../enum/code-actions.js";

export function getMissingCloseTagDiagnostics(context: TemplateContext, htmlLanguageService: HtmlLanguageService): tss.Diagnostic[] {
    const customElementTagNodes = getCustomElementTagsInContext(htmlLanguageService, context);
    const filePath = context.fileName;
    const sourceFile = getSourceFile(filePath);
    if (!sourceFile) {
        return [];
    }

    return customElementTagNodes
        .filter(nodeIsNotClosed)
        .map(node => nonClosedTagToDiagnostic(node, sourceFile, context.node.pos));
}

function nodeIsNotClosed(node: Node) {
    return node.endTagStart === undefined;
}

function nonClosedTagToDiagnostic(node: Node, sourceFile: tss.SourceFile, htmlContextOffset: number): tss.Diagnostic {
    const startTagEnd = node.startTagEnd ?? node.start;
    const closingSnippet = `Add closing tag </${node.tag}>`;
    const closingTagOffset = (node.startTagEnd || 0) + 1;
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