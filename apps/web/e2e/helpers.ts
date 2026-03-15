import { type Page, expect } from '@playwright/test';
import { execSync } from 'child_process';

const API_URL = 'http://localhost:3001';

/**
 * Clear Redis rate-limit keys so E2E tests don't hit 429.
 */
export function clearThrottle() {
  try {
    execSync(
      "docker exec otantist-redis redis-cli EVAL \"local keys=redis.call('KEYS','throttle:*') for i=1,#keys do redis.call('DEL',keys[i]) end return #keys\" 0",
      { stdio: 'pipe' }
    );
  } catch {
    // Redis may not be running — tests will still work if in-memory fallback is active
  }
}

/**
 * Login via API and inject tokens into the browser's localStorage.
 * Uses addInitScript so tokens are set BEFORE React mounts.
 * Clears rate-limit keys first to avoid 429 errors.
 */
export async function loginViaApi(page: Page, email: string, password: string) {
  clearThrottle();

  // Call the login API directly
  const response = await page.request.post(`${API_URL}/api/auth/login`, {
    data: { email, password },
  });

  if (!response.ok()) {
    throw new Error(`Login API failed for ${email}: ${response.status()} ${await response.text()}`);
  }

  const data = await response.json();

  // Queue script to inject tokens into localStorage BEFORE any page JS executes.
  // This ensures the auth context reads valid tokens on mount.
  await page.addInitScript(
    ({ accessToken, refreshToken }) => {
      localStorage.setItem('otantist-access-token', accessToken);
      localStorage.setItem('otantist-refresh-token', refreshToken);
    },
    { accessToken: data.accessToken, refreshToken: data.refreshToken }
  );

  // Navigate to dashboard — auth context will find tokens already in localStorage
  await page.goto('/dashboard');
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
}

/**
 * Dismiss the daily check-in modal if it appears.
 */
export async function dismissCheckInModal(page: Page) {
  const modal = page.locator('[role="dialog"]');
  try {
    await modal.waitFor({ state: 'visible', timeout: 3000 });
    await page.locator('button:has-text("Passer"), button:has-text("Skip")').first().click();
    await modal.waitFor({ state: 'hidden', timeout: 3000 });
  } catch {
    // Modal didn't appear — continue
  }
}
