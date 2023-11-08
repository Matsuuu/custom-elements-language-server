import {
  FASTElement,
  customElement,
  attr,
  observable,
  Observable,
  html,
  repeat
} from "@microsoft/fast-element";

const template = html<NameTag>`<div>
  <h2>Hello!</h2>
  <p>I am ${(x) => x.name}. I enjoy:</p>
  <ul>
    ${repeat(
  (x) => x.hobbies,
  html`<li>
        ${(hobby) => {
      return hobby;
    }}
      </li> `
)}
  </ul>
  <fast-button @click=${(x) => x.onDelete()}>Delete</fast-button>
</div>`;

@customElement({ name: "name-tag", template })
export class NameTag extends FASTElement {
  @attr() name: string = "John Doe";

  @attr() foo: string = "Bar";

  /**
   * Color of project card background and general theme
   * */
  @attr() color: string = "#000000";

  @observable() data: any;

  @observable() hobbies: string[] = ["1", "2", "3"];

  connectedCallback() {
    super.connectedCallback();
    const test = ["test1", "test2", "test3"];
    // this.hobbies = ["tom", "jerry", "dave"];
    this.hobbies = test;
    // const notifier = Observable.getNotifier(this.hobbies);
    // const handler = {
    //   handleChange(source: any, splices: any) {
    //     console.log("WORKING", source, splices);
    //     // respond to the change here
    //     // source will be the array instance
    //     // splices will be an array of change records
    //     // describing the mutations in the array in
    //     // terms of splice operations
    //   }
    // };
    // notifier.subscribe(handler);
  }

  // hobbiesChanged() {
  //   console.log("changed hobbies", this.hobbies);
  // }

  public onDelete = () => {
    this.hobbies.splice(0, 1);
  };
}

