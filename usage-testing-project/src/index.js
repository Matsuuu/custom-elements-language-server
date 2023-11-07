import { html } from "lit-html";
import "./example-project.js";

export const temp = html`

  <example-project
      project-name="foo"
      .color=""
    ></example-project>

    <p>Foo</p>

    <img src="" />

    <input type="text" />

    <textarea cols="40"></textarea>

    <div class="foo">
        <span>Bar</span>
    </div>
`;
