import React, { lazy, Suspense } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.jsx";
import { I18nProvider } from "./lib/i18n.jsx";
import { basisRouter } from "./lib/asets.js";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import "./index.css";

// SpeedInsights dimuat secara deferred — tidak memblokir render halaman pertama.
// Dihindari import statis agar modul @vercel/speed-insights tidak masuk bundle kritis.
const SpeedInsightsDeferred = lazy(() =>
  import("@vercel/speed-insights/react").then((m) => ({ default: m.SpeedInsights }))
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <HelmetProvider>
        <BrowserRouter basename={basisRouter()}>
          <I18nProvider>
            <App />
            <Suspense fallback={null}>
              <SpeedInsightsDeferred />
            </Suspense>
          </I18nProvider>
        </BrowserRouter>
      </HelmetProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
