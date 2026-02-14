import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import { analytics } from "./analytics";
import "./index.css";

// Use HashRouter for Electron (file:// protocol)
const Router =
  window.location.protocol === "file:" ? HashRouter : BrowserRouter;

// Track app open
analytics.trackAppOpen();

// Load high-contrast setting before first render to prevent flash
if (window.api) {
  window.api.getSetting("high_contrast").then((value: string | null) => {
    if (value === "true") {
      document.documentElement.classList.add("high-contrast");
    }
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
);
