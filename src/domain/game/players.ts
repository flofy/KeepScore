/** Prefilled placeholder names shown in every new game setup. */
export const DEFAULT_PLAYER_NAMES = ["Player 1", "Player 2"] as const;

/** Fallback label for a newly added player slot (0-based index). */
export function defaultPlayerName(index: number): string {
  return "Player " + (index + 1);
}
