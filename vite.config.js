import { execSync } from "node:child_process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
function getBuildId() {
    if (process.env.GITHUB_SHA)
        return process.env.GITHUB_SHA;
    try {
        return execSync("git rev-parse HEAD", { encoding: "utf8" }).trim();
    }
    catch {
        return "dev";
    }
}
function serviceWorkerVersion() {
    const buildId = getBuildId();
    return {
        name: "keepscore-service-worker-version",
        generateBundle(_options, bundle) {
            const asset = bundle["sw.js"];
            if (!asset || asset.type !== "asset")
                return;
            asset.source = String(asset.source).replaceAll("__BUILD_ID__", buildId);
        },
    };
}
export default defineConfig({
    // GitHub Pages serves the app from /KeepScore/, while Netlify serves it from /
    base: process.env.NETLIFY ? "/" : "/KeepScore/",
    plugins: [react(), serviceWorkerVersion()],
});
