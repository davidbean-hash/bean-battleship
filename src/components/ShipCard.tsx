import type { CSSProperties } from 'react';
import type { Orientation, ShipDefinition } from '../types';
import { AustinShipIcon } from './AustinShipIcon';

export type ShipPlacementStatus = 'pending' | 'placed' | 'sunk';

interface ShipCardProps {
  ship: ShipDefinition;
  status: ShipPlacementStatus;
  orientation: Orientation;
  selected?: boolean;
  onSelect?: () => void;
  onRotate?: () => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const STATUS_LABEL: Record<ShipPlacementStatus, string> = {
  pending: 'Awaiting deployment',
  placed: 'Deployed',
  sunk: 'Sunk',
};

export function ShipCard({
  ship,
  status,
  orientation,
  selected,
  onSelect,
  onRotate,
  onDragStart,
  onDragEnd,
}: ShipCardProps) {
  const className = [
    'ship-card',
    `ship-card--${status}`,
    selected ? 'ship-card--selected' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article
      className={className}
      style={{ '--ship-accent': ship.themeColor } as CSSProperties}
      draggable={Boolean(onDragStart) && status !== 'sunk'}
      onDragStart={(e) => {
        if (!onDragStart) return;
        e.dataTransfer.setData('text/plain', ship.id);
        e.dataTransfer.effectAllowed = 'move';
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
    >
      <div className="ship-card__star" aria-hidden>★</div>
      <div className="ship-card__icon">
        <AustinShipIcon type={ship.iconType} size={48} />
      </div>
      <div className="ship-card__body">
        <h3 className="ship-card__name">{ship.name}</h3>
        <div className="ship-card__pips" aria-label={`Length ${ship.length}`}>
          {Array.from({ length: ship.length }, (_, i) => (
            <span key={i} className="ship-pip" />
          ))}
          <span className="ship-card__len">·{ship.length}</span>
        </div>
        <p className="ship-card__status">{STATUS_LABEL[status]}</p>
      </div>
      <button
        type="button"
        className="ship-card__rotate"
        aria-label={`Rotate ${ship.name} (currently ${orientation})`}
        title={`Currently ${orientation}`}
        onClick={(e) => {
          e.stopPropagation();
          onRotate?.();
        }}
        disabled={!onRotate || status === 'sunk'}
      >
        <span aria-hidden>{orientation === 'horizontal' ? '↔' : '↕'}</span>
      </button>
    </article>
  );
}
