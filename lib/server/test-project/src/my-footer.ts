import { LitElement, html } from "lit";

export class MyFooter extends LitElement {
    render() {
        return html` <h2>Footer</h2> `;
    }
}

customElements.define("my-footer", MyFooter);
