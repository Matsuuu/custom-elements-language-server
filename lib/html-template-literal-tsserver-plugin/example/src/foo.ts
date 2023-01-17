import { html } from "lit-html";
import "./importing-element.ts";
import "./example-project.js";

export const temp = html`

    <example-project my-attribute="f" 
    project-name="foo" 
    .projectName="" 
    .color="#ff094"
    @my-custom-event="">      
    </example-project>

    <sl-button size=""></sl-button>
    
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
