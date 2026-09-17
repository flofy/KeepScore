import type { ReactElement } from "react";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { routes } from "./routes";
import { RouteErrorBoundary } from "./RouteErrorBoundary";

type RouteComponents = {
  home: ReactElement;
  setup: ReactElement;
  chwatzi: ReactElement;
  game: ReactElement;
  saved: ReactElement;
};

export function createAppRouteObjects(
  components: RouteComponents,
): RouteObject[] {
  return [
    {
      path: routes.home(),
      element: components.home,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: routes.setup(),
      element: components.setup,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: "/chwatzi",
      element: components.chwatzi,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: "/game",
      element: components.game,
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: routes.saved(),
      element: components.saved,
      errorElement: <RouteErrorBoundary />,
    },
  ];
}

export function createAppRouter(components: RouteComponents) {
  return createBrowserRouter(createAppRouteObjects(components), {
    basename: import.meta.env.BASE_URL,
  });
}
