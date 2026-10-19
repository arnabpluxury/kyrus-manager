import "@fontsource/ibm-plex-sans/latin-400.css";
import "@fontsource/ibm-plex-sans/latin-500.css";
import "@fontsource/ibm-plex-sans/latin-600.css";
import "@fontsource/ibm-plex-mono/latin-400.css";
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { BusyProvider } from "./lib/busy";
import { PrefsProvider } from "./lib/prefs";
import { TelemetryProvider } from "./lib/telemetry";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <PrefsProvider>
      <TelemetryProvider>
        <BusyProvider>
          <App />
        </BusyProvider>
      </TelemetryProvider>
    </PrefsProvider>
  </React.StrictMode>,
);
