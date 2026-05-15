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

export type CellState = 'unknown' | 'miss' | 'hit' | 'sunk' | 'blocked';

export interface BoardState {
  ships: PlacedShip[];
  // ship index at each cell, or -1
  occupancy: number[][];
  // shots fired AT this board
  shots: CellState[][];
}

export const FLEET: ShipSpec[] = [
  { id: 'green-monster', name: 'The Green Monster', length: 5 },
  { id: 'peskys-pole', name: "Pesky's Pole Patrol", length: 4 },
  { id: 'citgo', name: 'The Citgo Cruiser', length: 3 },
  { id: 'yawkey-way', name: 'Yawkey Way Destroyer', length: 3 },
  { id: 'monster-seat', name: 'The Monster Seat Sub', length: 2 },
];
