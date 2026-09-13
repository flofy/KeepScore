import type { Game } from "../../domain/game/types";
import type { HistoryGrouping } from "../../ui/historyGrouping";
import { useI18n } from "../../ui/i18n";
import { GameHistoryPanel } from "./GameHistoryPanel";

type Props = {
  game: Game;
  historyGrouping: HistoryGrouping;
  onHistoryGroupingChange: (grouping: HistoryGrouping) => void;
  historyFlipped: boolean;
  onClose: () => void;
  onFlip: () => void;
  editingEntry: string | null;
  draftDelta: string;
  onBeginEdit: (id: string, delta: number) => void;
  onDraftDeltaChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteEntry: (entryId: string) => void;
};

export function GameHistoryOverlay({
  game,
  historyGrouping,
  onHistoryGroupingChange,
  historyFlipped,
  onClose,
  onFlip,
  editingEntry,
  draftDelta,
  onBeginEdit,
  onDraftDeltaChange,
  onSaveEdit,
  onCancelEdit,
  onDeleteEntry,
}: Props) {
  const { t } = useI18n();

  return (
    <div
      className={
        historyFlipped ? "history-fullscreen flipped" : "history-fullscreen"
      }
      role="dialog"
      aria-label={t("history")}
    >
      <button
        className="history-close"
        type="button"
        onClick={onClose}
        aria-label={t("closeHistory")}
        title={t("closeHistory")}
      >
        ✕
      </button>
      <button
        className="history-flip-btn"
        type="button"
        onClick={onFlip}
        aria-pressed={historyFlipped}
        aria-label={t("flipHistory")}
        title={t("flipHistory")}
      >
        ↻
      </button>
      <GameHistoryPanel
        game={game}
        historyGrouping={historyGrouping}
        onHistoryGroupingChange={onHistoryGroupingChange}
        editingEntry={editingEntry}
        draftDelta={draftDelta}
        onBeginEdit={onBeginEdit}
        onDraftDeltaChange={onDraftDeltaChange}
        onSaveEdit={onSaveEdit}
        onCancelEdit={onCancelEdit}
        onDeleteEntry={onDeleteEntry}
      />
    </div>
  );
}
