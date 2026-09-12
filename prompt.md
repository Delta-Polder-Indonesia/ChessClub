[vite] connecting...
client:912 [vite] connected.
script.debug.js:1 [Vercel Speed Insights] Debug mode is enabled by default in development. No requests will be sent to the server.
DashboardAkun.jsx:208 Uncaught ReferenceError: useI18n is not defined
    at DashboardAkun (DashboardAkun.jsx:208:17)
    at renderWithHooks (chunk-SXRIVT2P.js?v=ed8b16a7:11596:26)
    at mountIndeterminateComponent (chunk-SXRIVT2P.js?v=ed8b16a7:14974:21)
    at beginWork (chunk-SXRIVT2P.js?v=ed8b16a7:15962:22)
    at HTMLUnknownElement.callCallback2 (chunk-SXRIVT2P.js?v=ed8b16a7:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-SXRIVT2P.js?v=ed8b16a7:3705:24)
    at invokeGuardedCallback (chunk-SXRIVT2P.js?v=ed8b16a7:3739:39)
    at beginWork$1 (chunk-SXRIVT2P.js?v=ed8b16a7:19818:15)
    at performUnitOfWork (chunk-SXRIVT2P.js?v=ed8b16a7:19251:20)
    at workLoopSync (chunk-SXRIVT2P.js?v=ed8b16a7:19190:13)
DashboardAkun.jsx:208 Uncaught ReferenceError: useI18n is not defined
    at DashboardAkun (DashboardAkun.jsx:208:17)
    at renderWithHooks (chunk-SXRIVT2P.js?v=ed8b16a7:11596:26)
    at mountIndeterminateComponent (chunk-SXRIVT2P.js?v=ed8b16a7:14974:21)
    at beginWork (chunk-SXRIVT2P.js?v=ed8b16a7:15962:22)
    at HTMLUnknownElement.callCallback2 (chunk-SXRIVT2P.js?v=ed8b16a7:3680:22)
    at Object.invokeGuardedCallbackDev (chunk-SXRIVT2P.js?v=ed8b16a7:3705:24)
    at invokeGuardedCallback (chunk-SXRIVT2P.js?v=ed8b16a7:3739:39)
    at beginWork$1 (chunk-SXRIVT2P.js?v=ed8b16a7:19818:15)
    at performUnitOfWork (chunk-SXRIVT2P.js?v=ed8b16a7:19251:20)
    at workLoopSync (chunk-SXRIVT2P.js?v=ed8b16a7:19190:13)
installHook.js:1 The above error occurred in the <DashboardAkun> component:

    at DashboardAkun (http://localhost:5173/src/halaman/Analisa/akun/DashboardAkun.jsx?t=1789203797415:375:41)
    at div
    at div
    at div
    at div
    at div
    at section
    at PanelLayar (http://localhost:5173/src/halaman/Analisa/komponen/nav/PanelLayar.jsx:18:3)
    at LayarAkun (http://localhost:5173/src/halaman/Analisa/komponen/nav/layarAkun.jsx?t=1789203797415:24:37)
    at div
    at div
    at AreaKerja (http://localhost:5173/src/halaman/Analisa/komponen/areaKerja.jsx?t=1789203797415:29:26)
    at AnalyzeContextProvider (http://localhost:5173/src/halaman/Analisa/konteks/analyze.jsx:105:27)
    at div
    at div
    at MesinProvider (http://localhost:5173/src/halaman/Analisa/konteks/mesin.jsx:24:33)
    at ErrorsContextProvider (http://localhost:5173/src/halaman/Analisa/konteks/errors.jsx:25:31)
    at ConfigContextProvider (http://localhost:5173/src/halaman/Analisa/konteks/config.jsx:55:39)
    at div
    at Analisa (http://localhost:5173/src/halaman/Analisa/Analisa.jsx?t=1789203797415:32:17)
    at RenderedRoute (http://localhost:5173/node_modules/.vite/deps/chunk-2AGDYKLP.js?v=ed8b16a7:6666:26)
    at Outlet (http://localhost:5173/node_modules/.vite/deps/chunk-2AGDYKLP.js?v=ed8b16a7:7531:26)
    at Suspense
    at main
    at PageLayout (http://localhost:5173/src/components/PageLayout.jsx:34:24)
    at RenderedRoute (http://localhost:5173/node_modules/.vite/deps/chunk-2AGDYKLP.js?v=ed8b16a7:6666:26)
    at Routes (http://localhost:5173/node_modules/.vite/deps/chunk-2AGDYKLP.js?v=ed8b16a7:7601:3)
    at App (http://localhost:5173/src/App.jsx?t=1789203797415:211:3)
    at I18nProvider (http://localhost:5173/src/lib/i18n.jsx:29:32)
    at Router (http://localhost:5173/node_modules/.vite/deps/chunk-2AGDYKLP.js?v=ed8b16a7:7540:13)
    at BrowserRouter (http://localhost:5173/node_modules/.vite/deps/chunk-2AGDYKLP.js?v=ed8b16a7:10856:3)
    at _a (http://localhost:5173/node_modules/.vite/deps/react-helmet-async.js?v=be7f8bdd:627:5)
    at ErrorBoundary (http://localhost:5173/src/components/ErrorBoundary.jsx:7:5)

React will try to recreate this component tree from scratch using the error boundary you provided, ErrorBoundary.
overrideMethod @ installHook.js:1
installHook.js:1 [kci] ErrorBoundary menangkap error: ReferenceError: useI18n is not defined
    at DashboardAkun (DashboardAkun.jsx:208:17)
    at renderWithHooks (chunk-SXRIVT2P.js?v=ed8b16a7:11596:26)
    at mountIndeterminateComponent (chunk-SXRIVT2P.js?v=ed8b16a7:14974:21)
    at beginWork (chunk-SXRIVT2P.js?v=ed8b16a7:15962:22)
    at beginWork$1 (chunk-SXRIVT2P.js?v=ed8b16a7:19806:22)
    at performUnitOfWork (chunk-SXRIVT2P.js?v=ed8b16a7:19251:20)
    at workLoopSync (chunk-SXRIVT2P.js?v=ed8b16a7:19190:13)
    at renderRootSync (chunk-SXRIVT2P.js?v=ed8b16a7:19169:15)
    at recoverFromConcurrentError (chunk-SXRIVT2P.js?v=ed8b16a7:18786:28)
    at performSyncWorkOnRoot (chunk-SXRIVT2P.js?v=ed8b16a7:18932:28) ObjectcomponentStack: "\n    at DashboardAkun (http://localhost:5173/src/halaman/Analisa/akun/DashboardAkun.jsx?t=1789203797415:375:41)\n    at div\n    at div\n    at div\n    at div\n    at div\n    at section\n    at PanelLayar (http://localhost:5173/src/halaman/Analisa/komponen/nav/PanelLayar.jsx:18:3)\n    at LayarAkun (http://localhost:5173/src/halaman/Analisa/komponen/nav/layarAkun.jsx?t=1789203797415:24:37)\n    at div\n    at div\n    at AreaKerja (http://localhost:5173/src/halaman/Analisa/komponen/areaKerja.jsx?t=1789203797415:29:26)\n    at AnalyzeContextProvider (http://localhost:5173/src/halaman/Analisa/konteks/analyze.jsx:105:27)\n    at div\n    at div\n    at MesinProvider (http://localhost:5173/src/halaman/Analisa/konteks/mesin.jsx:24:33)\n    at ErrorsContextProvider (http://localhost:5173/src/halaman/Analisa/konteks/errors.jsx:25:31)\n    at ConfigContextProvider (http://localhost:5173/src/halaman/Analisa/konteks/config.jsx:55:39)\n    at div\n    at Analisa (http://localhost:5173/src/halaman/Analisa/Analisa.jsx?t=1789203797415:32:17)\n    at RenderedRoute (http://localhost:5173/node_modules/.vite/deps/chunk-2AGDYKLP.js?v=ed8b16a7:6666:26)\n    at Outlet (http://localhost:5173/node_modules/.vite/deps/chunk-2AGDYKLP.js?v=ed8b16a7:7531:26)\n    at Suspense\n    at main\n    at PageLayout (http://localhost:5173/src/components/PageLayout.jsx:34:24)\n    at RenderedRoute (http://localhost:5173/node_modules/.vite/deps/chunk-2AGDYKLP.js?v=ed8b16a7:6666:26)\n    at Routes (http://localhost:5173/node_modules/.vite/deps/chunk-2AGDYKLP.js?v=ed8b16a7:7601:3)\n    at App (http://localhost:5173/src/App.jsx?t=1789203797415:211:3)\n    at I18nProvider (http://localhost:5173/src/lib/i18n.jsx:29:32)\n    at Router (http://localhost:5173/node_modules/.vite/deps/chunk-2AGDYKLP.js?v=ed8b16a7:7540:13)\n    at BrowserRouter (http://localhost:5173/node_modules/.vite/deps/chunk-2AGDYKLP.js?v=ed8b16a7:10856:3)\n    at _a (http://localhost:5173/node_modules/.vite/deps/react-helmet-async.js?v=be7f8bdd:627:5)\n    at ErrorBoundary (http://localhost:5173/src/components/ErrorBoundary.jsx:7:5)"[[Prototype]]: Object Error Component Stack
    at ErrorBoundary (ErrorBoundary.jsx:9:5)
overrideMethod @ installHook.js:1
script.debug.js:1 [Vercel Speed Insights] [vitals] Object /_vercel/speed-insights/vitals