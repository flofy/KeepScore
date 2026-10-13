export const routes = {
  home: () => "/",
  setup: () => "/setup",
  chwatzi: () => "/chwatzi",
  quixscore: () => "/quixscore",
  game: (gameId: string) => `/game?gameId=${encodeURIComponent(gameId)}`,
  saved: () => "/saved",
} as const;
