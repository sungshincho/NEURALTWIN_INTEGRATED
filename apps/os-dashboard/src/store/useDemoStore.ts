/**
 * useDemoStore.ts
 *
 * Demo Mode 전역 상태 관리 (Zustand)
 * - 시나리오 기반 데모 모드 (fashion / beauty / department)
 * - 7단계 가이드 투어 진행 상태
 * - sessionStorage 연동 (매 방문마다 새 세션)
 * - 5분 자동 타임아웃
 */

import { create } from 'zustand';

// ============================================================================
// 타입 정의
// ============================================================================

export type DemoScenario = 'fashion' | 'beauty' | 'department';

export interface DemoInteraction {
  event: string;
  data?: Record<string, unknown>;
  timestamp: number;
}

interface DemoStoreState {
  /** 데모 모드 활성화 여부 */
  isDemoMode: boolean;

  /** 현재 시나리오 */
  currentScenario: DemoScenario | null;

  /** 가이드 투어 현재 단계 (0 = 시작 전, 1-7 = 진행 중, 8 = 완료) */
  tourStep: number;

  /** 투어 활성화 여부 */
  isTourActive: boolean;

  /** 투어 일시정지 여부 (사용자 인터랙션 시) */
  isTourPaused: boolean;

  /** 데모 시작 시각 (ISO string for serialization) */
  demoStartedAt: string | null;

  /** 자유 탐색 시작 시각 */
  freeExploreStartedAt: string | null;

  /** 남은 시간 (초) — UI 표시용, ticker로 갱신 */
  remainingSeconds: number;

  /** 추적된 인터랙션 */
  interactions: DemoInteraction[];

  /** 시나리오 선택 화면 표시 여부 */
  showScenarioSelector: boolean;

  /** 상단 배너 닫기 여부 */
  bannerDismissed: boolean;
}

interface DemoStoreActions {
  /** 데모 모드 시작 (시나리오 선택 후) */
  startDemo: (scenario: DemoScenario) => void;

  /** 데모 모드 종료 */
  endDemo: () => void;

  /** 시나리오 선택 화면 표시 */
  showSelector: () => void;

  /** 시나리오 선택 화면 닫기 */
  hideSelector: () => void;

  /** 투어 다음 단계 */
  nextTourStep: () => void;

  /** 투어 이전 단계 */
  prevTourStep: () => void;

  /** 투어 건너뛰기 (자유 탐색 모드로) */
  skipTour: () => void;

  /** 투어 일시정지 */
  pauseTour: () => void;

  /** 투어 재개 */
  resumeTour: () => void;

  /** 남은 시간 갱신 (1초 ticker) */
  tick: () => void;

  /** 인터랙션 추적 */
  trackInteraction: (event: string, data?: Record<string, unknown>) => void;

  /** 상단 배너 닫기 */
  dismissBanner: () => void;

  /** URL에서 데모 모드 초기화 */
  initFromUrl: (scenario: DemoScenario) => void;
}

export type DemoStore = DemoStoreState & DemoStoreActions;

// ============================================================================
// 상수
// ============================================================================

const DEMO_SESSION_KEY = 'neuraltwin-demo-session';
const DEMO_MAX_DURATION_SEC = 5 * 60; // 5분
const TOTAL_TOUR_STEPS = 7;

// ============================================================================
// sessionStorage 헬퍼
// ============================================================================

interface DemoSessionData {
  isDemoMode: boolean;
  currentScenario: DemoScenario | null;
  tourStep: number;
  isTourActive: boolean;
  demoStartedAt: string | null;
  freeExploreStartedAt: string | null;
  bannerDismissed: boolean;
  interactions: DemoInteraction[];
}

function saveSession(state: Partial<DemoSessionData>) {
  try {
    const existing = loadSession();
    const merged = { ...existing, ...state };
    sessionStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(merged));
  } catch {
    // sessionStorage unavailable
  }
}

function loadSession(): DemoSessionData | null {
  try {
    const raw = sessionStorage.getItem(DEMO_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function clearSession() {
  try {
    sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch {
    // noop
  }
}

/** 세션 시작 시각 기준 남은 초 계산 */
function calculateRemainingSeconds(startedAt: string | null): number {
  if (!startedAt) return DEMO_MAX_DURATION_SEC;
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
  return Math.max(0, Math.floor(DEMO_MAX_DURATION_SEC - elapsed));
}

// ============================================================================
// 초기 상태 (세션 복원)
// ============================================================================

function getInitialState(): DemoStoreState {
  const session = loadSession();
  if (session?.isDemoMode && session.demoStartedAt) {
    const remaining = calculateRemainingSeconds(session.demoStartedAt);
    if (remaining > 0) {
      return {
        isDemoMode: true,
        currentScenario: session.currentScenario,
        tourStep: session.tourStep,
        isTourActive: session.isTourActive,
        isTourPaused: false,
        demoStartedAt: session.demoStartedAt,
        freeExploreStartedAt: session.freeExploreStartedAt || null,
        remainingSeconds: remaining,
        interactions: session.interactions || [],
        showScenarioSelector: false,
        bannerDismissed: session.bannerDismissed || false,
      };
    }
    // 세션 만료
    clearSession();
  }
  return {
    isDemoMode: false,
    currentScenario: null,
    tourStep: 0,
    isTourActive: false,
    isTourPaused: false,
    demoStartedAt: null,
    freeExploreStartedAt: null,
    remainingSeconds: DEMO_MAX_DURATION_SEC,
    interactions: [],
    showScenarioSelector: false,
    bannerDismissed: false,
  };
}

// ============================================================================
// Zustand Store
// ============================================================================

export const useDemoStore = create<DemoStore>((set, get) => ({
  ...getInitialState(),

  // =========================================================================
  // 데모 시작/종료
  // =========================================================================

  startDemo: (scenario) => {
    const now = new Date().toISOString();
    const newState = {
      isDemoMode: true,
      currentScenario: scenario,
      tourStep: 1,
      isTourActive: true,
      isTourPaused: false,
      demoStartedAt: now,
      freeExploreStartedAt: null,
      remainingSeconds: DEMO_MAX_DURATION_SEC,
      interactions: [] as DemoInteraction[],
      showScenarioSelector: false,
      bannerDismissed: false,
    };
    set(newState);
    saveSession({
      isDemoMode: true,
      currentScenario: scenario,
      tourStep: 1,
      isTourActive: true,
      demoStartedAt: now,
      freeExploreStartedAt: null,
      bannerDismissed: false,
      interactions: [],
    });

    get().trackInteraction('demo_started', { scenario, timestamp: now });
  },

  endDemo: () => {
    const { interactions } = get();
    // 마지막 이벤트 기록
    const endInteraction: DemoInteraction = {
      event: 'demo_session_ended',
      data: {
        totalInteractions: interactions.length,
      },
      timestamp: Date.now(),
    };
    console.log('[DemoMode] Session ended', [...interactions, endInteraction]);

    clearSession();
    set({
      isDemoMode: false,
      currentScenario: null,
      tourStep: 0,
      isTourActive: false,
      isTourPaused: false,
      demoStartedAt: null,
      freeExploreStartedAt: null,
      remainingSeconds: DEMO_MAX_DURATION_SEC,
      interactions: [],
      showScenarioSelector: false,
      bannerDismissed: false,
    });
  },

  showSelector: () => set({ showScenarioSelector: true }),
  hideSelector: () => set({ showScenarioSelector: false }),

  // =========================================================================
  // 투어 제어
  // =========================================================================

  nextTourStep: () => {
    const { tourStep, isTourActive } = get();
    if (!isTourActive) return;

    const nextStep = tourStep + 1;
    if (nextStep > TOTAL_TOUR_STEPS) {
      // 투어 완료
      set({
        tourStep: TOTAL_TOUR_STEPS + 1,
        isTourActive: false,
        freeExploreStartedAt: new Date().toISOString(),
      });
      saveSession({
        ...get(),
        tourStep: TOTAL_TOUR_STEPS + 1,
        isTourActive: false,
        freeExploreStartedAt: new Date().toISOString(),
      });
      get().trackInteraction('demo_tour_completed', {
        totalSteps: TOTAL_TOUR_STEPS,
      });
    } else {
      set({ tourStep: nextStep, isTourPaused: false });
      saveSession({ ...get(), tourStep: nextStep, isTourActive: true });
      get().trackInteraction('demo_tour_step', { step: nextStep });
    }
  },

  prevTourStep: () => {
    const { tourStep, isTourActive } = get();
    if (!isTourActive || tourStep <= 1) return;
    const prevStep = tourStep - 1;
    set({ tourStep: prevStep, isTourPaused: false });
    saveSession({ ...get(), tourStep: prevStep });
  },

  skipTour: () => {
    const { tourStep } = get();
    const now = new Date().toISOString();
    set({
      isTourActive: false,
      isTourPaused: false,
      tourStep: TOTAL_TOUR_STEPS + 1,
      freeExploreStartedAt: now,
    });
    saveSession({
      ...get(),
      isTourActive: false,
      tourStep: TOTAL_TOUR_STEPS + 1,
      freeExploreStartedAt: now,
    });
    get().trackInteraction('demo_tour_skipped', { skippedAtStep: tourStep });
  },

  pauseTour: () => {
    set({ isTourPaused: true });
  },

  resumeTour: () => {
    set({ isTourPaused: false });
  },

  // =========================================================================
  // 타이머
  // =========================================================================

  tick: () => {
    const { demoStartedAt, isDemoMode } = get();
    if (!isDemoMode || !demoStartedAt) return;

    const remaining = calculateRemainingSeconds(demoStartedAt);
    if (remaining <= 0) {
      // 자동 타임아웃
      get().endDemo();
      return;
    }
    set({ remainingSeconds: remaining });
  },

  // =========================================================================
  // 인터랙션 추적
  // =========================================================================

  trackInteraction: (event, data) => {
    const interaction: DemoInteraction = {
      event,
      data,
      timestamp: Date.now(),
    };
    set((state) => ({
      interactions: [...state.interactions, interaction],
    }));
  },

  // =========================================================================
  // UI 제어
  // =========================================================================

  dismissBanner: () => {
    set({ bannerDismissed: true });
    saveSession({ ...get(), bannerDismissed: true });
  },

  initFromUrl: (scenario) => {
    const { isDemoMode, currentScenario } = get();
    // 이미 같은 시나리오가 실행 중이면 무시
    if (isDemoMode && currentScenario === scenario) return;
    // 시나리오 선택 화면 없이 바로 시작
    get().startDemo(scenario);
  },
}));

export default useDemoStore;
