import { HoverParams, Hover } from "vscode-languageserver";

export const HoverHandler: Handler<HoverParams, Hover> = {
    handle: (hoverInfo: HoverParams) => {

        return undefined;
    },
    onJavascriptFile: (hoverInfo: HoverParams) => {

        return undefined;
    },
    onHTMLOrOtherFile: (hoverInfo: HoverParams) => {

        return undefined;
    }
}
