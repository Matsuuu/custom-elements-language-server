import { LitElement, html } from "lit";

export class MyArticle extends LitElement {
    render() {
        return html` <h2>Article</h2> `;
    }
}

customElements.define("my-article", MyArticle);
