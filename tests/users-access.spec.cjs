const { test, expect } = require('@playwright/test');

test('user management keeps the list readable and edits access in a modal', async ({ page }) => {
  await page.goto('/#/users');
  await expect(page.locator('#accessUserRows .accessUserRow')).toHaveCount(6);
  await expect(page.locator('#users .permissionCheck')).toHaveCount(0);

  await page.getByRole('button', { name: 'Edit Ana Reyes' }).click();
  await expect(page.locator('#userAccessModal')).toBeVisible();
  await expect(page.locator('#userAccessForm [name="name"]')).toHaveValue('Ana Reyes');
  await page.locator('#userRoleChoices input[value="Approver"]').check();
  await page.locator('#userRightChoices input[value="Approve"]').check();
  await page.getByRole('button', { name: 'Save changes' }).click();
  await expect(page.locator('.accessUserRow', { hasText: 'Ana Reyes' })).toContainText('Approver');

  await page.getByRole('button', { name: 'Add user' }).first().click();
  await page.locator('#userAccessForm [name="name"]').fill('Jane Rivera');
  await page.locator('#userAccessForm [name="email"]').fill('jane@abc.com');
  await page.locator('#userAccessForm [name="department"]').selectOption('Purchasing');
  await page.locator('#userRoleChoices input[value="Reviewer"]').check();
  await page.locator('#userRightChoices input[value="View"]').check();
  await page.locator('#userAccessForm button[type="submit"]').click();
  await expect(page.locator('#accessUserCount')).toHaveText('7');
  await page.reload();
  await expect(page.locator('.accessUserRow', { hasText: 'Jane Rivera' })).toBeVisible();
  await page.locator('#userAccessSearch').fill('Jane');
  await expect(page.locator('.accessUserRow')).toHaveCount(1);
  await page.getByRole('button', { name: 'Options for Jane Rivera' }).click();
  await page.getByRole('button', { name: 'Remove user', exact: true }).click();
  await expect(page.locator('#deleteUserModal')).toBeVisible();
  await page.locator('#confirmDeleteUser').click();
  await expect(page.locator('#accessEmpty')).toBeVisible();
  await expect(page.locator('#accessUserCount')).toHaveText('6');
});

test('user directory fits on a narrow viewport without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/#/users');
  await expect(page.locator('.accessUserRow').first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'Edit Maria Santos' }).click();
  await expect(page.locator('#userAccessModal')).toBeVisible();
});
