import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { ToastProvider } from "./context/ToastContext";
import { ThemeProvider } from "./context/ThemeContext";
import App from "./App";
import AppLoadingScreen from "./components/AppLoadingScreen";
import ErrorBoundary from "./components/ErrorBoundary";
import "./index.css";

function AppBootstrap() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(id);
  }, []);

  if (!ready) {
    return <AppLoadingScreen />;
  }
  return <App />;
}

const container = document.getElementById("root");
if (!container) {
  document.body.insertAdjacentHTML(
    "beforeend",
    '<p style="padding:1rem;font-family:system-ui">Application container missing.</p>'
  );
} else {
  ReactDOM.createRoot(container).render(
    <React.StrictMode>
      <ErrorBoundary>
        <BrowserRouter>
          <ThemeProvider>
            <ToastProvider>
              <AppBootstrap />
            </ToastProvider>
          </ThemeProvider>
        </BrowserRouter>
      </ErrorBoundary>
    </React.StrictMode>
  );
}
