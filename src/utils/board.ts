import type {
  Board,
  BoardCell,
  CellCoord,
  Orientation,
  PlacedShip,
  ShipDefinition,
  ShotResult,
} from '../types';

export const DEFAULT_BOARD_SIZE = 12;

const ROW_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Create an empty board of the given size. */
export function createEmptyBoard(size: number = DEFAULT_BOARD_SIZE): Board {
  if (!Number.isInteger(size) || size <= 0) {
    throw new Error(`Invalid board size: ${size}`);
  }
  const cells: BoardCell[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => ({ state: 'empty' as const })),
  );
  return { size, cells, ships: [] };
}

/** True if the coord lies inside an `size`x`size` board. */
export function isWithinBoard(coord: CellCoord, size: number): boolean {
  return (
    Number.isInteger(coord.row) &&
    Number.isInteger(coord.col) &&
    coord.row >= 0 &&
    coord.col >= 0 &&
    coord.row < size &&
    coord.col < size
  );
}

/** Compute the coordinates a ship would occupy from the given start. */
export function getShipCells(
  start: CellCoord,
  length: number,
  orientation: Orientation,
): CellCoord[] {
  const cells: CellCoord[] = [];
  for (let i = 0; i < length; i++) {
    cells.push(
      orientation === 'horizontal'
        ? { row: start.row, col: start.col + i }
        : { row: start.row + i, col: start.col },
    );
  }
  return cells;
}

/** Return all in-bounds neighbours (up to 8) around the coord. */
export function getAdjacentCells(coord: CellCoord, size: number): CellCoord[] {
  const out: CellCoord[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const n = { row: coord.row + dr, col: coord.col + dc };
      if (isWithinBoard(n, size)) out.push(n);
    }
  }
  return out;
}

/**
 * Check whether a ship can legally be placed.
 * - All cells must be in-bounds.
 * - Cells must currently be empty.
 * - No adjacent cell (orthogonal or diagonal) may contain another ship.
 */
export function canPlaceShip(
  board: Board,
  ship: Pick<ShipDefinition, 'id' | 'length'>,
  start: CellCoord,
  orientation: Orientation,
): boolean {
  const cells = getShipCells(start, ship.length, orientation);
  // Bounds + occupancy.
  for (const c of cells) {
    if (!isWithinBoard(c, board.size)) return false;
    if (board.cells[c.row][c.col].state !== 'empty') return false;
  }
  // No-touch rule: every adjacent cell that isn't part of this ship must be empty.
  const shipKey = (c: CellCoord) => `${c.row},${c.col}`;
  const own = new Set(cells.map(shipKey));
  for (const c of cells) {
    for (const n of getAdjacentCells(c, board.size)) {
      if (own.has(shipKey(n))) continue;
      if (board.cells[n.row][n.col].state !== 'empty') return false;
    }
  }
  return true;
}

function cloneCells(cells: BoardCell[][]): BoardCell[][] {
  return cells.map((row) => row.map((cell) => ({ ...cell })));
}

/** Place a ship on the board, returning a new Board. Throws if illegal. */
export function placeShip(
  board: Board,
  ship: ShipDefinition,
  start: CellCoord,
  orientation: Orientation,
): Board {
  if (!canPlaceShip(board, ship, start, orientation)) {
    throw new Error(
      `Cannot place ship ${ship.id} at (${start.row},${start.col}) ${orientation}`,
    );
  }
  const cells = cloneCells(board.cells);
  const shipCells = getShipCells(start, ship.length, orientation);
  for (const c of shipCells) {
    cells[c.row][c.col] = { state: 'ship', shipId: ship.id };
  }
  const placed: PlacedShip = {
    shipId: ship.id,
    length: ship.length,
    start,
    orientation,
    cells: shipCells,
    hits: shipCells.map(() => false),
  };
  return { size: board.size, cells, ships: [...board.ships, placed] };
}

/** Remove a ship by id, returning a new Board. No-op if not found. */
export function removeShip(board: Board, shipId: string): Board {
  const target = board.ships.find((s) => s.shipId === shipId);
  if (!target) return board;
  const cells = cloneCells(board.cells);
  for (const c of target.cells) {
    cells[c.row][c.col] = { state: 'empty' };
  }
  return {
    size: board.size,
    cells,
    ships: board.ships.filter((s) => s.shipId !== shipId),
  };
}

/**
 * Resolve a shot at `coord`. Returns the new board plus the outcome.
 * Repeat shots (already hit/miss) return outcome 'repeat' and leave the board unchanged.
 */
export function receiveShot(
  board: Board,
  coord: CellCoord,
): { board: Board; result: ShotResult } {
  if (!isWithinBoard(coord, board.size)) {
    throw new Error(`Shot out of bounds: (${coord.row},${coord.col})`);
  }
  const existing = board.cells[coord.row][coord.col];
  if (existing.state === 'hit' || existing.state === 'miss') {
    return { board, result: { coord, outcome: 'repeat', shipId: existing.shipId } };
  }

  const cells = cloneCells(board.cells);
  if (existing.state === 'ship') {
    const shipId = existing.shipId!;
    cells[coord.row][coord.col] = { state: 'hit', shipId };
    const ships = board.ships.map((s) => {
      if (s.shipId !== shipId) return s;
      const hits = s.hits.slice();
      const idx = s.cells.findIndex(
        (c) => c.row === coord.row && c.col === coord.col,
      );
      if (idx >= 0) hits[idx] = true;
      return { ...s, hits };
    });
    const nextBoard: Board = { size: board.size, cells, ships };
    const sunk = isShipSunk(nextBoard, shipId);
    return {
      board: nextBoard,
      result: { coord, outcome: sunk ? 'sunk' : 'hit', shipId },
    };
  }

  // empty -> miss
  cells[coord.row][coord.col] = { state: 'miss' };
  return {
    board: { size: board.size, cells, ships: board.ships },
    result: { coord, outcome: 'miss' },
  };
}

/** True if every cell of the named ship has been hit. */
export function isShipSunk(board: Board, shipId: string): boolean {
  const ship = board.ships.find((s) => s.shipId === shipId);
  if (!ship) return false;
  return ship.hits.every(Boolean);
}

/** True if every placed ship has been sunk (and at least one is placed). */
export function areAllShipsSunk(board: Board): boolean {
  if (board.ships.length === 0) return false;
  return board.ships.every((s) => s.hits.every(Boolean));
}

/** Convert a coord to a human label like "A1", "L12". */
export function getCellLabel(coord: CellCoord): string {
  const letter = ROW_LETTERS[coord.row] ?? '?';
  return `${letter}${coord.col + 1}`;
}

/**
 * Randomly place every ship in `ships` on a fresh board, obeying the no-touch rule.
 * Throws if a legal layout cannot be found within the retry budget.
 */
export function generateRandomFleet(
  boardSize: number,
  ships: ShipDefinition[],
  rng: () => number = Math.random,
): Board {
  const orientations: Orientation[] = ['horizontal', 'vertical'];
  const ordered = [...ships].sort((a, b) => b.length - a.length);

  const MAX_FLEET_ATTEMPTS = 50;
  const MAX_SHIP_ATTEMPTS = 500;

  for (let fleetAttempt = 0; fleetAttempt < MAX_FLEET_ATTEMPTS; fleetAttempt++) {
    let board = createEmptyBoard(boardSize);
    let success = true;

    for (const ship of ordered) {
      let placed = false;
      for (let attempt = 0; attempt < MAX_SHIP_ATTEMPTS; attempt++) {
        const orientation = orientations[Math.floor(rng() * 2)];
        const maxRow = orientation === 'vertical' ? boardSize - ship.length : boardSize - 1;
        const maxCol = orientation === 'horizontal' ? boardSize - ship.length : boardSize - 1;
        if (maxRow < 0 || maxCol < 0) break;
        const start: CellCoord = {
          row: Math.floor(rng() * (maxRow + 1)),
          col: Math.floor(rng() * (maxCol + 1)),
        };
        if (canPlaceShip(board, ship, start, orientation)) {
          board = placeShip(board, ship, start, orientation);
          placed = true;
          break;
        }
      }
      if (!placed) {
        success = false;
        break;
      }
    }

    if (success) return board;
  }

  throw new Error('generateRandomFleet: could not place fleet after retries');
}
