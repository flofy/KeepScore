import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { routes } from './routes';
import {
  ChwatziRoute,
  GameRoute,
  GameSetupRoute,
  RouteShell,
  SavedGamesRoute,
  StartScreenRoute,
} from './route-wrappers';

type RouteComponents = {
  home: React.ReactElement;
  setup: React.ReactElement;
  chwatzi: React.ReactElement;
  game: React.ReactElement;
  saved: React.ReactElement;
};

export function createAppRouteObjects(components: RouteComponents): RouteObject[] {
  return [
    { path: routes.home(), element: components.home },
    { path: routes.setup(), element: components.setup },
    { path: '/chwatzi', element: components.chwatzi },
    { path: '/game', element: components.game },
    { path: routes.saved(), element: components.saved },
  ];
}

export function createAppRouter(components: RouteComponents) {
  return createBrowserRouter(createAppRouteObjects(components), {
    basename: import.meta.env.BASE_URL,
  });
}

export const router = createAppRouter({
  home: <RouteShell showBack={false}><StartScreenRoute /></RouteShell>,
  setup: <RouteShell><GameSetupRoute /></RouteShell>,
  chwatzi: <RouteShell><ChwatziRoute /></RouteShell>,
  game: <RouteShell><GameRoute /></RouteShell>,
  saved: <RouteShell><SavedGamesRoute /></RouteShell>,
});
