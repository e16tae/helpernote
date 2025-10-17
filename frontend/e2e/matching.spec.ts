import { test, expect } from '@playwright/test';

test.describe('Matching Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', process.env.TEST_USERNAME || 'testuser');
    await page.fill('input[name="password"]', process.env.TEST_PASSWORD || 'testpassword');
    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard/);
  });

  test('should navigate to matchings page', async ({ page }) => {
    await page.locator('a[href*="/matchings"]').first().click();

    await expect(page).toHaveURL(/\/dashboard\/matchings/);
    await expect(page.locator('h1, h2, h3')).toContainText(/매칭|Matching/i);
  });

  test('should display matchings list', async ({ page }) => {
    await page.goto('/dashboard/matchings');

    // Check for table or list
    const hasTable = await page.locator('table').isVisible();
    const hasList = await page.locator('[role="list"], .matching-list').isVisible();

    expect(hasTable || hasList).toBeTruthy();
  });

  test('should open create matching form', async ({ page }) => {
    await page.goto('/dashboard/matchings');

    const createButton = page.locator('button:has-text("생성"), button:has-text("추가"), a[href*="/new"]');
    await createButton.first().click();

    await expect(page).toHaveURL(/\/dashboard\/matchings\/new/);
  });

  test('should create new matching', async ({ page }) => {
    await page.goto('/dashboard/matchings/new');

    // Select job posting
    const jobPostingSelect = page.locator('select[name*="job_posting"], button[role="combobox"]').first();
    await jobPostingSelect.click();
    await page.locator('[role="option"]').first().click();

    // Select customer (job seeker)
    const customerSelect = page.locator('select[name*="customer"], button[role="combobox"]').last();
    await customerSelect.click();
    await page.locator('[role="option"]').first().click();

    // Fill additional fields if present
    const notesField = page.locator('textarea[name="notes"]');
    if (await notesField.isVisible()) {
      await notesField.fill('테스트 매칭 생성');
    }

    // Submit
    await page.locator('button[type="submit"]').click();

    // Should redirect to matching detail or list
    await page.waitForURL(/\/dashboard\/matchings/, { timeout: 10000 });

    // Verify success
    const successIndicator = page.locator('text=/성공|생성|Success|Created/i');
    await expect(successIndicator).toBeVisible({ timeout: 5000 });
  });

  test('should view matching detail', async ({ page }) => {
    await page.goto('/dashboard/matchings');

    // Click on first matching
    const firstMatching = page.locator('table tbody tr, [role="listitem"]').first();
    await firstMatching.click();

    // Should navigate to detail page
    await expect(page).toHaveURL(/\/dashboard\/matchings\/\d+/);

    // Should show matching information
    await expect(page.locator('text=/상태|Status|구직자|구인/i')).toBeVisible();
  });

  test('should update matching status', async ({ page }) => {
    await page.goto('/dashboard/matchings');

    // Click on first matching
    const firstMatching = page.locator('table tbody tr, [role="listitem"]').first();
    await firstMatching.click();

    // Find status dropdown or buttons
    const statusButton = page.locator('button:has-text("상태"), select[name*="status"]').first();

    if (await statusButton.isVisible()) {
      await statusButton.click();

      // Select different status
      await page.locator('text=/진행중|완료|Pending|Completed/i').first().click();

      // Verify status change
      await expect(page.locator('text=/업데이트|변경|Updated|Changed/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should add memo to matching', async ({ page }) => {
    await page.goto('/dashboard/matchings');

    // Click on first matching
    const firstMatching = page.locator('table tbody tr, [role="listitem"]').first();
    await firstMatching.click();

    // Find memo section
    const memoButton = page.locator('button:has-text("메모"), button:has-text("Memo")');

    if (await memoButton.isVisible()) {
      await memoButton.click();

      // Fill memo
      const memoInput = page.locator('textarea[name="content"], textarea[placeholder*="메모"]');
      await memoInput.fill(`테스트 메모 ${Date.now()}`);

      // Submit memo
      await page.locator('button[type="submit"]').click();

      // Verify memo added
      await expect(page.locator('text=/메모.*추가|Memo.*added/i')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should filter matchings by status', async ({ page }) => {
    await page.goto('/dashboard/matchings');

    // Find filter dropdown
    const filterDropdown = page.locator('select[name*="status"], button:has-text("필터")');

    if (await filterDropdown.isVisible()) {
      await filterDropdown.click();

      // Select a status filter
      await page.locator('text=/진행중|Pending/i').first().click();

      // Wait for filtered results
      await page.waitForTimeout(1000);

      // Verify results are filtered
      const rows = page.locator('table tbody tr, [role="listitem"]');
      if (await rows.count() > 0) {
        await expect(rows.first()).toContainText(/진행중|Pending/i);
      }
    }
  });

  test('should complete matching workflow', async ({ page }) => {
    await page.goto('/dashboard/matchings');

    // Click on a matching
    const firstMatching = page.locator('table tbody tr, [role="listitem"]').first();
    await firstMatching.click();

    // Find complete button
    const completeButton = page.locator('button:has-text("완료"), button:has-text("Complete")');

    if (await completeButton.isVisible()) {
      await completeButton.click();

      // Fill completion form if exists
      const commissionInput = page.locator('input[name*="commission"]');
      if (await commissionInput.isVisible()) {
        await commissionInput.fill('1000000');
      }

      // Confirm
      await page.locator('button:has-text("확인"), button:has-text("Confirm")').last().click();

      // Verify completion
      await expect(page.locator('text=/완료|Completed/i')).toBeVisible({ timeout: 5000 });
    }
  });
});
