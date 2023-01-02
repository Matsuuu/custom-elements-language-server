import { html } from "lit-html";

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
