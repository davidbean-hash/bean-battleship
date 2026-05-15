export const BOARD_SIZE = 10;

export type Orientation = 'H' | 'V';
export type Difficulty = 'moderate' | 'hard';
export type Phase = 'landing' | 'setup' | 'playing' | 'over';
export type Player = 'you' | 'ai';

export interface ShipSpec {
  id: string;
  name: string;
  length: number;
}

export interface PlacedShip extends ShipSpec {
  row: number;
  col: number;
  orientation: Orientation;
  hits: number;
}

export type CellState = 'unknown' | 'miss' | 'hit' | 'sunk';

export interface BoardState {
  ships: PlacedShip[];
  // ship index at each cell, or -1
  occupancy: number[][];
  // shots fired AT this board
  shots: CellState[][];
}

export const FLEET: ShipSpec[] = [
  { id: 'navy-bean', name: 'Navy Bean', length: 5 },
  { id: 'black-bean', name: 'Black Bean', length: 4 },
  { id: 'pinto-bean', name: 'Pinto Bean', length: 3 },
  { id: 'kidney-bean', name: 'Kidney Bean', length: 3 },
  { id: 'coffee-bean', name: 'Coffee Bean', length: 2 },
];
