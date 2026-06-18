# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Running the game

No build step. Open directly or serve statically:

```bash
python3 -m http.server 8000   # then open http://localhost:8000
```

## Architecture

Three files; no dependencies, no bundler.

- **`index.html`** — DOM structure: `<canvas id="board">` (300×600 px), a sidebar panel with score/lines/level/next-piece preview (`<canvas id="next-canvas">`), and a shared overlay div for PAUSE and GAME OVER states.
- **`style.css`** — dark/retro aesthetic; no game logic.
- **`game.js`** — all game logic (~300 lines, `'use strict'`).

### game.js key concepts

**State**: mutable globals — `board` (2-D array `ROWS×COLS`, `0` = empty, `1–7` = piece color index), `current` / `next` (piece objects with `{type, shape, x, y}`), plus `score`, `lines`, `level`, `paused`, `gameOver`, `dropAccum`, `dropInterval`, `animId`.

**Game loop**: `requestAnimationFrame`-based `loop(ts)`. Accumulates `dropAccum`; when it exceeds `dropInterval`, the piece drops one row or locks.

**Piece locking flow**: `lockPiece()` → `merge()` (writes piece into board) → `clearLines()` → `spawn()` (promotes `next` to `current`, detects game over if new piece immediately collides).

**Rotation**: `rotateCW(shape)` = transpose + reverse rows. `tryRotate()` attempts wall kicks at offsets `[0, -1, 1, -2, 2]`.

**Ghost piece**: `ghostY()` projects the current piece straight down; drawn at `globalAlpha = 0.2`.

**Speed**: `dropInterval = Math.max(100, 1000 − (level − 1) × 90)` ms. Level increments every 10 lines.

**Scoring**: `LINE_SCORES = [0, 100, 300, 500, 800]` × level; soft drop +1/row, hard drop +2/cell fallen.

### Tunable constants (top of game.js)

| Constant | Default | Note |
|---|---|---|
| `COLS` / `ROWS` | 10 / 20 | Also update canvas `width`/`height` in `index.html` |
| `BLOCK` | 30 px | Cell size in pixels |
| `COLORS` | 7 colors | Index 1–7 maps to piece types I–L |
| `LINE_SCORES` | `[0,100,300,500,800]` | Points per 1–4 cleared lines |
