export type GamePreset = {
  id: string
  name: string
  emoji: string
  startingScore: number
}

export const GAME_PRESETS: GamePreset[] = [
  { id: 'default', name: 'Default', emoji: '🎲', startingScore: 0 },
  { id: 'star-realms', name: 'Star Realms', emoji: '🚀', startingScore: 20 },
  { id: 'munchkin', name: 'Munchkin', emoji: '🗡️', startingScore: 1 },
]

export function findPreset(id: string): GamePreset | undefined {
  return GAME_PRESETS.find((preset) => preset.id === id)
}
