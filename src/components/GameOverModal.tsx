interface GameOverModalProps {
  winner: 'player' | 'ai';
  shotsFired: number;
  hits: number;
  shipsSunk: number;
  totalShips: number;
  elapsedMs: number;
  onPlayAgain: () => void;
  onMainMenu: () => void;
}

function formatTime(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function GameOverModal({
  winner,
  shotsFired,
  hits,
  shipsSunk,
  totalShips,
  elapsedMs,
  onPlayAgain,
  onMainMenu,
}: GameOverModalProps) {
  const accuracy = shotsFired === 0 ? 0 : Math.round((hits / shotsFired) * 100);
  const isWin = winner === 'player';

  return (
    <div
      className={`game-over ${isWin ? 'game-over--win' : 'game-over--lose'}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby="game-over-title"
    >
      <div className="game-over__skyline" aria-hidden />
      <div className="game-over__panel">
        <div className="game-over__medal" aria-hidden>
          <span className="game-over__star">★</span>
        </div>
        <h2 id="game-over-title" className="game-over__title">
          {isWin ? 'VICTORY!' : 'DEFEAT!'}
        </h2>
        <p className="game-over__subtitle">
          {isWin
            ? 'You sank the entire enemy fleet across Lady Bird Lake.'
            : 'The enemy claimed the harbour. Regroup and fire again, Captain.'}
        </p>

        <dl className="game-over__stats">
          <div>
            <dt>Accuracy</dt>
            <dd>{accuracy}%</dd>
          </div>
          <div>
            <dt>Shots Fired</dt>
            <dd>{shotsFired}</dd>
          </div>
          <div>
            <dt>Ships Sunk</dt>
            <dd>
              {shipsSunk}/{totalShips}
            </dd>
          </div>
          <div>
            <dt>Game Time</dt>
            <dd>{formatTime(elapsedMs)}</dd>
          </div>
        </dl>

        <div className="game-over__actions">
          <button type="button" className="ctl-btn ctl-btn--primary" onClick={onPlayAgain}>
            Play Again
          </button>
          <button type="button" className="ctl-btn" onClick={onMainMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
