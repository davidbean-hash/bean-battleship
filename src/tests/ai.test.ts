import { describe, expect, it } from 'vitest';
import { createAI, chooseShot, recordResult } from '../utils/ai';
import { FLEET } from '../types';

describe('ai state', () => {
  it('always chooses an unknown cell', () => {
    const ai = createAI('hard');

    ai.shots[0][0] = 'miss';
    ai.shots[0][1] = 'hit';

    const [r, c] = chooseShot(ai);
    expect(ai.shots[r][c]).toBe('unknown');
  });

  it('queues targets after a hit', () => {
    const ai = createAI('moderate');

    recordResult(ai, 4, 4, 'hit');

    expect(ai.currentHits).toContainEqual([4, 4]);
    expect(ai.targetQueue.length).toBeGreaterThan(0);
  });

  it('marks sunk ship cells and removes remaining length', () => {
    const ai = createAI('hard');
    const twoCellShip = {
      ...FLEET.find((s) => s.length === 2)!,
      row: 3,
      col: 3,
      orientation: 'H' as const,
      hits: 2,
    };

    recordResult(ai, 3, 4, 'sunk', twoCellShip);

    expect(ai.shots[3][3]).toBe('sunk');
    expect(ai.shots[3][4]).toBe('sunk');
    expect(ai.currentHits).toHaveLength(0);
    expect(ai.remainingLengths.includes(2)).toBe(false);
  });
});
