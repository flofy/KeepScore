export const routes = {
  home: () => "/",
  setup: () => "/setup",
  chwatzi: () => "/chwatzi",
  game: (gameId: string) => `/game?gameId=${encodeURIComponent(gameId)}`,
  saved: () => "/saved",
} as const;
