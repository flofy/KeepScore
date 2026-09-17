import type { ScoreEntry } from "../domain/game/types";

export type HistoryGrouping = "round" | "player";

export type HistoryGroup = {
  key: string;
  round: number;
  entries: ScoreEntry[];
};

export function groupHistory(
  history: ScoreEntry[],
  grouping: HistoryGrouping,
): HistoryGroup[] {
  if (grouping === "player") {
    const groups = new Map<string, HistoryGroup>();

    for (const entry of history) {
      const existing = groups.get(entry.playerId);
      if (existing) {
        existing.entries.push(entry);
        continue;
      }

      groups.set(entry.playerId, {
        key: entry.playerId,
        round: 0,
        entries: [entry],
      });
    }

    return [...groups.values()];
  }

  const roundByPlayer = new Map<string, number>();
  const rounds = new Map<number, ScoreEntry[]>();

  for (const entry of history) {
    const round = (roundByPlayer.get(entry.playerId) ?? 0) + 1;
    roundByPlayer.set(entry.playerId, round);

    const entries = rounds.get(round);
    if (entries) {
      entries.push(entry);
    } else {
      rounds.set(round, [entry]);
    }
  }

  return [...rounds.entries()].map(([round, entries]) => ({
    key: `round-${round}`,
    round,
    entries,
  }));
}
