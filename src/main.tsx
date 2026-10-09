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
import "./features/game/munchkin-combat.css";
import { App } from "./app/App";
import { AppProviders } from "./app/providers";
import { UpdateButton } from "./ui/UpdateButton";

// Capacitor packages the web assets directly into the native app; the PWA
// service worker and its update flow are only for browser-installed builds.
if (
  "serviceWorker" in navigator &&
  import.meta.env.PROD &&
  import.meta.env.VITE_CAPACITOR !== "true"
) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register(`${import.meta.env.BASE_URL}sw.js`)
      .then((registration) => registration.update())
      .catch((error) => {
        console.warn("KeepScore service worker registration failed.", error);
      });
  });
}

// In development, wipe any service worker and KeepScore caches left over from
// a previous production build or dev session, so local changes are always
// served fresh without manual DevTools cleanup.
if (import.meta.env.DEV) {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .getRegistrations()
      .then((registrations) =>
        Promise.all(registrations.map((reg) => reg.unregister())),
      )
      .catch(() => {});
  }
  if ("caches" in window) {
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("keepscore-"))
            .map((key) => caches.delete(key)),
        ),
      )
      .catch(() => {});
  }
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AppProviders>
      <App />
      <UpdateButton />
    </AppProviders>
  </StrictMode>,
);
