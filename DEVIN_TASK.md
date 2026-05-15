# Bean Battleship - Devin Task

## Project Overview
Bean Battleship is a fully functional Battleship game with a Fenway Park/Boston Red Sox theme. The game is complete and working — your task is to deploy it and optionally enhance it.

## Current State
- ✅ Game logic complete (placement, battle, AI with 2 difficulty levels)
- ✅ Full UI with landing page, setup phase, play phase, game over
- ✅ Fenway Park theme (Red Sox colors, baseball UI, stadium backdrop)
- ✅ Responsive design
- ✅ TypeScript + React + Vite
- ✅ Build passing (171 kB JS / 29 kB CSS)

## Tech Stack
- React 18 + TypeScript
- Vite (dev server + build)
- CSS (no framework, custom Fenway theme)
- No backend (pure client-side)

## Your Tasks

### 1. Deploy to Production
**Priority: HIGH**

Deploy this game to a public URL using one of:
- **Netlify** (recommended - drag & drop the `dist` folder)
- **Vercel** (connect GitHub repo)
- **GitHub Pages** (static hosting)

Steps:
```bash
# Build the production bundle
npm run build

# The dist/ folder contains the deployable static site
# Upload dist/ to your hosting provider
```

**Deliverable:** Live game URL

### 2. Create GitHub Repository
**Priority: HIGH**

1. Create a new public GitHub repo: `bean-battleship`
2. Push this code
3. Add a good README with:
   - Screenshot of the game
   - Live demo link
   - "How to run locally" instructions
   - Tech stack
   - Credit: "Built with Cascade AI"

**Deliverable:** GitHub repo URL

### 3. Optional Enhancements
**Priority: MEDIUM**

Pick any of these if you have time:

- **Add sound effects** (hit, miss, sunk, game over)
- **Add ship placement animations** (ships sliding into position)
- **Add a "replay last game" feature** (save game state to localStorage)
- **Add a leaderboard** (track fastest wins, best accuracy)
- **Add more difficulty levels** (easy, nightmare)
- **Add keyboard shortcuts** (arrow keys to navigate grid, Enter to fire)
- **Add a tutorial/help modal** for first-time players
- **Add social sharing** ("I just sank the Green Monster!")

### 4. Bug Fixes (if any)
**Priority: LOW**

Test the game thoroughly and fix any bugs you find. The game should be stable, but edge cases may exist.

## Project Structure
```
src/
├── App.tsx              # Main game component (landing, setup, play, game-over)
├── components/
│   └── ShipIcon.tsx     # SVG ship illustrations (Green Monster, etc.)
├── utils/
│   ├── board.ts         # Board state, placement, shot logic
│   └── ai.ts            # AI opponent (moderate/hard difficulty)
├── types.ts             # TypeScript interfaces
└── styles.css           # All styling (Fenway theme)

public/
└── hero.jpg             # Fenway Park backdrop photo
```

## How to Run Locally
```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview production build
```

## Important Notes
- The game uses a **real Fenway Park photo** (`/public/hero.jpg`) as the backdrop. Make sure this file exists.
- Ship names are Red Sox themed: Green Monster, Pesky's Pole, Citgo Cruiser, Yawkey Way Destroyer, Monster Seat Sub
- The AI has two modes:
  - **Moderate** (Regular Season) - random targeting
  - **Hard** (World Series) - parity hunt + line lock when it gets 2+ hits
- Board size is 10×10 (not the classic 12×12)
- No external dependencies for game logic (pure TypeScript)

## Success Criteria
1. ✅ Game deploys successfully to a public URL
2. ✅ GitHub repo is public and well-documented
3. ✅ Game is playable end-to-end (no crashes)
4. ✅ (Optional) At least 1 enhancement implemented

## Questions?
If anything is unclear, check:
- `src/types.ts` for data structures
- `src/utils/board.ts` for game rules
- `src/utils/ai.ts` for AI logic
- `src/styles.css` for theming

Good luck! 🎯⚾
