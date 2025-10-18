import { test, expect } from '@playwright/test';

test.describe('Customer Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', process.env.TEST_USERNAME || 'playwright');
    await page.fill('input[name="password"]', process.env.TEST_PASSWORD || 'test1234');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/);
  });

  test('should navigate to customers page', async ({ page }) => {
    // Click on customers menu item
    await page.locator('a[href*="/customers"]').first().click();

    await expect(page).toHaveURL(/\/dashboard\/customers/);
    await expect(page.locator('h1, h2, h3')).toContainText(/고객|Customer/i);
  });

  test('should display customers list', async ({ page }) => {
    await page.goto('/dashboard/customers');

    // Check for table or list
    const hasTable = await page.locator('table').isVisible();
    const hasList = await page.locator('[role="list"], .customer-list').isVisible();

    expect(hasTable || hasList).toBeTruthy();
  });

  test('should open create customer form', async ({ page }) => {
    await page.goto('/dashboard/customers');

    // Click create button
    const createButton = page.locator('button:has-text("생성"), button:has-text("추가"), a[href*="/new"]');
    await createButton.first().click();

    await expect(page).toHaveURL(/\/dashboard\/customers\/new/);
  });

  test('should create new customer', async ({ page }) => {
    await page.goto('/dashboard/customers/new');

    const timestamp = Date.now();

    // Fill customer form
    await page.fill('input[name="name"]', `고객${timestamp}`);
    await page.fill('input[name="phone"]', '010-1234-5678');

    // Fill optional fields if they exist
    const emailInput = page.locator('input[name="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill(`customer${timestamp}@test.com`);
    }

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Should redirect to customer detail or list
    await page.waitForURL(/\/dashboard\/customers/, { timeout: 10000 });

    // Verify success message or customer in list
    const successIndicator = page.locator('text=/성공|추가됨|Success|Created/i');
    const customerName = page.locator(`text=고객${timestamp}`);

    await expect(successIndicator.or(customerName)).toBeVisible({ timeout: 5000 });
  });

  test('should view customer detail', async ({ page }) => {
    await page.goto('/dashboard/customers');

    // Click on first customer
    const firstCustomer = page.locator('table tbody tr, [role="listitem"]').first();
    await firstCustomer.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/dashboard\/customers\/\d+/);

    // Should show customer information
    await expect(page.locator('text=/이름|Name|전화|Phone/i')).toBeVisible();
  });

  test('should edit customer', async ({ page }) => {
    await page.goto('/dashboard/customers');

    // Click on first customer to view detail
    const firstCustomer = page.locator('table tbody tr, [role="listitem"]').first();
    await firstCustomer.click();

    // Click edit button
    const editButton = page.locator('button:has-text("수정"), button:has-text("Edit"), a[href*="/edit"]');
    await editButton.first().click();

    await expect(page).toHaveURL(/\/edit$/);

    // Modify a field
    const nameInput = page.locator('input[name="name"]');
    const originalName = await nameInput.inputValue();
    await nameInput.fill(`${originalName} (수정됨)`);

    // Submit
    await page.locator('button[type="submit"]').click();

    // Verify update
    await page.waitForURL(/\/dashboard\/customers\/\d+$/);
    await expect(page.locator(`text=${originalName} (수정됨)`)).toBeVisible({ timeout: 5000 });
  });

  test('should search customers', async ({ page }) => {
    await page.goto('/dashboard/customers');

    // Find search input
    const searchInput = page.locator('input[type="search"], input[placeholder*="검색"]');

    if (await searchInput.isVisible()) {
      await searchInput.fill('테스트');

      // Wait for search results
      await page.waitForTimeout(1000);

      // Results should be filtered
      const rows = page.locator('table tbody tr, [role="listitem"]');
      await expect(rows.first()).toBeVisible();
    }
  });

  test('should delete customer', async ({ page }) => {
    // First create a customer to delete
    await page.goto('/dashboard/customers/new');
    const timestamp = Date.now();
    await page.fill('input[name="name"]', `삭제테스트${timestamp}`);
    await page.fill('input[name="phone"]', '010-9999-9999');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard\/customers/);

    // Find and click the customer
    await page.locator(`text=삭제테스트${timestamp}`).click();

    // Click delete button
    const deleteButton = page.locator('button:has-text("삭제"), button:has-text("Delete")');
    await deleteButton.click();

    // Confirm deletion in dialog
    await page.locator('button:has-text("확인"), button:has-text("Confirm"), button:has-text("삭제")').last().click();

    // Should redirect to list
    await page.waitForURL(/\/dashboard\/customers$/);

    // Verify customer is not in list
    await expect(page.locator(`text=삭제테스트${timestamp}`)).not.toBeVisible();
  });
});
