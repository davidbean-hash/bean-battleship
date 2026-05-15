# Bean Battleship — Deep Wiki

A comprehensive technical reference for the Bean Battleship codebase.

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Project Structure](#project-structure)
4. [Tech Stack](#tech-stack)
5. [Type System](#type-system)
6. [Game Engine (`board.ts`)](#game-engine-boardts)
7. [AI System (`ai.ts`)](#ai-system-aits)
8. [UI Components](#ui-components)
9. [State Machine & Game Flow](#state-machine--game-flow)
10. [Visual Design & CSS](#visual-design--css)
11. [Ship Illustrations (SVG)](#ship-illustrations-svg)
12. [Testing](#testing)
13. [Build & Development](#build--development)
14. [Data Flow Diagrams](#data-flow-diagrams)

---

## Overview

Bean Battleship is a single-player, browser-based Battleship game themed around Fenway Park and the Boston Red Sox. The player commands "Captain Bean's Fleet" — five ships named after Red Sox landmarks — on a 10x10 grid against an AI opponent. The game features:

- Fenway Park photo backdrop with CSS-rendered stadium elements (Green Monster, Citgo sign, stadium lights)
- Baseball-themed UI: scoreboard with innings/runs/hits/errors, baseballs for misses, announcer play-by-play
- Two AI difficulty levels: Regular Season (moderate) and World Series (hard)
- Strict no-touch placement rule (ships can't be adjacent, even diagonally)
- Custom hand-drawn SVG ship illustrations
- Responsive layout from desktop to mobile
- 44 unit tests covering engine and AI invariants

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                        App.tsx                           │
│              (State Machine: 4 phases)                   │
│                                                          │
│  landing ──> setup ──> playing ──> over                  │
│                                                          │
│  State:                                                  │
│    playerBoard: BoardState                               │
│    aiBoard: BoardState                                   │
│    ai: AIState                                           │
│    phase, turn, winner, stats, shotLog, ...              │
│                                                          │
├─────────────┬────────────┬───────────────────────────────┤
│ BoardView   │ Panels     │ Utilities                     │
│ (grid       │ (Scoreboard│ board.ts (engine)             │
│  renderer)  │  Announcer │ ai.ts   (AI brain)            │
│             │  ShotLog)  │ types.ts (shared types)       │
├─────────────┴────────────┴───────────────────────────────┤
│ ShipIcon.tsx           │ HeaderBrand.tsx                  │
│ (SVG ship drawings)    │ (Title/branding)                │
└────────────────────────┴─────────────────────────────────┘
```

The app follows a **single-component state machine** pattern. `App.tsx` (~1024 lines) contains all game state and phase logic, rendering different UI based on the current `Phase`. There is no external state management library — all state is managed via React `useState` hooks in the root `App` component.

---

## Project Structure

```
bean-battleship/
├── public/
│   └── assets/           # Optional backdrop images
├── src/
│   ├── components/
│   │   ├── HeaderBrand.tsx    # "Bean Battleship" title branding
│   │   └── ShipIcon.tsx       # SVG ship illustrations (5 ships)
│   ├── utils/
│   │   ├── board.ts           # Game engine: placement, shots, sink detection
│   │   └── ai.ts              # AI opponent: hunt/target modes, difficulty
│   ├── App.tsx                # Main component: state machine, all game logic
│   ├── main.tsx               # React entry point
│   ├── types.ts               # Shared TypeScript types & fleet definition
│   └── styles.css             # All styles (~2400 lines, plain CSS)
├── docs/
│   └── screenshots/           # Game screenshots
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
```

---

## Tech Stack

| Technology | Version | Purpose |
|---|---|---|
| React | 18.3 | UI framework |
| TypeScript | 5.5 | Type safety (strict mode) |
| Vite | 5.3 | Dev server + production bundler |
| Vitest | 2.0 | Unit testing |
| @testing-library/react | 16.0 | Component testing utilities |
| jsdom | 24.1 | DOM environment for tests |
| Plain CSS | — | Styling (CSS variables, no Tailwind/CSS-in-JS) |

**Fonts:** Cinzel (display), Oswald (UI), Special Elite (typewriter/announcer), Black Ops One (blocked markers)

---

## Type System

Defined in `src/types.ts`:

### Constants & Primitives

```typescript
BOARD_SIZE = 10           // 10x10 grid
Orientation = 'H' | 'V'  // Horizontal or Vertical
Difficulty = 'moderate' | 'hard'
Phase = 'landing' | 'setup' | 'playing' | 'over'
Player = 'you' | 'ai'
CellState = 'unknown' | 'miss' | 'hit' | 'sunk' | 'blocked'
```

### Ship Types

```typescript
ShipSpec { id: string; name: string; length: number }
PlacedShip extends ShipSpec { row, col, orientation, hits }
```

### Board State

```typescript
BoardState {
  ships: PlacedShip[]        // All placed ships
  occupancy: number[][]      // 10x10 grid, ship index or -1
  shots: CellState[][]       // 10x10 grid of cell states
}
```

### The Fleet

| ID | Name | Length | SVG Style |
|---|---|---|---|
| `green-monster` | The Green Monster | 5 | Navy Bean (battleship) |
| `peskys-pole` | Pesky's Pole Patrol | 4 | Black Bean (gun turrets) |
| `citgo` | The Citgo Cruiser | 3 | Pinto Bean (cargo ship) |
| `yawkey-way` | Yawkey Way Destroyer | 3 | Kidney Bean (submarine) |
| `monster-seat` | The Monster Seat Sub | 2 | Coffee Bean (twin ellipses) |

---

## Game Engine (`board.ts`)

### Core Functions

#### `emptyBoard(): BoardState`
Creates a fresh 10x10 board with all cells `unknown` and occupancy `-1`.

#### `inBounds(r, c): boolean`
Checks if coordinates are within the 10x10 grid (0-indexed).

#### `shipCells(row, col, length, orientation): [number, number][]`
Returns all cell coordinates a ship would occupy. For horizontal ships, increments column; for vertical, increments row.

#### `canPlace(board, row, col, length, orientation): boolean`
Validates ship placement with two checks:
1. **Bounds + overlap**: All cells must be in bounds and unoccupied
2. **No-touch rule**: No adjacent cells (8 directions) can contain another ship

The no-touch rule enforces a minimum 1-cell gap between all ships, including diagonals.

#### `placeShip(board, spec, row, col, orientation): boolean`
Places a ship on the board by:
1. Validating with `canPlace`
2. Creating a `PlacedShip` object
3. Adding to `board.ships[]`
4. Marking `board.occupancy[][]` with the ship's index

#### `randomizeBoard(rng?): BoardState`
Generates a valid random board by attempting to place each fleet ship with up to 200 random attempts per ship. Retries from scratch if any ship can't be placed.

#### `fireAt(board, row, col): ShotResult`
The main shot resolution function:
1. Returns `'repeat'` if cell was already shot
2. Marks `'miss'` if no ship at that cell
3. On hit, increments `ship.hits`:
   - If `hits >= length`: marks all ship cells as `'sunk'`, calls `markSurroundingBlocked()`, checks for game over
   - Otherwise: marks cell as `'hit'`

Returns: `{ result, shipIndex?, sunkShip?, gameOver }`

#### `markSurroundingBlocked(board, ship): void`
When a ship sinks, marks all 8-directional adjacent cells as `'blocked'`:
- Iterates every cell of the sunk ship
- For each, checks all 8 neighbors (dr/dc -1 to 1)
- Skips cells that are part of the sunk ship itself
- Converts `'unknown'` and `'miss'` cells to `'blocked'`
- Preserves `'sunk'` and `'hit'` states from other ships

This reveals to the player where ships cannot be, aiding strategy.

#### `allSunk(board): boolean`
Returns true if all ships on the board have `hits >= length`.

---

## AI System (`ai.ts`)

### AI State

```typescript
AIState {
  difficulty: Difficulty
  shots: CellState[][]       // AI's view of the opponent board
  remainingLengths: number[] // Lengths of unsunk ships
  currentHits: [r, c][]     // Active target's accumulated hits
  targetQueue: [r, c][]     // LIFO stack of next cells to try
}
```

### Behavior Modes

The AI operates in two modes:

#### Hunt Mode (`huntShot`)
When `targetQueue` is empty (no active target):
- **Moderate**: Picks a random unknown cell
- **Hard**: Uses **parity optimization** — only targets cells where `(r + c) % minShipLength === 0`, reducing the search space. Falls back to any unknown cell if parity cells are exhausted.

#### Target Mode (`chooseShot` + `recomputeTargetQueue`)
When the AI has hits but hasn't sunk the ship:
- Pops candidates from `targetQueue` (LIFO)
- **Moderate**: Queues shuffled orthogonal neighbors of the last hit
- **Hard** (2+ hits): **Line lock** — determines if hits are horizontal or vertical, then only queues cells extending the line in both directions

### Shot Recording (`recordResult`)
After each shot:
- `miss`: Updates AI state; if in target mode, recomputes queue (tries other direction)
- `hit`: Marks hit, adds to `currentHits`, recomputes target queue
- `sunk`: Marks all ship cells as `sunk`, removes ship length from `remainingLengths`, clears `currentHits` for that ship, recomputes queue

### AI Weaknesses (by design)
- Moderate AI: No memory of impossible positions, no parity optimization
- Both difficulties: Don't mark exclusion zones around sunk ships in their own tracking (the board engine does this visually, but the AI's internal `shots` state doesn't block these cells)

---

## UI Components

### `App.tsx` — Main Application

The root component manages:
- **Phase transitions**: landing → setup → playing → over
- **Game state**: Two `BoardState` objects (player + AI), `AIState`, turn tracking
- **UI state**: Hover preview, orientation, selected ship, messages, shot log, stats
- **AI turn logic**: Uses `setTimeout` for delayed AI shots (simulates thinking)

Key internal components (defined within App.tsx):

#### `BoardView`
Renders a 10x10 CSS grid with:
- Column labels (A-J) and row labels (1-10)
- Cell buttons with state-dependent styling (`miss`, `hit`, `sunk`, `blocked`, `clickable`)
- Ship overlay SVGs (when `revealShips` is true)
- Placement preview (green/red highlight)
- Baseball icons for misses, X marks for hits/sunk/blocked

#### `Panel`
Reusable section wrapper with styled header (flank decorations).

#### `FenwayBackdrop`
Pure CSS/HTML backdrop rendering:
- Sky gradient + animated clouds
- Stadium lights (left + right poles)
- Citgo sign
- Green Monster wall with mini scoreboard
- Grass field

### `ShipIcon.tsx` — Ship Illustrations

Five hand-drawn SVG ship designs:
- **Navy Bean** (Green Monster, length 5): Blue battleship with portholes, anchor, deck stripe
- **Black Bean** (Pesky's Pole, length 4): Dark ship with gun turrets, cannons, rivets
- **Pinto Bean** (Citgo, length 3): Brown cargo ship with hatches
- **Kidney Bean** (Yawkey Way, length 3): Red submarine with bridge, smokestack, windows
- **Coffee Bean** (Monster Seat, length 2): Twin coffee bean ellipses with characteristic center lines

Each ship supports horizontal and vertical orientation via SVG viewBox/transform manipulation (no CSS rotation).

### `HeaderBrand.tsx`
Simple branding component: "Bean Battleship" title with tagline.

---

## State Machine & Game Flow

### Phase: `landing`
- Difficulty selection (Regular Season / World Series)
- "PLAY BALL" button to start
- Transitions to `setup`

### Phase: `setup`
- Player places 5 ships on their board
- Click cells to place, press `R` to rotate
- "Randomize Fleet" for auto-placement
- "Clear Fleet" to start over
- Ship roster shows placed/unplaced status
- Preview shows green (valid) or red (invalid) placement
- "Take the Mound" button when all ships placed → transitions to `playing`

### Phase: `playing`
- Two boards displayed: "Your Field" (player's ships, always visible) + "Enemy Field" (AI's ships, hidden)
- Player clicks enemy board to fire
- Turn alternates: player → AI → player → ...
- AI fires after a delay (~800ms, ~1400ms for hard)
- Scoreboard tracks: innings, runs (sunk ships), hits, errors (misses), outs
- Announcer provides play-by-play commentary
- Shot log tracks all moves
- "Homer" animation plays when a ship is sunk
- Continues until all ships on one side are sunk → transitions to `over`

### Phase: `over`
- Game-over modal: "YOU WIN THE PENNANT!" or "GAME OVER — CPU WINS"
- Final stats: shots, hit rate, ships sunk
- "Play Again" resets to setup phase
- Enemy ships revealed on board

---

## Visual Design & CSS

### Theme Tokens (CSS Variables)

```css
--sox-red: #c8102e        /* Primary accent (hits, danger) */
--monster-green: #2d5a27  /* Green Monster, field elements */
--cream: #f5e9cf          /* Background, text on dark */
--dirt: #8b7355           /* Board background */
--dugout: #2a1c11         /* Dark panels, headers */
--chalk: #ffffff          /* Bright highlights */
```

### Layout System
- Desktop: Three-column layout (left panel / center boards / right panel)
- Tablet (~900px): Two-column, side panels stack
- Mobile (~600px): Single column, everything stacks

### CSS Grid Board
Each board is an 11x11 CSS grid (10 cells + 1 label row/column):
- `grid-template-columns: auto repeat(10, 1fr)`
- Cells sized with `clamp()` for fluid responsiveness
- Ship overlays positioned using `grid-column/grid-row` spans

### Key Animations
- `@keyframes drift`: Cloud animation (infinite horizontal scroll)
- `@keyframes glow-pulse`: Stadium light glow
- `@keyframes bannerFlap`: Panel header flutter
- `@keyframes sunkShake`: Ship sunk shake effect
- Homer effect: Ship sunk celebration overlay

### Cell States (CSS)
| State | Background | Icon |
|---|---|---|
| `unknown` | Transparent | — |
| `miss` | Light brown | Baseball emoji via `::before` |
| `hit` | Red gradient | Red X mark |
| `sunk` | Dark red gradient | Red X mark |
| `blocked` | `rgba(42, 28, 17, 0.5)` | Muted X mark |
| `clickable` | Hover: semi-transparent green | — |

---

## Ship Illustrations (SVG)

Each ship is a React component returning SVG elements. Ships are drawn horizontally and support vertical orientation through SVG viewBox/transform changes:

### Horizontal (default)
- `viewBox="0 0 {length * 10} 10"`
- Internal artwork drawn left-to-right

### Vertical
- `viewBox="0 0 10 {length * 10}"`
- SVG `<g transform="rotate(90 5 5) translate(0 -{offset})">` rotates the artwork

The `ShipIcon` component maps ship IDs to their drawing functions and handles orientation switching.

---

## Testing

### Test Suite: 44 tests total

#### Board Tests (`board.test.ts`) — 25 specs
- Board creation and dimensions
- Ship cell generation (horizontal + vertical)
- Placement validation (bounds, overlap, no-touch rule)
- Ship placement mutations
- Board randomization
- Shot mechanics (miss, hit, sunk, repeat, game over)
- Blocked cell marking after sinking

#### AI Tests (`ai.test.ts`) — 19 specs
- AI state creation
- Shot recording (miss, hit, sunk)
- Hunt mode behavior
- Target mode (neighbor queuing)
- Hard mode parity optimization
- Hard mode line lock (horizontal + vertical detection)
- Full integration: AI vs random fleet to completion

### Running Tests

```bash
npm test              # Single run
npm run test:watch    # Watch mode
```

---

## Build & Development

### Development

```bash
npm install           # Install dependencies
npm run dev           # Start Vite dev server (http://localhost:5173/)
```

### Production Build

```bash
npm run build         # TypeScript check + Vite production build → dist/
npm run preview       # Preview built bundle locally
```

### Build Pipeline
1. `tsc -b` — TypeScript type checking (strict mode)
2. `vite build` — Bundle, tree-shake, minify → `dist/`
   - CSS: ~35 KB (gzipped: ~7.4 KB)
   - JS: ~171 KB (gzipped: ~54 KB)

---

## Data Flow Diagrams

### Player Shot Flow

```
Player clicks enemy cell (r, c)
  │
  ├─ App.playerFire(r, c)
  │    ├─ cloneBoard(aiBoard)
  │    ├─ fireAt(clone, r, c)
  │    │    ├─ miss → shots[r][c] = 'miss'
  │    │    ├─ hit  → ship.hits++, shots[r][c] = 'hit'
  │    │    └─ sunk → ship.hits++, mark all 'sunk',
  │    │             markSurroundingBlocked(), check gameOver
  │    ├─ setAiBoard(clone)
  │    ├─ updateStats()
  │    ├─ addShotLogEntry()
  │    ├─ setMessage(commentary)
  │    └─ if sunk: triggerHomerEffect()
  │
  └─ setTurn('ai') → setTimeout(aiTurn, delay)
```

### AI Shot Flow

```
aiTurn()
  │
  ├─ cloneAI(ai)
  ├─ chooseShot(aiClone) → [r, c]
  │    ├─ targetQueue not empty? → pop & return
  │    └─ empty → huntShot() (random or parity)
  │
  ├─ cloneBoard(playerBoard)
  ├─ fireAt(clone, r, c) → result
  ├─ recordResult(aiClone, r, c, result)
  │    ├─ miss → recompute queue
  │    ├─ hit  → push to currentHits, recompute queue
  │    └─ sunk → clear currentHits, remove from remaining
  │
  ├─ setPlayerBoard(clone)
  ├─ setAi(aiClone)
  ├─ updateStats(), addLog(), setMessage()
  └─ setTurn('you')
```

### Placement Flow

```
Player hovers cell
  │
  ├─ previewCells = shipCells(hover, selectedShip, orientation)
  ├─ previewValid = canPlace(playerBoard, ...)
  └─ BoardView renders green/red preview

Player clicks cell
  │
  ├─ canPlace? → placeShip(clone, ship, r, c, orientation)
  ├─ setPlayerBoard(clone)
  ├─ setPlacedIds(+ship.id)
  ├─ auto-select next unplaced ship
  └─ all placed? → "Take the Mound" button enabled
```

---

*Generated from codebase analysis — May 2026*
