import { test, expect } from '@playwright/test';
import { clearThrottle } from './helpers';

test.describe('Registration flow', () => {
  test('should register a new account and reach verify-email-sent', async ({ page }) => {
    clearThrottle();
    // Generate unique email so test is repeatable
    const uniqueEmail = `e2e-${Date.now()}@test.com`;

    await page.goto('/register');

    // Fill registration form
    await page.locator('#email').fill(uniqueEmail);
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirmPassword').fill('Password123!');
    await page.locator('#inviteCode').fill('E2ETEST');

    // Submit
    await page.locator('button[type="submit"]').click();

    // Should land on verify-email-sent page
    // (Beta mode auto-verifies, but registration still redirects here)
    await expect(page).toHaveURL(/\/verify-email-sent/, { timeout: 10000 });
  });

  test('should show error for invalid invite code', async ({ page }) => {
    const uniqueEmail = `e2e-bad-${Date.now()}@test.com`;

    await page.goto('/register');

    await page.locator('#email').fill(uniqueEmail);
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirmPassword').fill('Password123!');
    await page.locator('#inviteCode').fill('INVALIDCODE');
    await page.locator('button[type="submit"]').click();

    // Should show error
    await expect(page.locator('[role="alert"]')).toBeVisible({
      timeout: 5000,
    });

    // Should stay on register page
    await expect(page).toHaveURL(/\/register/);
  });

  test('should show error for mismatched passwords', async ({ page }) => {
    await page.goto('/register');

    await page.locator('#email').fill('mismatch@test.com');
    await page.locator('#password').fill('Password123!');
    await page.locator('#confirmPassword').fill('DifferentPass456!');
    await page.locator('#inviteCode').fill('E2ETEST');
    await page.locator('button[type="submit"]').click();

    // Should show error about password mismatch
    await expect(page.locator('[role="alert"]')).toBeVisible({
      timeout: 5000,
    });
  });
});
