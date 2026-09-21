import type { HistoryGrouping } from "./types";

type GamePreset = {
  id: string;
  name: string;
  emoji: string;
  startingScore: number;
  defaultHistoryGrouping: HistoryGrouping;
  workflowId?: "munchkin";
};

export const GAME_PRESETS: GamePreset[] = [
  {
    id: "default",
    name: "Default",
    emoji: "🎲",
    startingScore: 0,
    defaultHistoryGrouping: "round",
  },
  {
    id: "star-realms",
    name: "Star Realms",
    emoji: "🚀",
    startingScore: 20,
    defaultHistoryGrouping: "round",
  },
  {
    id: "munchkin",
    name: "Munchkin",
    emoji: "🗡️",
    startingScore: 1,
    defaultHistoryGrouping: "player",
    workflowId: "munchkin",
  },
];

export function findPreset(id: string): GamePreset | undefined {
  return GAME_PRESETS.find((preset) => preset.id === id);
}
