import { useEffect, useState } from "react";
import { useI18n } from "./i18n";
import {
  clearInstallPrompt,
  getInstallPrompt,
  subscribeToInstallPrompt,
  type BeforeInstallPromptEvent,
} from "./installPrompt";

type InstallButtonProps = {
  variant?: "header" | "menu";
};

const HEADER_DISMISSED_KEY = "keepscore-install-header-dismissed";

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
    appinstalled: Event;
  }
}

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.matchMedia("(display-mode: fullscreen)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function InstallButton({ variant = "menu" }: InstallButtonProps) {
  const { t } = useI18n();
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(() =>
    getInstallPrompt(),
  );
  const [standalone, setStandalone] = useState(() => isStandalone());
  const [headerDismissed, setHeaderDismissed] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(display-mode: standalone)");
    const unsubscribe = subscribeToInstallPrompt(setPrompt);

    if (variant === "header") {
      setHeaderDismissed(sessionStorage.getItem(HEADER_DISMISSED_KEY) === "1");
    }

    const onDisplayModeChange = () => setStandalone(isStandalone());
    media.addEventListener("change", onDisplayModeChange);

    return () => {
      media.removeEventListener("change", onDisplayModeChange);
      unsubscribe();
    };
  }, [variant]);

  if (standalone || !prompt || (variant === "header" && headerDismissed))
    return null;

  async function install() {
    const installPrompt = prompt;
    if (!installPrompt) return;

    await installPrompt.prompt();
    await installPrompt.userChoice;
    clearInstallPrompt();
  }

  if (variant === "header") {
    const dismiss = () => {
      sessionStorage.setItem(HEADER_DISMISSED_KEY, "1");
      setHeaderDismissed(true);
    };

    return (
      <div className="install-notice" role="status">
        <button
          className="install-notice-action"
          type="button"
          onClick={install}
        >
          <svg className="install-icon" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2h14v-2"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              fill="none"
            />
          </svg>
          <span>{t("install")}</span>
        </button>
        <button
          className="install-notice-close"
          type="button"
          onClick={dismiss}
          aria-label={t("dismissInstall")}
        >
          ×
        </button>
      </div>
    );
  }

  return (
    <button className="install-menu-button" type="button" onClick={install}>
      <svg className="install-icon" viewBox="0 0 24 24" aria-hidden="true">
        <path
          d="M12 3v11m0 0 4-4m-4 4-4-4M5 17v2h14v-2"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
      {t("install")}
    </button>
  );
}
