/**
 * useOnboardingStore.ts
 *
 * Onboarding 2.0 전역 상태 관리 (Zustand)
 * - 2단계 간소화된 온보딩 프로세스
 * - Step 1: 매장 유형 선택
 * - Step 2: 매장 이름 입력
 * - localStorage 연동으로 브라우저 재시작 시에도 상태 유지
 */

import { create } from 'zustand';

// ============================================================================
// 타입 정의
// ============================================================================

export type StoreType = 'fashion' | 'beauty' | 'fnb' | 'lifestyle' | 'other';

export interface OnboardingData {
  storeType: StoreType;
  storeName: string;
}

export interface StoreTypeOption {
  id: StoreType;
  label: string;
  labelKo: string;
  icon: string; // Lucide icon name
  description: string;
  sampleMetrics: {
    visitors: number;
    visitorsChange: number;
    dwell: string;
    dwellChange: number;
    conversion: number;
    conversionChange: number;
  };
}

/** 매장 유형별 옵션 및 샘플 데이터 */
export const STORE_TYPE_OPTIONS: StoreTypeOption[] = [
  {
    id: 'fashion',
    label: 'Fashion',
    labelKo: '패션',
    icon: 'ShoppingBag',
    description: '의류, 잡화, 액세서리',
    sampleMetrics: {
      visitors: 12847,
      visitorsChange: 8.3,
      dwell: '4:12',
      dwellChange: 12,
      conversion: 3.8,
      conversionChange: -0.2,
    },
  },
  {
    id: 'beauty',
    label: 'Beauty',
    labelKo: '뷰티',
    icon: 'Sparkles',
    description: '화장품, 스킨케어',
    sampleMetrics: {
      visitors: 8420,
      visitorsChange: 5.1,
      dwell: '3:45',
      dwellChange: 8,
      conversion: 5.2,
      conversionChange: 1.3,
    },
  },
  {
    id: 'fnb',
    label: 'F&B',
    labelKo: '음식/음료',
    icon: 'Coffee',
    description: '카페, 레스토랑, 베이커리',
    sampleMetrics: {
      visitors: 6200,
      visitorsChange: 3.2,
      dwell: '18:30',
      dwellChange: -4,
      conversion: 12.1,
      conversionChange: 0.8,
    },
  },
  {
    id: 'lifestyle',
    label: 'Lifestyle',
    labelKo: '라이프스타일',
    icon: 'Home',
    description: '리빙, 인테리어, 가전',
    sampleMetrics: {
      visitors: 9100,
      visitorsChange: 6.7,
      dwell: '5:20',
      dwellChange: 15,
      conversion: 2.9,
      conversionChange: -0.5,
    },
  },
  {
    id: 'other',
    label: 'Other',
    labelKo: '기타',
    icon: 'Store',
    description: '편의점, 서점, 기타',
    sampleMetrics: {
      visitors: 7500,
      visitorsChange: 4.0,
      dwell: '4:00',
      dwellChange: 6,
      conversion: 4.0,
      conversionChange: 0.3,
    },
  },
];

// ============================================================================
// localStorage 키
// ============================================================================

const ONBOARDING_COMPLETED_KEY = 'neuraltwin-onboarding-completed';
const ONBOARDING_DATA_KEY = 'neuraltwin-onboarding-data';

// ============================================================================
// Store 정의
// ============================================================================

interface OnboardingStoreState {
  /** 현재 단계 (1: 유형 선택, 2: 이름 입력, 3: 로딩/완료) */
  step: 1 | 2 | 3;
  /** 선택한 매장 유형 */
  storeType: StoreType;
  /** 매장 이름 */
  storeName: string;
  /** 온보딩 완료 여부 */
  isComplete: boolean;
  /** 로딩 중 여부 */
  isLoading: boolean;
  /** 에러 메시지 */
  error: string | null;

  // 액션
  setStoreType: (type: StoreType) => void;
  setStoreName: (name: string) => void;
  nextStep: () => void;
  prevStep: () => void;
  completeOnboarding: () => void;
  skipOnboarding: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

function loadCompletionState(): boolean {
  try {
    return localStorage.getItem(ONBOARDING_COMPLETED_KEY) === 'true';
  } catch {
    return false;
  }
}

function loadOnboardingData(): Partial<OnboardingData> {
  try {
    const raw = localStorage.getItem(ONBOARDING_DATA_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export const useOnboardingStore = create<OnboardingStoreState>((set, get) => ({
  step: 1,
  storeType: (loadOnboardingData().storeType as StoreType) || 'fashion',
  storeName: loadOnboardingData().storeName || '',
  isComplete: loadCompletionState(),
  isLoading: false,
  error: null,

  setStoreType: (type) => set({ storeType: type }),

  setStoreName: (name) => set({ storeName: name }),

  nextStep: () => {
    const { step } = get();
    if (step < 3) {
      set({ step: (step + 1) as 1 | 2 | 3 });
    }
  },

  prevStep: () => {
    const { step } = get();
    if (step > 1) {
      set({ step: (step - 1) as 1 | 2 | 3 });
    }
  },

  completeOnboarding: () => {
    const { storeType, storeName } = get();
    try {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      localStorage.setItem(
        ONBOARDING_DATA_KEY,
        JSON.stringify({ storeType, storeName })
      );
    } catch {
      // localStorage unavailable — continue anyway
    }
    set({ isComplete: true, isLoading: false, error: null });
  },

  skipOnboarding: () => {
    try {
      localStorage.setItem(ONBOARDING_COMPLETED_KEY, 'true');
      localStorage.setItem(
        ONBOARDING_DATA_KEY,
        JSON.stringify({ storeType: 'other', storeName: 'My Store' })
      );
    } catch {
      // noop
    }
    set({
      isComplete: true,
      storeType: 'other',
      storeName: 'My Store',
      isLoading: false,
      error: null,
    });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  reset: () => {
    try {
      localStorage.removeItem(ONBOARDING_COMPLETED_KEY);
      localStorage.removeItem(ONBOARDING_DATA_KEY);
    } catch {
      // noop
    }
    set({
      step: 1,
      storeType: 'fashion',
      storeName: '',
      isComplete: false,
      isLoading: false,
      error: null,
    });
  },
}));
