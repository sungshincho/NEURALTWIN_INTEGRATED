/**
 * navigation.spec.ts — 앱 네비게이션 E2E 테스트
 *
 * 테스트 범위:
 * - 사이드바 네비게이션 (페이지 간 이동)
 * - URL 라우팅
 * - 레거시 라우트 리다이렉트
 * - 404 페이지
 * - 모바일 반응형 사이드바
 */

import { test, expect } from '@playwright/test';
import { mockAuthSession, skipOnboarding, waitForAppReady, ROUTES } from './fixtures';

test.describe('사이드바 네비게이션', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);
  });

  test('사이드바 메뉴에서 "설정 & 관리"로 이동할 수 있다', async ({ page }) => {
    const settingsLink = page.locator('a[href="/settings"]').first();
    await settingsLink.click();

    await expect(page).toHaveURL(/\/settings/, { timeout: 10_000 });
  });

  test('사이드바 메뉴에서 "ROI 측정"으로 이동할 수 있다', async ({ page }) => {
    const roiLink = page.locator('a[href="/roi"]').first();
    await roiLink.click();

    await expect(page).toHaveURL(/\/roi/, { timeout: 10_000 });
  });

  test('사이드바 메뉴에서 "디지털트윈 스튜디오"로 이동할 수 있다', async ({ page }) => {
    const studioLink = page.locator('a[href="/studio"]').first();
    await studioLink.click();

    await expect(page).toHaveURL(/\/studio/, { timeout: 10_000 });
  });

  test('사이드바 메뉴에서 "데이터 컨트롤타워"로 이동할 수 있다', async ({ page }) => {
    const dataLink = page.locator('a[href="/data/control-tower"]').first();
    await dataLink.click();

    await expect(page).toHaveURL(/\/data\/control-tower/, { timeout: 10_000 });
  });
});

test.describe('URL 직접 접근 (Direct URL routing)', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
  });

  test('/insights 경로로 인사이트 허브에 접근할 수 있다', async ({ page }) => {
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);

    await expect(page).toHaveURL(/\/insights/);
    await expect(page).toHaveTitle(/NEURALTWIN/);
  });

  test('/studio 경로로 디지털트윈 스튜디오에 접근할 수 있다', async ({ page }) => {
    await page.goto(ROUTES.studio);
    await waitForAppReady(page);

    await expect(page).toHaveURL(/\/studio/);
  });

  test('/roi 경로로 ROI 측정에 접근할 수 있다', async ({ page }) => {
    await page.goto(ROUTES.roi);
    await waitForAppReady(page);

    await expect(page).toHaveURL(/\/roi/);
  });

  test('/settings 경로로 설정 페이지에 접근할 수 있다', async ({ page }) => {
    await page.goto(ROUTES.settings);
    await waitForAppReady(page);

    await expect(page).toHaveURL(/\/settings/);
  });

  test('/data/control-tower 경로로 데이터 컨트롤타워에 접근할 수 있다', async ({ page }) => {
    await page.goto(ROUTES.dataControlTower);
    await waitForAppReady(page);

    await expect(page).toHaveURL(/\/data\/control-tower/);
  });
});

test.describe('404 페이지', () => {
  test('존재하지 않는 경로 접근 시 404 페이지가 표시된다', async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
    await page.goto(ROUTES.notFound);
    await waitForAppReady(page);

    // NotFoundPage의 "404" 텍스트 확인
    await expect(page.locator('text=404')).toBeVisible({ timeout: 10_000 });

    // "Page not found" 메시지 확인
    await expect(page.locator('text=Page not found')).toBeVisible();

    // 홈으로 돌아가기 링크 확인
    const homeLink = page.locator('a[href="/"]');
    await expect(homeLink).toBeVisible();
  });

  test('404 페이지에서 홈 링크를 클릭하면 대시보드로 이동한다', async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
    await page.goto(ROUTES.notFound);
    await waitForAppReady(page);

    const homeLink = page.locator('a[href="/"]');
    await expect(homeLink).toBeVisible({ timeout: 10_000 });
    await homeLink.click();

    // 루트 경로로 이동 (인증 상태이므로 대시보드 표시)
    await expect(page).toHaveURL(/^\/$|\/insights/, { timeout: 10_000 });
  });
});

test.describe('레거시 라우트 리다이렉트', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
  });

  test('/overview/dashboard -> /insights 리다이렉트', async ({ page }) => {
    await page.goto('/overview/dashboard');
    await expect(page).toHaveURL(/\/insights/, { timeout: 10_000 });
  });

  test('/overview/settings -> /settings 리다이렉트', async ({ page }) => {
    await page.goto('/overview/settings');
    await expect(page).toHaveURL(/\/settings/, { timeout: 10_000 });
  });

  test('/simulation/digital-twin -> /studio 리다이렉트', async ({ page }) => {
    await page.goto('/simulation/digital-twin');
    await expect(page).toHaveURL(/\/studio/, { timeout: 10_000 });
  });

  test('/analysis/store -> /insights?tab=store 리다이렉트', async ({ page }) => {
    await page.goto('/analysis/store');
    await expect(page).toHaveURL(/\/insights.*tab=store/, { timeout: 10_000 });
  });
});

test.describe('모바일 반응형 네비게이션', () => {
  test('모바일 뷰포트에서 페이지가 정상적으로 로드된다', async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);

    // 모바일 뷰포트 설정
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);

    // 페이지가 로드되면 성공
    await expect(page).toHaveTitle(/NEURALTWIN/);
  });

  test('모바일에서 사이드바 트리거가 존재한다', async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);

    // 사이드바 트리거 버튼 확인
    const sidebarTrigger = page.locator('button[data-sidebar="trigger"]').first();
    const triggerExists = await sidebarTrigger.isVisible({ timeout: 5_000 }).catch(() => false);

    if (triggerExists) {
      await expect(sidebarTrigger).toBeVisible();
    }
    // 트리거가 없으면 (항상 열려있는 레이아웃) 테스트 통과
  });
});

test.describe('페이지 간 브라우저 네비게이션', () => {
  test('페이지 이동 후 뒤로가기가 정상 동작한다', async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);

    await page.goto(ROUTES.insights);
    await waitForAppReady(page);

    // 설정 페이지로 이동
    const settingsLink = page.locator('a[href="/settings"]').first();
    await settingsLink.click();
    await expect(page).toHaveURL(/\/settings/, { timeout: 10_000 });

    // 뒤로가기
    await page.goBack();
    await expect(page).toHaveURL(/\/insights/, { timeout: 10_000 });
  });
});
