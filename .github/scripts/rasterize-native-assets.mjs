import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

/*
 * Rasterizes the SVG icon/splash sources from capacitor/resources/ into the
 * PNG assets expected by @capacitor/assets (written to capacitor/assets/).
 * sharp is installed ad hoc by the Android CI workflow (.asset-tools/), so the
 * project dependencies stay untouched.
 */

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const require = createRequire(path.join(rootDir, ".asset-tools", "index.cjs"));
const sharp = require("sharp");

const resourcesDir = path.join(rootDir, "capacitor", "resources");
const outputDir = path.join(rootDir, "capacitor", "assets");

const targets = [
  { svg: "icon.svg", sourceSize: 512, out: "icon.png", size: 1024 },
  {
    svg: "icon-foreground.svg",
    sourceSize: 512,
    out: "icon-foreground.png",
    size: 1024,
  },
  {
    svg: "icon-background.svg",
    sourceSize: 512,
    out: "icon-background.png",
    size: 1024,
  },
  { svg: "splash.svg", sourceSize: 2732, out: "splash.png", size: 2732 },
  {
    svg: "splash-background.svg",
    sourceSize: 2732,
    out: "splash-background.png",
    size: 2732,
  },
];

await mkdir(outputDir, { recursive: true });

for (const target of targets) {
  const density = Math.ceil((target.size * 72) / target.sourceSize);
  const source = await readFile(path.join(resourcesDir, target.svg));
  await sharp(source, { density })
    .resize(target.size, target.size)
    .png()
    .toFile(path.join(outputDir, target.out));
  console.log(`Generated ${target.out} (${target.size}x${target.size})`);
}
