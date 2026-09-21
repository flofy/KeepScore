import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: [
      "node_modules",
      "dist",
      "e2e",
      "test-results",
      "playwright-report",
    ],
    coverage: {
      provider: "v8",
      // La couverture unitaire mesure la logique pure (domaine + infrastructure).
      // Les composants UI (src/ui, src/features, src/app) sont couverts par les
      // tests e2e Playwright (`pnpm run test:e2e`).
      include: ["src/domain/**", "src/infrastructure/**"],
      reporter: ["text", "json", "html"],
      // Seuils alignés sur la couverture actuelle (81,7 % lignes, 67,5 % branches
      // avec le remapping v8 de Vitest 4, plus strict qu'en Vitest 1).
      // À re-relever au fur et à mesure des nouveaux tests.
      thresholds: {
        lines: 80,
        functions: 90,
        branches: 65,
        statements: 72,
      },
    },
    environment: "jsdom",
    globals: true,
  },
});
