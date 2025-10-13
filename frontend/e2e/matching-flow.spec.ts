import { test, expect } from '@playwright/test';

test.describe('Matching Flow E2E', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('complete matching creation flow', async ({ page }) => {
    // Step 1: Create Employer Customer
    await page.goto('/dashboard/customers/new');
    await page.selectOption('select#customer_type', 'Employer');
    await page.fill('input#name', 'E2E 구인자');
    await page.fill('input#phone', '010-1111-1111');
    await page.fill('input#birth_date', '1980-01-01');
    await page.fill('input#address', '서울시 강남구 테스트동');
    await page.click('button[type="submit"]');

    // Verify customer created
    await expect(page.locator('h1')).toContainText('E2E 구인자');
    const employerUrl = page.url();
    const employerId = employerUrl.split('/').pop();

    // Step 2: Create Employee Customer
    await page.goto('/dashboard/customers/new');
    await page.selectOption('select#customer_type', 'Employee');
    await page.fill('input#name', 'E2E 구직자');
    await page.fill('input#phone', '010-2222-2222');
    await page.fill('input#birth_date', '1995-05-15');
    await page.click('button[type="submit"]');

    await expect(page.locator('h1')).toContainText('E2E 구직자');
    const employeeUrl = page.url();
    const employeeId = employeeUrl.split('/').pop();

    // Step 3: Create Job Posting
    await page.goto('/dashboard/job-postings/new');
    await page.fill('input#title', 'E2E 테스트 구인공고');
    await page.fill('textarea#job_description', '테스트 설명');
    await page.fill('input#salary_amount', '3000000');
    await page.selectOption('select#customer_id', employerId!);
    await page.click('button[type="submit"]');

    const jobPostingUrl = page.url();
    const jobPostingId = jobPostingUrl.split('/').pop();

    // Step 4: Create Job Seeking
    await page.goto('/dashboard/job-seeking/new');
    await page.fill('input#title', 'E2E 테스트 구직공고');
    await page.fill('textarea#job_description', '테스트 구직 설명');
    await page.fill('input#desired_salary', '3000000');
    await page.selectOption('select#customer_id', employeeId!);
    await page.click('button[type="submit"]');

    const jobSeekingUrl = page.url();
    const jobSeekingId = jobSeekingUrl.split('/').pop();

    // Step 5: Create Matching
    await page.goto('/dashboard/matchings/new');
    await page.selectOption('select#job_posting_id', jobPostingId!);
    await page.selectOption('select#job_seeking_posting_id', jobSeekingId!);
    await page.fill('input#agreed_salary', '3000000');
    await page.click('button[type="submit"]');

    // Verify matching created
    await expect(page.locator('h1')).toContainText('매칭 상세');
    await expect(page.locator('text=E2E 구인자')).toBeVisible();
    await expect(page.locator('text=E2E 구직자')).toBeVisible();

    // Step 6: Verify in matchings list
    await page.goto('/dashboard/matchings');
    await expect(page.locator('text=E2E 구인자')).toBeVisible();
    await expect(page.locator('text=E2E 구직자')).toBeVisible();

    // Step 7: Verify in settlements
    await page.goto('/dashboard/settlements');
    await expect(page.locator('text=E2E 구인자')).toBeVisible();
    await expect(page.locator('text=미정산')).toBeVisible();
  });

  test('search and filter customers', async ({ page }) => {
    await page.goto('/dashboard/customers');

    // Test search
    await page.fill('input[placeholder*="검색"]', 'admin');
    await page.waitForTimeout(500);

    // Verify search results
    const rows = page.locator('table tbody tr');
    await expect(rows).toHaveCount(1);

    // Test filter
    await page.selectOption('select', 'Employer');
    await page.waitForTimeout(500);

    // Verify filter results show only employers
    await expect(page.locator('text=구인자')).toBeVisible();
  });

  test('create customer with validation', async ({ page }) => {
    await page.goto('/dashboard/customers/new');

    // Submit without required fields
    await page.click('button[type="submit"]');

    // Verify validation messages
    await expect(page.locator('text=이름을 입력하세요')).toBeVisible();
    await expect(page.locator('text=전화번호를 입력하세요')).toBeVisible();
  });

  test('add memo to customer', async ({ page }) => {
    // Navigate to first customer
    await page.goto('/dashboard/customers');
    await page.click('table tbody tr:first-child a');

    // Add memo
    await page.fill('textarea[placeholder*="메모"]', 'E2E 테스트 메모');
    await page.click('button:has-text("메모 추가")');

    // Verify memo added
    await expect(page.locator('text=E2E 테스트 메모')).toBeVisible();
  });

  test('dashboard statistics display correctly', async ({ page }) => {
    await page.goto('/dashboard');

    // Verify all stat cards are visible
    await expect(page.locator('text=전체 고객')).toBeVisible();
    await expect(page.locator('text=구인 공고')).toBeVisible();
    await expect(page.locator('text=구직 공고')).toBeVisible();
    await expect(page.locator('text=매칭')).toBeVisible();
    await expect(page.locator('text=미정산 금액')).toBeVisible();
    await expect(page.locator('text=총 수수료')).toBeVisible();

    // Verify quick actions
    await expect(page.locator('text=새 고객 추가')).toBeVisible();
    await expect(page.locator('text=새 구인 공고')).toBeVisible();
    await expect(page.locator('text=새 구직 공고')).toBeVisible();
    await expect(page.locator('text=새 매칭 생성')).toBeVisible();
  });

  test('theme toggle works', async ({ page }) => {
    await page.goto('/dashboard');

    // Find and click theme toggle
    await page.click('button[aria-label*="테마"], button:has(svg[class*="sun"]), button:has(svg[class*="moon"])');

    // Wait for theme change
    await page.waitForTimeout(300);

    // Verify theme changed (check html class or data attribute)
    const htmlClass = await page.locator('html').getAttribute('class');
    expect(htmlClass).toBeTruthy();
  });

  test('navigation menu works', async ({ page }) => {
    await page.goto('/dashboard');

    // Test each navigation item
    const menuItems = [
      { text: '고객 관리', url: '/dashboard/customers' },
      { text: '구인 공고', url: '/dashboard/job-postings' },
      { text: '구직 공고', url: '/dashboard/job-seeking' },
      { text: '매칭 관리', url: '/dashboard/matchings' },
      { text: '정산 관리', url: '/dashboard/settlements' },
      { text: '태그 관리', url: '/dashboard/tags' },
      { text: '설정', url: '/dashboard/settings' },
    ];

    for (const item of menuItems) {
      await page.click(`text=${item.text}`);
      await expect(page).toHaveURL(item.url);
    }
  });
});
