export type HistoryGrouping = "round" | "player";

export type WorkflowPhase = "setup" | "turn" | "event" | "finished";

export type WorkflowAction =
  | { type: "START"; playerId: string }
  | { type: "NEXT_PLAYER"; playerId: string }
  | { type: "OPEN_EVENT" }
  | { type: "CLOSE_EVENT" }
  | { type: "FINISH" };

export type MunchkinGender = "male" | "female";

export type MunchkinStats = {
  level: number;
  equipmentBonus: number;
  gender?: MunchkinGender;
};

type CombatState = {
  monsterLevel: number;
  helperIds: string[];
  rewardLevels: number;
  rewardTreasures: number;
};

export type MunchkinContext = { combat: CombatState | null };

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
