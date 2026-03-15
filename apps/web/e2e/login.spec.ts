import { test, expect } from '@playwright/test';
import { loginViaApi, dismissCheckInModal, clearThrottle } from './helpers';

const TEST_USER = {
  email: 'marie@test.com',
  password: 'Password123!',
};

test.describe.configure({ mode: 'serial' });

test.describe('Login flow', () => {
  test('should login and reach dashboard', async ({ page }) => {
    // Use API-based login to avoid rate limiting
    await loginViaApi(page, TEST_USER.email, TEST_USER.password);
    await dismissCheckInModal(page);

    // StatusBar should show the user's display name
    await expect(page.getByText('Marie').first()).toBeVisible();
  });

  test('should show error for wrong password', async ({ page }) => {
    clearThrottle();
    await page.goto('/login');

    await page.locator('#email').fill('sam@test.com');
    await page.locator('#password').fill('WrongPassword99!');
    await page.locator('button[type="submit"]').click();

    // Should show error alert
    await expect(page.locator('[role="alert"]').first()).toBeVisible({
      timeout: 5000,
    });

    // Should stay on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should show validation error for empty fields', async ({ page }) => {
    await page.goto('/login');

    await page.locator('button[type="submit"]').click();

    await expect(page.locator('[role="alert"]').first()).toBeVisible({
      timeout: 5000,
    });
  });
});
