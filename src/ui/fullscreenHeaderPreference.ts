const STORAGE_KEY = "keepscore-fullscreen-header";

export function getFullscreenHeaderPreference(): boolean {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(STORAGE_KEY) !== "0";
}

export function setFullscreenHeaderPreference(keepHeader: boolean): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, keepHeader ? "1" : "0");
}
