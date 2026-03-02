/**
 * ai-insight.spec.ts — AI 인사이트 버블/패널 E2E 테스트
 *
 * 테스트 범위:
 * - AIInsightBubble 플로팅 버튼 렌더링
 * - 패널 열기/닫기 (클릭, Escape, 닫기 버튼)
 * - 빈 상태 표시
 * - 메시지 입력 필드 및 전송 버튼 상태
 */

import { test, expect } from '@playwright/test';
import { mockAuthSession, skipOnboarding, waitForAppReady, ROUTES } from './fixtures';

test.describe('AI Insight Bubble — 기본 렌더링', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);
  });

  test('AI 인사이트 버블 버튼이 대시보드에 표시된다', async ({ page }) => {
    const bubble = page.locator('button[aria-label*="AI 인사이트 패널"]');
    await expect(bubble).toBeVisible({ timeout: 10_000 });
  });

  test('버블에 "AI가 할 말 있어요" 텍스트가 표시된다', async ({ page }) => {
    await expect(page.locator('text=AI가 할 말 있어요')).toBeAttached({ timeout: 10_000 });
  });
});

test.describe('AI Insight Bubble — 패널 열기/닫기', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);
  });

  test('버블 클릭 시 AI 패널이 열린다', async ({ page }) => {
    const bubble = page.locator('button[aria-label*="AI 인사이트 패널 열기"]');
    await expect(bubble).toBeVisible({ timeout: 10_000 });
    await bubble.click();

    // 패널 (dialog role)이 열리는지 확인
    const panel = page.locator('[role="dialog"][aria-label*="NeuralMind"]');
    await expect(panel).toBeVisible({ timeout: 5_000 });

    // 패널 헤더 "NeuralMind" 텍스트 확인
    await expect(page.locator('text=NeuralMind')).toBeVisible();
    await expect(page.locator('text=AI 인사이트 어시스턴트')).toBeVisible();
  });

  test('빈 상태에서 안내 메시지가 표시된다', async ({ page }) => {
    const bubble = page.locator('button[aria-label*="AI 인사이트 패널 열기"]');
    await bubble.click();

    await expect(page.locator('text=아직 새로운 인사이트가 없습니다')).toBeVisible({ timeout: 5_000 });
  });

  test('Escape 키로 패널이 닫힌다', async ({ page }) => {
    const bubble = page.locator('button[aria-label*="AI 인사이트 패널 열기"]');
    await bubble.click();

    const panel = page.locator('[role="dialog"][aria-label*="NeuralMind"]');
    await expect(panel).toBeVisible({ timeout: 5_000 });

    await page.keyboard.press('Escape');

    // 패널이 슬라이드 아웃 (translate-x-full)
    await expect(panel).toBeHidden({ timeout: 5_000 });
  });

  test('닫기 버튼(X) 클릭 시 패널이 닫힌다', async ({ page }) => {
    const bubble = page.locator('button[aria-label*="AI 인사이트 패널 열기"]');
    await bubble.click();

    const panel = page.locator('[role="dialog"][aria-label*="NeuralMind"]');
    await expect(panel).toBeVisible({ timeout: 5_000 });

    const closeBtn = page.locator('button[aria-label="패널 닫기"]');
    await closeBtn.click();

    await expect(panel).toBeHidden({ timeout: 5_000 });

    // 버블이 다시 보이는지 확인
    await expect(bubble).toBeVisible({ timeout: 5_000 });
  });
});

test.describe('AI Insight Bubble — 메시지 입력', () => {
  test.beforeEach(async ({ page }) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
    await page.goto(ROUTES.insights);
    await waitForAppReady(page);

    // 패널 열기
    const bubble = page.locator('button[aria-label*="AI 인사이트 패널 열기"]');
    await bubble.click();
    await page.locator('[role="dialog"][aria-label*="NeuralMind"]').waitFor({ state: 'visible', timeout: 5_000 });
  });

  test('메시지 입력 필드가 존재하고 placeholder가 올바르다', async ({ page }) => {
    const input = page.locator('input[aria-label="AI에게 메시지 입력"]');
    await expect(input).toBeVisible({ timeout: 5_000 });
    await expect(input).toHaveAttribute('placeholder', '메시지 입력...');
  });

  test('입력이 비어있을 때 전송 버튼이 비활성화된다', async ({ page }) => {
    const sendBtn = page.locator('button[aria-label="메시지 전송"]');
    await expect(sendBtn).toBeVisible({ timeout: 5_000 });
    await expect(sendBtn).toBeDisabled();
  });

  test('텍스트를 입력하면 전송 버튼이 활성화된다', async ({ page }) => {
    const input = page.locator('input[aria-label="AI에게 메시지 입력"]');
    await input.fill('테스트 메시지');

    const sendBtn = page.locator('button[aria-label="메시지 전송"]');
    await expect(sendBtn).toBeEnabled();
  });
});
