import React from "react";
import "./example-project.js";

function MyButton() {
  return (
    <button>
      I'm a button

      <example-project color=""></example-project>

    </button>
  );
}

export default function MyApp() {
  return (
    <div>
      <h1>Welcome to my app</h1>
      <MyButton />
    </div>
  );
}
