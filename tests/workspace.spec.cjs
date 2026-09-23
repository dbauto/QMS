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
  const statusTabs = await page.locator('#controlledStatusTabs').evaluate(element => ({
    clientHeight: element.clientHeight,
    scrollHeight: element.scrollHeight,
  }));
  expect(statusTabs.scrollHeight).toBe(statusTabs.clientHeight);
  await page.locator('#controlledSearch').fill('Recruitment');
  await expect(page.locator('.controlledLibraryRow:visible')).toHaveCount(1);
  await page.locator('#controlledTypeFilter').selectOption('SOP');
  await expect(page.locator('#documentEmpty')).toBeVisible();
  await page.locator('#documentEmpty button').click();
  await expect(page.locator('.controlledLibraryRow:visible')).toHaveCount(6);
  await page.locator('[data-controlled-status="workflow"]').click();
  await expect(page.locator('.controlledLibraryRow:visible')).toHaveCount(2);
  await expect(page.locator('.controlledLibraryRow:visible')).toContainText('Final Inspection');
  await expect(page.locator('.controlledLibraryRow:visible')).toContainText('Control of Nonconforming Outputs');
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

test('task documents open in context without navigating to Documents', async ({ page }) => {
  await page.goto('/#/approvals');
  const task = page.locator('#approvals .taskQueue > .approvalItem[data-document-code="SOP-QA-014"]');
  const openButton = page.locator('#openTaskDocument');

  await task.click();
  await expect(page.locator('#approvals .approvalHero h2')).toHaveText('Control of Nonconforming Outputs');
  await openButton.click();
  await expect(page).toHaveURL(/#\/approvals$/);
  await expect(page.locator('#approvals')).toBeVisible();
  await expect(page.locator('#repository')).toBeHidden();
  await expect(page.locator('#repositoryDocument')).toBeVisible();
  await expect(page.locator('#repositoryDocument')).toHaveAttribute('data-context', 'task');
  await expect(page.locator('#docContextBreadcrumb')).toHaveText('My tasks');
  await expect(page.locator('#docTitle')).toHaveText('Control of Nonconforming Outputs');
  await page.keyboard.press('Escape');
  await expect(page.locator('#repositoryDocument')).toBeHidden();
  await expect(page).toHaveURL(/#\/approvals$/);
  await expect(openButton).toBeFocused();

  const revisionTask = page.locator('#revisionTaskQueue .approvalItem').first();
  await revisionTask.click();
  await expect(page.locator('#repositoryDocument')).toBeVisible();
  await expect(page.locator('#docContextBreadcrumb')).toHaveText('My tasks');
  await expect(page).toHaveURL(/#\/approvals$/);
});


test('active approval locks parallel revisions and the final approver publishes', async ({ page }) => {
  await page.goto('/#/repository');
  await page.locator('.controlledLibraryRow', { hasText: 'Final Inspection Work Instruction' }).click();

  await expect(page.locator('#docStatus')).toHaveText('In approval');
  await expect(page.locator('#workflowLockBanner')).toBeVisible();
  await expect(page.locator('#requestRevisionBtn')).toBeDisabled();
  await expect(page.locator('#startRevisionBtn')).toBeDisabled();
  await expect(page.locator('#approvalDecision')).toContainText('Publish');
  await expect(page.locator('#repositoryDocument .reviewWorkflow')).toContainText('Final approval & publish');

  await page.locator('#approvalDecision .btn.primary').click();
  await expect(page.locator('#docStatus')).toHaveText('Effective');
  await expect(page.locator('#approvalDecision')).toBeHidden();
  await expect(page.locator('#requestRevisionBtn')).toBeEnabled();
  await expect(page.locator('#startRevisionBtn')).toBeEnabled();
});


test('return keeps the same revision open and removes the stale final approval task', async ({ page }) => {
  await page.goto('/#/repository');
  await page.locator('.controlledLibraryRow', { hasText: 'Final Inspection Work Instruction' }).click();

  await page.locator('#approvalDecision .dangerOutline').click();
  await expect(page.locator('#docStatus')).toHaveText('Returned for changes');
  await expect(page.locator('#openRevisionBanner')).toBeVisible();
  await expect(page.locator('#openRevisionNumber')).toHaveText('Rev 03');
  await expect(page.locator('#openRevisionStage')).toContainText('Returned for changes');
  await expect(page.locator('#requestRevisionBtn')).toBeDisabled();
  await expect(page.locator('#startRevisionBtn')).toBeDisabled();

  await page.keyboard.press('Escape');
  await page.goto('/#/approvals');
  await expect(page.locator('#approvals .taskQueue > .approvalItem[data-document-code="WI-PROD-021"]')).toHaveCount(0);
  await expect(page.locator('#revisionTaskQueue')).toContainText('WI-PROD-021');
  await expect(page.locator('#revisionTaskQueue')).toContainText('Rev 03');
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

test('desktop sidebar keeps its compact, hover-expand, and persistent pin behavior', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/');
  const nav = page.locator('.sideNav');
  const main = page.locator('.mainArea');
  const width = locator => locator.evaluate(element => Math.round(element.getBoundingClientRect().width));
  const margin = locator => locator.evaluate(element => Math.round(parseFloat(getComputedStyle(element).marginLeft)));

  await expect.poll(() => width(nav)).toBe(58);
  await expect.poll(() => margin(main)).toBe(58);
  await nav.hover();
  await expect(page.locator('body')).toHaveClass(/navExpanded/);
  await expect.poll(() => width(nav)).toBe(228);
  await expect.poll(() => margin(main)).toBe(58);
  await page.mouse.move(30, 150);
  await page.mouse.move(120, 60);
  await page.locator('#sidebarPin').click();
  await expect(page.locator('body')).toHaveClass(/navPinned/);
  await page.mouse.move(700, 300);
  await expect(page.locator('body')).toHaveClass(/navPinned/);
  await expect.poll(() => margin(main)).toBe(228);
  const taskBadgeGap = await page.locator('[data-view="approvals"]').evaluate(item => {
    const label = item.children[1].getBoundingClientRect();
    const badge = item.querySelector('.navBadge').getBoundingClientRect();
    return Math.round(badge.left - label.right);
  });
  expect(taskBadgeGap).toBeGreaterThanOrEqual(6);
  expect(taskBadgeGap).toBeLessThanOrEqual(10);
  expect(await page.evaluate(() => localStorage.getItem('nexus.navPinned'))).toBe('1');
  await page.setViewportSize({ width: 375, height: 812 });
  await expect(page.locator('body')).not.toHaveClass(/navPinned/);
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator('body')).toHaveClass(/navPinned/);

  await page.reload();
  await expect(page.locator('body')).toHaveClass(/navPinned/);
  await expect.poll(() => margin(main)).toBe(228);
  await page.mouse.move(30, 150);
  await page.mouse.move(120, 60);
  await page.locator('#sidebarPin').click();
  await page.mouse.move(700, 300);
  await expect.poll(() => width(nav)).toBe(58);
  await page.locator('[data-view="dashboard"]').focus();
  await expect.poll(() => width(nav)).toBe(228);
  await page.locator('#globalSearch').focus();
  await expect.poll(() => width(nav)).toBe(58);
});

test('main workspace settings preserve the existing production profile and storage namespace', async ({ page }) => {
  await page.addInitScript(() => localStorage.setItem('iqms.profile', JSON.stringify({ name: 'Production User' })));
  await page.goto('/#/settings');
  await expect(page.locator('#headerProfileName')).toHaveText('Production User');
  const keys = await page.evaluate(() => Object.keys(localStorage));
  expect(keys.some(key => key.startsWith('iqms-testing.'))).toBe(false);
  expect(keys).toContain('iqms.profile');
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
