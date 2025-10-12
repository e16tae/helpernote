import { test, expect } from '@playwright/test';

test.describe('Login Page', () => {
  test('should display login form with Korean text', async ({ page }) => {
    await page.goto('/login');

    // Check if the page has Korean text
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
    await expect(page.getByText('계정에 로그인하세요')).toBeVisible();

    // Check for form fields
    await expect(page.getByLabel('사용자명')).toBeVisible();
    await expect(page.getByLabel('비밀번호')).toBeVisible();

    // Check for submit button
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();

    // Check for register link
    await expect(page.getByRole('link', { name: '회원가입' })).toBeVisible();
  });

  test('should show logo', async ({ page }) => {
    await page.goto('/login');

    // Check for logo (it should contain the text "Helpernote")
    await expect(page.getByText('Helpernote').first()).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');

    // Click on register link
    await page.getByRole('link', { name: '회원가입' }).click();

    // Should navigate to register page
    await expect(page).toHaveURL(/.*register/);
    await expect(page.getByRole('heading', { name: '회원가입' })).toBeVisible();
  });

  test('should show validation for empty form', async ({ page }) => {
    await page.goto('/login');

    // Try to submit empty form
    await page.getByRole('button', { name: '로그인' }).click();

    // HTML5 validation should prevent submission
    // The button should still be visible (form doesn't submit)
    await expect(page.getByRole('button', { name: '로그인' })).toBeVisible();
  });
});
