import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import inspect from "vite-plugin-inspect";

function getBuildId(): string {
  if (process.env.GITHUB_SHA) return process.env.GITHUB_SHA;

  try {
    return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
  } catch {
    return "dev";
  }
}

/**
 * Les fichiers de public/ sont copiés tels quels dans dist/ par Vite, en dehors
 * du bundle rollup : on remplace donc le placeholder __BUILD_ID__ après la
 * copie (closeBundle), pour que chaque déploiement ait un cache SW unique.
 */
function serviceWorkerVersion(): Plugin {
  let outDir = "dist";
  return {
    name: "keepscore-service-worker-version",
    apply: "build",
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      const target = path.resolve(outDir, "sw.js");
      if (!existsSync(target)) return;
      const buildId = getBuildId();
      writeFileSync(
        target,
        readFileSync(target, "utf8").replaceAll("__BUILD_ID__", buildId),
      );
    },
  };
}

export default defineConfig(({ mode }) => ({
  // Capacitor serves the packaged app from its local origin root. Keep the
  // existing deployment bases for GitHub Pages and Netlify.
  base: process.env.CAPACITOR
    ? "/"
    : process.env.NETLIFY
      ? "/"
      : "/KeepScore/",
  plugins: [
    react(),
    serviceWorkerVersion(),
    // Le plugin inspect n'est utile que pour `pnpm run inspect`
    ...(mode === "inspect" ? [inspect({ build: true })] : []),
  ],
}));
