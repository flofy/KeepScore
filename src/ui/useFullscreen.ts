import { useEffect, useState } from "react";

const STORAGE_KEY = "keepscore-fullscreen";

export function useFullscreen() {
  const [fullscreen, setFullscreen] = useState(
    () => localStorage.getItem(STORAGE_KEY) === "1",
  );

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, fullscreen ? "1" : "0");
  }, [fullscreen]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
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

  return { fullscreen, toggleFullscreen };
}
