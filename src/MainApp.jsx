import { lazy, Suspense } from "react";
import App from "./App.jsx";
import { I18nProvider } from "./lib/I18nProvider.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import { HelmetProvider } from "react-helmet-async";
import { BrowserRouter } from "react-router-dom";
import { basisRouter } from "./lib/asets.js";

// SpeedInsights dimuat secara deferred — tidak memblokir render halaman pertama.
// Dihindari import statis agar modul @vercel/speed-insights tidak masuk bundle kritis.
const SpeedInsightsDeferred = lazy(() =>
  import("@vercel/speed-insights/react").then((m) => ({ default: m.SpeedInsights }))
);

export default function MainApp() {
  return (
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
  );
}
