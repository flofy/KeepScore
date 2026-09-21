import type { Game, Player, ScoreEntry } from "../../domain/game/types";

const PORTABLE_GAMES_FORMAT = "keepscore";
const PORTABLE_GAMES_VERSION = 1;

type PortableGames = {
  format: typeof PORTABLE_GAMES_FORMAT;
  version: typeof PORTABLE_GAMES_VERSION;
  exportedAt: number;
  games: Game[];
};

export function exportGames(games: Game[]): string {
  return JSON.stringify(
    {
      format: PORTABLE_GAMES_FORMAT,
      version: PORTABLE_GAMES_VERSION,
      exportedAt: Date.now(),
      games,
    } satisfies PortableGames,
    null,
    2,
  );
}

function isPlayer(value: unknown): value is Player {
  if (!value || typeof value !== "object") return false;
  const player = value as Record<string, unknown>;
  return (
    typeof player.id === "string" &&
    typeof player.name === "string" &&
    typeof player.score === "number" &&
    Number.isFinite(player.score)
  );
}

function isScoreEntry(value: unknown): value is ScoreEntry {
  if (!value || typeof value !== "object") return false;
  const entry = value as Record<string, unknown>;
  return (
    typeof entry.id === "string" &&
    typeof entry.playerId === "string" &&
    typeof entry.delta === "number" &&
    Number.isFinite(entry.delta) &&
    typeof entry.timestamp === "number" &&
    Number.isFinite(entry.timestamp)
  );
}

function isGame(value: unknown): value is Game {
  if (!value || typeof value !== "object") return false;
  const game = value as Record<string, unknown>;
  return (
    typeof game.id === "string" &&
    (game.name === undefined || typeof game.name === "string") &&
    Array.isArray(game.players) &&
    game.players.every(isPlayer) &&
    Array.isArray(game.history) &&
    game.history.every(isScoreEntry) &&
    typeof game.createdAt === "number" &&
    Number.isFinite(game.createdAt) &&
    typeof game.updatedAt === "number" &&
    Number.isFinite(game.updatedAt)
  );
}

export function importGames(json: string): Game[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(json);
  } catch {
    throw new Error("The selected file is not valid JSON.");
  }

  if (!parsed || typeof parsed !== "object")
    throw new Error("The selected file has an invalid format.");
  const data = parsed as Record<string, unknown>;
  if (data.format !== PORTABLE_GAMES_FORMAT)
    throw new Error("This file is not a KeepScore export.");
  if (data.version !== PORTABLE_GAMES_VERSION)
    throw new Error("This export version is not supported.");
  if (!Array.isArray(data.games) || !data.games.every(isGame))
    throw new Error("The exported games are invalid.");

  return data.games;
}
