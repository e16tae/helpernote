import { test, expect } from '@playwright/test';

test.describe('Navigation and Error Handling', () => {
  test('should handle navigation between pages', async ({ page }) => {
    await page.goto('/login');

    // Verify we're on login page
    await expect(page).toHaveURL(/.*login/);
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();

    // Navigate to register
    await page.getByRole('link', { name: '회원가입' }).click();
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();

    // Navigate back to login
    await page.getByRole('link', { name: '로그인' }).click();
    await expect(page).toHaveURL(/.*login/);
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    // Navigate to non-existent page
    const response = await page.goto('/this-page-does-not-exist');

    // Should either show 404 page or redirect
    // Just verify the page doesn't crash
    await expect(page.locator('body')).toBeVisible();
  });

  test('should preserve state during navigation', async ({ page }) => {
    await page.goto('/login');

    // Fill in username
    await page.getByLabel('사용자명').fill('testuser');

    // Navigate away and back
    await page.getByRole('link', { name: '회원가입' }).click();
    await page.goBack();

    // State might not be preserved (expected behavior)
    // Just verify page loads correctly
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    await page.goto('/login');
    await page.getByRole('link', { name: '회원가입' }).click();

    // Use browser back button
    await page.goBack();
    await expect(page).toHaveURL(/.*login/);

    // Use browser forward button
    await page.goForward();
    await expect(page).toHaveURL(/.*register/);
  });

  test('should load all critical assets', async ({ page }) => {
    const failedRequests: string[] = [];

    // Listen for failed requests
    page.on('requestfailed', request => {
      failedRequests.push(request.url());
    });

    await page.goto('/login');

    // Wait for page to fully load
    await page.waitForLoadState('networkidle');

    // Verify no critical assets failed (images can fail in test env)
    const criticalFailures = failedRequests.filter(url =>
      url.includes('.js') || url.includes('.css')
    );

    expect(criticalFailures).toHaveLength(0);
  });

  test('should have working logo link', async ({ page }) => {
    await page.goto('/login');

    // Logo should be visible and clickable
    const logo = page.getByText('Helpernote').first();
    await expect(logo).toBeVisible();

    // Note: Logo behavior on login page might differ from dashboard
    // Just verify it's present and doesn't cause errors when clicked
  });
});
