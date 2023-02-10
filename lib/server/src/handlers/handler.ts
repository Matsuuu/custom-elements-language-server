interface Handler<T, P> {
    handle: (params: T) => P | undefined;
    onJavascriptFile: (params: T) => P | undefined;
    onHTMLOrOtherFile: (params: T) => P | undefined;
}
