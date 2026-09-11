import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";
import "./ui/responsive.css";
import "./ui/start.css";
import "./ui/error.css";
import "./ui/saved-games.css";
import "./ui/chwatzi.css";
import "./ui/intro.css";
import "./ui/install.css";
import { App } from "./app/App";
import { AppProviders } from "./app/providers";
import { UpdateButton } from "./ui/UpdateButton";

// The service worker powers the installed-PWA offline shell in production.
// It must never register in development: its cache-first fetch handler would
// serve stale Vite modules and hide every new change until the cache is cleared.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => registration.update())
      .catch((error) => {
        console.warn("KeepScore service worker registration failed.", error);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
      <UpdateButton />
    </AppProviders>
  </StrictMode>,
);
