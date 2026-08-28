import type { Game } from '../../domain/game/types'

const STORAGE_KEY = 'keepscore.games.v1'

export interface GameRepository {
  list(): Game[]
  get(id: string): Game | undefined
  save(game: Game): void
  remove(id: string): void
}

function readGames(): Game[] {
  if (typeof localStorage === 'undefined') return []
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
  save: (game) => writeGames([game, ...readGames().filter((candidate) => candidate.id !== game.id)]),
  remove: (id) => writeGames(readGames().filter((game) => game.id !== id)),
}
