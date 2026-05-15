# ⚾ Bean Battleship

A Fenway Park-themed take on the classic Battleship game. Built with React + TypeScript + Vite. Command Captain Bean's fleet in a naval battle at Fenway Park, where every ship is a Red Sox landmark.

> **Live game:** _(deploy URL TBD)_
> **GitHub repo:** _(repo URL TBD)_

## Description

Bean Battleship is a single-player browser game set at Fenway Park. Place Captain Bean's fleet of five Red Sox-themed ships on a 10 × 10 grid, then battle a smart AI opponent. Choose between **Regular Season** (moderate) or **World Series** (hard) difficulty. The UI features a Fenway Park photo backdrop, Red Sox color palette (monster green, Sox red, cream), baseball-themed UI elements (scoreboard, outs, baseballs for misses), and custom SVG ship illustrations.

## Fleet

Every ship is a Fenway Park / Red Sox landmark:

| Ship | Length | Description |
|---|---|---|
| **The Green Monster** | 5 | The iconic 37-foot left field wall |
| **Pesky's Pole Patrol** | 4 | The right field foul pole, just 302 feet away |
| **The Citgo Cruiser** | 3 | The famous Citgo sign beyond the Green Monster |
| **Yawkey Way Destroyer** | 3 | The historic street (now Jersey Street) |
| **The Monster Seat Sub** | 2 | The lone red seat in right field (Ted Williams' 502-foot homer) |

Visual touches include a real Fenway Park photo backdrop, a mini scoreboard with inning/runs/hits/errors, announcer panel with play-by-play commentary, and shot log tracking every hit and miss.

## Features

- **10 × 10 board** with rows 1–10 and columns A–J
- **Strict no-touch placement rule** — ships cannot overlap or touch (orthogonally or diagonally)
- **Click-to-place** placement with rotate via `R` key
- **Randomize Fleet** and **Clear Fleet** controls
- **Two AI difficulty levels:**
  - **Regular Season (Moderate)** — random targeting with basic hunt/target mode
  - **World Series (Hard)** — parity hunt + line lock (when AI gets 2+ hits, it locks onto the ship's axis)
- **Baseball-themed UI:**
  - Mini scoreboard with innings, runs, hits, errors
  - Announcer panel with play-by-play commentary
  - Shot log tracking every move
  - Baseball markers for misses
  - Red X markers for hits/sunk
- **Game-over modal** with final stats and replay option
- **Surrender / Restart / Play Again** controls.
- **Responsive layout** — desktop three-column shell down to single-column mobile stacking.
- **Accessibility** — keyboard rotate (`R`), focus rings, ARIA labels, `prefers-reduced-motion` honoured.
- **44 unit tests** covering the engine and AI invariants.

## Screenshots

_(screenshots placeholder — capture from `http://localhost:5173/` and drop into `docs/screenshots/`)_

- `docs/screenshots/placement.png` — ship placement with previews and dashboard.
- `docs/screenshots/battle.png` — battle phase with hits, misses, and a sunk ship.
- `docs/screenshots/victory.png` — game-over modal in the win state.

## Tech Stack

- **React 18** + **TypeScript 5** (strict mode, automatic JSX runtime)
- **Vite 5** for dev server / production build
- **Vitest 2** + **@testing-library/react** + **jsdom** for unit tests
- **Plain CSS** with CSS variables for theme tokens — no Tailwind / CSS-in-JS
- Google Fonts: **Cinzel** (display), **Oswald** (UI), **Special Elite** (typewriter)

## How to Run Locally

```bash
git clone <repo-url>
cd austin-battleship
npm install
npm run dev
```

The dev server prints a URL (default: `http://localhost:5173/`). Open it in a browser.

## How to Test

```bash
npm test            # run vitest once
npm run test:watch  # watch mode
```

44 tests should pass (board: 25, ai: 19), including a full integration game vs a randomly-generated fleet.

## How to Build

```bash
npm run build       # type-check + production build to dist/
npm run preview     # preview the built bundle locally
```

The build runs `tsc -b` first to enforce strict TypeScript, then `vite build`. Output is `dist/` with hashed asset names.

## How to Deploy

The app is a fully static SPA after `npm run build` — drop the contents of `dist/` onto any static host:

- **Netlify / Vercel / Cloudflare Pages:** point the host at this repo. Build command: `npm run build`. Publish directory: `dist`.
- **GitHub Pages:** push the contents of `dist/` to a `gh-pages` branch (or use a CI action).
- **S3 / Cloud Storage + CDN:** upload `dist/` and enable static-site hosting.

There is no backend.

## Asset Licensing Note

The Austin skyline silhouette in the app shell and game-over modal is rendered entirely from a hand-authored SVG path embedded inline in CSS — no external image is shipped. If you wish to use a real Austin skyline photograph:

1. Place a licensed photo at `public/assets/austin-skyline.jpg`.
2. **Confirm you have the rights to use it** before any public deployment. The repo includes no photographic assets and makes no claims to any photograph you might add.

## Project Structure

```
src/
  components/
    HeaderBrand.tsx          Brand panel + Keep Austin Weird badge
    Layout.tsx               Shell with brand / play / instructions / dashboard slots
    Board.tsx                12×12 grid renderer
    BoardCell.tsx            Single cell with all visual states
    InstructionsPanel.tsx    "How to Play" panel
    PlacementDashboard.tsx   Fleet roster + Austin facts
    ShipCard.tsx             Collectible-card ship roster entry
    AustinShipIcon.tsx       Hand-drawn SVG illustrations for each ship
    GameOverModal.tsx        Victory / defeat modal
  data/
    ships.ts                 Austin fleet definition
  utils/
    board.ts                 Engine: placement, shots, sink detection
    ai.ts                    AI memory: hunt + target mode
  tests/
    board.test.ts            25 engine specs
    ai.test.ts               19 AI specs
  App.tsx                    Three-phase state machine (placement / playing / gameover)
  main.tsx
  styles.css
  types.ts
public/
  assets/                    Drop the optional skyline image here
```

## License

TBD.
