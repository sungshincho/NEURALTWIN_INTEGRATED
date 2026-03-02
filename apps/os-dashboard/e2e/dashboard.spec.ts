/**
 * dashboard.spec.ts — 메인 대시보드 E2E 테스트
 *
 * 테스트 범위:
 * - 인사이트 허브 (메인 대시보드) 로드
 * - DashboardLayout 구조 (사이드바, 헤더)
 * - AI Insight 버블 존재 확인
 * - 탭 전환 동작
 */

import { test, expect } from '@playwright/test';
import { mockAuthSession, skipOnboarding, waitForAppReady, ROUTES } from './fixtures';

test.describe('대시보드 페이지 로드', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
  });

  test('인사이트 허브 (/) 페이지가 로드된다', async ({ page }) => {
    await page.goto(ROUTES.home);
    await waitForAppReady(page);

    await expect(page).toHaveTitle(/NEURALTWIN/);
  });

  test('/insights 경로로도 인사이트 허브에 접근할 수 있다', async ({ page }) => {
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);

    await expect(page).toHaveTitle(/NEURALTWIN/);
  });
});

test.describe('DashboardLayout 구조', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);
  });

  test('사이드바가 존재한다', async ({ page }) => {
    // AppSidebar는 shadcn의 Sidebar 컴포넌트 사용
    // aside 또는 [data-sidebar] 요소 확인
    const sidebar = page.locator('aside, [data-sidebar="sidebar"]').first();
    await expect(sidebar).toBeAttached({ timeout: 10_000 });
  });

  test('사이드바에 주요 메뉴 항목이 존재한다', async ({ page }) => {
    // 5개 메인 메뉴 확인
    const menuLabels = [
      '데이터 컨트롤타워',
      '인사이트 허브',
      '디지털트윈 스튜디오',
      'ROI 측정',
      '설정 & 관리',
    ];

    for (const label of menuLabels) {
      const menuItem = page.locator(`text=${label}`).first();
      // 사이드바가 축소되어 있을 수 있으므로 attached만 확인
      await expect(menuItem).toBeAttached({ timeout: 10_000 });
    }
  });

  test('사용자 아바타/프로필 영역이 존재한다', async ({ page }) => {
    // DashboardLayout의 Avatar 컴포넌트 확인
    const avatar = page.locator('[class*="avatar"], [data-slot="avatar"]').first();
    await expect(avatar).toBeAttached({ timeout: 10_000 });
  });
});

test.describe('AI Insight 버블', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
  });

  test('AI 인사이트 버블 버튼이 화면에 존재한다', async ({ page }) => {
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);

    // AIInsightBubble의 플로팅 버튼 — aria-label로 찾기
    const bubbleButton = page.locator('button[aria-label*="AI 인사이트"]');
    await expect(bubbleButton).toBeAttached({ timeout: 10_000 });
  });

  test('AI 인사이트 버블 클릭 시 패널이 열린다', async ({ page }) => {
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);

    // 버블 클릭
    const bubbleButton = page.locator('button[aria-label*="AI 인사이트 패널 열기"]');
    await bubbleButton.click();

    // 패널 (dialog role)이 열리는지 확인
    const panel = page.locator('[role="dialog"][aria-label*="NeuralMind"]');
    await expect(panel).toBeVisible({ timeout: 5_000 });

    // 패널 헤더 "NeuralMind" 텍스트 확인
    await expect(page.locator('text=NeuralMind')).toBeVisible();
  });

  test('AI 인사이트 패널에 메시지 입력 필드가 있다', async ({ page }) => {
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);

    // 패널 열기
    const bubbleButton = page.locator('button[aria-label*="AI 인사이트 패널 열기"]');
    await bubbleButton.click();

    // 입력 필드 확인
    const inputField = page.locator('input[aria-label="AI에게 메시지 입력"]');
    await expect(inputField).toBeVisible({ timeout: 5_000 });
  });

  test('AI 인사이트 패널의 닫기 버튼이 동작한다', async ({ page }) => {
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);

    // 패널 열기
    const bubbleButton = page.locator('button[aria-label*="AI 인사이트 패널 열기"]');
    await bubbleButton.click();

    const panel = page.locator('[role="dialog"][aria-label*="NeuralMind"]');
    await expect(panel).toBeVisible({ timeout: 5_000 });

    // 닫기 버튼 클릭
    const closeButton = page.locator('button[aria-label="패널 닫기"]');
    await closeButton.click();

    // 패널이 슬라이드 아웃 (translate-x-full)
    // 패널이 DOM에는 남아있지만 화면에서 벗어남
    // 버블이 다시 보이는지 확인
    await expect(bubbleButton).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('인사이트 허브 탭', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);
  });

  test('인사이트 허브에 탭 네비게이션이 존재한다', async ({ page }) => {
    // TabsList의 탭 버튼들 확인
    const tabLabels = ['개요', '매장', '고객', '상품', '재고', '예측', 'AI추천'];

    for (const label of tabLabels) {
      const tab = page.locator(`[role="tablist"] >> text=${label}`).first();
      await expect(tab).toBeAttached({ timeout: 10_000 });
    }
  });

  test('탭 클릭 시 URL 파라미터가 변경된다', async ({ page }) => {
    // "매장" 탭 클릭
    const storeTab = page.locator('[role="tablist"] >> text=매장').first();
    await storeTab.click();

    // URL에 tab=store 파라미터가 추가되는지 확인
    await expect(page).toHaveURL(/tab=store/, { timeout: 5_000 });
  });
});
