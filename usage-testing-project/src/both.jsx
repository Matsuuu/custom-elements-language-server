import { createSignal, onCleanup } from "solid-js";
import { render } from "solid-js/web";

const template = html`
  <example-project></example-project>

  
  
  <sl-card>
`

const CountingComponent = () => {
	const [count, setCount] = createSignal(0);
	const interval = setInterval(
		() => setCount(c => c + 1),
		1000
	);
	onCleanup(() => clearInterval(interval));
  return <div>
	<example-project></example-project>
    <p>Count value is {count()}</p>
  </div>;
};

render(() => <CountingComponent />, document.getElementById("app"));
