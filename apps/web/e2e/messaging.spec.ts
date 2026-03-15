import { test, expect } from '@playwright/test';
import { loginViaApi, dismissCheckInModal } from './helpers';

// Use jordan@test.com for messaging tests
const TEST_USER = {
  email: 'jordan@test.com',
  password: 'Password123!',
};

test.describe.configure({ mode: 'serial' });

test.describe('Messaging', () => {
  test('should send a message and see it appear', async ({ page }) => {
    await loginViaApi(page, TEST_USER.email, TEST_USER.password);
    await dismissCheckInModal(page);

    const conversations = page.locator('[role="option"]');
    await expect(conversations.first()).toBeVisible({ timeout: 10000 });
    await conversations.first().click();

    await expect(page.locator('#message-input')).toBeVisible({ timeout: 5000 });

    const testMessage = `E2E test message ${Date.now()}`;
    await page.locator('#message-input').fill(testMessage);

    const sendButton = page.locator('button:has-text("Envoyer"), button:has-text("Send")');
    await expect(sendButton).toBeEnabled();
    await sendButton.click();

    await expect(page.locator('#message-input')).toHaveValue('', { timeout: 5000 });
    await expect(page.locator('article').getByText(testMessage)).toBeVisible({ timeout: 10000 });
  });

  test('should display existing messages', async ({ page }) => {
    await loginViaApi(page, TEST_USER.email, TEST_USER.password);
    await dismissCheckInModal(page);

    const conversations = page.locator('[role="option"]');
    await expect(conversations.first()).toBeVisible({ timeout: 10000 });
    await conversations.first().click();

    await expect(page.locator('#message-input')).toBeVisible({ timeout: 5000 });

    const messages = page.locator('article');
    await expect(messages.first()).toBeVisible({ timeout: 10000 });
  });

  test('should show "How to talk to me" button', async ({ page }) => {
    await loginViaApi(page, TEST_USER.email, TEST_USER.password);
    await dismissCheckInModal(page);

    const conversations = page.locator('[role="option"]');
    await expect(conversations.first()).toBeVisible({ timeout: 10000 });
    await conversations.first().click();

    await expect(page.locator('#message-input')).toBeVisible({ timeout: 5000 });

    const infoButton = page.locator(
      'button:has-text("Comment me parler"), button:has-text("How to talk to")'
    );
    await expect(infoButton).toBeVisible({ timeout: 5000 });
  });
});
