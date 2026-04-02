import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.js";
import "./styles/global.css";

document.addEventListener("mousedown", () => document.body.classList.add("cursor-clicking"));
document.addEventListener("mouseup", () => document.body.classList.remove("cursor-clicking"));
document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-clicking"));

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
