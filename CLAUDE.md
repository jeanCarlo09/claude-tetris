# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Vanilla-JS implementation of classic Tetris using the HTML5 Canvas 2D API. No dependencies, no `package.json`, no build/transpile step — three files (`index.html`, `style.css`, `game.js`) that run directly in a browser. UI text and README are in Spanish.

## Running

Open `index.html` directly, or serve statically (recommended, avoids file:// quirks):

```bash
python3 -m http.server 8000    # then open http://localhost:8000
```

There is no test suite, linter, or build. Verify changes by loading the page in a browser and playing.

## Architecture

All game logic lives in `game.js` (~300 lines, single global scope, `'use strict'`). Key structural points that span the code:

- **Board model**: `board` is a `ROWS × COLS` matrix. Each cell holds `0` (empty) or a color index `1–7` that identifies the piece type. `COLORS` and `PIECES` are 1-indexed arrays (index `0` is `null`) so a cell value doubles as both the piece id and the color/shape lookup key.
- **Pieces**: square matrices in `PIECES`. Rotation is a transpose-and-reverse (`rotateCW`); `tryRotate` applies basic wall kicks by testing horizontal offsets `[0,-1,1,-2,2]` before giving up on a rotation.
- **Collision** (`collide`) is the single gatekeeper — movement, rotation, soft/hard drop, and ghost projection all call it with a candidate shape + offset rather than mutating state first.
- **Game loop** (`loop`): `requestAnimationFrame`-driven; accumulates `dropAccum` and drops one row when it exceeds `dropInterval`. Locking a piece (`lockPiece` → `merge` + `clearLines` + `spawn`) happens both from the loop and from drop actions.
- **State transitions**: `spawn` sets `current = next`, generates a new `next`, and calls `endGame()` if the fresh piece already collides. `init()` resets everything and is also the restart handler.
- **Scoring/leveling** live in `clearLines`: `LINE_SCORES × level`, level rises every 10 lines, and `dropInterval = max(100, 1000 - (level-1)*90)`.

`draw()` renders grid → locked board → ghost piece (`globalAlpha 0.2`) → current piece each frame; `drawNext` renders the preview on a separate canvas.

## Gotchas

- Canvas dimensions are hardcoded in `index.html` (`board` = 300×600, `next-canvas` = 120×120). If you change `COLS`, `ROWS`, or `BLOCK` in `game.js`, update the `<canvas width/height>` attributes to match (`COLS*BLOCK × ROWS*BLOCK`), or rendering will be misaligned/clipped.
- `game.js` depends on specific DOM element IDs (`board`, `next-canvas`, `score`, `lines`, `level`, `combo`, `overlay`, `overlay-title`, `overlay-score`, `overlay-records`, `restart-btn`, `name-form`, `name-input`, `start-screen`, `start-records`, `play-btn`, `reset-records-btn`, `theme-toggle`). Renaming in HTML requires matching updates in the `getElementById` calls at the top of `game.js`.
- `localStorage` keys: `tetris-records` (top 5), `tetris-last-name`, `tetris-theme`. `loadRecords()` sanitizes/sorts/truncates on every read, so corrupt or hand-edited data degrades to `[]` instead of throwing.
