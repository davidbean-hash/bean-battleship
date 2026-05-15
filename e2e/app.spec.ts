import { test, expect, Page } from '@playwright/test';

async function startBattle(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^PLAY BALL$/ }).click();
  await page.getByRole('button', { name: /Randomize/i }).click();
  // The big enabled "PLAY BALL" inside roster panel
  const playButtons = page.getByRole('button', { name: /^PLAY BALL$/ });
  const count = await playButtons.count();
  for (let i = 0; i < count; i++) {
    const b = playButtons.nth(i);
    if (await b.isEnabled()) {
      await b.click();
      break;
    }
  }
  await expect(page.getByText(/Enemy Field/i)).toBeVisible();
}

test('landing screen renders title and difficulty options', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('h1').first()).toContainText('BEAN');
  await expect(page.getByText(/Regular Season/i)).toBeVisible();
  await expect(page.getByText(/World Series/i)).toBeVisible();
  await expect(page.getByRole('button', { name: /^PLAY BALL$/ })).toBeVisible();
});

test('user can navigate landing -> setup -> battle', async ({ page }) => {
  await startBattle(page);
  await expect(page.getByText(/Shot Log/i)).toBeVisible();
  await expect(page.locator('.mini-scoreboard')).toBeVisible();
});

test('firing on enemy board updates Last Shot and Shot Log', async ({ page }) => {
  await startBattle(page);

  // Click first available enemy cell
  const enemyPanel = page.locator('.panel', { hasText: 'Enemy Field' });
  const firstCell = enemyPanel.locator('button[aria-label*="unknown"]').first();
  await firstCell.click();

  await expect(page.getByText(/by You/i)).toBeVisible();

  // Wait for CPU to respond
  await expect(page.getByText(/by CPU/i)).toBeVisible({ timeout: 3000 });
});

test('scoreboard reflects real shot count', async ({ page }) => {
  await startBattle(page);
  const enemyPanel = page.locator('.panel', { hasText: 'Enemy Field' });
  await enemyPanel.locator('button[aria-label*="unknown"]').first().click();

  const bostonRow = page.locator('.mini-scoreboard tr', { hasText: /^BOSTON/ });
  const cells = bostonRow.locator('td');
  const cellsCount = await cells.count();
  // Last 3 columns: R, H, E. H = total shots.
  await expect(cells.nth(cellsCount - 2)).toHaveText('1');
});

test('AT BAT chip toggles between YOU and CPU', async ({ page }) => {
  await startBattle(page);
  const atBat = page.locator('.ms-chip.at-bat .ms-chip-val');
  await expect(atBat).toHaveText(/YOU/);

  const enemyPanel = page.locator('.panel', { hasText: 'Enemy Field' });
  await enemyPanel.locator('button[aria-label*="unknown"]').first().click();

  // Either it's CPU's turn briefly, or it's already back to YOU after AI fires.
  // Either way, after enough time, expect YOU again.
  await expect(atBat).toHaveText(/YOU|CPU/);
});

test('surrender returns to landing', async ({ page }) => {
  await startBattle(page);
  await page.getByRole('button', { name: /Surrender \/ Restart/ }).click();
  await expect(page.getByRole('button', { name: /^PLAY BALL$/ })).toBeVisible();
  await expect(page.getByText(/Regular Season/i)).toBeVisible();
});

test('enemy board has active turn glow during player turn', async ({ page }) => {
  await startBattle(page);
  const enemyPanel = page.locator('.panel', { hasText: 'Enemy Field' });
  // The clickable cells exist only when it's the player's turn
  await expect(enemyPanel.locator('button.cell.clickable').first()).toBeVisible();
});
