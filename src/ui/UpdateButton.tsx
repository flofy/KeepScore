import { useEffect, useState } from "react";
import { useI18n } from "./i18n";

export function UpdateButton() {
  const { t } = useI18n();
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(
    null,
  );
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    let active = true;
    let installing: ServiceWorker | null = null;

    const onControllerChange = () => {
      if (!active || !updating) return;
      window.location.reload();
    };

    const watchInstalling = (worker: ServiceWorker | null) => {
      if (!worker || worker === installing) return;
      installing = worker;
      worker.addEventListener("statechange", () => {
        if (worker.state === "installed" && navigator.serviceWorker.controller) {
          setUpdateAvailable(true);
        }
      });
    };

    navigator.serviceWorker.addEventListener(
      "controllerchange",
      onControllerChange,
    );

    navigator.serviceWorker
      .getRegistration()
      .then((currentRegistration) => {
        if (!active || !currentRegistration) return;
        setRegistration(currentRegistration);
        if (currentRegistration.waiting) setUpdateAvailable(true);
        watchInstalling(currentRegistration.installing);
        currentRegistration.addEventListener("updatefound", () => {
          watchInstalling(currentRegistration.installing);
        });
        return currentRegistration.update();
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
