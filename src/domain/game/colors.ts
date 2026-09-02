export const PLAYER_COLORS = [
  '#38bdf8',
  '#f87171',
  '#4ade80',
  '#facc15',
  '#c084fc',
  '#fb923c',
  '#2dd4bf',
  '#f472b6',
] as const

export function colorForIndex(index: number): string {
  return PLAYER_COLORS[index % PLAYER_COLORS.length]
}
