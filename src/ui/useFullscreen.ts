import { useEffect, useState } from "react";
import {
  getFullscreenHeaderPreference,
  setFullscreenHeaderPreference,
} from "./fullscreenHeaderPreference";

const STORAGE_KEY = "keepscore-fullscreen";

export function useFullscreen() {
  const [fullscreen, setFullscreen] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1",
  );
  const [keepHeaderInFullscreen, setKeepHeaderInFullscreen] = useState(
    getFullscreenHeaderPreference,
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, fullscreen ? "1" : "0");
  }, [fullscreen]);

  useEffect(() => {
    // The Android WebView does not reliably dispatch fullscreenchange for the
    // browser Fullscreen API. Capacitor fullscreen is therefore app-layout
    // fullscreen, driven by React state and CSS instead.
    if (import.meta.env.VITE_CAPACITOR === "true") return;

    const handleFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (import.meta.env.VITE_CAPACITOR === "true") {
      setFullscreen((current) => !current);
      return;
    }

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else {
        setFullscreen((current) => !current);
      }
    } catch {
      setFullscreen((current) => !current);
    }
  };

  const setKeepHeaderPreference = (keepHeader: boolean) => {
    setKeepHeaderInFullscreen(keepHeader);
    setFullscreenHeaderPreference(keepHeader);
  };

  return {
    fullscreen,
    toggleFullscreen,
    keepHeaderInFullscreen,
    setKeepHeaderPreference,
  };
}
