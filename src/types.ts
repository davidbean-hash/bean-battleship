// Core type definitions for Austin Battleship.

export type Orientation = 'horizontal' | 'vertical';

export type GamePhase = 'placement' | 'playing' | 'gameover';

export type PlayerType = 'human' | 'ai';

export interface CellCoord {
  row: number; // 0-indexed, 0 == 'A'
  col: number; // 0-indexed, 0 == '1'
}

export type IconType =
  | 'capitol'
  | 'bats'
  | 'rainey'
  | 'paddleboard'
  | 'springs'
  | 'tap'
  | 'kite';

export interface ShipDefinition {
  id: string;
  name: string;
  length: number;
  themeColor: string;
  shortLabel: string;
  iconType: IconType;
  flavor?: string;
}

export interface PlacedShip {
  shipId: string;
  length: number;
  start: CellCoord;
  orientation: Orientation;
  cells: CellCoord[];
  hits: boolean[]; // parallel to cells
}

export type CellState = 'empty' | 'ship' | 'hit' | 'miss';

export interface BoardCell {
  state: CellState;
  shipId?: string;
}

export interface Board {
  size: number;
  cells: BoardCell[][];
  ships: PlacedShip[];
}

export type ShotOutcome = 'hit' | 'miss' | 'sunk' | 'repeat';

export interface ShotResult {
  coord: CellCoord;
  outcome: ShotOutcome;
  shipId?: string;
}
