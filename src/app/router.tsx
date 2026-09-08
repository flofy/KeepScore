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

/**
 * Builds the application route objects from screen route elements.
 *
 * Keeping route composition separate from the browser router makes the
 * application routing contract easy to test without requiring a DOM.
 */
export function createAppRouteObjects(components: RouteComponents): RouteObject[] {
  return [
    { path: routes.home(), element: components.home },
    { path: routes.setup(), element: components.setup },
    { path: '/chwatzi', element: components.chwatzi },
    { path: '/game', element: components.game },
    { path: routes.saved(), element: components.saved },
  ];
}

/**
 * Builds the application router from screen route elements.
 *
 * Keeping the router in the application layer lets feature-specific route
 * wrappers be extracted incrementally.
 */
export function createAppRouter(components: RouteComponents) {
  return createBrowserRouter(createAppRouteObjects(components), {
    basename: import.meta.env.BASE_URL,
  });
}
