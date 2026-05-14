import {
  BOARD_SIZE,
  BoardState,
  CellState,
  FLEET,
  Orientation,
  PlacedShip,
  ShipSpec,
} from '../types';

export function emptyBoard(): BoardState {
  const occupancy: number[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill(-1),
  );
  const shots: CellState[][] = Array.from({ length: BOARD_SIZE }, () =>
    Array(BOARD_SIZE).fill('unknown') as CellState[],
  );
  return { ships: [], occupancy, shots };
}

export function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE;
}

export function shipCells(
  row: number,
  col: number,
  length: number,
  orientation: Orientation,
): Array<[number, number]> {
  const cells: Array<[number, number]> = [];
  for (let i = 0; i < length; i++) {
    const r = orientation === 'H' ? row : row + i;
    const c = orientation === 'H' ? col + i : col;
    cells.push([r, c]);
  }
  return cells;
}

export function canPlace(
  board: BoardState,
  row: number,
  col: number,
  length: number,
  orientation: Orientation,
): boolean {
  const cells = shipCells(row, col, length, orientation);
  for (const [r, c] of cells) {
    if (!inBounds(r, c)) return false;
    if (board.occupancy[r][c] !== -1) return false;
  }
  // No-touch rule: ships may not be orthogonally or diagonally adjacent.
  const own = new Set(cells.map(([r, c]) => `${r},${c}`));
  for (const [r, c] of cells) {
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (!inBounds(nr, nc)) continue;
        if (own.has(`${nr},${nc}`)) continue;
        if (board.occupancy[nr][nc] !== -1) return false;
      }
    }
  }
  return true;
}

export function placeShip(
  board: BoardState,
  spec: ShipSpec,
  row: number,
  col: number,
  orientation: Orientation,
): boolean {
  if (!canPlace(board, row, col, spec.length, orientation)) return false;
  const ship: PlacedShip = { ...spec, row, col, orientation, hits: 0 };
  const idx = board.ships.length;
  board.ships.push(ship);
  for (const [r, c] of shipCells(row, col, spec.length, orientation)) {
    board.occupancy[r][c] = idx;
  }
  return true;
}

export function randomizeBoard(rng: () => number = Math.random): BoardState {
  while (true) {
    const board = emptyBoard();
    let ok = true;
    for (const spec of FLEET) {
      let placed = false;
      for (let attempt = 0; attempt < 200 && !placed; attempt++) {
        const orientation: Orientation = rng() < 0.5 ? 'H' : 'V';
        const row = Math.floor(rng() * BOARD_SIZE);
        const col = Math.floor(rng() * BOARD_SIZE);
        if (canPlace(board, row, col, spec.length, orientation)) {
          placeShip(board, spec, row, col, orientation);
          placed = true;
        }
      }
      if (!placed) {
        ok = false;
        break;
      }
    }
    if (ok) return board;
  }
}

export interface ShotResult {
  result: 'miss' | 'hit' | 'sunk' | 'repeat';
  shipIndex?: number;
  sunkShip?: PlacedShip;
  gameOver: boolean;
}

export function fireAt(board: BoardState, row: number, col: number): ShotResult {
  if (!inBounds(row, col)) {
    return { result: 'repeat', gameOver: false };
  }
  const prior = board.shots[row][col];
  if (prior !== 'unknown') {
    return { result: 'repeat', gameOver: false };
  }
  const shipIdx = board.occupancy[row][col];
  if (shipIdx === -1) {
    board.shots[row][col] = 'miss';
    return { result: 'miss', gameOver: false };
  }
  const ship = board.ships[shipIdx];
  ship.hits += 1;
  if (ship.hits >= ship.length) {
    // mark all sunk
    for (const [r, c] of shipCells(ship.row, ship.col, ship.length, ship.orientation)) {
      board.shots[r][c] = 'sunk';
    }
    const gameOver = board.ships.every((s) => s.hits >= s.length);
    return { result: 'sunk', shipIndex: shipIdx, sunkShip: ship, gameOver };
  }
  board.shots[row][col] = 'hit';
  return { result: 'hit', shipIndex: shipIdx, gameOver: false };
}

export function allSunk(board: BoardState): boolean {
  return board.ships.length > 0 && board.ships.every((s) => s.hits >= s.length);
}
