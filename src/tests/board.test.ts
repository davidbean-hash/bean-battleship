import { describe, expect, it } from 'vitest';
import {
  areAllShipsSunk,
  canPlaceShip,
  createEmptyBoard,
  DEFAULT_BOARD_SIZE,
  generateRandomFleet,
  getAdjacentCells,
  getCellLabel,
  getShipCells,
  isShipSunk,
  isWithinBoard,
  placeShip,
  receiveShot,
  removeShip,
} from '../utils/board';
import { AUSTIN_FLEET } from '../data/ships';
import type { ShipDefinition } from '../types';

const ship = (id: string, length: number): ShipDefinition => ({
  id,
  name: id,
  length,
  themeColor: '#000',
  shortLabel: id.slice(0, 3).toUpperCase(),
  iconType: 'capitol',
});

describe('createEmptyBoard', () => {
  it('creates a 12x12 board by default', () => {
    const b = createEmptyBoard();
    expect(b.size).toBe(12);
    expect(b.cells).toHaveLength(12);
    for (const row of b.cells) {
      expect(row).toHaveLength(12);
      for (const cell of row) expect(cell.state).toBe('empty');
    }
    expect(b.ships).toEqual([]);
  });
});

describe('isWithinBoard', () => {
  it('accepts in-bounds and rejects out-of-bounds', () => {
    expect(isWithinBoard({ row: 0, col: 0 }, 12)).toBe(true);
    expect(isWithinBoard({ row: 11, col: 11 }, 12)).toBe(true);
    expect(isWithinBoard({ row: -1, col: 0 }, 12)).toBe(false);
    expect(isWithinBoard({ row: 0, col: 12 }, 12)).toBe(false);
  });
});

describe('getShipCells', () => {
  it('builds horizontal cells', () => {
    const cells = getShipCells({ row: 2, col: 3 }, 3, 'horizontal');
    expect(cells).toEqual([
      { row: 2, col: 3 },
      { row: 2, col: 4 },
      { row: 2, col: 5 },
    ]);
  });
  it('builds vertical cells', () => {
    const cells = getShipCells({ row: 2, col: 3 }, 3, 'vertical');
    expect(cells).toEqual([
      { row: 2, col: 3 },
      { row: 3, col: 3 },
      { row: 4, col: 3 },
    ]);
  });
});

describe('getAdjacentCells', () => {
  it('returns 8 neighbours for interior cells', () => {
    expect(getAdjacentCells({ row: 5, col: 5 }, 12)).toHaveLength(8);
  });
  it('returns 3 neighbours for a corner', () => {
    expect(getAdjacentCells({ row: 0, col: 0 }, 12)).toHaveLength(3);
  });
});

describe('placeShip', () => {
  it('places a ship horizontally', () => {
    const s = ship('h', 4);
    const b = placeShip(createEmptyBoard(12), s, { row: 1, col: 1 }, 'horizontal');
    for (let c = 1; c <= 4; c++) {
      expect(b.cells[1][c].state).toBe('ship');
      expect(b.cells[1][c].shipId).toBe('h');
    }
    expect(b.ships).toHaveLength(1);
  });

  it('places a ship vertically', () => {
    const s = ship('v', 3);
    const b = placeShip(createEmptyBoard(12), s, { row: 4, col: 6 }, 'vertical');
    for (let r = 4; r <= 6; r++) {
      expect(b.cells[r][6].state).toBe('ship');
    }
  });

  it('rejects placement outside the board', () => {
    const s = ship('oob', 5);
    expect(canPlaceShip(createEmptyBoard(12), s, { row: 0, col: 10 }, 'horizontal')).toBe(false);
    expect(() =>
      placeShip(createEmptyBoard(12), s, { row: 10, col: 0 }, 'vertical'),
    ).toThrow();
  });

  it('rejects overlapping ships', () => {
    let b = createEmptyBoard(12);
    b = placeShip(b, ship('a', 3), { row: 5, col: 2 }, 'horizontal');
    expect(canPlaceShip(b, ship('b', 3), { row: 5, col: 3 }, 'horizontal')).toBe(false);
  });

  it('rejects ships touching directly (orthogonally)', () => {
    let b = createEmptyBoard(12);
    b = placeShip(b, ship('a', 3), { row: 5, col: 5 }, 'horizontal'); // (5,5)-(5,7)
    // Directly above on (4,5)-(4,7)
    expect(canPlaceShip(b, ship('b', 3), { row: 4, col: 5 }, 'horizontal')).toBe(false);
    // Directly to the right starting at (5,8)
    expect(canPlaceShip(b, ship('c', 2), { row: 5, col: 8 }, 'horizontal')).toBe(false);
  });

  it('rejects ships touching diagonally', () => {
    let b = createEmptyBoard(12);
    b = placeShip(b, ship('a', 3), { row: 5, col: 5 }, 'horizontal'); // (5,5)-(5,7)
    // Diagonally touching top-right corner at (4,8)
    expect(canPlaceShip(b, ship('b', 2), { row: 4, col: 8 }, 'horizontal')).toBe(false);
    // Diagonally touching bottom-left at (6,4)
    expect(canPlaceShip(b, ship('c', 2), { row: 6, col: 3 }, 'horizontal')).toBe(false);
  });

  it('allows ships with one empty cell of separation', () => {
    let b = createEmptyBoard(12);
    b = placeShip(b, ship('a', 3), { row: 5, col: 5 }, 'horizontal');
    // Two rows away
    expect(canPlaceShip(b, ship('b', 3), { row: 7, col: 5 }, 'horizontal')).toBe(true);
  });
});

describe('removeShip', () => {
  it('clears the cells and removes the ship record', () => {
    let b = createEmptyBoard(12);
    b = placeShip(b, ship('a', 4), { row: 3, col: 3 }, 'horizontal');
    b = removeShip(b, 'a');
    for (let c = 3; c <= 6; c++) expect(b.cells[3][c].state).toBe('empty');
    expect(b.ships).toHaveLength(0);
  });

  it('is a no-op for unknown ids', () => {
    const b = createEmptyBoard(12);
    expect(removeShip(b, 'nope')).toBe(b);
  });
});

describe('receiveShot', () => {
  it('records a miss on empty water', () => {
    const b = createEmptyBoard(12);
    const { board, result } = receiveShot(b, { row: 0, col: 0 });
    expect(result.outcome).toBe('miss');
    expect(board.cells[0][0].state).toBe('miss');
  });

  it('records a hit on a ship cell', () => {
    let b = createEmptyBoard(12);
    b = placeShip(b, ship('a', 3), { row: 2, col: 2 }, 'horizontal');
    const { board, result } = receiveShot(b, { row: 2, col: 2 });
    expect(result.outcome).toBe('hit');
    expect(result.shipId).toBe('a');
    expect(board.cells[2][2].state).toBe('hit');
  });

  it('reports sunk when the final cell of a ship is hit', () => {
    let b = createEmptyBoard(12);
    b = placeShip(b, ship('a', 2), { row: 0, col: 0 }, 'horizontal');
    ({ board: b } = receiveShot(b, { row: 0, col: 0 }));
    const final = receiveShot(b, { row: 0, col: 1 });
    expect(final.result.outcome).toBe('sunk');
    expect(isShipSunk(final.board, 'a')).toBe(true);
  });

  it('safely ignores duplicate shots', () => {
    let b = createEmptyBoard(12);
    b = placeShip(b, ship('a', 2), { row: 0, col: 0 }, 'horizontal');
    const first = receiveShot(b, { row: 0, col: 0 });
    const second = receiveShot(first.board, { row: 0, col: 0 });
    expect(second.result.outcome).toBe('repeat');
    // Board reference unchanged on repeat.
    expect(second.board).toBe(first.board);
  });
});

describe('areAllShipsSunk', () => {
  it('returns false when ships remain', () => {
    let b = createEmptyBoard(12);
    b = placeShip(b, ship('a', 2), { row: 0, col: 0 }, 'horizontal');
    expect(areAllShipsSunk(b)).toBe(false);
  });

  it('returns true when every ship is fully hit', () => {
    let b = createEmptyBoard(12);
    b = placeShip(b, ship('a', 2), { row: 0, col: 0 }, 'horizontal');
    b = placeShip(b, ship('b', 2), { row: 5, col: 5 }, 'vertical');
    for (const c of [
      { row: 0, col: 0 },
      { row: 0, col: 1 },
      { row: 5, col: 5 },
      { row: 6, col: 5 },
    ]) {
      ({ board: b } = receiveShot(b, c));
    }
    expect(areAllShipsSunk(b)).toBe(true);
  });

  it('returns false on an empty board (no ships placed)', () => {
    expect(areAllShipsSunk(createEmptyBoard(12))).toBe(false);
  });
});

describe('getCellLabel', () => {
  it('formats coords as Letter+Number', () => {
    expect(getCellLabel({ row: 0, col: 0 })).toBe('A1');
    expect(getCellLabel({ row: 11, col: 11 })).toBe('L12');
  });
});

describe('generateRandomFleet', () => {
  it('places every Austin ship legally on a 12x12 board', () => {
    const b = generateRandomFleet(DEFAULT_BOARD_SIZE, AUSTIN_FLEET);
    expect(b.ships).toHaveLength(AUSTIN_FLEET.length);
    // Every ship's cells must be in-bounds and marked as ship.
    for (const s of b.ships) {
      expect(s.cells).toHaveLength(s.length);
      for (const c of s.cells) {
        expect(isWithinBoard(c, b.size)).toBe(true);
        expect(b.cells[c.row][c.col].state).toBe('ship');
        expect(b.cells[c.row][c.col].shipId).toBe(s.shipId);
      }
    }
  });

  it('obeys the no-touch rule for random fleets across many seeds', () => {
    for (let i = 0; i < 25; i++) {
      const b = generateRandomFleet(DEFAULT_BOARD_SIZE, AUSTIN_FLEET);
      // For each ship cell, every adjacent cell must either belong to the same ship or be empty.
      for (const s of b.ships) {
        const own = new Set(s.cells.map((c) => `${c.row},${c.col}`));
        for (const c of s.cells) {
          for (const n of getAdjacentCells(c, b.size)) {
            const cell = b.cells[n.row][n.col];
            if (cell.state === 'ship' && !own.has(`${n.row},${n.col}`)) {
              throw new Error(
                `Ships touching at ${getCellLabel(n)} (neighbour of ${getCellLabel(c)})`,
              );
            }
          }
        }
      }
    }
  });
});
