import { html } from "lit-html";

export const temp = html`
    <example-project my-attribute="f" 
    project-name="foo" 
    .projectName="" 
    .color="#f00b44"
    @my-custom-event="">

    <sl-alert>

    <p>Foo</p>

    <img src="" />

    <input type="text" />

    <textarea cols="40"></textarea>

    <div class="foo">
        <span>Bar</span>
    </div>
`;
