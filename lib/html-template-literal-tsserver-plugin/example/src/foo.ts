import { html } from "lit-html";

export const temp = html`
    <example-project project-name="foo" .projectName="" @my-custom-event=""></example-project>

    <p>Foo</p>

    <img src="" />

    <input type="text" />

    <textarea cols="40"></textarea>

    <div class="foo">
        <span>Bar</span>
    </div>
`;
