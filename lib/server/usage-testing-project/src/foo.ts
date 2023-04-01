import { html } from "lit-html";
import { repeat } from "lit/directives/repeat.js";
import "./importing-element.js";
import "./example-project.js";

export const temp = html`
    <example-project my-attribute="f" 
    project-name="foo" 
    .projectName="" 
    .color="#ff094"
    @my-custom-event="${() => { console.log('foo') }}"
    ></example-project>

    <example-project></example-project>
    
    <example-project></example-project>
        

    <sl-button size="" variant=""></sl-button>
  
    <sl-input @sl-blur="${() => { }}"></sl-input>

    <p>Foo</p>
    
    <img src="" />

  
    <input type="text" />

    <textarea cols="40"></textarea>

    <div class="foo">
        <span>Bar</span>
    </div>

`;

document.querySelector("p");


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
