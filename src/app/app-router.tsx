import {
  ChwatziRoute,
  GameRoute,
  GameSetupRoute,
  RouteShell,
  SavedGamesRoute,
  StartScreenRoute,
} from "./route-wrappers";
import { createAppRouter } from "./router";

export const router = createAppRouter({
  home: (
    <RouteShell showBack={false}>
      <StartScreenRoute />
    </RouteShell>
  ),
  setup: (
    <RouteShell showBack={false}>
      <GameSetupRoute />
    </RouteShell>
  ),
  chwatzi: (
    <RouteShell showBack={false}>
      <ChwatziRoute />
    </RouteShell>
  ),
  game: (
    <RouteShell showBack={false}>
      <GameRoute />
    </RouteShell>
  ),
  saved: (
    <RouteShell showBack={false}>
      <SavedGamesRoute />
    </RouteShell>
  ),
});
