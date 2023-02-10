import { TextDocumentPositionParams } from "vscode-languageserver";

const javascriptFileTypes = [
    "js", "ts", "jsx", "tsx", "mjs", "cjs"
];

export interface Handler<T, P> {
    handle: (params: T) => P | undefined;
    onJavascriptFile: (params: T) => P | undefined;
    onHTMLOrOtherFile: (params: T) => P | undefined;
}

export function isJavascriptFile(params: TextDocumentPositionParams | string) {
    const uri = typeof params === "string" ? params : params.textDocument.uri;

    return javascriptFileTypes.some(fileType => uri.endsWith("." + fileType));
}
