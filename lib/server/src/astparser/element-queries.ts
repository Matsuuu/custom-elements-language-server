import * as acorn from "acorn";

async function test() {
    acorn.Parser.extend(
        require("acorn-jsx"),
        require("acorn-es7-plugin")
    );

    const parseOutput = acorn.parse(code, { ecmaVersion: 2022, sourceType: "module" });

    console.log(parseOutput);
}

let code = `
import { LitElement, html } from 'lit';
import { customElement } from 'lit/decorators.js';

import './my-header.js';
import './my-article.js';
import './my-footer.js';

@customElement('my-page')
class MyPage extends LitElement {

    firstUpdated() {

    }

    render() {
        return html\`
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
    \`;
    }
}


`;

test();

