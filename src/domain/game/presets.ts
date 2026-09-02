export type GamePreset = {
  id: string
  name: string
  emoji: string
  startingScore: number
}

export const GAME_PRESETS: GamePreset[] = [
  { id: 'custom', name: 'Custom', emoji: '🎲', startingScore: 0 },
  { id: 'star-realms', name: 'Star Realms', emoji: '🚀', startingScore: 20 },
  { id: 'magic', name: 'Magic: The Gathering', emoji: '🧙', startingScore: 20 },
  { id: 'pokemon', name: 'Pokémon', emoji: '⚡', startingScore: 200 },
  { id: 'seven-wonders', name: '7 Wonders', emoji: '🏛️', startingScore: 0 },
  { id: 'trivial-pursuit', name: 'Trivial Pursuit', emoji: '❓', startingScore: 0 },
  { id: 'munchkin', name: 'Munchkin', emoji: '🗡️', startingScore: 10 },
]

export function findPreset(id: string): GamePreset | undefined {
  return GAME_PRESETS.find((preset) => preset.id === id)
}
