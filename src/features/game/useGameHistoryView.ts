import { useEffect, useState } from "react";
import { findPreset } from "../../domain/game/presets";
import type { Game } from "../../domain/game/types";
import type { GameAction } from "../../domain/game/gameReducer";
import type { HistoryGrouping } from "../../domain/game/types";

export function useGameHistoryView({
  game,
  dispatch,
}: {
  game: Game;
  dispatch: (action: GameAction) => void;
}) {
  const [editingEntry, setEditingEntry] = useState<string | null>(null);
  const [draftDelta, setDraftDelta] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyFlipped, setHistoryFlipped] = useState(false);
  const [historyGrouping, setHistoryGrouping] = useState<HistoryGrouping>(
    () =>
      findPreset(game.presetId ?? "default")?.defaultHistoryGrouping ?? "round",
  );

  useEffect(() => {
    document.body.style.overflow = historyOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [historyOpen]);

  const beginEdit = (id: string, delta: number) => {
    setEditingEntry(id);
    setDraftDelta(String(delta));
  };

  const saveEdit = () => {
    if (!editingEntry) return;
    const delta = Number(draftDelta);
    if (Number.isFinite(delta) && delta !== 0) {
      dispatch({ type: "EDIT_HISTORY_ENTRY", entryId: editingEntry, delta });
    }
    setEditingEntry(null);
  };

  const openHistory = () => setHistoryOpen(true);

  const closeHistory = () => setHistoryOpen(false);

  const cancelEdit = () => setEditingEntry(null);

  const deleteEntry = (entryId: string) => {
    dispatch({ type: "DELETE_HISTORY_ENTRY", entryId });
  };

  return {
    editingEntry,
    draftDelta,
    historyOpen,
    historyFlipped,
    historyGrouping,
    setHistoryGrouping,
    setHistoryFlipped,
    setDraftDelta,
    beginEdit,
    saveEdit,
    openHistory,
    closeHistory,
    cancelEdit,
    deleteEntry,
  };
}
