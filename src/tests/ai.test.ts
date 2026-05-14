import { describe, expect, it } from 'vitest';
import {
  createInitialAIMemory,
  getAIMove,
  getNeighborTargets,
  hasAIFiredAt,
  updateAIMemory,
} from '../utils/ai';
import type { AIMemory, AIShotFeedback } from '../utils/ai';
import {
  areAllShipsSunk,
  createEmptyBoard,
  generateRandomFleet,
  placeShip,
  receiveShot,
} from '../utils/board';
import { AUSTIN_FLEET } from '../data/ships';
import type { CellCoord, ShotResult } from '../types';

const BOARD_SIZE = 12;

const fire = (
  memory: AIMemory,
  coord: CellCoord,
  feedback: AIShotFeedback,
): AIMemory => updateAIMemory(memory, coord, feedback);

describe('createInitialAIMemory', () => {
  it('creates an empty 12x12 fired matrix', () => {
    const m = createInitialAIMemory(BOARD_SIZE);
    expect(m.boardSize).toBe(12);
    expect(m.fired).toHaveLength(12);
    for (const row of m.fired) {
      expect(row).toHaveLength(12);
      expect(row.every((b) => b === false)).toBe(true);
    }
    expect(m.targetQueue).toEqual([]);
    expect(m.activeHits).toEqual([]);
  });

  it('rejects invalid sizes', () => {
    expect(() => createInitialAIMemory(0)).toThrow();
    expect(() => createInitialAIMemory(-3)).toThrow();
  });
});

describe('getNeighborTargets', () => {
  it('returns 4 orthogonal neighbours for an interior cell', () => {
    const ns = getNeighborTargets({ row: 5, col: 5 }, 12);
    expect(ns).toEqual([
      { row: 4, col: 5 },
      { row: 6, col: 5 },
      { row: 5, col: 4 },
      { row: 5, col: 6 },
    ]);
  });
  it('omits out-of-board neighbours at corners', () => {
    expect(getNeighborTargets({ row: 0, col: 0 }, 12)).toEqual([
      { row: 1, col: 0 },
      { row: 0, col: 1 },
    ]);
    expect(getNeighborTargets({ row: 11, col: 11 }, 12)).toEqual([
      { row: 10, col: 11 },
      { row: 11, col: 10 },
    ]);
  });
});

describe('getAIMove', () => {
  it('returns an in-bounds coord on a fresh memory', () => {
    const m = createInitialAIMemory(BOARD_SIZE);
    const move = getAIMove(m, BOARD_SIZE);
    expect(move.row).toBeGreaterThanOrEqual(0);
    expect(move.row).toBeLessThan(BOARD_SIZE);
    expect(move.col).toBeGreaterThanOrEqual(0);
    expect(move.col).toBeLessThan(BOARD_SIZE);
  });

  it('never repeats a shot across many turns', () => {
    let m = createInitialAIMemory(BOARD_SIZE);
    const seen = new Set<string>();
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
      const move = getAIMove(m, BOARD_SIZE);
      const key = `${move.row},${move.col}`;
      expect(seen.has(key)).toBe(false);
      seen.add(key);
      // Treat every shot as a miss so target mode never engages.
      m = fire(m, move, { outcome: 'miss' });
    }
    // After a full sweep, every cell has been fired upon.
    expect(seen.size).toBe(BOARD_SIZE * BOARD_SIZE);
  });

  it('uses checkerboard parity in hunt mode', () => {
    const m = createInitialAIMemory(BOARD_SIZE);
    // Sample 50 fresh draws; every one should land on an even-parity cell.
    for (let i = 0; i < 50; i++) {
      const move = getAIMove(m, BOARD_SIZE);
      expect((move.row + move.col) % 2).toBe(0);
    }
  });

  it('falls back to remaining cells when parity is exhausted', () => {
    let m = createInitialAIMemory(BOARD_SIZE);
    // Mark every even-parity cell as fired.
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if ((r + c) % 2 === 0) {
          m = fire(m, { row: r, col: c }, { outcome: 'miss' });
        }
      }
    }
    const move = getAIMove(m, BOARD_SIZE);
    expect((move.row + move.col) % 2).toBe(1);
  });

  it('throws if no cells remain', () => {
    let m = createInitialAIMemory(2);
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        m = fire(m, { row: r, col: c }, { outcome: 'miss' });
      }
    }
    expect(() => getAIMove(m, 2)).toThrow();
  });
});

describe('updateAIMemory — target mode', () => {
  it('queues the four neighbours of a hit', () => {
    let m = createInitialAIMemory(BOARD_SIZE);
    const hit = { row: 5, col: 5 };
    m = fire(m, hit, { outcome: 'hit' });
    expect(m.activeHits).toContainEqual(hit);
    expect(m.targetQueue).toEqual(
      expect.arrayContaining([
        { row: 4, col: 5 },
        { row: 6, col: 5 },
        { row: 5, col: 4 },
        { row: 5, col: 6 },
      ]),
    );
    expect(m.targetQueue).toHaveLength(4);
  });

  it('does not queue out-of-bounds or already-fired neighbours', () => {
    let m = createInitialAIMemory(BOARD_SIZE);
    // Pre-fire (0,1) so it should be skipped when (0,0) is hit.
    m = fire(m, { row: 0, col: 1 }, { outcome: 'miss' });
    m = fire(m, { row: 0, col: 0 }, { outcome: 'hit' });
    // (0,0) corner has only (1,0) and (0,1) as in-bounds neighbours; (0,1) was
    // already fired, so only (1,0) should be queued.
    expect(m.targetQueue).toEqual([{ row: 1, col: 0 }]);
  });

  it('prefers queued targets over hunt picks', () => {
    let m = createInitialAIMemory(BOARD_SIZE);
    m = fire(m, { row: 5, col: 5 }, { outcome: 'hit' });
    const next = getAIMove(m, BOARD_SIZE);
    expect(m.targetQueue).toContainEqual(next);
  });

  it('clears the target queue when the ship is sunk and no other hits remain', () => {
    let m = createInitialAIMemory(BOARD_SIZE);
    const a = { row: 3, col: 3 };
    const b = { row: 3, col: 4 };
    m = fire(m, a, { outcome: 'hit' });
    m = fire(m, b, { outcome: 'sunk', sunkCells: [a, b] });
    expect(m.activeHits).toEqual([]);
    expect(m.targetQueue).toEqual([]);
  });

  it('keeps targeting unrelated active hits after a sink', () => {
    let m = createInitialAIMemory(BOARD_SIZE);
    // Hit ship A at (3,3)-(3,4), then hit a cell of a different ship at (8,8),
    // then sink only ship A. The (8,8) hit must remain active and re-seed the queue.
    m = fire(m, { row: 3, col: 3 }, { outcome: 'hit' });
    m = fire(m, { row: 8, col: 8 }, { outcome: 'hit' });
    m = fire(m, { row: 3, col: 4 }, {
      outcome: 'sunk',
      sunkCells: [
        { row: 3, col: 3 },
        { row: 3, col: 4 },
      ],
    });
    expect(m.activeHits).toEqual([{ row: 8, col: 8 }]);
    // Queue should be neighbours of (8,8) only, none of which were fired upon.
    expect(m.targetQueue).toEqual(
      expect.arrayContaining([
        { row: 7, col: 8 },
        { row: 9, col: 8 },
        { row: 8, col: 7 },
        { row: 8, col: 9 },
      ]),
    );
    expect(m.targetQueue).toHaveLength(4);
  });

  it('marks repeat shots as fired without queueing', () => {
    let m = createInitialAIMemory(BOARD_SIZE);
    m = fire(m, { row: 0, col: 0 }, { outcome: 'miss' });
    m = fire(m, { row: 0, col: 0 }, { outcome: 'repeat' });
    expect(hasAIFiredAt(m, { row: 0, col: 0 })).toBe(true);
    expect(m.targetQueue).toEqual([]);
  });
});

describe('hasAIFiredAt', () => {
  it('reports false initially and true after a shot', () => {
    let m = createInitialAIMemory(BOARD_SIZE);
    expect(hasAIFiredAt(m, { row: 4, col: 7 })).toBe(false);
    m = fire(m, { row: 4, col: 7 }, { outcome: 'miss' });
    expect(hasAIFiredAt(m, { row: 4, col: 7 })).toBe(true);
  });
  it('returns false for out-of-board coords', () => {
    const m = createInitialAIMemory(BOARD_SIZE);
    expect(hasAIFiredAt(m, { row: -1, col: 0 })).toBe(false);
    expect(hasAIFiredAt(m, { row: 0, col: 12 })).toBe(false);
  });
});

describe('AI integration — full game against a random fleet', () => {
  it('eventually sinks every ship without firing twice at the same cell', () => {
    // Map ship-id -> full set of cells, used to translate engine "sunk" results
    // into the cell list the AI consumes.
    const board0 = generateRandomFleet(BOARD_SIZE, AUSTIN_FLEET);
    let board = board0;
    let memory = createInitialAIMemory(BOARD_SIZE);
    const fired = new Set<string>();
    let safety = BOARD_SIZE * BOARD_SIZE + 5;

    while (!areAllShipsSunk(board) && safety-- > 0) {
      const move = getAIMove(memory, BOARD_SIZE);
      const key = `${move.row},${move.col}`;
      expect(fired.has(key)).toBe(false);
      fired.add(key);

      const { board: nextBoard, result } = receiveShot(board, move);
      board = nextBoard;
      const feedback: AIShotFeedback = { outcome: result.outcome };
      if (result.outcome === 'sunk' && result.shipId) {
        const ship = board.ships.find((s) => s.shipId === result.shipId);
        feedback.sunkCells = ship ? ship.cells : [move];
      }
      memory = updateAIMemory(memory, move, feedback);
    }

    expect(areAllShipsSunk(board)).toBe(true);
  });

  it('handles a tiny board exhaustively', () => {
    // 3x3 board with a single horizontal length-2 ship at (0,0)-(0,1).
    let board = createEmptyBoard(3);
    board = placeShip(
      board,
      { id: 's', name: 's', length: 2, themeColor: '#000', shortLabel: 'S', iconType: 'capitol' },
      { row: 0, col: 0 },
      'horizontal',
    );
    let memory = createInitialAIMemory(3);
    const fired = new Set<string>();
    for (let i = 0; i < 9 && !areAllShipsSunk(board); i++) {
      const move = getAIMove(memory, 3);
      expect(fired.has(`${move.row},${move.col}`)).toBe(false);
      fired.add(`${move.row},${move.col}`);
      let result: ShotResult;
      ({ board, result } = receiveShot(board, move));
      const fb: AIShotFeedback = { outcome: result.outcome };
      if (result.outcome === 'sunk' && result.shipId) {
        const ship = board.ships.find((s) => s.shipId === result.shipId);
        fb.sunkCells = ship?.cells;
      }
      memory = updateAIMemory(memory, move, fb);
    }
    expect(areAllShipsSunk(board)).toBe(true);
  });
});
