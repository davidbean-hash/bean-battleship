import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import App from '../App';

describe('end-to-end app flow', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: false });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function advance(ms: number) {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }

  it('renders the landing screen with difficulty options and Play Ball', () => {
    render(<App />);
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/BEAN/);
    expect(screen.getByText(/Regular Season/i)).toBeInTheDocument();
    expect(screen.getByText(/World Series/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^PLAY BALL$/ })).toBeInTheDocument();
  });

  it('lets the user choose World Series difficulty and transition to setup', () => {
    render(<App />);
    fireEvent.click(screen.getByText(/World Series/i).closest('button')!);
    fireEvent.click(screen.getByRole('button', { name: /^PLAY BALL$/ }));
    expect(screen.getByText(/Your Fleet/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Randomize/i })).toBeInTheDocument();
  });

  it('randomizes the fleet and starts the battle', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^PLAY BALL$/ }));
    fireEvent.click(screen.getByRole('button', { name: /Randomize/i }));

    const startBtn = screen
      .getAllByRole('button', { name: /^PLAY BALL$/ })
      .find((b) => !(b as HTMLButtonElement).disabled);
    expect(startBtn).toBeDefined();
    fireEvent.click(startBtn!);

    // Battle screen should now show Enemy Field
    expect(screen.getByText(/Enemy Field/i)).toBeInTheDocument();
    expect(screen.getByText(/Shot Log/i)).toBeInTheDocument();
  });

  it('completes a full turn cycle: player fires, then CPU responds', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^PLAY BALL$/ }));
    fireEvent.click(screen.getByRole('button', { name: /Randomize/i }));
    fireEvent.click(
      screen
        .getAllByRole('button', { name: /^PLAY BALL$/ })
        .find((b) => !(b as HTMLButtonElement).disabled)!,
    );

    // Locate the Enemy Field panel and fire on its first unknown cell.
    const enemyPanel = screen.getByText(/Enemy Field/i).closest('.panel')!;
    const enemyCells = within(enemyPanel as HTMLElement).getAllByRole('button');
    const firstFireable = enemyCells.find(
      (b) => !(b as HTMLButtonElement).disabled && /unknown/i.test(b.getAttribute('aria-label') ?? ''),
    );
    expect(firstFireable).toBeDefined();
    fireEvent.click(firstFireable!);

    // Last Shot panel should now attribute the shot to "You"
    expect(screen.getByText(/by You/i)).toBeInTheDocument();

    // Advance the AI timer so CPU takes its turn
    advance(600);

    // CPU should have responded — either Last Shot updates, or a CPU log entry appears
    const logRows = screen.getAllByText(/CPU/i);
    expect(logRows.length).toBeGreaterThan(0);
  });

  it('shows surrender control during play and returns to landing', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^PLAY BALL$/ }));
    fireEvent.click(screen.getByRole('button', { name: /Randomize/i }));
    fireEvent.click(
      screen
        .getAllByRole('button', { name: /^PLAY BALL$/ })
        .find((b) => !(b as HTMLButtonElement).disabled)!,
    );

    const surrender = screen.getByRole('button', { name: /Surrender \/ Restart/i });
    fireEvent.click(surrender);

    // Back at landing
    expect(screen.getByRole('button', { name: /^PLAY BALL$/ })).toBeInTheDocument();
    expect(screen.getByText(/Regular Season/i)).toBeInTheDocument();
  });

  it('updates scoreboard derived values (R/H/E + outs) after a shot', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^PLAY BALL$/ }));
    fireEvent.click(screen.getByRole('button', { name: /Randomize/i }));
    fireEvent.click(
      screen
        .getAllByRole('button', { name: /^PLAY BALL$/ })
        .find((b) => !(b as HTMLButtonElement).disabled)!,
    );

    const enemyPanel = screen.getByText(/Enemy Field/i).closest('.panel')!;
    const fireable = within(enemyPanel as HTMLElement)
      .getAllByRole('button')
      .find(
        (b) => !(b as HTMLButtonElement).disabled && /unknown/i.test(b.getAttribute('aria-label') ?? ''),
      );
    fireEvent.click(fireable!);

    // BOSTON row in the mini scoreboard should now show 1 shot (H column)
    const miniScoreboard = document.querySelector('.mini-scoreboard') as HTMLElement;
    expect(miniScoreboard).not.toBeNull();
    const bostonRow = within(miniScoreboard).getByText(/^BOSTON$/i).closest('tr')!;
    const cells = within(bostonRow).getAllByRole('cell');
    // Last 3 cells are R, H, E. Shots = 1 (column H).
    expect(cells[cells.length - 2].textContent).toBe('1');
  });
});
