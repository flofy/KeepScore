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
  const { lang } = useI18n();
  const labels =
    lang === "fr"
      ? { group: "Regrouper", round: "Par tour", player: "Par joueur" }
      : { group: "Group history", round: "By round", player: "By player" };

  return (
    <div
      className="history-grouping-toggle"
      role="group"
      aria-label={labels.group}
    >
      <button
        type="button"
        className={value === "round" ? "active" : ""}
        aria-pressed={value === "round"}
        onClick={() => onChange("round")}
      >
        {labels.round}
      </button>
      <button
        type="button"
        className={value === "player" ? "active" : ""}
        aria-pressed={value === "player"}
        onClick={() => onChange("player")}
      >
        {labels.player}
      </button>
    </div>
  );
}
