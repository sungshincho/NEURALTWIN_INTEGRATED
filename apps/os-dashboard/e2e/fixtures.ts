/**
 * Playwright E2E 테스트 헬퍼 / 픽스처
 *
 * - Mock auth 상태 설정
 * - 공통 테스트 데이터
 * - 재사용 가능한 유틸 함수
 */

import { test as base, type Page } from '@playwright/test';

// ============================================================================
// 테스트 상수
// ============================================================================

/** 테스트용 사용자 정보 */
export const TEST_USER = {
  email: 'test@neuraltwin.com',
  password: 'test123456',
} as const;

/** OS Dashboard 주요 라우트 */
export const ROUTES = {
  auth: '/auth',
  home: '/',
  insights: '/insights',
  studio: '/studio',
  roi: '/roi',
  settings: '/settings',
  dataControlTower: '/data/control-tower',
  dataLineage: '/data/lineage',
  notFound: '/this-page-does-not-exist',
} as const;

/** 사이드바 네비게이션 메뉴 항목 (라벨 -> URL 매핑) */
export const SIDEBAR_MENU = [
  { label: '데이터 컨트롤타워', url: '/data/control-tower' },
  { label: '인사이트 허브', url: '/insights' },
  { label: '디지털트윈 스튜디오', url: '/studio' },
  { label: 'ROI 측정', url: '/roi' },
  { label: '설정 & 관리', url: '/settings' },
] as const;

// ============================================================================
// 유틸 함수
// ============================================================================

/**
 * Supabase auth 세션을 localStorage에 주입하여 로그인 상태를 모킹합니다.
 * 실제 Supabase 인증 없이 ProtectedRoute를 통과할 수 있게 합니다.
 *
 * 주의: 이 함수는 page.goto() 전에 호출해야 합니다.
 * 만약 이미 페이지가 로드된 상태라면 호출 후 page.reload()가 필요합니다.
 */
export async function mockAuthSession(page: Page): Promise<void> {
  // Supabase가 사용하는 localStorage 키 패턴으로 세션 주입
  // 실제 키는 `sb-{project-ref}-auth-token` 형태
  await page.addInitScript(() => {
    const mockSession = {
      access_token: 'mock-access-token-for-e2e',
      refresh_token: 'mock-refresh-token-for-e2e',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      token_type: 'bearer',
      user: {
        id: 'e2e-test-user-id',
        aud: 'authenticated',
        role: 'authenticated',
        email: 'test@neuraltwin.com',
        email_confirmed_at: new Date().toISOString(),
        app_metadata: { provider: 'email', providers: ['email'] },
        user_metadata: { full_name: 'E2E Test User' },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    };

    // Supabase는 모든 `sb-*-auth-token` 키를 사용
    // 정확한 프로젝트 ref가 없으면 일반적인 패턴으로 설정
    const keys = Object.keys(localStorage);
    const authKey = keys.find((k) => k.startsWith('sb-') && k.endsWith('-auth-token'));
    const storageKey = authKey || 'sb-bdrvowacecxnraaivlhr-auth-token';

    localStorage.setItem(storageKey, JSON.stringify(mockSession));
  });
}

/**
 * 온보딩 완료 상태를 localStorage에 주입합니다.
 * 온보딩 다이얼로그가 테스트 중 방해하지 않도록 합니다.
 */
export async function skipOnboarding(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem('neuraltwin-onboarding-complete', 'true');
  });
}

/**
 * 온보딩이 표시되도록 localStorage를 초기화합니다.
 */
export async function resetOnboarding(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.removeItem('neuraltwin-onboarding-complete');
  });
}

/**
 * 페이지가 완전히 로드될 때까지 대기합니다.
 * Suspense fallback 스피너가 사라지고 콘텐츠가 나타날 때까지 기다립니다.
 */
export async function waitForAppReady(page: Page): Promise<void> {
  // Suspense 스피너 (animate-spin)가 사라질 때까지 대기
  await page.waitForLoadState('domcontentloaded');
  // 스피너가 존재할 수 있으므로 잠시 대기 후 본문 확인
  try {
    await page.waitForSelector('.animate-spin', { state: 'hidden', timeout: 10_000 });
  } catch {
    // 스피너가 처음부터 없을 수 있음 — 무시
  }
}

// ============================================================================
// 확장 테스트 픽스처
// ============================================================================

/**
 * 인증된 상태에서 테스트를 실행하는 픽스처.
 * 매 테스트 전에 mockAuthSession + skipOnboarding을 자동 적용합니다.
 */
export const authenticatedTest = base.extend<{ authedPage: Page }>({
  authedPage: async ({ page }, use) => {
    await mockAuthSession(page);
    await skipOnboarding(page);
    await use(page);
  },
});
