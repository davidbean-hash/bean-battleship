# ⚾ Bean Battleship

Bean Battleship is a Fenway Park-themed Battleship game built with React, TypeScript, and Vite.

> GitHub: `https://github.com/davidbean-hash/bean-battleship`

## What it includes

- 10×10 board with A–J / 1–10 coordinates
- Fenway-themed fleet:
  - The Green Monster (5)
  - Pesky's Pole Patrol (4)
  - The Citgo Cruiser (3)
  - Yawkey Way Destroyer (3)
  - The Monster Seat Sub (2)
- Strict no-touch placement rule (including diagonals)
- Two AI levels:
  - Regular Season (moderate)
  - World Series (hard: parity + line lock)
- Sunk-ship polish:
  - Homerun animation
  - Sunk ship cells crossed out
  - Surrounding impossible cells auto-marked as blocked
- Setup quality-of-life:
  - Clear spacing instruction in the fleet panel
  - PLAY BALL CTA visible in setup roster panel
- Accessibility and responsiveness improvements:
  - Keyboard rotate (`R`)
  - Live region status updates
  - Focus-visible styles
  - Reduced-motion support

## Run locally

```bash
npm install
npm run dev
```

If `localhost` has issues on your machine, use `http://127.0.0.1:5173`.

## Scripts

- `npm run dev` — start Vite dev server
- `npm run build` — TypeScript build + production bundle
- `npm run preview` — preview production bundle
- `npm test` — run Vitest once
- `npm run test:watch` — Vitest watch mode

## Testing

Current tests cover core board/AI invariants in:

- `src/tests/board.test.ts`
- `src/tests/ai.test.ts`

Run with:

```bash
npm test
```

## Deploy

This is a static SPA (no backend). Deploy `dist/` to Netlify, Vercel, Cloudflare Pages, GitHub Pages, or any static host.

## Project structure

```
src/
  App.tsx
  main.tsx
  styles.css
  types.ts
  components/
    ShipIcon.tsx
    HeaderBrand.tsx
  utils/
    board.ts
    ai.ts
  tests/
    board.test.ts
    ai.test.ts
public/
  hero.jpg
  stadium.jpg
docs/
  screenshots/
```
