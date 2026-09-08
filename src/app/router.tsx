import type { ReactElement } from 'react';
import { createBrowserRouter, type RouteObject } from 'react-router-dom';
import { routes } from './routes';

type RouteComponents = {
  home: ReactElement;
  setup: ReactElement;
  chwatzi: ReactElement;
  game: ReactElement;
  saved: ReactElement;
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
