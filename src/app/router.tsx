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
  // Capacitor serves the bundled app from its local origin root. A relative
  // Vite base ("./") is valid for asset URLs, but not for React Router's basename.
  const basename =
    import.meta.env.VITE_CAPACITOR === "true"
      ? "/"
      : import.meta.env.BASE_URL;

  return createBrowserRouter(createAppRouteObjects(components), { basename });
}
