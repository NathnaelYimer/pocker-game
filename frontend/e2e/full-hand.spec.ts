import { test, expect } from '@playwright/test';

const ACTIONS = ["Fold", "Check", "Call", "Bet", "Raise", "Allin"];

test('play a full hand and check hand history', async ({ page }) => {
  await page.goto('http://localhost:3000');

  // Set stack size and start the game
  await page.fill('input[type="number"]', '10000');
  await page.click('button:has-text("Apply")');
  await page.click('button:has-text("Start")');

  // Click "Deal Cards" if it is enabled
  const dealCardsButton = await page.$('button:has-text("Deal Cards"):not([disabled])');
  if (dealCardsButton) {
    await dealCardsButton.click();
  }

  // Log all button texts and their enabled state after clicking Start
  const buttons = await page.$$('button');
  for (const btn of buttons) {
    const text = await btn.textContent();
    const enabled = await btn.isEnabled();
    console.log(`Button: "${text}", Enabled: ${enabled}`);
  }

  // Play a simple hand: for each player, click the first enabled action button
  for (let i = 0; i < 5; i++) {
    let clicked = false;
    for (const action of ACTIONS) {
      const selector = `button:has-text(\"${action}\"):not([disabled])`;
      const button = await page.$(selector);
      if (button) {
        await button.click();
        clicked = true;
        break;
      }
    }
    if (!clicked) {
      throw new Error('No enabled action button found for player');
    }
    // Wait for the next action button to be enabled
    await page.waitForSelector('button:enabled');
  }

  // The last player should win
  await expect(page.locator('text=Final pot')).toBeVisible();

  // Check that hand history is updated
  await page.reload();
  await expect(page.locator('text=Hand History')).toBeVisible();
  await expect(page.locator('text=Player').first()).toBeVisible();
}); 