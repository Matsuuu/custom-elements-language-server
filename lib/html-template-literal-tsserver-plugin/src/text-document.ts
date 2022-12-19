import { TemplateContext } from "typescript-template-language-service-decorator";
import { Position, TextDocument } from "vscode-languageserver-textdocument";

export function createTextDocumentFromContext(context: TemplateContext): TextDocument {
    return {
        uri: "html-template-literal-tsserver-plugin/embedded.html",
        languageId: "html",
        version: 1,
        getText: () => context.text,
        positionAt: (offset: number) => {
            return context.toPosition(offset);
        },
        offsetAt: (position: Position) => {
            return context.toOffset(position);
        },
        lineCount: context.text.split(/\n/g).length + 1,
    };
}
