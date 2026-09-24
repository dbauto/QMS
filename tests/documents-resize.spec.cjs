const { test, expect } = require('@playwright/test');

test('Primary Spaces divider can be dragged, adjusted by keyboard, and reset', async ({ page }) => {
  await page.goto('/#/repository');
  const rail = page.locator('#dmsSpaceRail');
  const splitter = page.getByRole('separator', { name: 'Resize Primary Spaces panel' });
  const initial = await rail.evaluate(element => element.getBoundingClientRect().width);
  const handle = await splitter.boundingBox();
  expect(handle).not.toBeNull();

  await page.mouse.move(handle.x + handle.width / 2, handle.y + 150);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 110, handle.y + 150, { steps: 5 });
  await page.mouse.up();
  const dragged = await rail.evaluate(element => element.getBoundingClientRect().width);
  expect(dragged).toBeGreaterThan(initial + 80);
  await expect(splitter).toHaveAttribute('aria-valuenow', String(Math.round(dragged)));

  await splitter.focus();
  await page.keyboard.press('ArrowLeft');
  const keyed = await rail.evaluate(element => element.getBoundingClientRect().width);
  expect(keyed).toBeLessThan(dragged);
  await page.reload();
  const restored = await rail.evaluate(element => element.getBoundingClientRect().width);
  expect(restored).toBeCloseTo(keyed, 0);

  await splitter.dblclick();
  const reset = await rail.evaluate(element => element.getBoundingClientRect().width);
  expect(reset).toBeCloseTo(initial, 0);
});
