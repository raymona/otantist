import { test, expect } from '@playwright/test';
import { clearThrottle } from './helpers';

test.describe.configure({ mode: 'serial' });

const API_URL = 'http://localhost:3001';

test.describe('Onboarding flow', () => {
  test('should complete all 5 onboarding steps and reach dashboard', async ({ page }) => {
    const testEmail = `e2e-onboard-${Date.now()}@test.com`;

    // Clear rate limits before API calls
    clearThrottle();

    // ── Register via API ──
    const regResponse = await page.request.post(`${API_URL}/api/auth/register`, {
      data: {
        email: testEmail,
        password: 'Password123!',
        inviteCode: 'E2ETEST',
        language: 'fr',
      },
    });
    expect(regResponse.ok()).toBeTruthy();

    // ── Login via API ──
    const loginResponse = await page.request.post(`${API_URL}/api/auth/login`, {
      data: { email: testEmail, password: 'Password123!' },
    });
    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();

    // ── Accept terms via API ──
    const termsResponse = await page.request.post(`${API_URL}/api/auth/accept-terms`, {
      headers: {
        Authorization: `Bearer ${loginData.accessToken}`,
        'Content-Type': 'application/json',
      },
      data: { accepted: true },
    });
    expect(termsResponse.ok()).toBeTruthy();

    // ── Inject auth and navigate to onboarding ──
    await page.addInitScript(
      ({ accessToken, refreshToken }) => {
        localStorage.setItem('otantist-access-token', accessToken);
        localStorage.setItem('otantist-refresh-token', refreshToken);
      },
      { accessToken: loginData.accessToken, refreshToken: loginData.refreshToken }
    );
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 });

    // ── Step 1: Profile ──
    await page.locator('#display-name').fill('E2E Test User');
    await page.locator('#age-group').selectOption('age_18_25');
    await page.locator('button:has-text("Suivant"), button:has-text("Next")').click();

    await expect(page.locator('#display-name')).not.toBeVisible({ timeout: 5000 });

    // ── Step 2: Communication ──
    await page.locator('fieldset input[name="tone"]').first().check({ force: true });
    await page.locator('button[aria-pressed="false"]').first().click();
    await page.locator('button:has-text("Suivant"), button:has-text("Next")').click();

    await expect(page.locator('input[name="tone"]').first()).not.toBeVisible({ timeout: 5000 });

    // ── Step 3: Sensory ──
    await page.locator('button:has-text("Suivant"), button:has-text("Next")').click();

    // ── Step 4: Conversation starters ──
    await page.locator('button:has-text("Terminer"), button:has-text("Finish")').click();

    // ── Step 5: Complete ──
    const goToAppButton = page.locator(
      'button:has-text("Commencer"), button:has-text("Start using")'
    );
    await expect(goToAppButton).toBeVisible({ timeout: 10000 });
    await goToAppButton.click();

    // Should land on dashboard
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });
});
