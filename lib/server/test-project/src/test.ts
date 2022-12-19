import { LitElement, html } from "lit";
import { customElement } from "lit/decorators.js";

import "./my-header.js";
import "./my-article.js";
import "./my-footer.js";

function foo() {
    return "bar";
}

@customElement("my-page")
class MyPage extends LitElement {
    firstUpdated() {
        foo();
    }

    render() {
        return html`
        ${foo()}
        <button></button>
      <my-header></my-header>
      <my-article></my-article>
      <my-footer></my-footer>
		<my-multi-row
		  foo="bar"
		></my-multi-row>
      <
		my-janky-row>
		</my-janky-row>
		<
		my-other-janky-row
		>
		</my-other-janky-row>
    `;
    }
}
