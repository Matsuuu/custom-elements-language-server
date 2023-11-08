import { createSignal, onCleanup } from "solid-js";
import { render } from "solid-js/web";

const template = html`
  <example-project></example-project>

  <sl-button type="button"></sl-button>

  <importing-element>

  <sl-card></sl-card>
`

const CountingComponent = () => {
	const [count, setCount] = createSignal(0);
	const interval = setInterval(
		() => setCount(c => c + 1),
		1000
	);
	onCleanup(() => clearInterval(interval));
  return <div>
    <importing-element></importing-element>
	<example-project></example-project>
    <p>Count value is {count()}</p>
  </div>;
};

render(() => <CountingComponent />, document.getElementById("app"));
