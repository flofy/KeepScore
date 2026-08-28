import type { Game } from '../../domain/game/types'

const STORAGE_KEY = 'keepscore.games'

export interface GameRepository {
  list(): Game[]
  get(id: string): Game | undefined
  save(game: Game): void
  remove(id: string): void
}

function readGames(): Game[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Game[]) : []
  } catch {
    return []
  }
}

function writeGames(games: Game[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games))
}

export const localGameRepository: GameRepository = {
  list: () => readGames().sort((a, b) => b.updatedAt - a.updatedAt),
  get: (id) => readGames().find((game) => game.id === id),
  save: (game) => {
    const games = readGames().filter((candidate) => candidate.id !== game.id)
    writeGames([game, ...games])
  },
  remove: (id) => writeGames(readGames().filter((game) => game.id !== id)),
}
