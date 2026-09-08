export const routes = {
  home: () => '/',
  setup: () => '/setup',
  chwatzi: (playerCount: number) => `/chwatzi?players=${String(playerCount)}`,
  game: (gameId: string) => `/game?gameId=${encodeURIComponent(gameId)}`,
  saved: () => '/saved',
} as const;
