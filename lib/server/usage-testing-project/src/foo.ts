import { html } from "lit-html";
import { repeat } from "lit/directives/repeat.js";
import "./importing-element.js";
import "./example-project.js";
import "@shoelace-style/shoelace/dist/components/button/button.js";
import "@shoelace-style/shoelace/dist/components/input/input.js";

export const temp = html`
    <example-project my-attribute="f" 
    project-name="foo" 
    .projectName="" 
    .color="#ff094"
    .foo=""
    @my-custom-event="">      
    </example-project>

    <example-project project-name="foo"></example-project>

    <sl-button size=""></sl-button>
    
  
    <sl-input @sl-blur=""></sl-input>

    <p>Foo</p>
    
    <img src="" />

  
    <input type="text" />

    <textarea cols="40"></textarea>

    <div class="foo">
        <span>Bar</span>
    </div>

`;

class Foo {
    bar() {
        console.log("Bin");
    }
}

function doRender() {
    return html`
    <p>Foo</p>

    <example-project project-name=""></example-project>
    `;
}
