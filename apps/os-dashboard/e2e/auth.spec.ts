/**
 * auth.spec.ts — 인증 플로우 E2E 테스트
 *
 * 테스트 범위:
 * - 로그인 페이지 렌더링
 * - 폼 유효성 검사 (이메일, 비밀번호)
 * - 미인증 상태에서 보호 라우트 리다이렉트
 * - 인증 후 대시보드 리다이렉트
 */

import { test, expect } from '@playwright/test';
import { ROUTES, TEST_USER, mockAuthSession, skipOnboarding } from './fixtures';

test.describe('로그인 페이지 렌더링', () => {
  test('로그인 페이지가 정상적으로 로드된다', async ({ page }) => {
    await page.goto(ROUTES.auth);
    await expect(page).toHaveTitle(/NEURALTWIN/);

    // NEURALTWIN 타이틀이 보인다
    await expect(page.locator('text=NEURALTWIN').first()).toBeVisible({ timeout: 10_000 });

    // 설명 텍스트가 보인다
    await expect(page.locator('text=AI 기반 매장 분석 플랫폼')).toBeVisible();
  });

  test('이메일과 비밀번호 입력 필드가 존재한다', async ({ page }) => {
    await page.goto(ROUTES.auth);

    const emailInput = page.locator('#signin-email');
    const passwordInput = page.locator('#signin-password');

    await expect(emailInput).toBeVisible({ timeout: 10_000 });
    await expect(passwordInput).toBeVisible();
  });

  test('로그인 버튼이 존재한다', async ({ page }) => {
    await page.goto(ROUTES.auth);

    const loginButton = page.locator('button[type="submit"]', { hasText: '로그인' });
    await expect(loginButton).toBeVisible({ timeout: 10_000 });
  });

  test('소셜 로그인 버튼들이 존재한다', async ({ page }) => {
    await page.goto(ROUTES.auth);

    // Google 로그인 버튼
    await expect(page.locator('button', { hasText: 'Google로 계속하기' })).toBeVisible({ timeout: 10_000 });

    // 카카오 로그인 버튼
    await expect(page.locator('button', { hasText: '카카오로 계속하기' })).toBeVisible();
  });

  test('비밀번호 찾기 링크가 존재한다', async ({ page }) => {
    await page.goto(ROUTES.auth);

    await expect(page.locator('text=비밀번호를 잊으셨나요?')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('로그인 폼 유효성 검사', () => {
  test('빈 폼 제출 시 브라우저 기본 유효성 검사가 작동한다', async ({ page }) => {
    await page.goto(ROUTES.auth);

    const loginButton = page.locator('button[type="submit"]', { hasText: '로그인' });
    await loginButton.click();

    // HTML5 required 속성으로 인해 브라우저가 제출을 차단
    // URL이 여전히 /auth인지 확인
    await expect(page).toHaveURL(/\/auth/);
  });

  test('이메일 입력 후 비밀번호 없이 제출하면 차단된다', async ({ page }) => {
    await page.goto(ROUTES.auth);

    await page.fill('#signin-email', TEST_USER.email);
    const loginButton = page.locator('button[type="submit"]', { hasText: '로그인' });
    await loginButton.click();

    // 여전히 auth 페이지
    await expect(page).toHaveURL(/\/auth/);
  });
});

test.describe('비밀번호 재설정 다이얼로그', () => {
  test('비밀번호 찾기 버튼 클릭 시 다이얼로그가 열린다', async ({ page }) => {
    await page.goto(ROUTES.auth);

    await page.click('text=비밀번호를 잊으셨나요?');

    // 다이얼로그 제목 확인
    await expect(page.locator('text=비밀번호 재설정')).toBeVisible({ timeout: 5_000 });

    // 이메일 입력 필드 확인
    await expect(page.locator('#reset-email')).toBeVisible();

    // 전송 버튼 확인
    await expect(page.locator('button', { hasText: '재설정 링크 전송' })).toBeVisible();
  });
});

test.describe('보호 라우트 리다이렉트', () => {
  test('미인증 상태에서 인사이트 페이지 접근 시 /auth로 리다이렉트된다', async ({ page }) => {
    await page.goto(ROUTES.insights);
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
  });

  test('미인증 상태에서 스튜디오 페이지 접근 시 /auth로 리다이렉트된다', async ({ page }) => {
    await page.goto(ROUTES.studio);
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
  });

  test('미인증 상태에서 설정 페이지 접근 시 /auth로 리다이렉트된다', async ({ page }) => {
    await page.goto(ROUTES.settings);
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
  });

  test('미인증 상태에서 루트(/) 접근 시 /auth로 리다이렉트된다', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveURL(/\/auth/, { timeout: 10_000 });
  });
});

test.describe('인증 후 리다이렉트', () => {
  test('인증된 사용자가 /auth에 접근하면 대시보드로 리다이렉트된다', async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
    await page.goto(ROUTES.auth);

    // 인증된 사용자는 /auth에서 / 또는 /insights로 리다이렉트
    // AuthPage의 useEffect에서 user가 있으면 navigate("/") 호출
    await expect(page).not.toHaveURL(/\/auth$/, { timeout: 10_000 });
  });
});
