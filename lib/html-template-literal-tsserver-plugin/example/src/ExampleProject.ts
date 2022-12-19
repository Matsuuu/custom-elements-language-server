import { css, html, LitElement } from "lit";
import { property } from "lit/decorators.js";

const logo = new URL("../../assets/open-wc-logo.svg", import.meta.url).href;

/**
 * ExampleProject (used via html element `<example-project>`)
 * is a component used for displaying project information for the
 * user via a card-like UI component
 *
 * @fires my-custom-event
 * */
export class ExampleProject extends LitElement {
    @property({ type: String }) title = "My app";

    @property({ type: String, reflect: true, attribute: "project-name" })
    projectName = "Example Project";

    /**
     * Color of project card background and general theme
     * */
    @property({ type: String, reflect: true }) color = "#000000";

    /**
     * Userdata for authentication and token purposes
     * */
    @property({ type: Object }) userData = {};

    constructor() {
        super();
    }

    static styles = css`
        :host {
            min-height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: flex-start;
            font-size: calc(10px + 2vmin);
            color: #1a2b42;
            max-width: 960px;
            margin: 0 auto;
            text-align: center;
            background-color: var(--example-project-background-color);
        }

        main {
            flex-grow: 1;
        }

        .logo {
            margin-top: 36px;
            animation: app-logo-spin infinite 20s linear;
        }

        @keyframes app-logo-spin {
            from {
                transform: rotate(0deg);
            }
            to {
                transform: rotate(360deg);
            }
        }

        .app-footer {
            font-size: calc(12px + 0.5vmin);
            align-items: center;
        }

        .app-footer a {
            margin-left: 5px;
        }
    `;

    doEvent() {
        const eventName = "my-custom-event";
        /**
         * Event that gets triggered when my custom action
         * is triggered by the user
         * */
        const event = new CustomEvent(eventName);
        this.dispatchEvent(event);
    }

    render() {
        return html`
            <main>
                <div class="logo"><img alt="open-wc logo" src=${logo} /></div>
                <h1>${this.title}</h1>

                <p>Edit <code>src/ExampleProject.ts</code> and save to reload.</p>
                <a class="app-link" href="https://open-wc.org/guides/developing-components/code-examples" target="_blank" rel="noopener noreferrer">
                    Code examples
                </a>
            </main>

            <p class="app-footer">
                🚽 Made with love by
                <a target="_blank" rel="noopener noreferrer" href="https://github.com/open-wc">open-wc</a>.
            </p>
        `;
    }
}
