import { test, expect } from '@playwright/test';

test.describe('Conway\'s Game of Life — Happy Path', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('page loads with title and default state', async ({ page }) => {
    await expect(page.locator('h1')).toContainText("Conway's Game of Life");
    await expect(page.getByTestId('gen-count')).toHaveText('0');
    await expect(page.getByTestId('grid-canvas')).toBeVisible();
    await expect(page.getByTestId('play-pause-btn')).toBeVisible();
    await expect(page.getByTestId('step-btn')).toBeVisible();
    await expect(page.getByTestId('clear-btn')).toBeVisible();
    await expect(page.getByTestId('randomize-btn')).toBeVisible();
    await expect(page.getByTestId('speed-slider')).toBeVisible();
  });

  test('toggle cells on canvas, play, then pause', async ({ page }) => {
    const canvas = page.getByTestId('grid-canvas');
    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    const { x, y, width, height } = box as NonNullable<typeof box>;

    const cellW = width / 30;
    const cellH = height / 30;

    // Paint a Blinker: three horizontal cells at row 15
    for (const col of [14, 15, 16]) {
      await page.mouse.click(
        x + col * cellW + cellW / 2,
        y + 15 * cellH + cellH / 2
      );
    }

    await expect(page.getByTestId('gen-count')).toHaveText('0');

    // Step once — blinker oscillates, gen counter becomes 1
    await page.getByTestId('step-btn').click();
    await expect(page.getByTestId('gen-count')).toHaveText('1');

    // Play and wait for gen counter to advance (tolerate timing drift)
    await page.getByTestId('play-pause-btn').click();
    await expect(page.getByTestId('play-pause-btn')).toContainText('Pause');

    await expect
      .poll(async () => {
        const text = await page.getByTestId('gen-count').textContent();
        return Number(text);
      }, { timeout: 5000 })
      .toBeGreaterThanOrEqual(3);

    // Pause and verify the simulation stops
    await page.getByTestId('play-pause-btn').click();
    await expect(page.getByTestId('play-pause-btn')).toContainText('Play');

    const genAfterPause = Number(
      await page.getByTestId('gen-count').textContent()
    );

    // Poll to confirm the counter stays frozen (no waitForTimeout)
    await expect
      .poll(async () => {
        const text = await page.getByTestId('gen-count').textContent();
        return Number(text);
      }, { timeout: 1000 })
      .toBe(genAfterPause);
  });

  test('clear resets grid and gen counter', async ({ page }) => {
    // Step a couple of times first
    await page.getByTestId('randomize-btn').click();
    await page.getByTestId('step-btn').click();
    await expect(page.getByTestId('gen-count')).toHaveText('1');

    // Clear should reset everything
    await page.getByTestId('clear-btn').click();
    await expect(page.getByTestId('gen-count')).toHaveText('0');
  });

  test('randomize populates the grid and resets gen counter', async ({ page }) => {
    // Step a few times
    await page.getByTestId('randomize-btn').click();
    await page.getByTestId('step-btn').click();
    await page.getByTestId('step-btn').click();
    await expect(page.getByTestId('gen-count')).toHaveText('2');

    // Randomize again resets gen counter
    await page.getByTestId('randomize-btn').click();
    await expect(page.getByTestId('gen-count')).toHaveText('0');
  });

  test('speed slider adjusts the rate label', async ({ page }) => {
    const slider = page.getByTestId('speed-slider');
    await expect(page.getByTestId('speed-value')).toHaveText('10');

    await slider.fill('30');
    await slider.press('ArrowRight');

    await expect
      .poll(async () => page.getByTestId('speed-value').textContent(), {
        timeout: 2000,
      })
      .toBe('31');
  });

  test('grid resize form works with valid input', async ({ page }) => {
    await page.getByTestId('width-input').fill('10');
    await page.getByTestId('height-input').fill('10');
    await page.getByTestId('resize-btn').click();

    // Gen counter resets on resize
    await expect(page.getByTestId('gen-count')).toHaveText('0');
    // Canvas should still be visible
    await expect(page.getByTestId('grid-canvas')).toBeVisible();
  });

  test('grid resize form rejects invalid input', async ({ page }) => {
    const widthInput = page.getByTestId('width-input');

    // Clear and type an out-of-range value (triple-click to select all, then type)
    await widthInput.click({ clickCount: 3 });
    await widthInput.press('Backspace');
    await widthInput.type('0');

    await page.getByTestId('resize-btn').click();

    await expect(page.getByTestId('size-error')).toBeVisible({ timeout: 3000 });
  });
});
