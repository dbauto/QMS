const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

test('home starts with the action queue and has no runtime or network errors', async ({ page }) => {
  const errors = [], requests = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => requests.push(request.url()));
  await page.goto('/');
  await expect(page.locator('#dashboard')).toBeVisible();
  await expect(page.locator('#overviewWorkList > button').first()).toContainText('Due today');
  await expect(page.locator('[data-view="dashboard"]')).toHaveAttribute('aria-current', 'page');
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  expect(errors).toEqual([]);
  await expect(page.locator('i[data-lucide]')).toHaveCount(0);
  expect(requests.every(url => url.startsWith('http://127.0.0.1:4173'))).toBe(true);
});

test('document filters combine, show an empty state, and can be cleared', async ({ page }) => {
  await page.goto('/#/repository');
  await expect(page.locator('[data-repository-panel="all"]')).toBeVisible();
  await page.locator('#controlledSearch').fill('Recruitment');
  await expect(page.locator('.controlledLibraryRow:visible')).toHaveCount(1);
  await page.locator('#controlledTypeFilter').selectOption('SOP');
  await expect(page.locator('#documentEmpty')).toBeVisible();
  await page.locator('#documentEmpty button').click();
  await expect(page.locator('.controlledLibraryRow:visible')).toHaveCount(6);
  await page.locator('[data-controlled-status="workflow"]').click();
  await expect(page.locator('.controlledLibraryRow:visible')).toHaveCount(1);
  await expect(page.locator('.controlledLibraryRow:visible')).toContainText('Final Inspection');
});

test('document details retain tabs, trap focus, and restore the list', async ({ page }) => {
  await page.goto('/#/repository');
  const row = page.locator('.controlledLibraryRow').first();
  await row.click();
  const modal = page.locator('#repositoryDocument');
  await expect(modal).toBeVisible();
  await expect(page.locator('#docTitle')).toHaveText('Recruitment Procedure');
  await page.locator('[data-doc-tab="traceability"]').click();
  await expect(page.locator('#repositoryDocument [data-doc-panel="traceability"]')).toBeVisible();
  await page.locator('[data-doc-tab="revision"]').click();
  await expect(page.locator('#repositoryDocument [data-doc-panel="revision"]')).toBeVisible();
  for (let i = 0; i < 20; i++) {
    await page.keyboard.press('Tab');
    expect(await modal.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(modal).toBeHidden();
  await expect(row).toBeFocused();
  await expect(page.locator('.mainArea')).not.toHaveAttribute('inert');
});

test('global document search works from Overview with keyboard selection', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Control+k');
  await page.locator('#globalSearch').fill('Supplier Control');
  await expect(page.locator('#searchResults button')).toHaveCount(1);
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  await expect(page.locator('#docTitle')).toHaveText('Supplier Control Procedure');
  await page.keyboard.press('Escape');
  await page.locator('#globalSearch').fill('no-such-document');
  await expect(page.locator('#searchResults')).toContainText('No matching documents');
  await page.keyboard.press('Escape');
  await expect(page.locator('#searchResults')).toBeHidden();
});

test('browser Back and deep links select the matching navigation item', async ({ page }) => {
  await page.goto('/');
  await page.locator('.primaryNav [data-view="repository"]').click();
  await page.locator('.primaryNav [data-view="records"]').click();
  await page.goBack();
  await expect(page.locator('#repository')).toBeVisible();
  await expect(page.locator('[data-view="repository"]')).toHaveAttribute('aria-current', 'page');
  await page.reload();
  await expect(page.locator('#repository')).toBeVisible();
});

test('mobile navigation is accessible, dismissible, and closes after choosing a page', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto('/');
  await expect(page.locator('.sideNav')).toBeHidden();
  await page.locator('#openNavigation').click();
  await expect(page.locator('.sideNav')).toBeVisible();
  await expect(page.locator('#closeNavigation')).toBeFocused();
  await page.keyboard.press('Shift+Tab');
  expect(await page.locator('.sideNav').evaluate(nav => nav.contains(document.activeElement))).toBe(true);
  await page.keyboard.press('Escape');
  await expect(page.locator('#openNavigation')).toBeFocused();
  await page.locator('#openNavigation').click();
  await page.locator('.primaryNav [data-view="repository"]').click();
  await expect(page.locator('#repository')).toBeVisible();
  await expect(page.locator('.sideNav')).toBeHidden();
  await expect(page.locator('#openNavigation')).toHaveAttribute('aria-expanded', 'false');
});

test('testing settings cannot read or overwrite the main-site profile', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('iqms.profile', JSON.stringify({ name: 'Production User' })));
  await page.goto('/#/settings');
  await expect(page.locator('#headerProfileName')).toHaveText('Maria Santos');
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.filter(key => key.startsWith('iqms.') || key.startsWith('nexus.'))).toEqual(['iqms.profile']);
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('iqms.profile')).name)).toBe('Production User');
});

test('readiness finding opens with focus contained and Escape closes it', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /Internal audit Overdue/ }).click();
  const drawer = page.locator('#complianceDrawerBackdrop');
  await expect(drawer).toHaveClass(/show/);
  for (let i = 0; i < 12; i++) {
    await page.keyboard.press('Tab');
    expect(await drawer.evaluate(element => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(drawer).not.toHaveClass(/show/);
});

const routes = ['dashboard','repository','records','approvals','audit','relationships','structure','types','compliance','ai','users','settings'];
for (const route of routes) {
  test(`${route}: responsive layout and accessibility`, async ({ page }, testInfo) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/#/' + route);
    await expect(page.locator('#' + route)).toBeVisible();
    for (const width of [320,375,768,1024,1280,1440,1920]) {
      await page.setViewportSize({ width, height: width < 780 ? 812 : 900 });
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `Overflow at ${width}px`).toBeLessThanOrEqual(width + 1);
      if ([375,1440].includes(width)) {
        await page.screenshot({ path: testInfo.outputPath(`${route}-${width}.png`), fullPage: true });
        const result = await new AxeBuilder({ page }).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();
        expect(result.violations.map(v => ({ id: v.id, targets: v.nodes.map(n => n.target) })), `Accessibility at ${width}px`).toEqual([]);
      }
    }
    expect(errors).toEqual([]);
  });
}
