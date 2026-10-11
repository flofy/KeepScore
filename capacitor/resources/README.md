# Android app assets (Capacitor)

SVG sources for the Android launcher icons and splash screens.

- `icon.svg` — full legacy icon (rounded square)
- `icon-foreground.svg` — adaptive icon foreground layer (transparent, glyph in the adaptive safe zone)
- `icon-background.svg` — adaptive icon background layer (full-bleed gradient)
- `splash.svg` — splash screen logo (transparent)
- `splash-background.svg` — splash screen background

The `Android Capacitor` workflow rasterizes these sources with sharp into
`capacitor/assets/` (via `.github/scripts/rasterize-native-assets.mjs`), then
runs `@capacitor/assets generate` to produce all mipmap densities and splash
images inside the generated `capacitor/android/` project. No PNG is committed.

The PWA uses its own copies in `public/` (`icon.svg` and `icon-maskable.svg`).
Keep the glyph design in sync when editing one of the sets.
