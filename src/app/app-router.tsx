import {
  ChwatziRoute,
  GameRoute,
  GameSetupRoute,
  RouteShell,
  SavedGamesRoute,
  StartScreenRoute,
} from './route-wrappers';
import { createAppRouter } from './router';

export const router = createAppRouter({
  home: <RouteShell showBack={false}><StartScreenRoute /></RouteShell>,
  setup: <RouteShell><GameSetupRoute /></RouteShell>,
  chwatzi: <RouteShell><ChwatziRoute /></RouteShell>,
  game: <RouteShell><GameRoute /></RouteShell>,
  saved: <RouteShell><SavedGamesRoute /></RouteShell>,
});
