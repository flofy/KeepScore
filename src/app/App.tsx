import { RouterProvider } from "react-router-dom";
import { router } from "./app-router";
import "../ui/saved-games.css";
import "../ui/chwatzi.css";
import "../ui/start.css";

export function App() {
  return <RouterProvider router={router} />;
}
