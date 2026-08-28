# Game flow

## Current flow

1. Open KeepScore.
2. Configure a game name (optional).
3. Add or remove players (minimum: 2).
4. Start the game.
5. Change scores with large touch-friendly controls.
6. Rename players directly from the score screen.
7. Start a new game when finished.

## Domain rules

- A game must contain at least two players.
- Blank player names fall back to `Player N` when creating a game.
- Blank names are ignored when renaming an existing player.
- Every non-zero score change creates a history entry.
- Scores may be positive or negative.

## Next step

Persistence and undo/redo should be implemented around the game state rather than in UI components. This keeps the domain reducer deterministic and makes local storage replaceable by another repository later.
