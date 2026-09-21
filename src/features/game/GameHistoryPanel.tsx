import { HistoryGroupingToggle } from "../../ui/HistoryGroupingToggle";
import type { HistoryGrouping } from "../../domain/game/types";
import { groupHistory } from "../../ui/historyGrouping";
import { useI18n } from "../../ui/i18n";
import type { Game } from "../../domain/game/types";

function formatDelta(delta: number): string {
  return delta > 0 ? `+${delta}` : `${delta}`;
}

type Props = {
  game: Game;
  historyGrouping: HistoryGrouping;
  onHistoryGroupingChange: (grouping: HistoryGrouping) => void;
  editingEntry: string | null;
  draftDelta: string;
  onBeginEdit: (id: string, delta: number) => void;
  onDraftDeltaChange: (value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDeleteEntry: (entryId: string) => void;
};

export function GameHistoryPanel({
  game,
  historyGrouping,
  onHistoryGroupingChange,
  editingEntry,
  draftDelta,
  onBeginEdit,
  onDraftDeltaChange,
  onSaveEdit,
  onCancelEdit,
  onDeleteEntry,
}: Props) {
  const { t } = useI18n();
  const historyGroups = groupHistory(game.history, historyGrouping);
  const orderedHistoryGroups =
    historyGrouping === "player"
      ? [...historyGroups].sort(
          (a, b) =>
            game.players.findIndex((player) => player.id === a.key) -
            game.players.findIndex((player) => player.id === b.key),
        )
      : [...historyGroups].reverse();

  return (
    <section className="history" aria-label={t("history")}>
      <div className="section-heading">
        <div>
          <h2>{t("history")}</h2>
          <span>
            {game.history.length} {t("moves")}
          </span>
        </div>
        <HistoryGroupingToggle
          value={historyGrouping}
          onChange={onHistoryGroupingChange}
        />
      </div>
      {game.history.length === 0 ? (
        <p className="empty-state">{t("noMoves")}</p>
      ) : (
        <div className="history-groups">
          {orderedHistoryGroups.map((group) => {
            const player =
              historyGrouping === "player"
                ? game.players.find((candidate) => candidate.id === group.key)
                : undefined;
            const entries = [...group.entries].reverse();

            return (
              <section className="history-group" key={group.key}>
                <h3>
                  {historyGrouping === "player"
                    ? player?.name
                    : `${t("round")} ${group.round}`}
                </h3>
                <ol>
                  {entries.map((entry) => {
                    const entryPlayer = game.players.find(
                      (candidate) => candidate.id === entry.playerId,
                    );
                    return (
                      <li key={entry.id}>
                        <span>
                          {historyGrouping === "round" && entryPlayer?.name}
                          {historyGrouping === "round" && "  "}
                          <strong
                            className={
                              entry.delta > 0 ? "delta-plus" : "delta-minus"
                            }
                          >
                            {formatDelta(entry.delta)}
                          </strong>
                        </span>
                        <span className="history-actions">
                          <button
                            type="button"
                            className="secondary-button"
                            onClick={() => onBeginEdit(entry.id, entry.delta)}
                            title={t("edit")}
                          >
                            <svg
                              className="btn-icon"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                d="M16.8 3.8a2.4 2.4 0 013.4 3.4L7.6 19.7l-4.6 1.3 1.3-4.6L16.8 3.8z"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                            </svg>
                            {t("edit")}
                          </button>
                          <button
                            type="button"
                            className="secondary-button danger"
                            onClick={() => onDeleteEntry(entry.id)}
                            aria-label={t("removeHistoryEntry")}
                            title={t("delete")}
                          >
                            <svg
                              className="btn-icon"
                              viewBox="0 0 24 24"
                              aria-hidden="true"
                            >
                              <path
                                d="M5 7h14M9 7V4h6v3M7 7l1 13h8l1-13"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                fill="none"
                              />
                            </svg>
                            {t("delete")}
                          </button>
                        </span>
                        {editingEntry === entry.id && (
                          <span className="history-editor">
                            <input
                              autoFocus
                              type="number"
                              value={draftDelta}
                              onChange={(event) =>
                                onDraftDeltaChange(event.target.value)
                              }
                              aria-label={t("editHistoryDelta")}
                            />
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={onSaveEdit}
                            >
                              {t("save")}
                            </button>
                            <button
                              type="button"
                              className="secondary-button"
                              onClick={onCancelEdit}
                            >
                              {t("cancel")}
                            </button>
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </section>
            );
          })}
        </div>
      )}
    </section>
  );
}
