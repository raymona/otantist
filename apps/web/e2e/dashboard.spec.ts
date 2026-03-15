import { test, expect } from '@playwright/test';
import { loginViaApi, dismissCheckInModal } from './helpers';

// Use alex@test.com for dashboard tests
const TEST_USER = {
  email: 'alex@test.com',
  password: 'Password123!',
};

test.describe.configure({ mode: 'serial' });

test.describe('Dashboard', () => {
  test('should display StatusBar with app name and energy indicator', async ({ page }) => {
    await loginViaApi(page, TEST_USER.email, TEST_USER.password);
    await dismissCheckInModal(page);

    await expect(page.getByText('Alex').first()).toBeVisible();
    await expect(page.locator('.rounded-full').first()).toBeVisible();
  });

  test('should display conversation list', async ({ page }) => {
    await loginViaApi(page, TEST_USER.email, TEST_USER.password);
    await dismissCheckInModal(page);

    const conversationList = page.locator('[role="listbox"]');
    await expect(conversationList).toBeVisible({ timeout: 10000 });

    const conversations = page.locator('[role="option"]');
    await expect(conversations.first()).toBeVisible({ timeout: 10000 });
  });

  test('should open a conversation when clicked', async ({ page }) => {
    await loginViaApi(page, TEST_USER.email, TEST_USER.password);
    await dismissCheckInModal(page);

    const conversations = page.locator('[role="option"]');
    await expect(conversations.first()).toBeVisible({ timeout: 10000 });
    await conversations.first().click();

    await expect(page.locator('#message-input')).toBeVisible({ timeout: 5000 });
  });

  test('should show new conversation button', async ({ page }) => {
    await loginViaApi(page, TEST_USER.email, TEST_USER.password);
    await dismissCheckInModal(page);

    const newConvButton = page.locator(
      'button:has-text("Nouvelle conversation"), button:has-text("New conversation")'
    );
    await expect(newConvButton).toBeVisible({ timeout: 5000 });
  });
});
