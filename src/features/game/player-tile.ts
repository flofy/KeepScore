export type PlayerTileOrientation = "horizontal" | "vertical";

/** Returns the logical tile orientation for a quarter-turn rotation. */
export function getPlayerTileOrientation(
  rotation: number,
): PlayerTileOrientation {
  return Math.abs(rotation) % 180 === 90 ? "vertical" : "horizontal";
}
