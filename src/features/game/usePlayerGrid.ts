import { useEffect, useState } from "react";

export type PlayerGridLayout = "auto" | "1" | "2" | "3" | "4";

const STORAGE_KEY = "keepscore-player-grid-layout";

function isPlayerGridLayout(value: string | null): value is PlayerGridLayout {
  return (
    value === "auto" ||
    value === "1" ||
    value === "2" ||
    value === "3" ||
    value === "4"
  );
}

function getInitialPlayerGridLayout(): PlayerGridLayout {
  if (typeof window === "undefined") return "auto";
  const stored = window.localStorage.getItem(STORAGE_KEY);
  return isPlayerGridLayout(stored) ? stored : "auto";
}

export function getPlayerGridColumns(
  layout: PlayerGridLayout,
  playerCount: number,
): number {
  if (layout !== "auto") return Number(layout);
  if (playerCount <= 2) return 1;
  return Math.min(4, Math.max(2, Math.ceil(playerCount / 2)));
}

export function usePlayerGrid() {
  const [layout, setLayoutState] = useState<PlayerGridLayout>(
    getInitialPlayerGridLayout,
  );

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, layout);
  }, [layout]);

  return { layout, setLayout: setLayoutState };
}
