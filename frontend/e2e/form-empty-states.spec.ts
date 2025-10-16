import { test, expect } from '@playwright/test';

const mockUserResponse = {
  user: {
    id: 1,
    username: 'playwright',
    phone: '010-0000-0000',
  },
};

test.describe('Creation form empty state UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().addCookies([
      {
        name: 'token',
        value: 'playwright-token',
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
      },
    ]);

    await page.route('**/api/profile', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUserResponse),
      });
    });
  });

  test('job posting form shows guidance when no employers exist', async ({ page }) => {
    await page.route('**/api/customers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ customers: [] }),
      });
    });

    await page.goto('/dashboard/job-postings/new');

    await expect(
      page.getByText('등록된 구인자가 없습니다. 먼저 고객을 추가하세요.')
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '새 고객 등록하러 가기' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '생성' })).toBeDisabled();
  });

  test('job seeking form provides CTA when no candidates exist', async ({ page }) => {
    await page.route('**/api/customers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ customers: [] }),
      });
    });

    await page.goto('/dashboard/job-seeking/new');

    await expect(
      page.getByText('등록된 구직자가 없습니다. 먼저 고객을 추가하세요.')
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '새 고객 등록하러 가기' })
    ).toBeVisible();
    await expect(page.getByRole('button', { name: '생성' })).toBeDisabled();
  });

  test('matching form highlights missing upstream data', async ({ page }) => {
    await page.route('**/api/customers', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ customers: [] }),
      });
    });

    await page.route('**/api/job-postings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ job_postings: [] }),
      });
    });

    await page.route('**/api/job-seekings', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ job_seekings: [] }),
      });
    });

    await page.goto('/dashboard/matchings/new');

    await expect(
      page.getByText('등록된 구인 공고가 없습니다.')
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '새 구인 공고 만들기' })
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: '매칭 등록' })
    ).toBeDisabled();
  });
});
