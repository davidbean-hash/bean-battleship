import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import {
  BOARD_SIZE,
  BoardState,
  CellState,
  Difficulty,
  FLEET,
  Orientation,
  Phase,
} from './types';
import {
  allSunk,
  canPlace,
  emptyBoard,
  fireAt,
  placeShip,
  randomizeBoard,
  shipCells,
} from './utils/board';
import { AIState, chooseShot, createAI, recordResult } from './utils/ai';
import { ShipIcon } from './components/ShipIcon';

function cloneBoard(b: BoardState): BoardState {
  return {
    ships: b.ships.map((s) => ({ ...s })),
    occupancy: b.occupancy.map((row) => row.slice()),
    shots: b.shots.map((row) => row.slice()) as CellState[][],
  };
}

function cloneAI(s: AIState): AIState {
  return {
    difficulty: s.difficulty,
    shots: s.shots.map((row) => row.slice()) as CellState[][],
    remainingLengths: s.remainingLengths.slice(),
    currentHits: s.currentHits.map((h) => [...h] as [number, number]),
    targetQueue: s.targetQueue.map((h) => [...h] as [number, number]),
  };
}

const COL_LABELS = Array.from({ length: BOARD_SIZE }, (_, i) =>
  String.fromCharCode(65 + i),
);
const ROW_LABELS = Array.from({ length: BOARD_SIZE }, (_, i) => String(i + 1));

function coord(r: number, c: number): string {
  return `${COL_LABELS[c]}${r + 1}`;
}

interface ShotLogEntry {
  who: 'you' | 'cpu';
  r: number;
  c: number;
  result: 'miss' | 'hit' | 'sunk';
  shipName?: string;
}

interface BoardViewProps {
  board: BoardState;
  revealShips: boolean;
  interactive: boolean;
  onCellClick?: (r: number, c: number) => void;
  onCellEnter?: (r: number, c: number) => void;
  onCellLeave?: () => void;
  previewCells?: Array<[number, number]>;
  previewValid?: boolean;
}

function BoardView({
  board,
  revealShips,
  interactive,
  onCellClick,
  onCellEnter,
  onCellLeave,
  previewCells,
  previewValid,
}: BoardViewProps) {
  const previewSet = useMemo(() => {
    const s = new Set<string>();
    (previewCells ?? []).forEach(([r, c]) => s.add(`${r},${c}`));
    return s;
  }, [previewCells]);

  return (
    <div className="board-grid" onMouseLeave={onCellLeave}>
      <div />
      {COL_LABELS.map((l, c) => (
        <div
          key={`c${l}`}
          className="axis-label axis-label-x"
          style={{ gridColumn: c + 2, gridRow: 1 }}
        >
          {l}
        </div>
      ))}
      {ROW_LABELS.map((rowL, r) => (
        <Fragment key={`row-${rowL}`}>
          <div
            className="axis-label axis-label-y"
            style={{ gridColumn: 1, gridRow: r + 2 }}
          >
            {rowL}
          </div>
          {COL_LABELS.map((_, c) => {
            const shot = board.shots[r][c];
            const inPreview = previewSet.has(`${r},${c}`);
            const classes = ['cell'];
            if (shot === 'miss') classes.push('miss');
            if (shot === 'hit') classes.push('hit');
            if (shot === 'sunk') classes.push('sunk');
            if (interactive && shot === 'unknown') classes.push('clickable');
            if (inPreview)
              classes.push(previewValid ? 'preview-ok' : 'preview-bad');
            return (
              <button
                key={`${r}-${c}`}
                className={classes.join(' ')}
                style={{ gridColumn: c + 2, gridRow: r + 2 }}
                disabled={!interactive || shot !== 'unknown'}
                onClick={() => onCellClick?.(r, c)}
                onMouseEnter={() => onCellEnter?.(r, c)}
                onFocus={() => onCellEnter?.(r, c)}
                aria-label={`${COL_LABELS[c]}${r + 1} ${shot}`}
              >
                {shot === 'miss' && <span className="baseball" aria-hidden />}
                {(shot === 'hit' || shot === 'sunk') && (
                  <span className="x" aria-hidden>
                    ✕
                  </span>
                )}
              </button>
            );
          })}
        </Fragment>
      ))}
      {revealShips &&
        board.ships.map((s, i) => {
          const sunk = s.hits >= s.length;
          const horizontal = s.orientation === 'H';
          const style = horizontal
            ? {
                gridColumn: `${s.col + 2} / span ${s.length}`,
                gridRow: `${s.row + 2}`,
              }
            : {
                gridColumn: `${s.col + 2}`,
                gridRow: `${s.row + 2} / span ${s.length}`,
              };
          return (
            <div
              key={`ship-${i}`}
              className={['ship-overlay', sunk ? 'sunk' : ''].join(' ')}
              style={style}
            >
              <ShipIcon id={s.id} orientation={s.orientation} />
            </div>
          );
        })}
    </div>
  );
}

interface PanelProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  flank?: 'star' | 'b-logo';
}

function BLogo() {
  return (
    <svg viewBox="0 0 24 24" className="b-logo" aria-hidden>
      <circle cx="12" cy="12" r="11" fill="#bd3039" stroke="#f5e9cf" strokeWidth="1.2" />
      <text
        x="12"
        y="17"
        textAnchor="middle"
        fontSize="14"
        fontFamily="'Black Ops One', serif"
        fontWeight="900"
        fill="#f5e9cf"
      >
        B
      </text>
    </svg>
  );
}

function Panel({ title, children, className, flank = 'star' }: PanelProps) {
  const Flank = flank === 'b-logo' ? <BLogo /> : <span className="panel-star" aria-hidden>★</span>;
  return (
    <section className={['panel', className].filter(Boolean).join(' ')}>
      <header className="panel-header">
        {Flank}
        <h2>{title}</h2>
        {Flank}
      </header>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function FenwayBackdrop() {
  return (
    <div className="fenway-backdrop" aria-hidden>
      <div className="sky" />
      <div className="clouds" />
      <div className="stadium-lights left">
        <div className="pole" />
        <div className="lights" />
      </div>
      <div className="stadium-lights right">
        <div className="pole" />
        <div className="lights" />
      </div>
      <div className="citgo">
        <div className="citgo-square">
          <div className="citgo-tri" />
          <span>CITGO</span>
        </div>
        <div className="citgo-post" />
      </div>
      <div className="green-monster">
        <div className="monster-top" />
        <div className="manual-scoreboard">
          <div className="sb-row">
            <span>BOS</span>
            <span>3</span>
            <span>1</span>
            <span>0</span>
          </div>
          <div className="sb-row">
            <span>NYY</span>
            <span>0</span>
            <span>0</span>
            <span>2</span>
          </div>
        </div>
        <div className="monster-wall" />
      </div>
      <div className="grass" />
    </div>
  );
}

export default function App() {
  const [phase, setPhase] = useState<Phase>('landing');
  const [difficulty, setDifficulty] = useState<Difficulty>('moderate');
  const [playerBoard, setPlayerBoard] = useState<BoardState>(() => emptyBoard());
  const [aiBoard, setAiBoard] = useState<BoardState>(() => randomizeBoard());
  const [ai, setAi] = useState<AIState>(() => createAI('moderate'));
  const [turn, setTurn] = useState<'you' | 'ai'>('you');
  const [message, setMessage] = useState<string>(
    'Place your fleet, then play ball.',
  );
  const [winner, setWinner] = useState<'you' | 'ai' | null>(null);
  const [stats, setStats] = useState({
    youShots: 0,
    youHits: 0,
    aiShots: 0,
    aiHits: 0,
  });
  const [shotLog, setShotLog] = useState<ShotLogEntry[]>([]);
  const [homerEffect, setHomerEffect] = useState<{
    id: number;
    who: 'you' | 'cpu';
    shipName: string;
  } | null>(null);
  const aiTimer = useRef<number | null>(null);

  // --- Placement state ---
  const [placedIds, setPlacedIds] = useState<Set<string>>(new Set());
  const [selectedShipId, setSelectedShipId] = useState<string>(FLEET[0].id);
  const [orientation, setOrientation] = useState<Orientation>('H');
  const [hover, setHover] = useState<[number, number] | null>(null);

  const selectedShip = FLEET.find((s) => s.id === selectedShipId) ?? null;
  const allPlaced = placedIds.size === FLEET.length;

  function triggerHomerEffect(who: 'you' | 'cpu', shipName: string) {
    setHomerEffect({ id: Date.now(), who, shipName });
  }

  useEffect(() => {
    if (!homerEffect) return undefined;
    const timer = window.setTimeout(() => setHomerEffect(null), 1800);
    return () => window.clearTimeout(timer);
  }, [homerEffect]);

  const previewCells: Array<[number, number]> = useMemo(() => {
    if (phase !== 'setup' || !hover || !selectedShip) return [];
    if (placedIds.has(selectedShip.id)) return [];
    return shipCells(hover[0], hover[1], selectedShip.length, orientation);
  }, [phase, hover, selectedShip, orientation, placedIds]);

  const previewValid = useMemo(() => {
    if (previewCells.length === 0 || !selectedShip || !hover) return false;
    return canPlace(
      playerBoard,
      hover[0],
      hover[1],
      selectedShip.length,
      orientation,
    );
  }, [previewCells, playerBoard, selectedShip, hover, orientation]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (phase !== 'setup') return;
      if (e.key === 'r' || e.key === 'R') {
        setOrientation((o) => (o === 'H' ? 'V' : 'H'));
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase]);

  useEffect(() => {
    return () => {
      if (aiTimer.current) window.clearTimeout(aiTimer.current);
    };
  }, []);

  function tryPlace(r: number, c: number) {
    if (phase !== 'setup' || !selectedShip) return;
    if (placedIds.has(selectedShip.id)) return;
    if (!canPlace(playerBoard, r, c, selectedShip.length, orientation)) return;
    const nb = cloneBoard(playerBoard);
    placeShip(nb, selectedShip, r, c, orientation);
    setPlayerBoard(nb);
    const next = new Set(placedIds);
    next.add(selectedShip.id);
    setPlacedIds(next);
    const upcoming = FLEET.find((s) => !next.has(s.id));
    if (upcoming) setSelectedShipId(upcoming.id);
    setMessage(
      next.size === FLEET.length
        ? 'Fleet ready. Take the mound when you are.'
        : `Stationed ${selectedShip.name}.`,
    );
  }

  function randomizeMyFleet() {
    setPlayerBoard(randomizeBoard());
    setPlacedIds(new Set(FLEET.map((s) => s.id)));
    setMessage('Lineup randomized. Take the mound when you are.');
  }

  function clearFleet() {
    setPlayerBoard(emptyBoard());
    setPlacedIds(new Set());
    setSelectedShipId(FLEET[0].id);
    setMessage('Lineup cleared. Place your fleet.');
  }

  function goToSetup() {
    setPhase('setup');
    setPlayerBoard(emptyBoard());
    setPlacedIds(new Set());
    setSelectedShipId(FLEET[0].id);
    setOrientation('H');
    setMessage('Place your fleet, then play ball.');
  }

  function startGame() {
    if (!allPlaced) return;
    setAiBoard(randomizeBoard());
    setAi(createAI(difficulty));
    setTurn('you');
    setWinner(null);
    setStats({ youShots: 0, youHits: 0, aiShots: 0, aiHits: 0 });
    setShotLog([]);
    setMessage(
      `Play ball! Difficulty: ${difficulty === 'hard' ? 'WORLD SERIES' : 'REGULAR SEASON'}.`,
    );
    setPhase('playing');
  }

  function newGame() {
    setPhase('landing');
    setPlayerBoard(emptyBoard());
    setPlacedIds(new Set());
    setSelectedShipId(FLEET[0].id);
    setOrientation('H');
    setAiBoard(randomizeBoard());
    setShotLog([]);
    setHomerEffect(null);
    setWinner(null);
    setMessage('Place your fleet, then play ball.');
  }

  function playerFire(r: number, c: number) {
    if (phase !== 'playing' || turn !== 'you' || winner) return;
    const next = cloneBoard(aiBoard);
    const res = fireAt(next, r, c);
    if (res.result === 'repeat') return;
    setAiBoard(next);
    setStats((s) => ({
      ...s,
      youShots: s.youShots + 1,
      youHits: s.youHits + (res.result === 'hit' || res.result === 'sunk' ? 1 : 0),
    }));
    setShotLog((log) => [
      {
        who: 'you',
        r,
        c,
        result: res.result as 'miss' | 'hit' | 'sunk',
        shipName: res.sunkShip?.name,
      },
      ...log,
    ]);
    if (res.result === 'sunk') {
      triggerHomerEffect('you', res.sunkShip!.name);
      setMessage(`Going, going, GONE! You sank ${res.sunkShip!.name}!`);
    } else if (res.result === 'hit') {
      setMessage('Crack of the bat — base hit!');
    } else {
      setMessage('Strike — fouled into the stands.');
    }
    if (res.gameOver || allSunk(next)) {
      setWinner('you');
      setPhase('over');
      return;
    }
    setTurn('ai');
  }

  // AI turn
  useEffect(() => {
    if (phase !== 'playing' || turn !== 'ai' || winner) return;
    aiTimer.current = window.setTimeout(() => {
      const aiCopy = cloneAI(ai);
      const [r, c] = chooseShot(aiCopy);
      const board = cloneBoard(playerBoard);
      const res = fireAt(board, r, c);
      if (res.result === 'repeat') {
        setTurn('you');
        return;
      }
      recordResult(
        aiCopy,
        r,
        c,
        res.result as 'miss' | 'hit' | 'sunk',
        res.sunkShip,
      );
      setAi(aiCopy);
      setPlayerBoard(board);
      setStats((s) => ({
        ...s,
        aiShots: s.aiShots + 1,
        aiHits:
          s.aiHits + (res.result === 'hit' || res.result === 'sunk' ? 1 : 0),
      }));
      setShotLog((log) => [
        {
          who: 'cpu',
          r,
          c,
          result: res.result as 'miss' | 'hit' | 'sunk',
          shipName: res.sunkShip?.name,
        },
        ...log,
      ]);
      if (res.result === 'sunk') {
        triggerHomerEffect('cpu', res.sunkShip!.name);
        setMessage(
          `That ball is HEADED OVER THE GREEN MONSTER! They sank your ${res.sunkShip!.name}.`,
        );
      } else if (res.result === 'hit') {
        setMessage(`Visitors connect at ${coord(r, c)}.`);
      } else {
        setMessage(`Strike at ${coord(r, c)} — caught in the gap.`);
      }
      if (res.gameOver || allSunk(board)) {
        setWinner('ai');
        setPhase('over');
        return;
      }
      setTurn('you');
    }, 650);
    return () => {
      if (aiTimer.current) window.clearTimeout(aiTimer.current);
    };
  }, [phase, turn, winner, ai, playerBoard]);

  const remainingPlayer = useMemo(
    () => playerBoard.ships.filter((s) => s.hits < s.length).length,
    [playerBoard],
  );
  const remainingAI = useMemo(
    () => aiBoard.ships.filter((s) => s.hits < s.length).length,
    [aiBoard],
  );

  const lastShot = shotLog[0];

  // -------------------- LANDING --------------------
  if (phase === 'landing') {
    return (
      <div className="landing">
        <FenwayBackdrop />
        <div className="landing-content">
          <div className="title-plate">
            <div className="title-banner">
              <span>★</span>
              <span>FENWAY PARK · BOSTON</span>
              <span>★</span>
            </div>
            <h1>
              BEAN <span className="amp">BATTLESHIP</span>
            </h1>
            <div className="title-subbanner">
              ★ CAPTAIN BEAN'S FLEET ★
            </div>
          </div>

          <div className="landing-card">
            <h3>Choose your difficulty</h3>
            <div className="difficulty-pick">
              <button
                className={[
                  'diff-btn',
                  difficulty === 'moderate' ? 'active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setDifficulty('moderate')}
              >
                <span className="diff-label">Regular Season</span>
                <span className="diff-sub">
                  Moderate · the CPU plays loose
                </span>
              </button>
              <button
                className={[
                  'diff-btn',
                  difficulty === 'hard' ? 'active' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                onClick={() => setDifficulty('hard')}
              >
                <span className="diff-label">World Series</span>
                <span className="diff-sub">
                  Hard · parity hunt + line lock
                </span>
              </button>
            </div>
            <button className="play-ball" onClick={goToSetup}>
              PLAY BALL
            </button>
          </div>
        </div>
        <footer className="landing-footer">
          A Battleship-style game · Captain Bean commanding
        </footer>
      </div>
    );
  }

  // -------------------- SETUP / PLAY / OVER --------------------
  return (
    <div className="app">
      <header className="brand-header">
        <div className="brand-stadium-bg" aria-hidden />
        <div className="brand-grandstand" aria-hidden>
          <div className="bg-fenway-sign">FENWAY PARK</div>
          <div className="bg-lights" />
        </div>
        <div className="brand-inner">
          <div className="title-plate-game">
            <div className="title-banner small">
              <span>★</span>
              <span>FENWAY PARK · BOSTON</span>
              <span>★</span>
            </div>
            <h1>
              BEAN <span className="amp">BATTLESHIP</span>
            </h1>
            <div className="title-subbanner small">
              ★ CAPTAIN BEAN'S FLEET ★
            </div>
          </div>
          <div className="brand-citgo" aria-hidden>
            <div className="citgo-square small">
              <div className="citgo-tri" />
              <span>CITGO</span>
            </div>
          </div>
          <div className="scoreboard">
            <div className="sb-cell">
              <div className="sb-label">INNING</div>
              <div className="sb-val">
                {phase === 'over' ? 'F' : Math.min(9, Math.floor(stats.youShots / 3) + 1)}
              </div>
            </div>
            <div className="sb-cell">
              <div className="sb-label you">YOU</div>
              <div className="sb-val">{stats.youHits}</div>
            </div>
            <div className="sb-cell">
              <div className="sb-label cpu">CPU</div>
              <div className="sb-val">{stats.aiHits}</div>
            </div>
            <div className="sb-cell outs">
              <div className="sb-label">OUTS</div>
              <div className="outs-dots">
                <span className={stats.youShots > 0 ? 'on' : ''} />
                <span className={stats.youShots > 1 ? 'on' : ''} />
                <span className={stats.youShots > 2 ? 'on' : ''} />
              </div>
            </div>
          </div>
        </div>
      </header>

      {phase === 'setup' && (
        <div className="setup-grid">
          <Panel title="Your Fleet" className="roster-panel">
            <p className="hint">
              Pick a ship, then click your field to place it. Press{' '}
              <kbd>R</kbd> or the rotate button to flip it. Ships can't touch —
              leave a gap between each (including diagonally).
            </p>
            <ul className="ship-list">
              {FLEET.map((s) => {
                const placed = placedIds.has(s.id);
                const isSelected = s.id === selectedShipId;
                return (
                  <li
                    key={s.id}
                    className={[
                      'ship-card',
                      placed ? 'placed' : '',
                      isSelected ? 'selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')}
                  >
                    <button
                      className="ship-card-btn"
                      onClick={() => setSelectedShipId(s.id)}
                      disabled={placed}
                      aria-pressed={isSelected}
                    >
                      <span className="ship-card-icon">
                        <ShipIcon id={s.id} orientation="H" />
                      </span>
                      <span className="ship-card-text">
                        <span className="ship-name">{s.name}</span>
                        <span className="ship-cells" aria-hidden>
                          {Array.from({ length: s.length }).map((_, i) => (
                            <span key={i} className="ship-cell" />
                          ))}
                        </span>
                      </span>
                      <span className="ship-meta">
                        {placed ? '✓' : s.length}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="placement-actions">
              <button
                onClick={() => setOrientation((o) => (o === 'H' ? 'V' : 'H'))}
              >
                Rotate · {orientation === 'H' ? 'Horizontal' : 'Vertical'}
              </button>
              <button onClick={randomizeMyFleet}>Randomize</button>
              <button onClick={clearFleet} disabled={placedIds.size === 0}>
                Clear
              </button>
            </div>
          </Panel>

          <Panel title="Your Field" className="field-panel">
            <BoardView
              board={playerBoard}
              revealShips
              interactive={!allPlaced && !!selectedShip}
              onCellClick={tryPlace}
              onCellEnter={(r, c) => setHover([r, c])}
              onCellLeave={() => setHover(null)}
              previewCells={previewCells}
              previewValid={previewValid}
            />
            <div className="field-footer">
              <span>
                {placedIds.size}/{FLEET.length} ships placed
              </span>
              <button
                className="primary play-ball-sm"
                onClick={startGame}
                disabled={!allPlaced}
              >
                {allPlaced
                  ? 'PLAY BALL'
                  : `${FLEET.length - placedIds.size} ship(s) to go`}
              </button>
            </div>
          </Panel>
        </div>
      )}

      {(phase === 'playing' || phase === 'over') && (
        <>
          <div className="play-grid">
            <div className="side-stack left">
              <Panel title="Your Fleet" className="roster-panel">
                <ul className="ship-list compact">
                  {playerBoard.ships.map((s) => {
                    const sunk = s.hits >= s.length;
                    return (
                      <li
                        key={s.id}
                        className={['ship-card', sunk ? 'sunk' : ''].join(' ')}
                      >
                        <div className="ship-card-btn read-only">
                          <span className="ship-card-icon">
                            <ShipIcon id={s.id} orientation="H" />
                          </span>
                          <span className="ship-card-text">
                            <span className="ship-name">{s.name}</span>
                            <span className="ship-cells" aria-hidden>
                              {Array.from({ length: s.length }).map((_, i) => (
                                <span
                                  key={i}
                                  className={[
                                    'ship-cell',
                                    i < s.hits ? 'damaged' : '',
                                  ].join(' ')}
                                />
                              ))}
                            </span>
                          </span>
                          <span className="ship-meta">
                            {sunk ? 'SUNK' : s.length}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
              <Panel title="Controls" className="controls-panel">
                <ul className="controls-list">
                  <li>
                    <span className="ctrl-icon">◎</span>
                    <span>Click an enemy cell to fire a shot</span>
                  </li>
                  <li>
                    <span className="ctrl-icon">⚑</span>
                    <span>
                      {remainingAI}/{FLEET.length} enemy ships remaining
                    </span>
                  </li>
                  <li>
                    <span className="ctrl-icon">⚓</span>
                    <span>
                      {remainingPlayer}/{FLEET.length} of your ships afloat
                    </span>
                  </li>
                </ul>
                {phase === 'playing' && (
                  <button className="surrender-btn" onClick={newGame}>
                    Surrender / Restart
                  </button>
                )}
              </Panel>
            </div>

            <Panel title="Your Field" className="field-panel" flank="b-logo">
              <BoardView
                board={playerBoard}
                revealShips
                interactive={false}
              />
            </Panel>

            <Panel title="Enemy Field" className="field-panel" flank="b-logo">
              <BoardView
                board={aiBoard}
                revealShips={phase === 'over'}
                interactive={phase === 'playing' && turn === 'you' && !winner}
                onCellClick={playerFire}
              />
            </Panel>

            <div className="side-stack right">
              <Panel title="Last Shot" className="lastshot-panel">
                {lastShot ? (
                  <div className="lastshot">
                    <div className={`lastshot-coord ${lastShot.result}`}>
                      {coord(lastShot.r, lastShot.c)}
                    </div>
                    <div className={`lastshot-result ${lastShot.result}`}>
                      {lastShot.result === 'sunk'
                        ? 'SUNK!'
                        : lastShot.result === 'hit'
                          ? 'HIT!'
                          : 'MISS'}
                    </div>
                    <div className="lastshot-who">
                      by {lastShot.who === 'you' ? 'You' : 'CPU'}
                    </div>
                  </div>
                ) : (
                  <div className="lastshot empty">Awaiting first pitch…</div>
                )}
              </Panel>

              <Panel title="Headline" className="headline-panel">
                {(() => {
                  if (!lastShot) {
                    return (
                      <div className="headline-text">
                        <span className="hl-small">welcome to</span>
                        <span className="hl-big">THE PARK!</span>
                      </div>
                    );
                  }
                  if (lastShot.result === 'sunk') {
                    if (lastShot.who === 'you') {
                      return (
                        <div className="headline-text">
                          <span className="hl-small">that ball is headed</span>
                          <span className="hl-big">OVER THE GREEN MONSTER!</span>
                        </div>
                      );
                    }
                    return (
                      <div className="headline-text">
                        <span className="hl-small">straight into the</span>
                        <span className="hl-big">VISITOR DUGOUT!</span>
                      </div>
                    );
                  }
                  if (lastShot.result === 'hit') {
                    return (
                      <div className="headline-text">
                        <span className="hl-small">crack of</span>
                        <span className="hl-big">THE BAT!</span>
                      </div>
                    );
                  }
                  return (
                    <div className="headline-text">
                      <span className="hl-small">caught in</span>
                      <span className="hl-big">THE GAP.</span>
                    </div>
                  );
                })()}
                <div className="headline-b">
                  <BLogo />
                </div>
              </Panel>

              <Panel title="Shot Log" className="log-panel">
                {shotLog.length === 0 ? (
                  <div className="log-empty">No shots yet.</div>
                ) : (
                  <ul className="log-list">
                    {shotLog.slice(0, 5).map((s, i) => (
                      <li key={i} className={`log-item ${s.result}`}>
                        <span className="log-who">
                          {s.who === 'you' ? 'You' : 'CPU'}
                        </span>
                        <span className="log-coord">{coord(s.r, s.c)}</span>
                        <span className="log-icon" aria-hidden>
                          {s.result === 'miss' ? (
                            <span className="baseball small" />
                          ) : (
                            '✕'
                          )}
                        </span>
                        <span className="log-result">
                          {s.result === 'sunk'
                            ? `SUNK ${s.shipName ?? ''}`
                            : s.result.toUpperCase()}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>

          <div className="bottom-row">
            <div className="mini-scoreboard">
              <div className="ms-title">FENWAY PARK</div>
              <table>
                <thead>
                  <tr>
                    <th />
                    <th>1</th>
                    <th>2</th>
                    <th>3</th>
                    <th>4</th>
                    <th>5</th>
                    <th>6</th>
                    <th>7</th>
                    <th>8</th>
                    <th>9</th>
                    <th className="rhe">R</th>
                    <th className="rhe">H</th>
                    <th className="rhe">E</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="team">BOSTON</td>
                    {Array.from({ length: 9 }).map((_, i) => (
                      <td key={`b${i}`}>·</td>
                    ))}
                    <td className="rhe">{stats.youHits}</td>
                    <td className="rhe">{stats.youShots}</td>
                    <td className="rhe">0</td>
                  </tr>
                  <tr>
                    <td className="team">VISITOR</td>
                    {Array.from({ length: 9 }).map((_, i) => (
                      <td key={`v${i}`}>·</td>
                    ))}
                    <td className="rhe">{stats.aiHits}</td>
                    <td className="rhe">{stats.aiShots}</td>
                    <td className="rhe">0</td>
                  </tr>
                </tbody>
              </table>
              <div className="ms-bottom">
                <div className="ms-chip">
                  <span className="ms-chip-label">AT BAT</span>
                  <span className="ms-chip-val">
                    {turn === 'you' ? 'YOU' : 'CPU'}
                  </span>
                </div>
                <div className="ms-chip">
                  <span className="ms-chip-label">BALL</span>
                  <span className="dot green" />
                  <span className="dot green" />
                  <span className="dot off" />
                </div>
                <div className="ms-chip">
                  <span className="ms-chip-label">STRIKE</span>
                  <span className="dot red" />
                  <span className="dot off" />
                </div>
                <div className="ms-chip">
                  <span className="ms-chip-label">OUT</span>
                  <span className="dot red" />
                  <span className="dot off" />
                  <span className="dot off" />
                </div>
              </div>
            </div>

            <div className="announcer-box">
              <div className="announcer-header">★ ANNOUNCER ★</div>
              <div className="announcer-body">
                <div className="announcer-mic" aria-hidden>
                  🎙
                </div>
                <div className="announcer-text">"{message}"</div>
              </div>
            </div>

            <div className="bottom-cta">
              <button
                className="end-turn"
                onClick={phase === 'over' ? newGame : newGame}
              >
                {phase === 'over' ? 'NEW GAME' : 'END TURN'}
              </button>
              <button className="options-btn" onClick={newGame}>
                OPTIONS ⚙
              </button>
            </div>
          </div>

          {phase === 'over' && (
            <div className="game-over">
              <div className="game-over-card">
                <h2>{winner === 'you' ? 'YOU WIN THE PENNANT!' : 'CPU TAKES THE GAME'}</h2>
                <p>
                  Final · You {stats.youHits}/{stats.youShots} · CPU{' '}
                  {stats.aiHits}/{stats.aiShots}
                </p>
                <button className="play-ball" onClick={newGame}>
                  PLAY AGAIN
                </button>
              </div>
            </div>
          )}
          {homerEffect && (
            <div
              key={homerEffect.id}
              className={`homer-effect ${homerEffect.who}`}
              aria-live="polite"
            >
              <div className="homer-trail" aria-hidden />
              <div className="homer-ball" aria-hidden />
              <div className="homer-call">
                {homerEffect.who === 'you' ? 'HOME RUN!' : 'GONE!'}{' '}
                {homerEffect.shipName} sunk
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
