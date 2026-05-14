# Debug Report — Austin Battleship

## Overview

Austin Battleship is a browser-based, Austin-themed Battleship game where the player battles an AI opponent on a 12 × 12 board. Both fleets are made up of Austin landmarks (Texas Capitol, Congress Bats, Rainey Street, Lady Bird Paddleboard, Barton Springs, Rustic Tap, Zilker Kite). Ships obey strict no-overlap and no-touch rules — including diagonal corners — and the AI plays fairly: it never inspects the player's hidden state and only learns from the engine's hit / miss / sunk feedback.

## Testing Approach

- **Unit tests (Vitest, jsdom).** 25 specs in `src/tests/board.test.ts` cover the engine end-to-end (board construction, in-bounds checks, ship-cell math, neighbour lookup, placement validity including the no-touch rule, overlap rejection, removal, hit/miss/sunk, duplicate-shot rejection, `areAllShipsSunk` empty/partial/full, label formatting, and 25 random fleets that must obey the no-touch rule). 19 specs in `src/tests/ai.test.ts` cover hunt/target mode behaviour, including a full integration game vs `generateRandomFleet` and a 3 × 3 exhaustive run.
- **Manual placement testing.** Walked through every placement path in the browser: click-to-select-then-click-to-place, drag-and-drop from the dashboard, repositioning a placed ship by clicking it (lift + re-place), rotation via the card button + the `R` key, Randomize Fleet, Clear Fleet, and Start Battle gating.
- **Manual gameplay testing.** Played multiple full games to win, multiple to loss, plus a deliberate Surrender. Verified hit / miss / sunk visuals and messages, AI turn pacing (~850 ms), and that the AI never repeats shots even on a 3 × 3 stress board.
- **Build testing.** `npm run build` runs `tsc -b && vite build`; both must succeed with zero diagnostics. Verified after every phase.
- **Responsive UI testing.** Browser resize from 1920 px down to 360 px (iPhone SE width). Confirmed the desktop three-column shell collapses cleanly to a single column at ≤ 1100 px, and to compact mobile stacking at ≤ 700 px (status panel collapses, dashboard cards stack 1-up, VS badge shrinks, modal stats stack).

## Bugs Found and Fixed

### Bug 1: Diagonal touch slipped past the placement preview

- **Problem:** During manual placement, dropping a length-2 ship at a coord whose corner kissed an already-placed ship looked acceptable in the green/red preview, but `canPlaceShip` correctly refused the placement on click. The preview and the engine disagreed.
- **Cause:** The first version of the preview used `getShipCells` to compute the highlighted cells and treated overlap as the only invalidator. It never consulted the no-touch neighbour check that the engine applies in `canPlaceShip`.
- **Fix:** Drove the preview's `valid` flag from `canPlaceShip(candidateBoard, ship, coord, orientation)` directly, so the UI's red/green colour now matches the engine's verdict (including diagonal corners).
- **Verification:** Manually placed adjacent and diagonally adjacent ships; preview correctly turns red. The 25-iteration `generateRandomFleet obeys the no-touch rule` Vitest case continues to pass, exercising the same `canPlaceShip` path.

### Bug 2: Repositioning a placed ship was blocked by its own cells

- **Problem:** Clicking a placed ship to move it, then trying to re-drop it one cell over, always failed: every nearby coord reported "invalid placement". The ship couldn't be placed next to itself.
- **Cause:** `canPlaceShip` checked the *full* `playerBoard`, including the cells still occupied by the ship being moved. The no-touch rule then refused every candidate adjacent to those cells.
- **Fix:** Introduced a derived `candidateBoard = removeShip(playerBoard, activeShipId)` for the duration of the placement attempt. Both the preview and the eventual `placeShip` call run against the candidate board.
- **Verification:** Manually picked up and re-placed every ship one cell at a time; every legal move is now accepted, every illegal one (overlap with another ship, or diagonal touch with another ship) is correctly rejected.

### Bug 3: Sunk reporting fired one shot late

- **Problem:** The final hit on a ship reported `outcome: 'hit'` instead of `'sunk'`; the "You sank …" message and sunk styling appeared one tick later or not at all.
- **Cause:** `receiveShot` called `isShipSunk` against the *pre-update* board's `ships` array, before the new hit had been applied to the ship's `hits` mask.
- **Fix:** Restructured `receiveShot` to (a) compute the next ships array with the hit applied, (b) build `nextBoard`, then (c) call `isShipSunk(nextBoard, shipId)` to decide between `'hit'` and `'sunk'`.
- **Verification:** Vitest case `reports sunk when the final cell of a ship is hit` now passes. In gameplay, the message and the sunk styling both flip exactly on the killing shot.

### Bug 4: AI's target queue was wiped after every sink

- **Problem:** When the AI hit two different ships in alternating shots, sinking one of them sent the AI back into hunt mode even though the other ship was still wounded. The "smart" target mode was effectively cancelled prematurely.
- **Cause:** The first version of `updateAIMemory` cleared `targetQueue` unconditionally on `'sunk'`, deleting neighbours of unsunk hits along with the ones that belonged to the sunk ship.
- **Fix:** On `'sunk'`, remove only the sunk ship's cells from `activeHits`, then **rebuild** the queue from the remaining active hits' neighbours. If no active hits remain, only then clear the queue.
- **Verification:** Vitest case `keeps targeting unrelated active hits after a sink` covers exactly this scenario. The full-game integration test (`eventually sinks every ship without firing twice at the same cell`) confirms the AI sinks every ship in a real fleet.

### Bug 5: AI fired against a stale player board

- **Problem:** During quick gameplay the AI occasionally fired at a cell the player had just hit on a different ship, or its `lastShot` reflected the previous turn's player coord. Memory updates seemed off.
- **Cause:** The AI turn was triggered inside the player's click handler, reading `playerBoard` from the closure that captured the *previous* render's state — React hadn't yet committed the player's shot.
- **Fix:** Moved the AI turn into a `useEffect` keyed on `turn === 'ai' && phase === 'playing'`. The effect runs after the player's render commits, so it always sees the latest `playerBoard`.
- **Verification:** Played 5 full games end-to-end. Every AI shot lands on a cell that was empty at the moment the AI took its turn. The effect's cleanup (`clearTimeout`) also kills pending AI moves on phase changes.

### Bug 6: Game-over could trigger twice

- **Problem:** When the player's final shot sank the last enemy ship, the game-over modal appeared, but the AI then took an extra turn that fired on the player's already-final board, sometimes causing a double `setPhase('gameover')`.
- **Cause:** `setTurn('ai')` had already been called before the win check, scheduling an AI turn. The AI turn effect did not guard on `phase === 'playing'`.
- **Fix:** Added `phase !== 'playing'` early-outs at the top of the AI turn effect *and* in `handleEnemyCellClick`, plus the effect now clears `aiTimerRef.current` on every tear-down.
- **Verification:** Pressed the winning shot 10+ times; modal opens exactly once, AI never fires after victory. `setTimeout` is reliably cleaned up across phase transitions.

### Bug 7: Placement dashboard rendered twice

- **Problem:** During Phase 6 wiring, two stacked fleet dashboards briefly appeared in the bottom row.
- **Cause:** `Layout` mounted its own uncontrolled `PlacementDashboard`, while `App` rendered a controlled one as a sibling so it could pass placement state.
- **Fix:** Refactored `Layout` to take a `dashboard` slot prop. `App` injects the controlled instance; `Layout` no longer mounts its own.
- **Verification:** The DOM has exactly one `.placement-dashboard` element across all phases; the dashboard reflects every placement / sunk transition driven from `App`.

### Bug 8: Drag from a placed card always failed

- **Problem:** Dragging a card whose ship was already on the board reported every drop target as invalid.
- **Cause:** `canPlaceShip` saw the source ship still occupying its cells and refused every nearby coord (the same root cause as Bug 2, but on a different code path).
- **Fix:** Lift the ship off the board on `onDragStart` (and on `onSelect`) before any preview is computed. The shared `candidateBoard` derivation then handles both interaction styles.
- **Verification:** Dragged each ship to a new spot; every legal move places, every illegal one falls back to the source position. `onDragEnd` cleans up `draggingShipId` so a cancelled drag doesn't leave the UI in a half-state.

### Bug 9: Random-fleet generation could starve on long ships

- **Problem:** Occasionally, `generateRandomFleet` could fail to place the longest ship after pure random sampling.
- **Cause:** With a single-pass random placement and the strict no-touch rule, early random picks could fragment the 12 × 12 grid into pockets none of which had room for a length-5 ship.
- **Fix:** Added a per-ship retry budget (500 attempts) and an outer fleet-restart loop (50 fleets). If a ship can't be placed after 500 random tries, the entire fleet is rebuilt from scratch.
- **Verification:** Vitest case `places every Austin ship legally on a 12x12 board` runs reliably. The companion case loops 25 random fleets and verifies the no-touch rule for each. Manual Randomize Fleet button has been pressed 50+ times in the browser without failure.

### Bug 10: Repeat-shot bookkeeping inconsistencies

- **Problem:** Defensive code paths could double-count player shots, or leave the AI's `fired` matrix out of sync if the engine returned `'repeat'`.
- **Cause:** Two layered issues. (a) `receiveShot` originally cloned the board even on a repeat shot, breaking referential equality and ticking the cell into a new state. (b) `updateAIMemory` did not mark the cell as fired on `'repeat'` since the bit was already true, but it also didn't strip the coord from the queue.
- **Fix:** `receiveShot` now short-circuits on hit / miss cells and returns the original board reference with `outcome: 'repeat'`. `updateAIMemory` always marks `fired[r][c] = true` and removes the coord from `targetQueue` regardless of outcome. The player click handler also early-outs on repeats so stats don't increment.
- **Verification:** Vitest cases `safely ignores duplicate shots` and `marks repeat shots as fired without queueing` both pass. In gameplay, double-clicking a cell never advances the turn or AI memory.

### Bug 11: Hit pulse animation looked correct but only by coincidence

- **Problem:** During Phase 7, a CSS animation on `.cell-hit` worked as a one-shot effect, which is exactly what we wanted — but I wasn't sure why it didn't replay on every render.
- **Cause:** `animation:` plays once on element mount or on first paint with that class, and CSS does not re-trigger it when other props change. Cells use stable keys (`${row},${col}`), so React only swaps `className` on the existing DOM node — the animation plays exactly once when the class transitions from `cell-empty` → `cell-hit`.
- **Fix:** Confirmed the keying strategy and left the animation declarative. Documented the behaviour for future contributors.
- **Verification:** Stress-tested by clicking through a fast sequence of shots with React StrictMode on (which double-invokes effects); each hit animates exactly once when the cell first becomes a hit.

### Bug 12: KAW spinning badge swallowed clicks on adjacent controls

- **Problem:** The "Keep Austin Weird" rotating badge in the brand panel intercepted clicks on the rotate buttons of nearby ship cards.
- **Cause:** The badge defaulted to `pointer-events: auto`, and its 84 px circle sometimes overlapped the dashboard card area on tablet viewports.
- **Fix:** Set `pointer-events: none` on `.kaw-badge` since it is purely decorative.
- **Verification:** Resized to tablet width (~ 900 px), confirmed all rotate buttons remain clickable. The badge still rotates and is tabbed into focus only by its `aria-label` for screen readers.

## Final Test Results

- **Unit tests:** `npm test` — **44/44 passing** (`board.test.ts`: 25 cases; `ai.test.ts`: 19 cases including hunt/target mode, full-fleet integration, and a 3 × 3 exhaustive run).
- **Build:** `npm run build` — **clean** (`tsc -b && vite build`). Bundle: ~172 kB JS / 27 kB CSS.
- **Manual QA checklist** (✅ = verified):
  - ✅ Board is exactly 12 × 12 with rows A–L, columns 1–12.
  - ✅ All 7 Austin ships exist (`Texas Capitol 5`, `Congress Bats 4`, `Rainey Street 4`, `Lady Bird Paddleboard 3`, `Barton Springs 3`, `Rustic Tap 3`, `Zilker Kite 2`).
  - ✅ Player can place ships (click-to-place and drag-and-drop).
  - ✅ Ships cannot overlap.
  - ✅ Ships cannot touch directly (orthogonally adjacent).
  - ✅ Ships cannot touch diagonally (corner adjacent).
  - ✅ Ships cannot go off board.
  - ✅ Player can rotate ships (card button or `R` key).
  - ✅ Player can Randomize Fleet.
  - ✅ Player can Clear Fleet.
  - ✅ Begin Battle is disabled until all 7 ships are placed.
  - ✅ Enemy fleet is generated legally (no overlap, no touch).
  - ✅ Player can fire on the enemy board.
  - ✅ Duplicate player shots are blocked (UI guard + engine guard).
  - ✅ AI fires after the player.
  - ✅ Duplicate AI shots are blocked (Phase 3 invariant + tests).
  - ✅ Hits show correctly (red ✕ with pulse animation).
  - ✅ Misses show correctly (cream water-splash with rippling halo).
  - ✅ Sunk ships show correctly (deep crimson cells, sunk-flash animation, dashboard card transitions to `sunk`).
  - ✅ Win state works (gold medallion, "VICTORY!", stats, Play Again / Main Menu).
  - ✅ Loss state works (crimson medallion, "DEFEAT!", same controls).
  - ✅ Play Again preserves the player's layout, regenerates the enemy.
  - ✅ Surrender immediately ends the game with `winner: 'ai'`.
  - ✅ Restart (Main Menu) returns to placement with an empty player board.
  - ✅ `npm run test` passes.
  - ✅ `npm run build` passes.
  - ✅ UI matches the vintage Austin/Texas reference style (cream + navy + copper + burnt orange + gold; star-bracketed panel headers; KAW badge; compass VS medallion; worn-paper texture).

## Known Limitations

- The Austin skyline image at `public/assets/` is **not** committed — the production shell uses a CSS-rendered SVG silhouette so the app builds and runs without external assets. Drop a licensed photograph at `public/assets/austin-skyline.jpg` before public deployment and confirm the rights.
- The AI uses the Phase 3 hunt/target heuristic with checkerboard parity. It does **not** use probability-density targeting; a future phase could add it.
- Sound effects, music, and turn-by-turn battle log persistence are out of scope for this build.
- Multiplayer (online or hot-seat) is not implemented; this is single-player vs CPU only.
- `color-mix()` is used for some accent halos. It works in modern Chrome, Safari, Firefox; older browsers will see slightly less vibrant glows, but layout is unaffected.
