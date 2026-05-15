import { BOARD_SIZE, CellState, Difficulty, FLEET, PlacedShip } from '../types';
import { inBounds, shipCells } from './board';

export interface AIState {
  difficulty: Difficulty;
  shots: CellState[][];
  remainingLengths: number[];
  // hits on the ship currently being targeted (not yet sunk)
  currentHits: Array<[number, number]>;
  // candidate cells to fire at next (LIFO)
  targetQueue: Array<[number, number]>;
}

export function createAI(difficulty: Difficulty): AIState {
  return {
    difficulty,
    shots: Array.from({ length: BOARD_SIZE }, () =>
      Array(BOARD_SIZE).fill('unknown') as CellState[],
    ),
    remainingLengths: FLEET.map((s) => s.length),
    currentHits: [],
    targetQueue: [],
  };
}

function neighbors(r: number, c: number): Array<[number, number]> {
  return [
    [r - 1, c],
    [r + 1, c],
    [r, c - 1],
    [r, c + 1],
  ];
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isUnknown(state: AIState, r: number, c: number): boolean {
  return inBounds(r, c) && state.shots[r][c] === 'unknown';
}

function canContainShip(state: AIState, r: number, c: number): boolean {
  if (!inBounds(r, c)) return false;
  const cell = state.shots[r][c];
  return cell !== 'miss' && cell !== 'sunk';
}

function computeHardHeatmap(state: AIState): number[][] {
  const heat = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(0));
  const requiredHits = new Set(state.currentHits.map(([r, c]) => `${r},${c}`));

  for (const len of state.remainingLengths) {
    // Weight longer ships more heavily: finding the biggest ship first
    // gives the most information and is the most valuable target.
    const weight = len;
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        for (const orientation of ['H', 'V'] as const) {
          const cells = shipCells(r, c, len, orientation);
          if (cells.some(([sr, sc]) => !canContainShip(state, sr, sc))) continue;

          if (requiredHits.size > 0) {
            const cellSet = new Set(cells.map(([sr, sc]) => `${sr},${sc}`));
            let includesAllHits = true;
            for (const hit of requiredHits) {
              if (!cellSet.has(hit)) {
                includesAllHits = false;
                break;
              }
            }
            if (!includesAllHits) continue;
          }

          for (const [sr, sc] of cells) {
            if (state.shots[sr][sc] === 'unknown') {
              heat[sr][sc] += weight;
            }
          }
        }
      }
    }
  }

  return heat;
}

function recomputeTargetQueue(state: AIState): void {
  state.targetQueue = [];
  const hits = state.currentHits;
  if (hits.length === 0) return;

  // Hard mode + 2+ hits: lock onto the line.
  if (state.difficulty === 'hard' && hits.length >= 2) {
    const sameRow = hits.every((h) => h[0] === hits[0][0]);
    const sameCol = hits.every((h) => h[1] === hits[0][1]);
    if (sameRow) {
      const row = hits[0][0];
      const cols = hits.map((h) => h[1]).sort((a, b) => a - b);
      const left: [number, number] = [row, cols[0] - 1];
      const right: [number, number] = [row, cols[cols.length - 1] + 1];
      if (isUnknown(state, left[0], left[1])) state.targetQueue.push(left);
      if (isUnknown(state, right[0], right[1])) state.targetQueue.push(right);
      return;
    }
    if (sameCol) {
      const col = hits[0][1];
      const rows = hits.map((h) => h[0]).sort((a, b) => a - b);
      const up: [number, number] = [rows[0] - 1, col];
      const down: [number, number] = [rows[rows.length - 1] + 1, col];
      if (isUnknown(state, up[0], up[1])) state.targetQueue.push(up);
      if (isUnknown(state, down[0], down[1])) state.targetQueue.push(down);
      return;
    }
    // not collinear — fall through to neighbor strategy
  }

  // Default target: neighbors of the most recent hit, shuffled.
  const [r, c] = hits[hits.length - 1];
  const cands = neighbors(r, c).filter(([nr, nc]) => isUnknown(state, nr, nc));
  if (state.difficulty !== 'hard') {
    state.targetQueue = shuffle(cands);
    return;
  }

  const heat = computeHardHeatmap(state);
  const scored = cands
    .map(([nr, nc]) => ({ r: nr, c: nc, score: heat[nr][nc] }))
    .sort((a, b) => a.score - b.score);
  state.targetQueue = scored.map(({ r: sr, c: sc }) => [sr, sc]);
}

function hardHuntShot(state: AIState): [number, number] {
  const heat = computeHardHeatmap(state);
  let best: [number, number] | null = null;
  let bestScore = -1;
  let bestCenterDist = Number.POSITIVE_INFINITY;
  const center = (BOARD_SIZE - 1) / 2;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (state.shots[r][c] !== 'unknown') continue;
      const score = heat[r][c];
      const centerDist = Math.abs(r - center) + Math.abs(c - center);
      if (
        score > bestScore ||
        (score === bestScore && centerDist < bestCenterDist)
      ) {
        best = [r, c];
        bestScore = score;
        bestCenterDist = centerDist;
      }
    }
  }

  if (best) return best;

  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (state.shots[r][c] === 'unknown') return [r, c];
    }
  }

  return [0, 0];
}

function huntShot(state: AIState): [number, number] {
  if (state.difficulty === 'hard') {
    return hardHuntShot(state);
  }

  const minLen =
    state.remainingLengths.length > 0 ? Math.min(...state.remainingLengths) : 2;
  const parity: Array<[number, number]> = [];
  const any: Array<[number, number]> = [];
  for (let r = 0; r < BOARD_SIZE; r++) {
    for (let c = 0; c < BOARD_SIZE; c++) {
      if (state.shots[r][c] !== 'unknown') continue;
      any.push([r, c]);
      if ((r + c) % minLen === 0) parity.push([r, c]);
    }
  }
  return any[Math.floor(Math.random() * any.length)];
}

export function chooseShot(state: AIState): [number, number] {
  while (state.targetQueue.length > 0) {
    const [r, c] = state.targetQueue.pop()!;
    if (isUnknown(state, r, c)) return [r, c];
  }
  return huntShot(state);
}

export function recordResult(
  state: AIState,
  r: number,
  c: number,
  result: 'miss' | 'hit' | 'sunk',
  sunkShip?: PlacedShip,
): void {
  if (result === 'miss') {
    state.shots[r][c] = 'miss';
    // queue automatically drained; if we have currentHits, recompute to grab the other end of the line
    if (state.currentHits.length > 0) recomputeTargetQueue(state);
    return;
  }

  if (result === 'hit') {
    state.shots[r][c] = 'hit';
    state.currentHits.push([r, c]);
    recomputeTargetQueue(state);
    return;
  }

  // sunk
  state.shots[r][c] = 'hit';
  state.currentHits.push([r, c]);
  if (sunkShip) {
    const sunkCells = shipCells(
      sunkShip.row,
      sunkShip.col,
      sunkShip.length,
      sunkShip.orientation,
    );
    for (const [sr, sc] of sunkCells) {
      state.shots[sr][sc] = 'sunk';
    }
    // Exploit no-touch rule: all 8-neighbors of a sunk ship cannot hold
    // any other ship, so mark them as misses to shrink the search space.
    for (const [sr, sc] of sunkCells) {
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = sr + dr;
          const nc = sc + dc;
          if (!inBounds(nr, nc)) continue;
          if (state.shots[nr][nc] === 'unknown') {
            state.shots[nr][nc] = 'miss';
          }
        }
      }
    }
    // remove this ship's length from remaining
    const idx = state.remainingLengths.indexOf(sunkShip.length);
    if (idx >= 0) state.remainingLengths.splice(idx, 1);
    // drop hits that belong to this sunk ship
    state.currentHits = state.currentHits.filter(
      ([hr, hc]) => state.shots[hr][hc] !== 'sunk',
    );
  } else {
    state.currentHits = [];
  }
  recomputeTargetQueue(state);
}
