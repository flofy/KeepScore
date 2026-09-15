export type MunchkinStats = {
  level: number;
  equipmentBonus: number;
};

export type Player = {
  id: string;
  name: string;
  score: number;
  color?: string;
  munchkin?: MunchkinStats;
};

export type ScoreEntry = {
  id: string;
  playerId: string;
  delta: number;
  timestamp: number;
};

export type Game = {
  id: string;
  name?: string;
  presetId?: string;
  players: Player[];
  history: ScoreEntry[];
  createdAt: number;
  updatedAt: number;
  startingPlayerId?: string;
};
