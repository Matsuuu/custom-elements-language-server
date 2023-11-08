import html from "solid-js/html";
import {createSignal, createEffect} from "solid-js";

const [dialogOpen, setDialogOpen] = createSignal(false)
const [seconds, setSeconds] = createSignal(0)

setInterval(() => setSeconds(seconds() + 1), 1000)

/// basics with built-in elements ////////////////////////////////

const main = html`
  <main>
    <dialog open=${dialogOpen}>
      <p>Greetings, one and all!</p>
      <button onclick=${() => setDialogOpen(false)}>OK</button>
    </dialog>
  </main>
`

console.assert(main instanceof HTMLElement)

let button;

const div = html`
  <div>
    <h1>Demo:</h1>

    ${main}

    ${"" /* Note, here foo=${} sets the foo attribute, not the .foo property */}
    <button ref=${b => button = b} foo=${seconds} attr:bar=${seconds} prop:baz=${seconds}>
      Click to open dialog (seconds: ${seconds})
    </button>
  </div>
`

console.assert(button instanceof HTMLButtonElement)
console.assert(div instanceof HTMLDivElement)

button.onclick = () => setDialogOpen(true)

document.body.append(div)

// Show that every time seconds changes, the button's `.baz` property is updated
createEffect(() => {
  console.log('seconds:', seconds(), button.getAttribute('foo'), button.getAttribute('bar'), button.baz)
})


/// custom elements ////////////////////////////////
// Main difference is that prop: is default instead of attr:

class MyEl extends HTMLElement {
  #root = this.attachShadow({mode: 'open'})

  // for sake of example, manual getters/setters for
  // reactivity (but imagine a decorator in their place)

  get clicks() { return this.#clicks[0]() }
  set clicks(v) { this.#clicks[1](v) }
  #clicks = createSignal(0)

  get foo() { return this.#foo[0]() }
  set foo(v) { this.#foo[1](v) }
  #foo = createSignal('foo')

  static observedAttributes = ['bar']
  attributeChangedCallback(name, oldVal, newVal) {
    console.log('attribute change:', name, newVal)
  }

  get baz() { return this.#baz[0]() }
  set baz(v) { this.#baz[1](v) }
  #baz = createSignal(-1)

  connectedCallback() {
    this.shadowRoot.append(html`
      <button onclick=${() => this.clicks++}>Clicks: ${() => this.clicks}</button>
    `)

    createEffect(() => {
      console.log('click count:', this.clicks)
    })

    createEffect(() => {
      console.log('this.foo:', this.foo)
    })

    createEffect(() => {
      console.log('this.baz:', this.baz)
    })
  }
}

customElements.define('my-el', MyEl)

// type def
declare global {
  interface HTMLElementTagNameMap {
    'my-el': MyEl
  }
}

// Note, here foo=${} sets the .foo property, not the foo attribute
const myEl = html`
  <my-el foo=${seconds} attr:bar=${seconds} prop:baz=${seconds}></my-el>
`

document.body.append(myEl)

// The reason foo=${} sets attributes on built-ins is because
// that typically works better for them all, as they all typically
// handle a simple primitive value.
//
// But with custom elements, typically they handle JS properties,
// so that's the default, and avoids a serialization from strings
// being a default (better performance).
//
// Same applies to Solid's JSX. f.e.
document.body.append(
  <p foo={seconds} attr:bar={seconds} prop:baz={seconds}>
    Seconds: {seconds}, my-el clicks: {myEl.clicks}
  </p>
)
//
// Is this good thing or a bad thing (the differing default
// between builtins and customs)? There's a conversation about
// this somewhere that we can dig up.

