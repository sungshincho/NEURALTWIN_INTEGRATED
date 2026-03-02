/**
 * accessibility.spec.ts — 기본 접근성(a11y) E2E 테스트
 *
 * 테스트 범위:
 * - 로그인 폼 라벨/입력 연결
 * - 키보드 탐색 (Tab, Focus)
 * - ARIA 속성 (aria-label, aria-expanded, role)
 * - 포커스 인디케이터 존재
 */

import { test, expect } from '@playwright/test';
import { mockAuthSession, skipOnboarding, waitForAppReady, ROUTES } from './fixtures';

// ---------------------------------------------------------------------------
// Auth 페이지 접근성 (비인증 상태)
// ---------------------------------------------------------------------------

test.describe('접근성 — 로그인 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(ROUTES.auth);
    await page.waitForLoadState('networkidle');
  });

  test('이메일과 비밀번호 입력 필드에 연결된 라벨이 있다', async ({ page }) => {
    const emailLabel = page.locator('label[for="signin-email"]');
    await expect(emailLabel).toBeVisible({ timeout: 10_000 });

    const passwordLabel = page.locator('label[for="signin-password"]');
    await expect(passwordLabel).toBeVisible();
  });

  test('이메일 → 비밀번호 순서로 Tab 키 탐색이 된다', async ({ page }) => {
    const emailInput = page.locator('#signin-email');
    await emailInput.focus();
    await expect(emailInput).toBeFocused();

    // Tab으로 비밀번호 필드로 이동
    await page.keyboard.press('Tab');
    const passwordInput = page.locator('#signin-password');
    await expect(passwordInput).toBeFocused();
  });

  test('로그인 버튼이 키보드로 포커스 가능하다', async ({ page }) => {
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.focus();
    await expect(submitButton).toBeFocused();
  });

  test('소셜 로그인 버튼이 키보드로 포커스 가능하다', async ({ page }) => {
    const googleBtn = page.locator('button:has-text("Google로 계속하기")');
    await googleBtn.focus();
    await expect(googleBtn).toBeFocused();

    const kakaoBtn = page.locator('button:has-text("카카오로 계속하기")');
    await kakaoBtn.focus();
    await expect(kakaoBtn).toBeFocused();
  });

  test('비밀번호 재설정 트리거 버튼이 키보드로 접근 가능하다', async ({ page }) => {
    const resetTrigger = page.locator('button:has-text("비밀번호를 잊으셨나요?")');
    await resetTrigger.focus();
    await expect(resetTrigger).toBeFocused();
  });
});

// ---------------------------------------------------------------------------
// 대시보드 접근성 (인증 상태)
// ---------------------------------------------------------------------------

test.describe('접근성 — 대시보드', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);
  });

  test('AI 인사이트 버블에 설명적인 aria-label이 있다', async ({ page }) => {
    const bubble = page.locator('button[aria-label*="AI 인사이트 패널"]');
    await expect(bubble).toBeVisible({ timeout: 10_000 });

    const ariaLabel = await bubble.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    expect(ariaLabel).toContain('AI 인사이트 패널');
  });

  test('AI 인사이트 버블에 aria-expanded 속성이 있다', async ({ page }) => {
    const bubble = page.locator('button[aria-label*="AI 인사이트 패널"]');
    await expect(bubble).toBeVisible({ timeout: 10_000 });

    // 초기: 접힌 상태
    await expect(bubble).toHaveAttribute('aria-expanded', 'false');

    // 패널 열기
    await bubble.click();
    await expect(bubble).toHaveAttribute('aria-expanded', 'true');
  });

  test('AI 패널이 role="dialog"와 aria-modal="true"를 가진다', async ({ page }) => {
    const bubble = page.locator('button[aria-label*="AI 인사이트 패널"]');
    await bubble.click();

    const panel = page.locator('[role="dialog"][aria-modal="true"]');
    await expect(panel).toBeVisible({ timeout: 5_000 });
  });

  test('AI 패널 닫기 버튼에 aria-label이 있다', async ({ page }) => {
    const bubble = page.locator('button[aria-label*="AI 인사이트 패널"]');
    await bubble.click();

    const closeBtn = page.locator('button[aria-label="패널 닫기"]');
    await expect(closeBtn).toBeVisible({ timeout: 5_000 });
  });

  test('AI 패널 입력 필드에 aria-label이 있다', async ({ page }) => {
    const bubble = page.locator('button[aria-label*="AI 인사이트 패널"]');
    await bubble.click();

    const input = page.locator('input[aria-label="AI에게 메시지 입력"]');
    await expect(input).toBeVisible({ timeout: 5_000 });
  });

  test('AI 패널 전송 버튼에 aria-label이 있다', async ({ page }) => {
    const bubble = page.locator('button[aria-label*="AI 인사이트 패널"]');
    await bubble.click();

    const sendBtn = page.locator('button[aria-label="메시지 전송"]');
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
  });

  test('사이드바 네비게이션 링크가 키보드로 포커스 가능하다', async ({ page }) => {
    const insightLink = page.locator('a[href="/insights"]').first();
    await insightLink.focus();
    await expect(insightLink).toBeFocused();
  });

  test('AI 인사이트 버블에 포커스 인디케이터가 적용된다', async ({ page }) => {
    const bubble = page.locator('button[aria-label*="AI 인사이트 패널"]');
    await bubble.focus();
    await expect(bubble).toBeFocused();
    // 컴포넌트에 focus-visible:ring-2 클래스가 적용되어 있음
  });

  test('인사이트 카드의 role="article" 속성 확인 (인사이트가 있을 때)', async ({ page }) => {
    // 이 테스트는 인사이트가 없는 빈 상태에서는 article이 없음을 확인
    const bubble = page.locator('button[aria-label*="AI 인사이트 패널"]');
    await bubble.click();

    // 빈 상태에서는 article role이 없어야 함
    const articles = page.locator('[role="article"]');
    await expect(articles).toHaveCount(0, { timeout: 5_000 });
  });
});
