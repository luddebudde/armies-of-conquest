import React from "react";
import ReactDOM from "react-dom/client";
import { Game } from "./App.tsx";

const rootEl = document.getElementById("root");

if (rootEl === null) {
  throw new Error("Root element not found");
}

ReactDOM.createRoot(rootEl).render(
  <React.StrictMode>
    <Game />
  </React.StrictMode>,
);
