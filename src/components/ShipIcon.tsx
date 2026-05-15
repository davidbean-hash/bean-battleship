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

const drawNavyBean = (): ReactNode => (
  <>
    {/* hull */}
    <rect x="0" y="2" width="50" height="6" fill="#1e3a5f" stroke="#0d1929" strokeWidth="0.3" />
    {/* deck */}
    <rect x="0" y="1.5" width="50" height="0.8" fill="#2c4f7c" />
    {/* portholes */}
    <g fill="#4a6fa5" stroke="#0d1929" strokeWidth="0.15">
      <circle cx="6" cy="5" r="0.8" />
      <circle cx="12" cy="5" r="0.8" />
      <circle cx="18" cy="5" r="0.8" />
      <circle cx="24" cy="5" r="0.8" />
      <circle cx="30" cy="5" r="0.8" />
      <circle cx="36" cy="5" r="0.8" />
      <circle cx="42" cy="5" r="0.8" />
    </g>
    {/* anchor */}
    <g fill="#f5e9cf" stroke="#0d1929" strokeWidth="0.2">
      <circle cx="46" cy="4" r="0.6" />
      <rect x="45.7" y="4" width="0.6" height="2.5" />
      <path d="M44.5 6.5 L45.7 5.8 L46.3 5.8 L47.5 6.5" fill="none" />
    </g>
    {/* stripe */}
    <rect x="0" y="4.2" width="50" height="0.4" fill="#f5e9cf" opacity="0.3" />
  </>
);

const drawBlackBean = (): ReactNode => (
  <>
    {/* hull */}
    <rect x="0" y="2.5" width="40" height="5" fill="#1a1a1a" stroke="#000" strokeWidth="0.3" rx="0.5" />
    {/* deck */}
    <rect x="0" y="2" width="40" height="0.8" fill="#2d2d2d" />
    {/* gun turrets */}
    <g fill="#3a3a3a" stroke="#000" strokeWidth="0.2">
      <circle cx="8" cy="3.5" r="1.2" />
      <circle cx="20" cy="3.5" r="1.2" />
      <circle cx="32" cy="3.5" r="1.2" />
    </g>
    {/* cannons */}
    <g fill="#1a1a1a" stroke="#000" strokeWidth="0.15">
      <rect x="7" y="2.3" width="2" height="1.2" />
      <rect x="19" y="2.3" width="2" height="1.2" />
      <rect x="31" y="2.3" width="2" height="1.2" />
    </g>
    {/* rivets */}
    <g fill="#4a4a4a">
      <circle cx="4" cy="5" r="0.3" />
      <circle cx="12" cy="5" r="0.3" />
      <circle cx="24" cy="5" r="0.3" />
      <circle cx="36" cy="5" r="0.3" />
    </g>
  </>
);

const drawPintoBean = (): ReactNode => (
  <>
    {/* hull */}
    <rect x="0" y="2.5" width="30" height="5" fill="#c19a6b" stroke="#a0805a" strokeWidth="0.3" rx="0.5" />
    {/* deck */}
    <rect x="0" y="2" width="30" height="0.8" fill="#a57c5a" />
    {/* cargo hatches */}
    <g fill="#786c4b" stroke="#786c4b" strokeWidth="0.2">
      <rect x="5" y="3.5" width="4" height="1.2" />
      <rect x="15" y="3.5" width="4" height="1.2" />
      <rect x="25" y="3.5" width="4" height="1.2" />
    </g>
    {/* rivets */}
    <g fill="#786c4b">
      <circle cx="3" cy="5" r="0.3" />
      <circle cx="9" cy="5" r="0.3" />
      <circle cx="17" cy="5" r="0.3" />
      <circle cx="27" cy="5" r="0.3" />
    </g>
  </>
);

const drawKidneyBean = (): ReactNode => (
  <>
    {/* hull */}
    <ellipse cx="15" cy="5" rx="14" ry="2.8" fill="#8b2e2e" stroke="#5a1e1e" strokeWidth="0.3" />
    {/* kidney shape indent */}
    <ellipse cx="18" cy="5" rx="2" ry="1.5" fill="#6b1e1e" />
    {/* deck */}
    <ellipse cx="15" cy="4.2" rx="13" ry="1.2" fill="#a03939" />
    {/* bridge */}
    <rect x="12" y="2" width="6" height="2.5" fill="#6b1e1e" stroke="#5a1e1e" strokeWidth="0.2" rx="0.3" />
    {/* windows */}
    <g fill="#f5e9cf" opacity="0.6">
      <rect x="13" y="2.5" width="1" height="0.8" />
      <rect x="14.5" y="2.5" width="1" height="0.8" />
      <rect x="16" y="2.5" width="1" height="0.8" />
    </g>
    {/* smokestack */}
    <rect x="8" y="2.5" width="1.5" height="2" fill="#5a1e1e" stroke="#3a1010" strokeWidth="0.15" />
    <rect x="7.5" y="2.3" width="2.5" height="0.4" fill="#3a1010" />
  </>
);

const drawCoffeeBean = (): ReactNode => (
  <>
    {/* Coffee bean - brown with center line */}
    {[0, 10].map((x) => (
      <g key={x}>
        <ellipse
          cx={x + 5}
          cy="5"
          rx="4"
          ry="3.5"
          fill="#6f4e37"
          stroke="#4a3325"
          strokeWidth="0.3"
        />
        {/* center line characteristic of coffee beans */}
        <path
          d={`M${x + 3} 5 Q${x + 5} 4 ${x + 7} 5 Q${x + 5} 6 ${x + 3} 5`}
          fill="none"
          stroke="#4a3325"
          strokeWidth="0.4"
        />
        {/* highlight */}
        <ellipse
          cx={x + 4}
          cy="3.8"
          rx="1.2"
          ry="0.8"
          fill="#8b6f47"
          opacity="0.6"
        />
      </g>
    ))}
  </>
);

const SHIPS: Record<string, { length: number; draw: () => ReactNode }> = {
  'navy-bean': { length: 5, draw: drawNavyBean },
  'black-bean': { length: 4, draw: drawBlackBean },
  'pinto-bean': { length: 3, draw: drawPintoBean },
  'kidney-bean': { length: 3, draw: drawKidneyBean },
  'coffee-bean': { length: 2, draw: drawCoffeeBean },
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
