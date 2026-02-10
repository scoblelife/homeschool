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

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
);
