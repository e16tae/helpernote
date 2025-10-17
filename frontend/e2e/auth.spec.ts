import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    await expect(page).toHaveTitle(/Helpernote/);
    await expect(page.locator('h1, h2, h3')).toContainText(/로그인|Login/i);
  });

  test('should show validation errors for empty form', async ({ page }) => {
    await page.goto('/login');

    // Submit without filling form
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();

    // Check for validation messages (react-hook-form shows specific messages)
    await expect(page.locator('text=/사용자명을 입력하세요|입력하세요|required/i').first()).toBeVisible();
  });

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login');

    const registerLink = page.locator('a[href*="/register"]');
    await registerLink.click();

    await expect(page).toHaveURL(/\/register/);
    await expect(page.locator('h1, h2, h3')).toContainText(/회원가입|Register/i);
  });

  test('should complete registration flow', async ({ page }) => {
    await page.goto('/register');

    // Generate unique username
    const timestamp = Date.now();
    const username = `testuser${timestamp}`;

    // Fill registration form
    await page.fill('input[name="username"]', username);
    await page.fill('input[name="password"]', 'TestPassword123!');

    // Select security question (shadcn/ui Select component)
    const securitySelect = page.locator('button[role="combobox"]').first();
    await securitySelect.click();
    await page.locator('[role="option"]').first().click();

    // Fill security answer
    await page.fill('input[name="security_answer"]', 'MyAnswer123');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Should redirect to dashboard or login
    await page.waitForURL(/\/(dashboard|login)/, { timeout: 10000 });
  });

  test('should login with valid credentials', async ({ page, context }) => {
    await page.goto('/login');

    // Use test credentials from environment
    await page.fill('input[name="username"]', process.env.TEST_USERNAME || 'testuser');
    await page.fill('input[name="password"]', process.env.TEST_PASSWORD || 'testpassword');

    await page.locator('button[type="submit"]').click();

    // Should redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });

    // Verify cookies are set
    const cookies = await context.cookies();
    const tokenCookie = cookies.find(c => c.name === 'token');
    expect(tokenCookie).toBeDefined();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="username"]', 'invaliduser');
    await page.fill('input[name="password"]', 'wrongpassword');

    await page.locator('button[type="submit"]').click();

    // Should show error message
    await expect(page.locator('text=/잘못|오류|Invalid|error/i')).toBeVisible({ timeout: 5000 });
  });

  test('should logout successfully', async ({ page, context }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[name="username"]', process.env.TEST_USERNAME || 'testuser');
    await page.fill('input[name="password"]', process.env.TEST_PASSWORD || 'testpassword');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/);

    // Then logout - click user menu button
    // Find button containing the username (visible on desktop viewports)
    await page.getByRole('button', { name: new RegExp(process.env.TEST_USERNAME || 'testuser') }).click();

    // Click logout menu item in dropdown
    await page.getByText(/로그아웃|Logout/i).click();

    // Should redirect to login
    await page.waitForURL(/\/login/);

    // Verify cookies are cleared
    const cookies = await context.cookies();
    const tokenCookie = cookies.find(c => c.name === 'token');
    expect(tokenCookie).toBeUndefined();
  });
});
