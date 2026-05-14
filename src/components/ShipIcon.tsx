import type { ReactNode } from 'react';
import type { Orientation } from '../types';

interface ShipIconProps {
  id: string;
  orientation?: Orientation;
  className?: string;
}

// Each ship is drawn once in its horizontal form. The wrapper picks the right
// viewBox + internal SVG transform for vertical orientation, so the artwork
// never gets squished by CSS rotation.

const drawGreenMonster = (): ReactNode => (
  <>
    {/* wall */}
    <rect x="0" y="1" width="50" height="9" fill="#1f5132" />
    {/* yellow railing on top */}
    <rect x="0" y="0.4" width="50" height="0.9" fill="#e6c14a" />
    {/* horizontal seam lines */}
    <g opacity="0.35" stroke="#0d2718" strokeWidth="0.12">
      <line x1="0" y1="3" x2="50" y2="3" />
      <line x1="0" y1="5" x2="50" y2="5" />
      <line x1="0" y1="7" x2="50" y2="7" />
      <line x1="0" y1="9" x2="50" y2="9" />
    </g>
    {/* manual scoreboard */}
    <rect
      x="14"
      y="3"
      width="22"
      height="5"
      fill="#0d2718"
      stroke="#000"
      strokeWidth="0.25"
    />
    <g>
      <rect x="14.4" y="3.4" width="3" height="1.6" fill="#bd3039" />
      <rect x="17.6" y="3.4" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="19.4" y="3.4" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="21.2" y="3.4" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="23" y="3.4" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="24.8" y="3.4" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="26.6" y="3.4" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="28.4" y="3.4" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="30.2" y="3.4" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="14.4" y="5.2" width="3" height="1.6" fill="#1f5132" />
      <rect x="17.6" y="5.2" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="19.4" y="5.2" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="21.2" y="5.2" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="23" y="5.2" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="24.8" y="5.2" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="26.6" y="5.2" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="28.4" y="5.2" width="1.6" height="1.6" fill="#f5e9cf" />
      <rect x="30.2" y="5.2" width="1.6" height="1.6" fill="#f5e9cf" />
    </g>
    {/* ladder */}
    <g stroke="#000" strokeWidth="0.25" fill="none">
      <line x1="44" y1="1.5" x2="44" y2="9.6" />
      <line x1="46" y1="1.5" x2="46" y2="9.6" />
      <line x1="44" y1="3" x2="46" y2="3" />
      <line x1="44" y1="4.4" x2="46" y2="4.4" />
      <line x1="44" y1="5.8" x2="46" y2="5.8" />
      <line x1="44" y1="7.2" x2="46" y2="7.2" />
      <line x1="44" y1="8.6" x2="46" y2="8.6" />
    </g>
    <text x="48" y="9" fill="#f5e9cf" fontSize="1.4" fontFamily="serif" textAnchor="end">
      379
    </text>
  </>
);

const drawPeskysPole = (): ReactNode => (
  <>
    <rect x="0" y="3" width="3" height="4" fill="#7a1c22" stroke="#000" strokeWidth="0.15" />
    <rect x="3" y="4.2" width="32" height="1.6" fill="#bd3039" stroke="#000" strokeWidth="0.15" />
    <g stroke="#7a1c22" strokeWidth="0.18">
      <line x1="6" y1="4.2" x2="6" y2="5.8" />
      <line x1="10" y1="4.2" x2="10" y2="5.8" />
      <line x1="14" y1="4.2" x2="14" y2="5.8" />
      <line x1="18" y1="4.2" x2="18" y2="5.8" />
      <line x1="22" y1="4.2" x2="22" y2="5.8" />
      <line x1="26" y1="4.2" x2="26" y2="5.8" />
      <line x1="30" y1="4.2" x2="30" y2="5.8" />
    </g>
    <circle cx="36" cy="5" r="1.4" fill="#bd3039" stroke="#000" strokeWidth="0.15" />
    <rect x="35" y="3.2" width="2" height="3.6" fill="#bd3039" stroke="#000" strokeWidth="0.15" />
    <text x="38" y="9" fill="#f5e9cf" fontSize="1.4" fontFamily="serif" textAnchor="end">
      302
    </text>
  </>
);

const drawCitgoCruiser = (): ReactNode => (
  <>
    <path
      d="M2 7 L28 7 L26 9.5 L4 9.5 Z"
      fill="#6b7c8a"
      stroke="#1c2630"
      strokeWidth="0.2"
    />
    <rect x="2" y="6.6" width="26" height="0.5" fill="#1c2630" />
    <rect x="11" y="1.2" width="8" height="5.6" fill="#f5f5f5" stroke="#1a1a1a" strokeWidth="0.3" />
    <polygon points="13,2.2 17,2.2 15,5.4" fill="#d62027" />
    <text x="15" y="6.4" fill="#1a1a1a" fontSize="0.9" fontFamily="sans-serif" fontWeight="700" textAnchor="middle">
      CITGO
    </text>
    <rect x="14.6" y="6.6" width="0.8" height="0.5" fill="#1c2630" />
    <g fill="#9aabbd">
      <rect x="4" y="7.4" width="1.4" height="0.8" />
      <rect x="6.2" y="7.4" width="1.4" height="0.8" />
      <rect x="22.4" y="7.4" width="1.4" height="0.8" />
      <rect x="24.6" y="7.4" width="1.4" height="0.8" />
    </g>
  </>
);

const drawYawkeyWay = (): ReactNode => (
  <>
    <rect x="6" y="6.5" width="0.8" height="3" fill="#1c2630" />
    <rect x="23" y="6.5" width="0.8" height="3" fill="#1c2630" />
    <rect x="2" y="2" width="26" height="5" fill="#1f3a6e" stroke="#f5e9cf" strokeWidth="0.35" rx="0.3" />
    <text
      x="15"
      y="5.4"
      fill="#f5e9cf"
      fontFamily="sans-serif"
      fontWeight="800"
      fontSize="2.6"
      textAnchor="middle"
    >
      YAWKEY WAY
    </text>
  </>
);

const drawMonsterSeats = (): ReactNode => (
  <>
    {[0, 10].map((x) => (
      <g key={x}>
        <rect x={x + 1} y="1.5" width="8" height="6" fill="#1f5132" stroke="#0d2718" strokeWidth="0.2" rx="0.6" />
        <line x1={x + 2} y1="3" x2={x + 8} y2="3" stroke="#0d2718" strokeWidth="0.2" />
        <line x1={x + 2} y1="4.4" x2={x + 8} y2="4.4" stroke="#0d2718" strokeWidth="0.2" />
        <line x1={x + 2} y1="5.8" x2={x + 8} y2="5.8" stroke="#0d2718" strokeWidth="0.2" />
        <rect x={x + 1.5} y="7.5" width="7" height="1.4" fill="#1f5132" stroke="#0d2718" strokeWidth="0.2" />
        <rect x={x + 2} y="8.6" width="0.6" height="1" fill="#0d2718" />
        <rect x={x + 7.4} y="8.6" width="0.6" height="1" fill="#0d2718" />
      </g>
    ))}
  </>
);

const SHIPS: Record<string, { length: number; draw: () => ReactNode }> = {
  'green-monster': { length: 5, draw: drawGreenMonster },
  'peskys-pole': { length: 4, draw: drawPeskysPole },
  citgo: { length: 3, draw: drawCitgoCruiser },
  'yawkey-way': { length: 3, draw: drawYawkeyWay },
  'monster-seat': { length: 2, draw: drawMonsterSeats },
};

export function ShipIcon({ id, orientation = 'H', className }: ShipIconProps) {
  const def = SHIPS[id];
  if (!def) return null;
  const long = def.length * 10;
  const horizontal = orientation === 'H';
  const viewBox = horizontal ? `0 0 ${long} 10` : `0 0 10 ${long}`;
  // Rotate horizontal drawing 90° clockwise to fit a tall viewBox:
  //   translate(10, 0) then rotate(90) around origin maps (x,y) → (10-y, x).
  // SVG applies transforms right-to-left, so "translate(10 0) rotate(90)" rotates first then translates.
  const transform = horizontal ? undefined : 'translate(10 0) rotate(90)';
  return (
    <span
      className={['ship-icon', className].filter(Boolean).join(' ')}
      aria-hidden
    >
      <svg
        viewBox={viewBox}
        preserveAspectRatio="xMidYMid meet"
        className="ship-svg"
      >
        <g transform={transform}>{def.draw()}</g>
      </svg>
    </span>
  );
}
