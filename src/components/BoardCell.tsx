import type { CSSProperties, DragEvent, MouseEvent } from 'react';

export type CellVisualState =
  | 'empty'
  | 'ship'
  | 'hit'
  | 'miss'
  | 'sunk'
  | 'preview-valid'
  | 'preview-invalid';

interface BoardCellProps {
  state: CellVisualState;
  variant: 'player' | 'enemy';
  coordLabel: string;
  shipColor?: string;
  shipLabel?: string;
  shipLabelSpan?: number;
  shipLabelOrientation?: 'horizontal' | 'vertical';
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onDragOver?: (e: DragEvent<HTMLButtonElement>) => void;
  onDrop?: (e: DragEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

export function BoardCell({
  state,
  variant,
  coordLabel,
  shipColor,
  shipLabel,
  shipLabelSpan,
  shipLabelOrientation = 'horizontal',
  onClick,
  onMouseEnter,
  onMouseLeave,
  onDragOver,
  onDrop,
  disabled,
}: BoardCellProps) {
  const classes = [
    'cell',
    `cell-${state}`,
    `cell-${variant}`,
  ].join(' ');

  const style: CSSProperties = {};
  if ((state === 'ship' || state === 'sunk') && shipColor) {
    style.background = shipColor;
  }

  // The label spans across the ship by absolutely positioning a child element
  // whose width covers `length` cells (accounting for the 2px grid gap).
  const labelStyle: CSSProperties | undefined = shipLabel && shipLabelSpan
    ? shipLabelOrientation === 'horizontal'
      ? {
          width: `calc(${shipLabelSpan * 100}% + ${(shipLabelSpan - 1) * 2}px)`,
          height: '100%',
        }
      : {
          width: '100%',
          height: `calc(${shipLabelSpan * 100}% + ${(shipLabelSpan - 1) * 2}px)`,
          writingMode: 'vertical-rl',
        }
    : undefined;

  return (
    <button
      type="button"
      className={classes}
      style={style}
      data-coord={coordLabel}
      aria-label={`${coordLabel} ${state}`}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onDragOver={onDragOver}
      onDrop={onDrop}
      disabled={disabled}
    >
      {state === 'hit' && <span className="mark mark-hit" aria-hidden>✕</span>}
      {state === 'sunk' && <span className="mark mark-sunk" aria-hidden>✕</span>}
      {state === 'miss' && <span className="mark mark-miss" aria-hidden />}
      {shipLabel && shipLabelSpan && (
        <span className="ship-label" style={labelStyle} aria-hidden>
          {shipLabel}
        </span>
      )}
    </button>
  );
}
