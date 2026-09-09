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
      <style>{`
        .history-grouping-toggle {
          display: inline-flex;
          flex-wrap: wrap;
          gap: 3px;
          padding: 3px;
          border: 1px solid rgb(148 163 184 / 22%);
          border-radius: 12px;
          background: rgb(15 23 42 / 70%);
        }
        .history-grouping-toggle button {
          min-height: 38px;
          padding: 0 10px;
          border: 0;
          border-radius: 9px;
          background: transparent;
          color: #94a3b8;
          font-size: 12px;
          font-weight: 750;
          cursor: pointer;
          transition:
            background 0.15s ease,
            color 0.15s ease;
        }
        .history-grouping-toggle button:hover {
          color: #e2e8f0;
        }
        .history-grouping-toggle button.active {
          background: rgb(125 211 252 / 16%);
          color: #e0f2fe;
        }
        @media (max-width: 520px) {
          .history-grouping-toggle {
            width: 100%;
          }
          .history-grouping-toggle button {
            flex: 1 1 0;
          }
        }
      `}</style>
    </div>
  );
}
