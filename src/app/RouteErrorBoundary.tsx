import { useRouteError, useNavigate } from "react-router-dom";
import { useI18n } from "../ui/i18n";

/**
 * Route-level error boundary. Rendered via `errorElement` on every route so a
 * rendering error shows a friendly full-screen message instead of the default
 * React Router stack trace.
 */
export function RouteErrorBoundary() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const error = useRouteError();

  return (
    <main className="error-screen">
      <div className="error-card">
        <span className="error-icon" aria-hidden="true">
          ⚠️
        </span>
        <h1>{t("errorTitle")}</h1>
        <p className="muted">{t("errorMessage")}</p>
        <pre className="error-detail">
          {error instanceof Error
            ? error.message
            : String(error ?? t("errorUnknown"))}
        </pre>
        <button
          className="primary-button"
          type="button"
          onClick={() => navigate("/")}
        >
          ⌂ {t("home")}
        </button>
        <button
          className="secondary-button"
          type="button"
          onClick={() => window.location.reload()}
        >
          ↻ {t("errorReload")}
        </button>
      </div>
    </main>
  );
}