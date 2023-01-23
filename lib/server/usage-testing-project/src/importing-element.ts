import { LitElement, html } from "lit";
import { repeat } from "lit/directives/repeat.js";

class ImportingClass extends LitElement {

  render() {
    return html`
      ${repeat([1,2,3,4], item => html`foo ${item}`)}
    `
  }
}

customElements.define("importing-element", ImportingClass);