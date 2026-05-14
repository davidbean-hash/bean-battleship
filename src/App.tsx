import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Layout } from './components/Layout';
import { Board } from './components/Board';
import { PlacementDashboard, type ShipDeployState } from './components/PlacementDashboard';
import { GameOverModal } from './components/GameOverModal';
import { AUSTIN_FLEET } from './data/ships';
import {
  DEFAULT_BOARD_SIZE,
  areAllShipsSunk,
  canPlaceShip,
  createEmptyBoard,
  generateRandomFleet,
  getCellLabel,
  getShipCells,
  placeShip,
  receiveShot,
  removeShip,
} from './utils/board';
import {
  createInitialAIMemory,
  getAIMove,
  updateAIMemory,
  type AIMemory,
} from './utils/ai';
import type {
  Board as BoardModel,
  CellCoord,
  GamePhase,
  Orientation,
} from './types';

const SIZE = DEFAULT_BOARD_SIZE;
const FLEET_BY_ID = new Map(AUSTIN_FLEET.map((s) => [s.id, s]));
const AI_TURN_DELAY_MS = 850;

interface BattleStats {
  playerShots: number;
  playerHits: number;
  aiShots: number;
  aiHits: number;
}

const ZERO_STATS: BattleStats = { playerShots: 0, playerHits: 0, aiShots: 0, aiHits: 0 };

function clonePlayerLayout(board: BoardModel): BoardModel {
  // Rebuild a fresh board preserving placements but clearing hit/miss state.
  let fresh = createEmptyBoard(board.size);
  for (const ship of board.ships) {
    const def = FLEET_BY_ID.get(ship.shipId);
    if (!def) continue;
    fresh = placeShip(fresh, def, ship.start, ship.orientation);
  }
  return fresh;
}

export default function App() {
  // ----- Phase + boards -----
  const [phase, setPhase] = useState<GamePhase>('placement');
  const [playerBoard, setPlayerBoard] = useState<BoardModel>(() => createEmptyBoard(SIZE));
  const [enemyBoard, setEnemyBoard] = useState<BoardModel>(() =>
    generateRandomFleet(SIZE, AUSTIN_FLEET),
  );

  // ----- Placement-phase state -----
  const [selectedShipId, setSelectedShipId] = useState<string | null>(null);
  const [orientation, setOrientation] = useState<Orientation>('horizontal');
  const [hoverCoord, setHoverCoord] = useState<CellCoord | null>(null);
  const [draggingShipId, setDraggingShipId] = useState<string | null>(null);

  // ----- Battle-phase state -----
  const [aiMemory, setAIMemory] = useState<AIMemory>(() => createInitialAIMemory(SIZE));
  const [stats, setStats] = useState<BattleStats>(ZERO_STATS);
  const [turn, setTurn] = useState<'player' | 'ai'>('player');
  const [lastPlayerMove, setLastPlayerMove] = useState<string | null>(null);
  const [lastAIMove, setLastAIMove] = useState<string | null>(null);
  const [winner, setWinner] = useState<'player' | 'ai' | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);

  const aiTimerRef = useRef<number | null>(null);

  // ----- Derived values -----
  const placedById = useMemo(() => {
    const map = new Map<string, BoardModel['ships'][number]>();
    for (const ship of playerBoard.ships) map.set(ship.shipId, ship);
    return map;
  }, [playerBoard]);

  const allPlaced = placedById.size === AUSTIN_FLEET.length;
  const activeShipId = draggingShipId ?? selectedShipId;
  const activeShip = activeShipId ? FLEET_BY_ID.get(activeShipId) : undefined;

  const candidateBoard = useMemo(() => {
    if (!activeShipId) return playerBoard;
    return placedById.has(activeShipId) ? removeShip(playerBoard, activeShipId) : playerBoard;
  }, [activeShipId, placedById, playerBoard]);

  const preview = useMemo(() => {
    if (phase !== 'placement' || !activeShip || !hoverCoord) return undefined;
    const cells = getShipCells(hoverCoord, activeShip.length, orientation);
    const valid = canPlaceShip(candidateBoard, activeShip, hoverCoord, orientation);
    return { cells, valid };
  }, [activeShip, candidateBoard, hoverCoord, orientation, phase]);

  // Per-ship dashboard state, including 'sunk' during battle.
  const dashboardStates = useMemo<Record<string, ShipDeployState>>(() => {
    const result: Record<string, ShipDeployState> = {};
    for (const ship of AUSTIN_FLEET) {
      const placed = placedById.get(ship.id);
      const isSunk = placed ? placed.hits.every(Boolean) : false;
      result[ship.id] = {
        status: isSunk ? 'sunk' : placed ? 'placed' : 'pending',
        orientation: placed ? placed.orientation : orientation,
      };
    }
    return result;
  }, [orientation, placedById]);

  const playerShipsSunk = playerBoard.ships.filter((s) => s.hits.every(Boolean)).length;
  const enemyShipsSunk = enemyBoard.ships.filter((s) => s.hits.every(Boolean)).length;
  const accuracy = stats.playerShots === 0
    ? 0
    : Math.round((stats.playerHits / stats.playerShots) * 100);

  // ----- Placement handlers (Phase 6) -----

  const handleSelectShip = useCallback(
    (shipId: string) => {
      if (phase !== 'placement') return;
      const placed = placedById.get(shipId);
      if (placed) {
        setPlayerBoard((b) => removeShip(b, shipId));
        setOrientation(placed.orientation);
        setSelectedShipId(shipId);
      } else {
        setSelectedShipId((id) => (id === shipId ? null : shipId));
      }
    },
    [phase, placedById],
  );

  const handleRotateShip = useCallback(
    (shipId?: string) => {
      if (phase !== 'placement') return;
      if (shipId) {
        const placed = placedById.get(shipId);
        if (placed) {
          setPlayerBoard((b) => removeShip(b, shipId));
          setOrientation(placed.orientation === 'horizontal' ? 'vertical' : 'horizontal');
          setSelectedShipId(shipId);
          return;
        }
        if (selectedShipId !== shipId) setSelectedShipId(shipId);
      }
      setOrientation((o) => (o === 'horizontal' ? 'vertical' : 'horizontal'));
    },
    [phase, placedById, selectedShipId],
  );

  const handlePlayerCellClick = useCallback(
    (coord: CellCoord) => {
      if (phase !== 'placement' || !activeShip) return;
      if (!canPlaceShip(candidateBoard, activeShip, coord, orientation)) return;
      setPlayerBoard(placeShip(candidateBoard, activeShip, coord, orientation));
      setSelectedShipId(null);
      setHoverCoord(null);
    },
    [activeShip, candidateBoard, orientation, phase],
  );

  const handlePlayerCellDrop = useCallback(
    (coord: CellCoord) => {
      if (phase !== 'placement' || !activeShip) return;
      setDraggingShipId(null);
      if (!canPlaceShip(candidateBoard, activeShip, coord, orientation)) return;
      setPlayerBoard(placeShip(candidateBoard, activeShip, coord, orientation));
      setSelectedShipId(null);
      setHoverCoord(null);
    },
    [activeShip, candidateBoard, orientation, phase],
  );

  const handleDragShipStart = useCallback(
    (shipId: string) => {
      if (phase !== 'placement') return;
      const placed = placedById.get(shipId);
      if (placed) {
        setPlayerBoard((b) => removeShip(b, shipId));
        setOrientation(placed.orientation);
      }
      setDraggingShipId(shipId);
      setSelectedShipId(shipId);
    },
    [phase, placedById],
  );

  const handleDragShipEnd = useCallback(() => setDraggingShipId(null), []);

  const handleRandomize = useCallback(() => {
    setPlayerBoard(generateRandomFleet(SIZE, AUSTIN_FLEET));
    setSelectedShipId(null);
    setHoverCoord(null);
  }, []);

  const handleClear = useCallback(() => {
    setPlayerBoard(createEmptyBoard(SIZE));
    setSelectedShipId(null);
    setHoverCoord(null);
  }, []);

  // Keyboard rotate.
  useEffect(() => {
    if (phase !== 'placement') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'r' && e.key !== 'R') return;
      if (!activeShipId) return;
      e.preventDefault();
      handleRotateShip(activeShipId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeShipId, handleRotateShip, phase]);

  // ----- Battle handlers -----

  const handleStartBattle = useCallback(() => {
    if (!allPlaced) return;
    setEnemyBoard(generateRandomFleet(SIZE, AUSTIN_FLEET));
    setAIMemory(createInitialAIMemory(SIZE));
    setStats(ZERO_STATS);
    setLastPlayerMove(null);
    setLastAIMove(null);
    setWinner(null);
    setEndTime(null);
    setStartTime(Date.now());
    setTurn('player');
    setSelectedShipId(null);
    setHoverCoord(null);
    setPhase('playing');
  }, [allPlaced]);

  const finishGame = useCallback((who: 'player' | 'ai') => {
    setWinner(who);
    setPhase('gameover');
    setEndTime(Date.now());
  }, []);

  const handleEnemyCellClick = useCallback(
    (coord: CellCoord) => {
      if (phase !== 'playing' || turn !== 'player') return;
      const cell = enemyBoard.cells[coord.row][coord.col];
      if (cell.state === 'hit' || cell.state === 'miss') return;

      const { board: nextBoard, result } = receiveShot(enemyBoard, coord);
      setEnemyBoard(nextBoard);

      const isHit = result.outcome === 'hit' || result.outcome === 'sunk';
      setStats((s) => ({
        ...s,
        playerShots: s.playerShots + 1,
        playerHits: s.playerHits + (isHit ? 1 : 0),
      }));

      let message = `You fired at ${getCellLabel(coord)} — `;
      if (result.outcome === 'sunk' && result.shipId) {
        const def = FLEET_BY_ID.get(result.shipId);
        message += `you sank ${def?.name ?? 'an enemy ship'}!`;
      } else if (result.outcome === 'hit') {
        message += 'hit!';
      } else {
        message += 'miss.';
      }
      setLastPlayerMove(message);

      if (areAllShipsSunk(nextBoard)) {
        finishGame('player');
        return;
      }
      setTurn('ai');
    },
    [enemyBoard, finishGame, phase, turn],
  );

  // AI turn driver: when it's the AI's move during battle, schedule it.
  useEffect(() => {
    if (phase !== 'playing' || turn !== 'ai') return;
    aiTimerRef.current = window.setTimeout(() => {
      const move = getAIMove(aiMemory, SIZE);
      const { board: nextPlayerBoard, result } = receiveShot(playerBoard, move);
      setPlayerBoard(nextPlayerBoard);

      const isHit = result.outcome === 'hit' || result.outcome === 'sunk';
      setStats((s) => ({
        ...s,
        aiShots: s.aiShots + 1,
        aiHits: s.aiHits + (isHit ? 1 : 0),
      }));

      let sunkCells: CellCoord[] | undefined;
      let message = `Enemy fired at ${getCellLabel(move)} — `;
      if (result.outcome === 'sunk' && result.shipId) {
        const ship = nextPlayerBoard.ships.find((s) => s.shipId === result.shipId);
        sunkCells = ship?.cells;
        const def = FLEET_BY_ID.get(result.shipId);
        message += `the AI sank your ${def?.name ?? 'ship'}!`;
      } else if (result.outcome === 'hit') {
        message += 'hit!';
      } else {
        message += 'miss.';
      }
      setLastAIMove(message);

      setAIMemory((m) =>
        updateAIMemory(m, move, {
          outcome: result.outcome,
          sunkCells,
        }),
      );

      if (areAllShipsSunk(nextPlayerBoard)) {
        finishGame('ai');
        return;
      }
      setTurn('player');
    }, AI_TURN_DELAY_MS);

    return () => {
      if (aiTimerRef.current !== null) {
        window.clearTimeout(aiTimerRef.current);
        aiTimerRef.current = null;
      }
    };
  }, [aiMemory, finishGame, phase, playerBoard, turn]);

  const handlePlayAgain = useCallback(() => {
    // Keep the player's chosen layout; refresh enemy board, AI memory, stats.
    setPlayerBoard((b) => clonePlayerLayout(b));
    setEnemyBoard(generateRandomFleet(SIZE, AUSTIN_FLEET));
    setAIMemory(createInitialAIMemory(SIZE));
    setStats(ZERO_STATS);
    setLastPlayerMove(null);
    setLastAIMove(null);
    setWinner(null);
    setEndTime(null);
    setStartTime(Date.now());
    setTurn('player');
    setPhase('playing');
  }, []);

  const handleMainMenu = useCallback(() => {
    setPlayerBoard(createEmptyBoard(SIZE));
    setEnemyBoard(generateRandomFleet(SIZE, AUSTIN_FLEET));
    setAIMemory(createInitialAIMemory(SIZE));
    setStats(ZERO_STATS);
    setLastPlayerMove(null);
    setLastAIMove(null);
    setWinner(null);
    setEndTime(null);
    setStartTime(null);
    setTurn('player');
    setSelectedShipId(null);
    setHoverCoord(null);
    setPhase('placement');
  }, []);

  const handleSurrender = useCallback(() => {
    if (phase !== 'playing') return;
    finishGame('ai');
  }, [finishGame, phase]);

  // ----- Render helpers -----

  const placedCount = placedById.size;
  const elapsedMs = startTime ? (endTime ?? Date.now()) - startTime : 0;

  const dashboard = (
    <PlacementDashboard
      states={dashboardStates}
      selectedShipId={selectedShipId ?? undefined}
      onSelectShip={phase === 'placement' ? handleSelectShip : undefined}
      onRotateShip={phase === 'placement' ? handleRotateShip : undefined}
      onDragShipStart={phase === 'placement' ? handleDragShipStart : undefined}
      onDragShipEnd={phase === 'placement' ? handleDragShipEnd : undefined}
    />
  );

  // Status panel content varies by phase.
  let statusLeft: ReactNode;
  let statusHeadline: ReactNode;
  let statusRight: ReactNode;

  if (phase === 'placement') {
    statusLeft = `Captain · Deploy your fleet (${placedCount}/${AUSTIN_FLEET.length})`;
    statusHeadline = activeShip
      ? `Placing the ${activeShip.name} · ${orientation === 'horizontal' ? '↔ Horizontal' : '↕ Vertical'} · press R to rotate`
      : 'Drag an Austin landmark onto the harbour, partner';
    statusRight = (
      <div className="control-row">
        <button type="button" className="ctl-btn" onClick={handleRandomize}>
          Randomize Fleet
        </button>
        <button
          type="button"
          className="ctl-btn"
          onClick={handleClear}
          disabled={placedCount === 0}
        >
          Clear Fleet
        </button>
        <button
          type="button"
          className="ctl-btn ctl-btn--primary"
          onClick={handleStartBattle}
          disabled={!allPlaced}
          title={allPlaced ? 'Begin the battle' : `Deploy all ${AUSTIN_FLEET.length} ships`}
        >
          Begin Battle
        </button>
      </div>
    );
  } else {
    // playing or gameover
    statusLeft = (
      <div className="battle-stats">
        <span className="battle-stat">
          <span className="battle-stat__label">Turn</span>
          <span className="battle-stat__value">
            {phase === 'gameover' ? 'Final' : turn === 'player' ? 'You' : 'Enemy'}
          </span>
        </span>
        <span className="battle-stat">
          <span className="battle-stat__label">Shots</span>
          <span className="battle-stat__value">{stats.playerShots}</span>
        </span>
        <span className="battle-stat">
          <span className="battle-stat__label">Accuracy</span>
          <span className="battle-stat__value">{accuracy}%</span>
        </span>
      </div>
    );
    statusHeadline = (
      <div className="battle-log">
        <div className="battle-log__line battle-log__line--player">
          {lastPlayerMove ?? 'Y\'all ready? Click any cell on the enemy waters to fire.'}
        </div>
        {lastAIMove && (
          <div className="battle-log__line battle-log__line--ai">{lastAIMove}</div>
        )}
      </div>
    );
    statusRight = (
      <div className="battle-stats battle-stats--right">
        <span className="battle-stat">
          <span className="battle-stat__label">Sunk</span>
          <span className="battle-stat__value">
            {enemyShipsSunk}
            <span className="battle-stat__small"> /{AUSTIN_FLEET.length}</span>
          </span>
        </span>
        <span className="battle-stat">
          <span className="battle-stat__label">Lost</span>
          <span className="battle-stat__value">
            {playerShipsSunk}
            <span className="battle-stat__small"> /{AUSTIN_FLEET.length}</span>
          </span>
        </span>
        <div className="control-row">
          <button
            type="button"
            className="ctl-btn"
            onClick={handleSurrender}
            disabled={phase !== 'playing'}
          >
            Surrender
          </button>
          <button type="button" className="ctl-btn ctl-btn--primary" onClick={handleMainMenu}>
            Restart
          </button>
        </div>
      </div>
    );
  }

  const totalShipsSunkForModal = winner === 'player' ? enemyShipsSunk : playerShipsSunk;
  const hitsForModal = stats.playerHits;
  const shotsForModal = stats.playerShots;

  return (
    <Layout dashboard={dashboard}>
      <section className="status-panel">
        <div className="status-side">{statusLeft}</div>
        <div className="status-headline">{statusHeadline}</div>
        <div className="status-side right">{statusRight}</div>
      </section>

      <Board
        board={playerBoard}
        variant="player"
        title="YOUR FLEET"
        subtitle={
          phase === 'placement'
            ? 'Click a cell to place · drag from the dashboard · click a placed ship to reposition'
            : phase === 'playing'
              ? turn === 'ai' ? 'Enemy is taking aim…' : 'Awaiting your orders, Captain'
              : 'Battle complete'
        }
        revealShips
        preview={preview}
        onCellClick={phase === 'placement' ? handlePlayerCellClick : undefined}
        onCellHover={phase === 'placement' ? setHoverCoord : undefined}
        onCellDrop={phase === 'placement' ? handlePlayerCellDrop : undefined}
        acceptDrop={phase === 'placement' && Boolean(activeShipId)}
        disableCells={phase !== 'placement'}
      />

      <div className="vs-badge" aria-hidden>
        <span className="vs-badge__ring" />
        <span className="vs-badge__star">★</span>
        <span className="vs-badge__text">VS</span>
        <span className="vs-badge__compass">N</span>
      </div>

      <Board
        board={enemyBoard}
        variant="enemy"
        title="ENEMY WATERS"
        subtitle={
          phase === 'placement'
            ? 'Locked until your fleet is deployed'
            : phase === 'playing'
              ? turn === 'player' ? 'Click any open cell to fire' : 'Enemy turn — hold fire'
              : winner === 'player' ? 'Fleet destroyed' : 'Enemy fleet still afloat'
        }
        revealShips={false}
        onCellClick={phase === 'playing' && turn === 'player' ? handleEnemyCellClick : undefined}
        disableCells={phase !== 'playing' || turn !== 'player'}
      />

      {phase === 'gameover' && winner && (
        <GameOverModal
          winner={winner}
          shotsFired={shotsForModal}
          hits={hitsForModal}
          shipsSunk={totalShipsSunkForModal}
          totalShips={AUSTIN_FLEET.length}
          elapsedMs={elapsedMs}
          onPlayAgain={handlePlayAgain}
          onMainMenu={handleMainMenu}
        />
      )}
    </Layout>
  );
}

