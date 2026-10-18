import { useEffect, useState } from "react";
import { useI18n } from "./i18n";
import {
  setUpdateAvailable,
  subscribeToUpdateAvailable,
} from "./updateAvailable";

export function UpdateButton() {
  const { t } = useI18n();
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setLocalUpdateAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const unsubscribeUpdate = subscribeToUpdateAvailable(
      setLocalUpdateAvailable,
    );
    return () => {
      unsubscribeUpdate();
    };
  }, []);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let active = true;
    let installing: ServiceWorker | null = null;
    let currentRegistration: ServiceWorkerRegistration | null = null;
    const stateChangeHandlers = new Map<ServiceWorker, () => void>();

    const onControllerChange = () => {
      if (!active || !updating) return;
      window.location.reload();
    };

    const watchInstalling = (worker: ServiceWorker | null) => {
      if (!worker || worker === installing) return;
      installing = worker;

      const onStateChange = () => {
        if (
          active &&
          worker.state === "installed" &&
          navigator.serviceWorker.controller
        ) {
          setUpdateAvailable(true);
        }
      };

      stateChangeHandlers.set(worker, onStateChange);
      worker.addEventListener("statechange", onStateChange);
    };

    const onUpdateFound = () => {
      watchInstalling(currentRegistration?.installing ?? null);
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    navigator.serviceWorker
      .getRegistration()
      .then((registrationResult) => {
        if (!active || !registrationResult) return;
        currentRegistration = registrationResult;
        setRegistration(registrationResult);
        if (registrationResult.waiting) setUpdateAvailable(true);
        watchInstalling(registrationResult.installing);
        registrationResult.addEventListener("updatefound", onUpdateFound);
        return registrationResult.update();
      })
      .catch(() => {
        // Service worker support is optional; the app remains fully usable.
      });

    return () => {
      active = false;
      navigator.serviceWorker.removeEventListener(
        "controllerchange",
        onControllerChange,
      );
      currentRegistration?.removeEventListener("updatefound", onUpdateFound);
      for (const [worker, handler] of stateChangeHandlers) {
        worker.removeEventListener("statechange", handler);
      }
      stateChangeHandlers.clear();
    };
  }, [updating]);

  if (!updateAvailable) return null;

  const applyUpdate = () => {
    const waiting = registration?.waiting;
    if (!waiting) {
      setUpdateAvailable(false);
      void registration?.update();
      return;
    }

    setUpdating(true);
    waiting.postMessage({ type: "SKIP_WAITING" });
  };

  return (
    <div className="update-notice" role="status">
      <button
        className="update-notice-action"
        type="button"
        onClick={applyUpdate}
        disabled={updating}
      >
        <svg className="update-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 4v4m0 0 3-3m-3 3L9 5M5 12a7 7 0 0113.2-3.2M19 12a7 7 0 01-13.2 3.2"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <span>{updating ? t("updating") : t("update")}</span>
      </button>
    </div>
  );
}
