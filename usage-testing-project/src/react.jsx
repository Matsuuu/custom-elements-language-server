import React from "react";

function MyButton() {
  return (
    <button>
      I'm a button

      <example-project></example-project>

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
