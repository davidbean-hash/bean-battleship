# Austin Battleship

A vintage, Austin-Texas-themed take on the classic Battleship game. Built with React + TypeScript + Vite. Battle the AI on a 12 × 12 board where every ship is an Austin landmark.

> **Live game:** _(deploy URL TBD)_
> **GitHub repo:** _(repo URL TBD)_

## Description

Austin Battleship is a single-player browser game. Place a fleet of seven Austin landmarks on your 12 × 12 harbour, then trade salvos with a fair AI opponent until one fleet is on the bottom of Lady Bird Lake. The UI is styled like a premium vintage board game: cream typography, navy lake-blue panels, burnt-orange copper enemy waters, gold star accents, beveled metal frames, and a slow-rotating "Keep Austin Weird" badge.

## Austin Theme

Every ship is an Austin landmark or icon, with a hand-drawn SVG illustration and a short flavour fact:

| Ship | Length | Vibe |
|---|---|---|
| **Texas Capitol** | 5 | The pink-granite dome — flagship of the fleet. |
| **Congress Bats** | 4 | 1.5 million Mexican free-tailed bats swarm at dusk. |
| **Rainey Street** | 4 | Historic bungalow district turned cocktail-bar row. |
| **Lady Bird Paddleboard** | 3 | Glide across Lady Bird Lake at sunrise. |
| **Barton Springs** | 3 | A 68 °F spring-fed pool, the soul of Zilker Park. |
| **Rustic Tap** | 3 | A West-6th icehouse keeping the taps cold. |
| **Zilker Kite** | 2 | The Zilker Kite Festival fills the sky every March. |

Visual touches include a CSS-rendered Austin skyline silhouette, star-bracketed panel headers (`★ YOUR FLEET ★`), a compass-style **VS** medallion between the boards, and rotating Austin trivia in the dashboard.

## Features

- **12 × 12 board** with rows A–L and columns 1–12.
- **Strict no-touch placement rule** — ships cannot overlap, touch orthogonally, or touch diagonally.
- **Click-to-place and drag-and-drop** placement, plus rotate via card button or the `R` key.
- **Randomize Fleet** and **Clear Fleet** controls.
- **Fair AI opponent** with hunt/target mode and checkerboard parity. The AI never inspects hidden state — only the engine's hit / miss / sunk feedback.
- **Battle phase** with hit / miss / sunk animations, "You sank …" messages, and AI turn pacing.
- **Game-over modal** with star medallion, accuracy, shots fired, ships sunk, and game time.
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
