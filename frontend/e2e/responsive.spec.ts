import { test, expect, devices } from '@playwright/test';

test.describe('Responsive Design', () => {
  test('should show mobile hamburger menu on small screens', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');

    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip();
    }

    // Desktop sidebar should be hidden on mobile
    const desktopSidebar = page.locator('.lg\\:flex').first();
    await expect(desktopSidebar).not.toBeVisible();

    // Mobile hamburger menu button should be visible
    const hamburgerButton = page.getByLabel('메뉴 열기');
    await expect(hamburgerButton).toBeVisible();

    // Click hamburger to open mobile menu
    await hamburgerButton.click();

    // Mobile menu should show navigation items
    await expect(page.getByRole('link', { name: '대시보드' })).toBeVisible();
    await expect(page.getByRole('link', { name: '고객 관리' })).toBeVisible();
  });

  test('should show desktop sidebar on large screens', async ({ page }) => {
    // Set desktop viewport
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');

    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip();
    }

    // Desktop sidebar navigation should be visible
    await expect(page.getByRole('link', { name: '대시보드' })).toBeVisible();
    await expect(page.getByRole('link', { name: '고객 관리' })).toBeVisible();

    // Mobile hamburger should be hidden on desktop
    const hamburgerButton = page.getByLabel('메뉴 열기');
    await expect(hamburgerButton).not.toBeVisible();
  });

  test('should maintain functionality on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/login');

    // Form should work on mobile
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    await expect(page.getByLabel('사용자명')).toBeVisible();
    await expect(page.getByLabel('비밀번호')).toBeVisible();
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();

    // Logo should be visible
    await expect(page.getByText('Helpernote').first()).toBeVisible();
  });

  test('should adapt table layouts on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard/customers');

    // Skip if redirected to login
    if (page.url().includes('/login')) {
      test.skip();
    }

    // Page should load without horizontal scroll issues
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth);
    const viewportWidth = await page.evaluate(() => window.innerWidth);

    // Allow small differences due to browser variations
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 20);
  });
});
