import type { HistoryGrouping } from "./historyGrouping";
import { useI18n } from "./i18n";

type HistoryGroupingToggleProps = {
  value: HistoryGrouping;
  onChange: (value: HistoryGrouping) => void;
};

export function HistoryGroupingToggle({
  value,
  onChange,
}: HistoryGroupingToggleProps) {
  const { t } = useI18n();

  return (
    <div className="history-grouping-toggle" role="group" aria-label={t("historyGrouping")}>
      <button
        type="button"
        className={value === "round" ? "active" : ""}
        aria-pressed={value === "round"}
        onClick={() => onChange("round")}
      >
        {t("historyByRound")}
      </button>
      <button
        type="button"
        className={value === "player" ? "active" : ""}
        aria-pressed={value === "player"}
        onClick={() => onChange("player")}
      >
        {t("historyByPlayer")}
      </button>
    </div>
  );
}
