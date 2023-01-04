import { html } from "lit-html";
import "./importing-element.js";
import '@shoelace-style/shoelace/dist/components/button/button.js';
   
export const temp = html`
    <example-project my-attribute="f" 
    project-name="foo" 
    .projectName="" 
    .color="#ff094"
    @my-custom-event="">      
    </example-project>

    <p>Foo</p>
 
    <img src="" />

    <input type="text" />

    <textarea cols="40"></textarea>

    <div class="foo">
        <span>Bar</span>
    </div>
`;
