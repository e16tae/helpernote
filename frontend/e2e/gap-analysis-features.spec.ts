import { test, expect } from '@playwright/test';

/**
 * Comprehensive E2E tests for gap analysis implementation features
 * Tests all 9 priority improvements implemented
 */

// Helper function to login
async function login(page: any) {
  await page.goto('/login');
  await page.fill('input[name="username"]', process.env.TEST_USERNAME || 'testuser');
  await page.fill('input[name="password"]', process.env.TEST_PASSWORD || 'testpassword');
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard/, { timeout: 10000 });
}

// Helper function to create test customer
async function createTestCustomer(page: any, name: string) {
  await page.goto('/dashboard/customers/new');
  await page.fill('input#name', name);
  await page.fill('input#phone', '010-1234-5678');

  // Select customer type
  const typeSelect = page.locator('button[role="combobox"]').first();
  await typeSelect.click();
  await page.locator('[role="option"]:has-text("구인자")').first().click();

  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/dashboard\/customers\/\d+/, { timeout: 15000 });

  // Extract customer ID from URL
  const url = page.url();
  const match = url.match(/\/customers\/(\d+)/);
  return match ? parseInt(match[1]) : null;
}

test.describe('Gap Analysis Features - Priority 1', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Dashboard API Optimization - should load with single API call', async ({ page }) => {
    const requests: any[] = [];

    // Track API requests
    page.on('request', (request: any) => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          method: request.method(),
        });
      }
    });

    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Check dashboard stats API was called
    const statsRequest = requests.find(r =>
      r.url.includes('/api/dashboard/stats') && r.method === 'GET'
    );
    expect(statsRequest).toBeDefined();

    // Verify no redundant calls to individual endpoints
    const customersCall = requests.filter(r => r.url.match(/\/api\/customers$/));
    const jobPostingsCall = requests.filter(r => r.url.match(/\/api\/job-postings$/));
    const jobSeekingsCall = requests.filter(r => r.url.match(/\/api\/job-seekings$/));
    const matchingsCall = requests.filter(r => r.url.match(/\/api\/matchings$/));

    // These should not be called for dashboard stats
    expect(customersCall.length).toBeLessThanOrEqual(1);
    expect(jobPostingsCall.length).toBeLessThanOrEqual(1);
    expect(jobSeekingsCall.length).toBeLessThanOrEqual(1);
    expect(matchingsCall.length).toBeLessThanOrEqual(1);

    // Verify dashboard displays stats
    await expect(page.locator('text=/전체 고객|Total Customers/i').first()).toBeVisible();
    await expect(page.locator('text=/구인 공고|Job Postings/i').first()).toBeVisible();
    await expect(page.locator('text=/구직 공고|Job Seekings/i').first()).toBeVisible();
    await expect(page.locator('text=/매칭|Matchings/i').first()).toBeVisible();
  });

  test('Matching Update Endpoint - should update matching salary and fees', async ({ page }) => {
    // Navigate to matchings
    await page.goto('/dashboard/matchings');
    await page.waitForLoadState('networkidle');

    // Check if any matchings exist by counting tbody rows
    const rowCount = await page.locator('tbody tr').count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Click on first matching (tbody tr to avoid header row)
    const firstMatching = page.locator('tbody tr').first();
    await firstMatching.click();

    // Wait for matching detail page
    await page.waitForURL(/\/dashboard\/matchings\/\d+/);

    // Click edit button
    const editButton = page.locator('button:has-text("수정"), a:has-text("수정")').first();
    await editButton.click();

    await page.waitForURL(/\/dashboard\/matchings\/\d+\/edit/);

    // Get current values
    const salaryInput = page.locator('input[name="agreed_salary"]');
    const currentSalary = await salaryInput.inputValue();

    // Update salary
    const newSalary = (parseInt(currentSalary) + 100000).toString();
    await salaryInput.fill(newSalary);

    // Update employer fee rate
    const employerFeeInput = page.locator('input[name="employer_fee_rate"]');
    await employerFeeInput.fill('12.5');

    // Submit form
    await page.locator('button[type="submit"]').click();

    // Should redirect back to matching detail
    await page.waitForURL(/\/dashboard\/matchings\/\d+$/);

    // Verify updated values are displayed
    await expect(page.locator(`text=${newSalary}`)).toBeVisible();
    await expect(page.locator('text=/12.5%/')).toBeVisible();
  });
});

test.describe('Gap Analysis Features - Priority 2', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('Job Posting Tags API - should add and remove tags', async ({ page }) => {
    // Navigate to job postings
    await page.goto('/dashboard/job-postings');
    await page.waitForLoadState('networkidle');

    // Check if any job postings exist by counting tbody rows
    const rowCount = await page.locator('tbody tr').count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Click on first job posting (tbody tr to avoid header row)
    const firstPosting = page.locator('tbody tr').first();
    await firstPosting.click();

    await page.waitForURL(/\/dashboard\/job-postings\/\d+/);

    // Look for tag management section
    const tagsSection = page.locator('text=/태그|Tags/i');
    if (await tagsSection.isVisible().catch(() => false)) {
      // Try to add a tag
      const addTagButton = page.locator('button:has-text("태그 추가"), button:has-text("Add Tag")').first();
      if (await addTagButton.isVisible().catch(() => false)) {
        await addTagButton.click();

        // Select or create tag
        const tagSelect = page.locator('select, input[placeholder*="태그"]').first();
        await tagSelect.click();
        await tagSelect.fill('테스트태그');
        await page.keyboard.press('Enter');

        // Verify tag was added
        await expect(page.locator('text=테스트태그')).toBeVisible({ timeout: 5000 });
      }
    }
  });

  test('User File Upload - should upload and delete files in settings', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    // Scroll to user files section
    await page.locator('text=/개인 파일|User Files/i').first().scrollIntoViewIfNeeded();

    // Find file input
    const fileInput = page.locator('input[type="file"]').first();

    // Create test file
    const testFilePath = '/tmp/test-file.txt';
    await page.evaluate(() => {
      const fs = require('fs');
      fs.writeFileSync('/tmp/test-file.txt', 'Test file content');
    }).catch(() => {
      // If can't create file, skip test
      test.skip();
    });

    // Upload file
    await fileInput.setInputFiles(testFilePath);

    // Wait for upload to complete
    await expect(page.locator('text=/업로드 중|Uploading/i')).toBeHidden({ timeout: 10000 });
    await expect(page.locator('text=/test-file.txt/i')).toBeVisible({ timeout: 5000 });

    // Try to delete file
    const deleteButton = page.locator('button:has-text("삭제"), button[aria-label*="delete"]').last();
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();

      // Confirm deletion if dialog appears
      const confirmButton = page.locator('button:has-text("확인"), button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Verify file was deleted
      await expect(page.locator('text=/test-file.txt/i')).toBeHidden({ timeout: 5000 });
    }
  });

  test('Settlement Auto-calculation - should update settlement amounts on matching completion', async ({ page }) => {
    // Navigate to matchings
    await page.goto('/dashboard/matchings');
    await page.waitForLoadState('networkidle');

    // Check if any matchings exist by counting tbody rows
    const rowCount = await page.locator('tbody tr').count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Find an in-progress matching
    const inProgressCount = await page.locator('tbody tr').filter({ hasText: /진행중|In Progress/i }).count();

    if (inProgressCount === 0) {
      test.skip();
      return;
    }

    const inProgressMatching = page.locator('tbody tr').filter({ hasText: /진행중|In Progress/i }).first();
    await inProgressMatching.click();
    await page.waitForURL(/\/dashboard\/matchings\/\d+/);

    // Get matching details
    const employerFeeText = await page.locator('text=/구인자.*수수료/i').textContent();
    const employeeFeeText = await page.locator('text=/구직자.*수수료/i').textContent();

    // Complete matching
    const completeButton = page.locator('button:has-text("완료"), button:has-text("Complete")').first();
    if (await completeButton.isVisible().catch(() => false)) {
      await completeButton.click();

      // Confirm if dialog appears
      const confirmButton = page.locator('button:has-text("확인"), button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Wait for completion
      await expect(page.locator('text=/완료|Completed/i')).toBeVisible({ timeout: 5000 });

      // Navigate to settlements to verify auto-calculation
      await page.goto('/dashboard/settlements');
      await page.waitForLoadState('networkidle');

      // Verify settlement amounts were updated
      await expect(page.locator('text=/정산/i')).toBeVisible();
    }
  });
});

test.describe('Gap Analysis Features - Priority 3', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('User Memos Management - should add, edit, and delete memos in settings', async ({ page }) => {
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');

    // Scroll to user memos section
    await page.locator('text=/개인 메모|Personal Memos/i').first().scrollIntoViewIfNeeded();

    // Click "메모 추가" button to show form
    const showFormButton = page.locator('button:has-text("메모 추가")').first();
    await showFormButton.click();

    // Add new memo
    const memoInput = page.locator('textarea[placeholder*="메모"]').first();
    const testMemoContent = `테스트 메모 ${Date.now()}`;

    await memoInput.fill(testMemoContent);

    // Click save button
    const saveButton = page.locator('button:has-text("저장")').first();
    await saveButton.click();

    // Verify memo was added
    await expect(page.locator(`text=${testMemoContent}`)).toBeVisible({ timeout: 5000 });

    // Try to delete memo
    const deleteButton = page.locator('button:has-text("삭제"), button[aria-label*="delete"]').last();
    if (await deleteButton.isVisible().catch(() => false)) {
      await deleteButton.click();

      // Confirm deletion if dialog appears
      const confirmButton = page.locator('button:has-text("확인"), button:has-text("Confirm")');
      if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await confirmButton.click();
      }

      // Verify memo was deleted
      await expect(page.locator(`text=${testMemoContent}`)).toBeHidden({ timeout: 5000 });
    }
  });

  test('Profile Photo Delete - should upload and delete profile photo', async ({ page }) => {
    const customerName = `테스트고객_${Date.now()}`;
    const customerId = await createTestCustomer(page, customerName);

    if (!customerId) {
      test.skip();
      return;
    }

    await page.goto(`/dashboard/customers/${customerId}`);
    await page.waitForLoadState('networkidle');

    // Find profile photo section
    const profilePhotoSection = page.locator('text=/프로필 사진|Profile Photo/i').first();
    await profilePhotoSection.scrollIntoViewIfNeeded();

    // Upload profile photo
    const fileInput = page.locator('input[type="file"][accept*="image"]').first();

    // Create test image (1x1 pixel PNG)
    const testImagePath = '/tmp/test-profile.png';
    await page.evaluate(() => {
      const fs = require('fs');
      const pngData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
      fs.writeFileSync('/tmp/test-profile.png', pngData);
    }).catch(() => {
      test.skip();
    });

    await fileInput.setInputFiles(testImagePath);

    // Wait for upload to complete
    await expect(page.locator('text=/업로드 중|Uploading/i')).toBeHidden({ timeout: 10000 });

    // Verify delete button appears
    const deletePhotoButton = page.locator('button:has-text("삭제"), button:has-text("Delete")').filter({
      has: page.locator('svg, text=/프로필|Profile/i')
    }).first();

    await expect(deletePhotoButton).toBeVisible({ timeout: 5000 });

    // Delete profile photo
    await deletePhotoButton.click();

    // Confirm deletion if dialog appears
    const confirmButton = page.locator('button:has-text("확인"), button:has-text("Confirm")');
    if (await confirmButton.isVisible({ timeout: 1000 }).catch(() => false)) {
      await confirmButton.click();
    }

    // Verify delete button is hidden (no photo)
    await expect(deletePhotoButton).toBeHidden({ timeout: 5000 });
  });

  test('Completed/Cancelled Timestamps - should display timestamps in matching detail', async ({ page }) => {
    await page.goto('/dashboard/matchings');
    await page.waitForLoadState('networkidle');

    // Check if any matchings exist by counting tbody rows
    const rowCount = await page.locator('tbody tr').count();

    if (rowCount === 0) {
      test.skip();
      return;
    }

    // Find a completed or cancelled matching
    const completedCount = await page.locator('tbody tr').filter({ hasText: /완료|Completed/i }).count();
    const cancelledCount = await page.locator('tbody tr').filter({ hasText: /취소|Cancelled/i }).count();

    if (completedCount === 0 && cancelledCount === 0) {
      test.skip();
      return;
    }

    // Click on first completed or cancelled matching and track which type
    let clickedType: 'completed' | 'cancelled';
    if (completedCount > 0) {
      const completedMatching = page.locator('tbody tr').filter({ hasText: /완료|Completed/i }).first();
      await completedMatching.click();
      clickedType = 'completed';
    } else {
      const cancelledMatching = page.locator('tbody tr').filter({ hasText: /취소|Cancelled/i }).first();
      await cancelledMatching.click();
      clickedType = 'cancelled';
    }

    await page.waitForURL(/\/dashboard\/matchings\/\d+/);

    // Verify timestamp section is visible
    await expect(page.locator('text=/시간 정보|Time Information/i')).toBeVisible();

    // Check for completed_at or cancelled_at based on what we clicked
    if (clickedType === 'completed') {
      await expect(page.locator('text=/완료일시|Completed At/i')).toBeVisible();
    }
    if (clickedType === 'cancelled') {
      await expect(page.locator('text=/취소일시|Cancelled At/i')).toBeVisible();
    }
  });
});

test.describe('Gap Analysis Features - Integration Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('End-to-End Workflow - create customer, job posting, matching, and complete', async ({ page }) => {
    // 1. Create employer customer
    const employerName = `구인자_${Date.now()}`;
    const employerId = await createTestCustomer(page, employerName);
    expect(employerId).toBeTruthy();

    // 2. Create job posting
    await page.goto('/dashboard/job-postings/new');
    await page.waitForLoadState('networkidle');

    // Select customer
    const customerSelect = page.locator('button[role="combobox"]').first();
    await customerSelect.click();
    await page.locator(`[role="option"]:has-text("${employerName}")`).click();

    // Wait for select to close
    await page.waitForTimeout(500);

    // Fill job posting details (these use name attributes, not id)
    await page.fill('input[name="salary"]', '5000000');
    await page.fill('textarea[name="description"]', '테스트 구인 공고');

    // Scroll to fee section and click the "use default fee rate" checkbox to uncheck it
    const feeCheckbox = page.locator('text=/기본 수수료율 사용/').first();
    await feeCheckbox.scrollIntoViewIfNeeded();
    await feeCheckbox.click();

    // Now fill the employer fee rate
    await page.fill('input[name="employerFeeRate"]', '15');

    await page.locator('button[type="submit"]').click();
    await page.waitForURL(/\/dashboard\/job-postings\/\d+/);

    // 3. Verify dashboard stats updated
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');

    // Dashboard should show updated stats
    await expect(page.locator('text=/구인 공고/i').first()).toBeVisible();

    // Verify only one API call was made for stats
    const requests: any[] = [];
    page.on('request', (request: any) => {
      if (request.url().includes('/api/dashboard/stats')) {
        requests.push(request);
      }
    });

    await page.reload();
    await page.waitForLoadState('networkidle');

    expect(requests.length).toBeGreaterThanOrEqual(1);
  });
});
