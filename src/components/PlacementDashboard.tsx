import { useEffect, useState } from 'react';
import type { Orientation } from '../types';
import { AUSTIN_FLEET } from '../data/ships';
import { ShipCard, type ShipPlacementStatus } from './ShipCard';

export interface ShipDeployState {
  status: ShipPlacementStatus;
  orientation: Orientation;
}

interface PlacementDashboardProps {
  /** shipId -> deploy state. Missing entries default to pending + horizontal. */
  states?: Record<string, ShipDeployState>;
  selectedShipId?: string;
  onSelectShip?: (shipId: string) => void;
  onRotateShip?: (shipId: string) => void;
  onDragShipStart?: (shipId: string) => void;
  onDragShipEnd?: () => void;
}

const AUSTIN_FACTS = [
  'Austin is known as the Live Music Capital of the World.',
  'The Texas State Capitol is taller than the U.S. Capitol by about 15 feet.',
  '1.5 million bats live under the Congress Avenue Bridge — the largest urban bat colony in North America.',
  'Barton Springs Pool stays a brisk 68–70°F year-round.',
  'Lady Bird Lake was renamed in 2007 to honor First Lady Lady Bird Johnson.',
];

const FACT_ROTATE_MS = 6500;

export function PlacementDashboard({
  states,
  selectedShipId,
  onSelectShip,
  onRotateShip,
  onDragShipStart,
  onDragShipEnd,
}: PlacementDashboardProps) {
  const [factIdx, setFactIdx] = useState(0);

  useEffect(() => {
    const handle = window.setInterval(() => {
      setFactIdx((i) => (i + 1) % AUSTIN_FACTS.length);
    }, FACT_ROTATE_MS);
    return () => window.clearInterval(handle);
  }, []);

  const placedCount = AUSTIN_FLEET.reduce((acc, s) => {
    const st = states?.[s.id]?.status ?? 'pending';
    return acc + (st === 'placed' ? 1 : 0);
  }, 0);

  return (
    <section className="placement-dashboard">
      <header className="placement-dashboard__header">
        <div>
          <span className="panel-eyebrow">Fleet Roster</span>
          <h2>Austin Landmark Fleet</h2>
        </div>
        <div className="placement-dashboard__counter" aria-live="polite">
          <span className="counter-value">{placedCount}</span>
          <span className="counter-divider">/</span>
          <span className="counter-total">{AUSTIN_FLEET.length}</span>
          <span className="counter-label">Deployed</span>
        </div>
      </header>

      <div className="placement-dashboard__grid">
        {AUSTIN_FLEET.map((ship) => {
          const state = states?.[ship.id];
          return (
            <ShipCard
              key={ship.id}
              ship={ship}
              status={state?.status ?? 'pending'}
              orientation={state?.orientation ?? 'horizontal'}
              selected={selectedShipId === ship.id}
              onSelect={onSelectShip ? () => onSelectShip(ship.id) : undefined}
              onRotate={onRotateShip ? () => onRotateShip(ship.id) : undefined}
              onDragStart={onDragShipStart ? () => onDragShipStart(ship.id) : undefined}
              onDragEnd={onDragShipEnd}
            />
          );
        })}
      </div>

      <aside className="austin-fact" aria-live="polite">
        <span className="austin-fact__star" aria-hidden>★</span>
        <div>
          <span className="panel-eyebrow">Austin Fact</span>
          <p key={factIdx}>{AUSTIN_FACTS[factIdx]}</p>
        </div>
      </aside>
    </section>
  );
}
