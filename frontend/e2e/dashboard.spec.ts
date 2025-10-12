import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to login page
    await page.goto('/login');
  });

  test('should display dashboard layout correctly', async ({ page }) => {
    await page.goto('/dashboard');

    // Check if redirected to login (unauthenticated)
    if (page.url().includes('/login')) {
      // Expected behavior - unauthenticated users should be redirected
      await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    } else {
      // If authenticated, check dashboard elements
      await expect(page.getByText('Welcome to Helpernote')).toBeVisible();

      // Check sidebar menu items
      await expect(page.getByRole('link', { name: '대시보드' })).toBeVisible();
      await expect(page.getByRole('link', { name: '고객 관리' })).toBeVisible();
      await expect(page.getByRole('link', { name: '구인 공고' })).toBeVisible();
      await expect(page.getByRole('link', { name: '구직 공고' })).toBeVisible();
      await expect(page.getByRole('link', { name: '매칭 관리' })).toBeVisible();
      await expect(page.getByRole('link', { name: '정산 관리' })).toBeVisible();
      await expect(page.getByRole('link', { name: '설정' })).toBeVisible();
    }
  });

  test('should navigate between menu items', async ({ page }) => {
    await page.goto('/dashboard');

    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip();
    }

    // Navigate to customers page
    await page.getByRole('link', { name: '고객 관리' }).click();
    await expect(page).toHaveURL(/.*customers/);

    // Navigate back to dashboard
    await page.getByRole('link', { name: '대시보드' }).click();
    await expect(page).toHaveURL(/.*\/dashboard$/);
  });

  test('should display user dropdown menu', async ({ page }) => {
    await page.goto('/dashboard');

    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip();
    }

    // Click user menu button
    const userButton = page.locator('button').filter({ has: page.locator('svg') }).first();
    await userButton.click();

    // Check dropdown menu items
    await expect(page.getByText('My Account')).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('menuitem', { name: 'Log out' })).toBeVisible();
  });
});
