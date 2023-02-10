import { TextDocumentPositionParams } from "vscode-languageserver";

const javascriptFileTypes = [
    "js", "ts", "jsx", "tsx", "mjs", "cjs"
];

type HandlerReturnType<P> = (P | undefined) | PromiseLike<P | undefined>;

export interface Handler<T, P> {
    handle: (params: T) => HandlerReturnType<P>;
    onJavascriptFile: (params: T) => HandlerReturnType<P>;
    onHTMLOrOtherFile: (params: T) => HandlerReturnType<P>;
}

export function isJavascriptFile(params: TextDocumentPositionParams | string) {
    const uri = typeof params === "string" ? params : params.textDocument.uri;

    return javascriptFileTypes.some(fileType => uri.endsWith("." + fileType));
}
