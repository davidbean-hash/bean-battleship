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
  state.targetQueue = shuffle(cands);
}

function huntShot(state: AIState): [number, number] {
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
  if (state.difficulty === 'hard' && parity.length > 0) {
    return parity[Math.floor(Math.random() * parity.length)];
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
    for (const [sr, sc] of shipCells(
      sunkShip.row,
      sunkShip.col,
      sunkShip.length,
      sunkShip.orientation,
    )) {
      state.shots[sr][sc] = 'sunk';
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
