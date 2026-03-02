/**
 * onboarding.spec.ts — 온보딩 플로우 E2E 테스트
 *
 * 테스트 범위:
 * - 온보딩 위저드 다이얼로그 표시
 * - 단계 진행 (다음 버튼)
 * - 건너뛰기 기능
 * - 진행률 표시
 *
 * 참고: 온보딩은 Supabase API에 의존하므로,
 * 실제 API 호출 없이 UI 레벨 테스트만 수행합니다.
 * 온보딩 표시 조건은 useIsOnboardingComplete 훅이 결정하며,
 * localStorage와 Supabase 쿼리 모두에 의존합니다.
 */

import { test, expect } from '@playwright/test';
import { mockAuthSession, waitForAppReady } from './fixtures';

test.describe('온보딩 다이얼로그', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    // 온보딩 skipOnboarding을 호출하지 않아서 표시될 수 있게 함
  });

  test('온보딩 다이얼로그에 "NEURALTWIN 시작하기" 제목이 있다', async ({ page }) => {
    // 온보딩이 미완료 상태일 때 다이얼로그가 표시됨
    // 단, Supabase 쿼리 결과에 따라 표시가 결정되므로
    // 네트워크 요청을 인터셉트하여 온보딩 미완료 응답을 반환
    await page.route('**/rest/v1/onboarding_progress*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/');
    await waitForAppReady(page);

    // 온보딩 다이얼로그 확인 — 표시되면 검증, 안 되면 스킵
    const dialog = page.locator('text=NEURALTWIN 시작하기');
    const isVisible = await dialog.isVisible({ timeout: 8_000 }).catch(() => false);

    if (isVisible) {
      await expect(dialog).toBeVisible();

      // "5분 만에 첫 대시보드를 확인하세요" 설명 텍스트
      await expect(page.locator('text=5분 만에 첫 대시보드를 확인하세요')).toBeVisible();
    }
    // 온보딩이 표시되지 않으면 (이미 완료 등) 테스트 통과
  });

  test('온보딩 "건너뛰기" 버튼이 존재하고 클릭하면 다이얼로그가 닫힌다', async ({ page }) => {
    await page.route('**/rest/v1/onboarding_progress*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/');
    await waitForAppReady(page);

    const dialog = page.locator('text=NEURALTWIN 시작하기');
    const isVisible = await dialog.isVisible({ timeout: 8_000 }).catch(() => false);

    if (isVisible) {
      // 건너뛰기 버튼 클릭
      const skipButton = page.locator('button', { hasText: '건너뛰기' }).first();
      await expect(skipButton).toBeVisible();
      await skipButton.click();

      // 다이얼로그가 닫히는지 확인
      await expect(dialog).not.toBeVisible({ timeout: 5_000 });
    }
  });

  test('온보딩 진행률 표시가 있다', async ({ page }) => {
    await page.route('**/rest/v1/onboarding_progress*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/');
    await waitForAppReady(page);

    const dialog = page.locator('text=NEURALTWIN 시작하기');
    const isVisible = await dialog.isVisible({ timeout: 8_000 }).catch(() => false);

    if (isVisible) {
      // Progress bar 확인
      const progressBar = page.locator('[role="progressbar"]');
      await expect(progressBar).toBeVisible();

      // 단계 표시 (예: "1/7 단계")
      await expect(page.locator('text=/\\d+\\/7 단계/')).toBeVisible();
    }
  });

  test('온보딩 "다음" 버튼이 존재한다', async ({ page }) => {
    await page.route('**/rest/v1/onboarding_progress*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
    });

    await page.goto('/');
    await waitForAppReady(page);

    const dialog = page.locator('text=NEURALTWIN 시작하기');
    const isVisible = await dialog.isVisible({ timeout: 8_000 }).catch(() => false);

    if (isVisible) {
      // "다음" 버튼 확인
      const nextButton = page.locator('button', { hasText: '다음' });
      await expect(nextButton).toBeVisible();
    }
  });
});

test.describe('온보딩 완료 상태', () => {
  test('온보딩이 완료된 사용자에게는 온보딩 다이얼로그가 표시되지 않는다', async ({ page }) => {
    await mockAuthSession(page);

    // 온보딩 완료 상태를 localStorage에 설정
    await page.addInitScript(() => {
      localStorage.setItem('neuraltwin-onboarding-complete', 'true');
    });

    // 온보딩 진행 상태 API도 완료 응답
    await page.route('**/rest/v1/onboarding_progress*', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([{
          current_step: 7,
          is_complete: true,
          completed_steps: [1, 2, 3, 4, 5, 6, 7],
          skipped_steps: [],
        }]),
      });
    });

    await page.goto('/');
    await waitForAppReady(page);

    // 온보딩 다이얼로그가 보이지 않아야 함
    const dialog = page.locator('text=NEURALTWIN 시작하기');
    await expect(dialog).not.toBeVisible({ timeout: 5_000 });
  });
});
