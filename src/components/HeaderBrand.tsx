export function HeaderBrand() {
  return (
    <aside className="brand-panel">
      <div className="brand-bevel" aria-hidden />
      <div className="brand-corner brand-corner--tl" aria-hidden>★</div>
      <div className="brand-corner brand-corner--tr" aria-hidden>★</div>
      <div className="brand-corner brand-corner--bl" aria-hidden>★</div>
      <div className="brand-corner brand-corner--br" aria-hidden>★</div>

      <span className="brand-eyebrow">Est. 2026 · A Lone-Star Salvo</span>
      <h1 className="brand-title">
        <span>Austin</span>
        <span>Texas</span>
        <span className="brand-title-accent">Battleship</span>
      </h1>
      <p className="brand-tagline">
        A Vintage Naval Game on Lady Bird Lake
      </p>
      <div className="brand-rule" aria-hidden />
      <p className="brand-meta">Capt. Bean Commanding · 12 × 12 Harbour</p>

      <div className="kaw-badge" aria-label="Keep Austin Weird">
        <svg viewBox="0 0 100 100" aria-hidden>
          <defs>
            <path id="kaw-circle" d="M 50 50 m -34 0 a 34 34 0 1 1 68 0 a 34 34 0 1 1 -68 0" />
          </defs>
          <text fontSize="11" fontFamily="Cinzel, serif" fontWeight="700" letterSpacing="2">
            <textPath href="#kaw-circle" startOffset="0%">
              KEEP AUSTIN WEIRD · KEEP AUSTIN WEIRD ·
            </textPath>
          </text>
        </svg>
        <span className="kaw-badge__star" aria-hidden>★</span>
      </div>
    </aside>
  );
}
