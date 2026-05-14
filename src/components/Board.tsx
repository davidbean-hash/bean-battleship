import { useMemo, type ReactElement } from 'react';
import type { Board as BoardModel, CellCoord } from '../types';
import { AUSTIN_FLEET } from '../data/ships';
import { BoardCell, type CellVisualState } from './BoardCell';

interface BoardProps {
  board: BoardModel;
  variant: 'player' | 'enemy';
  title: string;
  subtitle?: string;
  /** When true, ship cells are visible. Player board: true; enemy board: false. */
  revealShips: boolean;
  /** Optional placement preview (e.g. during ship placement UX). */
  preview?: { cells: CellCoord[]; valid: boolean };
  onCellClick?: (coord: CellCoord) => void;
  onCellHover?: (coord: CellCoord | null) => void;
  onCellDrop?: (coord: CellCoord) => void;
  /** When true, cells accept HTML5 drops. */
  acceptDrop?: boolean;
  disableCells?: boolean;
}

const ROW_LETTERS = 'ABCDEFGHIJKL'.split('');

const SHIP_LOOKUP = new Map(AUSTIN_FLEET.map((s) => [s.id, s]));

export function Board({
  board,
  variant,
  title,
  subtitle,
  revealShips,
  preview,
  onCellClick,
  onCellHover,
  onCellDrop,
  acceptDrop,
  disableCells,
}: BoardProps) {
  const size = board.size;

  // Pre-compute which cells should render the ship's centered label.
  // The label is rendered on the middle cell of the ship and absolutely
  // positioned to span the full ship length.
  const labelInfo = useMemo(() => {
    const map = new Map<
      string,
      { label: string; span: number; orientation: 'horizontal' | 'vertical' }
    >();
    for (const ship of board.ships) {
      const def = SHIP_LOOKUP.get(ship.shipId);
      if (!def) continue;
      const mid = Math.floor((ship.length - 1) / 2);
      const cell = ship.cells[mid];
      map.set(`${cell.row},${cell.col}`, {
        label: def.shortLabel,
        span: ship.length,
        orientation: ship.orientation,
      });
    }
    return map;
  }, [board.ships]);

  // Pre-compute sunk-ship membership for hit cells.
  const sunkShipIds = useMemo(
    () =>
      new Set(
        board.ships
          .filter((s) => s.hits.every(Boolean))
          .map((s) => s.shipId),
      ),
    [board.ships],
  );

  // Quick lookup for placement preview cells.
  const previewKeys = useMemo(() => {
    if (!preview) return null;
    return {
      keys: new Set(preview.cells.map((c) => `${c.row},${c.col}`)),
      valid: preview.valid,
    };
  }, [preview]);

  const cells: ReactElement[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const coord = { row: r, col: c };
      const key = `${r},${c}`;
      const cell = board.cells[r][c];
      let state: CellVisualState = 'empty';

      if (previewKeys?.keys.has(key)) {
        state = previewKeys.valid ? 'preview-valid' : 'preview-invalid';
      } else if (cell.state === 'miss') {
        state = 'miss';
      } else if (cell.state === 'hit') {
        state = cell.shipId && sunkShipIds.has(cell.shipId) ? 'sunk' : 'hit';
      } else if (cell.state === 'ship') {
        state = revealShips ? 'ship' : 'empty';
      }

      const def = cell.shipId ? SHIP_LOOKUP.get(cell.shipId) : undefined;
      const showShipColor = revealShips || state === 'sunk' || state === 'hit';
      const shipColor = showShipColor && def ? def.themeColor : undefined;

      const labelEntry = labelInfo.get(key);
      const showLabel = revealShips && labelEntry && (state === 'ship');

      cells.push(
        <BoardCell
          key={key}
          state={state}
          variant={variant}
          coordLabel={`${ROW_LETTERS[r]}${c + 1}`}
          shipColor={shipColor}
          shipLabel={showLabel ? labelEntry.label : undefined}
          shipLabelSpan={showLabel ? labelEntry.span : undefined}
          shipLabelOrientation={showLabel ? labelEntry.orientation : undefined}
          onClick={onCellClick ? () => onCellClick(coord) : undefined}
          onMouseEnter={onCellHover ? () => onCellHover(coord) : undefined}
          onMouseLeave={onCellHover ? () => onCellHover(null) : undefined}
          onDragOver={
            acceptDrop
              ? (e) => {
                  e.preventDefault();
                  onCellHover?.(coord);
                }
              : undefined
          }
          onDrop={
            acceptDrop && onCellDrop
              ? (e) => {
                  e.preventDefault();
                  onCellDrop(coord);
                }
              : undefined
          }
          disabled={disableCells}
        />,
      );
    }
  }

  return (
    <section className={`board board-${variant}`}>
      <header className="board-header">
        <span className="panel-eyebrow">
          {variant === 'player' ? 'Your Waters' : 'Enemy Waters'}
        </span>
        <h2 className="panel-title">
          <span className="panel-title__star" aria-hidden>★</span>
          <span>{title}</span>
          <span className="panel-title__star" aria-hidden>★</span>
        </h2>
        {subtitle && <p className="board-subtitle">{subtitle}</p>}
      </header>
      <div className="board-grid-wrap">
        <div className="board-col-axis" aria-hidden>
          <span />
          {Array.from({ length: size }, (_, i) => (
            <span key={i}>{i + 1}</span>
          ))}
        </div>
        <div className="board-body">
          <div className="board-row-axis" aria-hidden>
            {ROW_LETTERS.slice(0, size).map((l) => (
              <span key={l}>{l}</span>
            ))}
          </div>
          <div
            className="board-grid"
            style={{
              gridTemplateColumns: `repeat(${size}, 1fr)`,
              gridTemplateRows: `repeat(${size}, 1fr)`,
            }}
          >
            {cells}
          </div>
        </div>
      </div>
    </section>
  );
}
