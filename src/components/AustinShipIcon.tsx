import type { IconType } from '../types';

interface AustinShipIconProps {
  type: IconType;
  size?: number;
  className?: string;
}

/**
 * Original SVG illustrations for each Austin landmark ship. All shapes are
 * hand-authored from primitives; no external assets or copyrighted logos.
 * Color is controlled by the parent via `currentColor` and the local accent.
 */
export function AustinShipIcon({ type, size = 56, className }: AustinShipIconProps) {
  const props = {
    width: size,
    height: size,
    viewBox: '0 0 64 64',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: ['ship-icon', className].filter(Boolean).join(' '),
    'aria-hidden': true,
  };

  switch (type) {
    case 'capitol':
      // Capitol dome: pediment, columns, rounded dome, lone star finial.
      return (
        <svg {...props}>
          <path d="M8 54 H56" />
          <path d="M12 54 V40 H52 V54" />
          <path d="M16 40 V28 M24 40 V28 M32 40 V28 M40 40 V28 M48 40 V28" />
          <path d="M14 28 H50 L46 22 H18 Z" />
          <path d="M22 22 Q32 6 42 22" />
          <circle cx="32" cy="14" r="2.4" fill="currentColor" />
          <path d="M32 8 L33.2 11 L36 11 L33.6 12.8 L34.6 16 L32 14 L29.4 16 L30.4 12.8 L28 11 L30.8 11 Z" fill="currentColor" stroke="none" />
        </svg>
      );

    case 'bats':
      // Three bats above the silhouette of Congress Avenue Bridge.
      return (
        <svg {...props}>
          <path d="M4 50 H60" />
          <path d="M8 50 Q14 40 20 50" />
          <path d="M20 50 Q26 40 32 50" />
          <path d="M32 50 Q38 40 44 50" />
          <path d="M44 50 Q50 40 56 50" />
          {/* Bats: V-shape with notched wing edges */}
          <path d="M14 22 L18 26 L22 22 L26 26 L30 22 M22 22 L22 24" />
          <path d="M30 14 L34 18 L38 14 L42 18 L46 14 M38 14 L38 16" />
          <path d="M42 28 L46 32 L50 28 L54 32 L58 28 M50 28 L50 30" />
          <circle cx="56" cy="10" r="2" fill="currentColor" stroke="none" />
        </svg>
      );

    case 'rainey':
      // A bungalow with a porch overhang and a string of patio lights.
      return (
        <svg {...props}>
          <path d="M6 18 Q14 14 22 18 Q30 14 38 18 Q46 14 54 18" />
          <circle cx="10" cy="18" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="18" cy="20" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="26" cy="18" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="34" cy="20" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="42" cy="18" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="50" cy="20" r="1.4" fill="currentColor" stroke="none" />
          <path d="M14 32 L32 22 L50 32 V52 H14 Z" />
          <path d="M14 36 H50" />
          <rect x="20" y="40" width="8" height="10" />
          <rect x="36" y="40" width="10" height="6" />
        </svg>
      );

    case 'paddleboard':
      // A long oval paddleboard with a paddle leaning across, water ripples below.
      return (
        <svg {...props}>
          <ellipse cx="32" cy="34" rx="24" ry="6" />
          <path d="M16 34 Q32 30 48 34" />
          <path d="M40 14 L40 38" />
          <path d="M36 12 H44 L40 8 Z" fill="currentColor" stroke="none" />
          <path d="M36 38 Q40 42 44 38" />
          <path d="M6 50 Q14 46 22 50 Q30 46 38 50 Q46 46 54 50" />
          <path d="M10 54 Q18 50 26 54 Q34 50 42 54 Q50 50 58 54" />
        </svg>
      );

    case 'springs':
      // Concentric water ripples around a swimmer's head.
      return (
        <svg {...props}>
          <path d="M4 36 Q16 30 28 36" />
          <path d="M36 36 Q48 30 60 36" />
          <path d="M4 44 Q16 38 28 44" />
          <path d="M36 44 Q48 38 60 44" />
          <path d="M4 52 Q16 46 28 52 Q40 46 52 52 Q58 50 60 52" />
          <circle cx="32" cy="22" r="6" />
          <path d="M22 32 Q26 36 32 36 Q38 36 42 32" />
          <path d="M48 18 L52 14 M50 22 L56 22 M14 18 L10 14 M14 22 L8 22" />
        </svg>
      );

    case 'tap':
      // Live music patio: an acoustic guitar with a string of patio lights overhead.
      return (
        <svg {...props}>
          <path d="M4 16 Q14 12 24 16 Q34 12 44 16 Q54 12 60 16" />
          <circle cx="10" cy="17" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="20" cy="15" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="30" cy="17" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="40" cy="15" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="50" cy="17" r="1.4" fill="currentColor" stroke="none" />
          {/* guitar */}
          <ellipse cx="36" cy="44" rx="12" ry="10" />
          <circle cx="36" cy="44" r="3" />
          <rect x="20" y="26" width="4" height="18" rx="1" transform="rotate(-15 22 35)" />
          <rect x="14" y="22" width="10" height="3" rx="1" transform="rotate(-15 19 23.5)" />
        </svg>
      );

    case 'kite':
      // A diamond kite with a wavy tail and a couple of bows.
      return (
        <svg {...props}>
          <path d="M22 8 L40 22 L26 38 L8 26 Z" />
          <path d="M22 8 L26 38 M40 22 L8 26" />
          <path d="M26 38 Q30 44 26 50 Q22 56 30 60" />
          <path d="M26 44 L30 44 M24 50 L28 50 M28 56 L32 56" />
        </svg>
      );

    default:
      return null;
  }
}
