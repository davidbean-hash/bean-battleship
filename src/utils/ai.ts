import type { CellCoord, ShotOutcome } from '../types';
import { isWithinBoard } from './board';

/**
 * The AI plays a fair game: it learns ONLY from feedback the engine gives it
 * (hit / miss / sunk + the cells of any ship it sinks). It never inspects
 * the opponent board's hidden state.
 */
export interface AIMemory {
  boardSize: number;
  /** fired[row][col] === true if the AI has already fired at that cell. */
  fired: boolean[][];
  /** Pending neighbour shots queued during target mode. May contain stale cells; consumers must filter. */
  targetQueue: CellCoord[];
  /** Hits belonging to ships not yet sunk — anchors for target mode. */
  activeHits: CellCoord[];
  /**
   * Last shot the AI made, in the form `${row},${col}` — convenience for
   * callers that want to render an animation. Optional internal field.
   */
  lastShot?: CellCoord;
}

/** Result feedback the engine supplies after the AI fires. */
export interface AIShotFeedback {
  outcome: ShotOutcome;
  /** When `outcome === 'sunk'`, the full set of cells comprising the sunk ship. */
  sunkCells?: CellCoord[];
}

const coordKey = (c: CellCoord) => `${c.row},${c.col}`;

/** Create a fresh AI memory for a square board of `boardSize`. */
export function createInitialAIMemory(boardSize: number): AIMemory {
  if (!Number.isInteger(boardSize) || boardSize <= 0) {
    throw new Error(`Invalid board size: ${boardSize}`);
  }
  const fired: boolean[][] = Array.from({ length: boardSize }, () =>
    Array.from({ length: boardSize }, () => false),
  );
  return {
    boardSize,
    fired,
    targetQueue: [],
    activeHits: [],
  };
}

/** True if the AI has already fired at this coord. */
export function hasAIFiredAt(memory: AIMemory, coord: CellCoord): boolean {
  if (!isWithinBoard(coord, memory.boardSize)) return false;
  return memory.fired[coord.row][coord.col];
}

/** Return the up-to-4 orthogonal neighbours of `coord` that lie inside the board. */
export function getNeighborTargets(coord: CellCoord, boardSize: number): CellCoord[] {
  const deltas: Array<[number, number]> = [
    [-1, 0], // up
    [1, 0],  // down
    [0, -1], // left
    [0, 1],  // right
  ];
  const out: CellCoord[] = [];
  for (const [dr, dc] of deltas) {
    const n = { row: coord.row + dr, col: coord.col + dc };
    if (isWithinBoard(n, boardSize)) out.push(n);
  }
  return out;
}

function cloneFired(fired: boolean[][]): boolean[][] {
  return fired.map((row) => row.slice());
}

/**
 * Decide the AI's next move.
 *  - Target mode: drains the queue, skipping any cell already fired upon.
 *  - Hunt mode: checkerboard parity (row+col even) for efficiency,
 *    falling back to any remaining cell if parity is exhausted.
 */
export function getAIMove(
  memory: AIMemory,
  boardSize: number,
  rng: () => number = Math.random,
): CellCoord {
  if (boardSize !== memory.boardSize) {
    throw new Error(
      `getAIMove: boardSize ${boardSize} does not match memory.boardSize ${memory.boardSize}`,
    );
  }

  // Target mode: prefer queued neighbours of unsunk hits.
  for (const candidate of memory.targetQueue) {
    if (
      isWithinBoard(candidate, boardSize) &&
      !memory.fired[candidate.row][candidate.col]
    ) {
      return candidate;
    }
  }

  // Hunt mode with checkerboard parity.
  const evenCells: CellCoord[] = [];
  const oddCells: CellCoord[] = [];
  for (let r = 0; r < boardSize; r++) {
    for (let c = 0; c < boardSize; c++) {
      if (memory.fired[r][c]) continue;
      ((r + c) % 2 === 0 ? evenCells : oddCells).push({ row: r, col: c });
    }
  }
  const pool = evenCells.length > 0 ? evenCells : oddCells;
  if (pool.length === 0) {
    throw new Error('getAIMove: every cell has been fired upon');
  }
  return pool[Math.floor(rng() * pool.length)];
}

/**
 * Update memory after an AI shot resolves. Returns a new memory object;
 * the input is not mutated.
 */
export function updateAIMemory(
  memory: AIMemory,
  coord: CellCoord,
  feedback: AIShotFeedback,
): AIMemory {
  if (!isWithinBoard(coord, memory.boardSize)) {
    throw new Error(`updateAIMemory: coord out of bounds (${coord.row},${coord.col})`);
  }

  const fired = cloneFired(memory.fired);
  fired[coord.row][coord.col] = true;

  // Drop the just-fired coord from the queue regardless of outcome.
  let targetQueue = memory.targetQueue.filter(
    (c) => !(c.row === coord.row && c.col === coord.col),
  );
  let activeHits = memory.activeHits.slice();

  if (feedback.outcome === 'hit') {
    activeHits = [...activeHits, coord];
    // Enqueue any in-bounds, un-fired, not-already-queued neighbours.
    const queued = new Set(targetQueue.map(coordKey));
    queued.add(coordKey(coord)); // don't re-queue ourselves
    for (const n of getNeighborTargets(coord, memory.boardSize)) {
      const key = coordKey(n);
      if (queued.has(key)) continue;
      if (fired[n.row][n.col]) continue;
      targetQueue.push(n);
      queued.add(key);
    }
  } else if (feedback.outcome === 'sunk') {
    // The sinking shot itself is a hit, plus all earlier hits in this ship are
    // resolved. Drop them from activeHits, then rebuild the queue from any
    // hits that still belong to other unsunk ships.
    const sunk = feedback.sunkCells ?? [coord];
    const sunkKeys = new Set(sunk.map(coordKey));
    sunkKeys.add(coordKey(coord));
    activeHits = activeHits.filter((h) => !sunkKeys.has(coordKey(h)));

    if (activeHits.length === 0) {
      targetQueue = [];
    } else {
      const queued = new Set<string>();
      const rebuilt: CellCoord[] = [];
      for (const h of activeHits) {
        for (const n of getNeighborTargets(h, memory.boardSize)) {
          const key = coordKey(n);
          if (queued.has(key)) continue;
          if (fired[n.row][n.col]) continue;
          rebuilt.push(n);
          queued.add(key);
        }
      }
      targetQueue = rebuilt;
    }
  }
  // 'miss' and 'repeat' need no extra bookkeeping beyond marking fired.

  return {
    boardSize: memory.boardSize,
    fired,
    targetQueue,
    activeHits,
    lastShot: coord,
  };
}
