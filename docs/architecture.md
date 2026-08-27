# Architecture

## Principles

- Domain logic is independent from React.
- A game is represented by players plus an append-only score history.
- UI state should remain thin; business rules belong in `src/domain`.
- Persistence will be local-first (IndexedDB) and added without coupling the domain to browser APIs.
- The SPA should remain usable offline and be installable as a PWA.

## Planned structure

```text
src/
├── domain/
│   ├── game/
│   └── statistics/
├── application/
├── infrastructure/
│   └── persistence/
└── ui/
```

## Roadmap

1. Core game model and score actions
2. Game creation and player editing
3. Undo/redo
4. Local persistence
5. PWA/offline support
6. Mobile gestures and polish
7. Saved games, history and import/export
