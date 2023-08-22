// Test if this is all that is needed for cross-package comms.

export class LanguageServerEventHost extends EventTarget {

    static #instance: LanguageServerEventHost;

    public static getInstance() {
        if (!LanguageServerEventHost.#instance) {
            LanguageServerEventHost.#instance = new LanguageServerEventHost();
        }
        return LanguageServerEventHost.#instance;
    }

    constructor() {
        super();
    }

    public static broadcast(event: Event) {
        this.getInstance().dispatchEvent(event);
    }
}
