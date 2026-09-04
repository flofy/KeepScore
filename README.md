# KeepScore

A modern, mobile-first SPA/PWA inspired by [KeepScore](https://github.com/nolanlawson/KeepScore).

## Status

🚧 Early development — the core scoring flow works; persistence, history and multi-game support are in place.

## Vision

A fast, offline-first score keeper designed for playing tabletop and card games on a phone.

## Features

- **Fast score entry** — large touch-friendly +/− buttons, quick deltas (+5/+10/+15/+20), long-press shortcuts
- **Multiple players and games** — from 2 to many, with per-player color and name
- **Duo mode** — two-player landscape layout for face-to-face play, with flip/rotate support
- **Undo/redo and complete score history** — edit or delete any move
- **Local-first persistence** — games are saved in IndexedDB/localStorage, no account needed
- **Fullscreen mode** — distraction-free card display
- **i18n** — Français / English, switchable from the burger menu
- **Installable PWA** — install it on your phone home screen
- **Export/Import** — backup and restore your games as JSON

## Game flow

1. **Configure** a game name (optional) and add players (2+ minimum)
2. **Score** by tapping `+1` / `−1`, using quick deltas, or long-pressing for +2/+3/−2/−3
3. **Tap the score** to jump to any number; use the history to review/undo moves
4. **Flip** a player card (180°) when playing face-to-face on a table
5. **Finish** and start a new game, or save and resume later

## Development

Built with **React + TypeScript + Vite**. Styling is hand-written CSS (no framework) with a mobile-first approach.

```bash
npm install
npm run dev       # development server
npm run build     # production build (tsc + vite)
npm run test      # run tests
```

## Architecture

- `src/domain/game` — pure domain logic (reducer, history, factory), independent from React
- `src/ui` — React components (App, GameSetup, SavedGames, i18n, etc.)
- `src/infrastructure` — persistence (gameRepository) and portability (export/import)
- A game is a list of **players** plus an **append-only score history**; every non-zero move creates a history entry
