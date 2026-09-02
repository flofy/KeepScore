export type Player = {
  id: string
  name: string
  score: number
  color?: string
}

export type ScoreEntry = {
  id: string
  playerId: string
  delta: number
  timestamp: number
}

export type Game = {
  id: string
  name?: string
  players: Player[]
  history: ScoreEntry[]
  createdAt: number
  updatedAt: number
}
