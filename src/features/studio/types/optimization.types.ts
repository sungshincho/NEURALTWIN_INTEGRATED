/**
 * optimization.types.ts
 *
 * AI 최적화 설정 관련 타입 정의
 */

// 최적화 목표 타입
export type OptimizationObjective = 'revenue' | 'dwell_time' | 'conversion' | 'balanced';

// 최적화 강도 타입
export type OptimizationIntensity = 'low' | 'medium' | 'high';

// 가구 설정 인터페이스
export interface FurnitureSettings {
  /** 이동 가능한 가구 ID 목록 */
  movableIds: string[];
  /** 벽면 배치 유지 여부 */
  keepWallAttached: boolean;
  /** 존 경계 유지 여부 */
  keepZoneBoundaries: boolean;
}

// 제품 설정 인터페이스
export interface ProductSettings {
  /** 재배치 가능한 제품 ID 목록 (빈 배열 = 전체) */
  relocatableIds: string[];
  /** 전체 제품 재배치 모드 */
  relocateAll: boolean;
  /** 진열 타입 호환성 유지 */
  respectDisplayType: boolean;
  /** 카테고리별 구역 유지 */
  keepCategory: boolean;
}

// B안: 통합 최적화 설정 인터페이스
export interface IntegratedOptimizationSettings {
  /** 레이아웃 최적화 시 직원 위치도 함께 제안 */
  includeStaffOptimization: boolean;
  /** 인력배치 최적화 시 가구 미세 조정 허용 */
  allowFurnitureAdjustment: boolean;
  /** 가구 미세 조정 최대 거리 (cm) */
  maxAdjustmentDistance: number;
}

// 통합 최적화 설정 인터페이스
export interface OptimizationSettings {
  /** 최적화 목표 */
  objective: OptimizationObjective;
  /** 가구 설정 */
  furniture: FurnitureSettings;
  /** 제품 설정 */
  products: ProductSettings;
  /** 최적화 강도 */
  intensity: OptimizationIntensity;
  /** B안: 통합 최적화 설정 */
  integrated?: IntegratedOptimizationSettings;
}

// 강도별 최대 변경 수
export interface IntensityLimits {
  maxFurnitureMoves: number;
  maxProductRelocations: number;
}

export const INTENSITY_LIMITS: Record<OptimizationIntensity, IntensityLimits> = {
  low: { maxFurnitureMoves: 5, maxProductRelocations: 15 },
  medium: { maxFurnitureMoves: 12, maxProductRelocations: 35 },
  high: { maxFurnitureMoves: 25, maxProductRelocations: 60 },
};

// B안: 기본 통합 최적화 설정
export const DEFAULT_INTEGRATED_SETTINGS: IntegratedOptimizationSettings = {
  includeStaffOptimization: true,
  allowFurnitureAdjustment: true,
  maxAdjustmentDistance: 50,
};

// 기본 최적화 설정
export const DEFAULT_OPTIMIZATION_SETTINGS: OptimizationSettings = {
  objective: 'balanced',
  furniture: {
    movableIds: [],
    keepWallAttached: true,
    keepZoneBoundaries: false,
  },
  products: {
    relocatableIds: [],
    relocateAll: true,
    respectDisplayType: true,
    keepCategory: false,
  },
  intensity: 'medium',
  // B안: 통합 최적화 기본값
  integrated: DEFAULT_INTEGRATED_SETTINGS,
};

// 가구 아이템 (선택 UI용)
export interface FurnitureItem {
  id: string;
  name: string;
  furniture_type: string;
  movable: boolean;
  position: { x: number; y: number; z: number };
  zone_id?: string;
}

// 제품 아이템 (선택 UI용)
export interface ProductItem {
  id: string;
  sku: string;
  product_name: string;
  category?: string;
  furniture_id?: string;
  slot_id?: string;
}

// 목표 옵션 메타데이터
export interface ObjectiveOption {
  value: OptimizationObjective;
  label: string;
  description: string;
  icon: string; // lucide icon name
  recommended?: boolean;
}

export const OBJECTIVE_OPTIONS: ObjectiveOption[] = [
  {
    value: 'revenue',
    label: '매출 최대화',
    description: '예상 매출을 최대화합니다',
    icon: 'DollarSign',
  },
  {
    value: 'dwell_time',
    label: '체류시간 증가',
    description: '고객 체류시간을 늘립니다',
    icon: 'Clock',
  },
  {
    value: 'conversion',
    label: '전환율 향상',
    description: '구매 전환율을 높입니다',
    icon: 'TrendingUp',
  },
  {
    value: 'balanced',
    label: '균형 최적화',
    description: '모든 지표를 균형있게 개선합니다',
    icon: 'Scale',
    recommended: true,
  },
];
