import { LitElement, html } from "lit";

export class MyHeader extends LitElement {
    render() {
        return html`
            <h2>Header</h2>
        `;
    }
}

customElements.define("my-header", MyHeader);
