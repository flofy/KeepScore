import type { ReactElement } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { routes } from './routes';

type RouteComponents = {
  home: ReactElement;
  setup: ReactElement;
  chwatzi: ReactElement;
  game: ReactElement;
  saved: ReactElement;
};

/**
 * Builds the application router from screen route elements.
 *
 * Keeping the route composition here lets the application layer own the
 * router while feature-specific route wrappers can be extracted incrementally.
 */
export function createAppRouter(components: RouteComponents) {
  return createBrowserRouter(
    [
      { path: routes.home(), element: components.home },
      { path: routes.setup(), element: components.setup },
      { path: '/chwatzi', element: components.chwatzi },
      { path: '/game', element: components.game },
      { path: routes.saved(), element: components.saved },
    ],
    { basename: import.meta.env.BASE_URL },
  );
}
