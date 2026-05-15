import { describe, expect, it } from 'vitest';
import { FLEET } from '../types';
import { emptyBoard, fireAt, placeShip, randomizeBoard, shipCells } from '../utils/board';

describe('board engine', () => {
  it('enforces no-touch placement rule (including diagonals)', () => {
    const board = emptyBoard();
    const flagship = FLEET[0];
    const escort = FLEET[4];

    expect(placeShip(board, flagship, 2, 2, 'H')).toBe(true);

    // Diagonal touch should be blocked
    expect(placeShip(board, escort, 1, 1, 'H')).toBe(false);
    // Orthogonal touch (directly above) should be blocked
    expect(placeShip(board, escort, 1, 2, 'H')).toBe(false);
    // Two rows away should be allowed
    expect(placeShip(board, escort, 4, 4, 'H')).toBe(true);
  });

  it('marks a full blocked ring around a sunk ship (including prior misses)', () => {
    const board = emptyBoard();
    const sub = FLEET[4];

    expect(placeShip(board, sub, 5, 5, 'H')).toBe(true);

    expect(fireAt(board, 4, 5).result).toBe('miss');
    expect(fireAt(board, 6, 6).result).toBe('miss');

    const firstHit = fireAt(board, 5, 5);
    expect(firstHit.result).toBe('hit');

    const sunk = fireAt(board, 5, 6);
    expect(sunk.result).toBe('sunk');

    expect(board.shots[4][5]).toBe('blocked');
    expect(board.shots[6][6]).toBe('blocked');
    expect(board.shots[4][4]).toBe('blocked');
    expect(board.shots[5][4]).toBe('blocked');
    expect(board.shots[6][5]).toBe('blocked');
  });

  it('generates legal random fleets that place every ship', () => {
    const board = randomizeBoard();

    expect(board.ships).toHaveLength(FLEET.length);

    for (const ship of board.ships) {
      for (const [r, c] of shipCells(ship.row, ship.col, ship.length, ship.orientation)) {
        expect(board.occupancy[r][c]).toBeGreaterThanOrEqual(0);
      }
    }
  });
});
