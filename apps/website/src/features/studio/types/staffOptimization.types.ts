/**
 * staffOptimization.types.ts
 *
 * 인력 배치 최적화 타입 정의
 */

export type StaffRole = 'manager' | 'sales' | 'cashier' | 'security' | 'fitting' | 'stock';

export const ROLE_LABELS: Record<StaffRole, string> = {
  manager: '매니저',
  sales: '판매직원',
  cashier: '계산원',
  security: '보안요원',
  fitting: '피팅룸 담당',
  stock: '재고관리',
};

export const ROLE_ICONS: Record<StaffRole, string> = {
  manager: '👔',
  sales: '🛍️',
  cashier: '💳',
  security: '🛡️',
  fitting: '👗',
  stock: '📦',
};

export interface StaffMember {
  id: string;
  staff_code: string;
  staff_name: string;
  role: StaffRole;
  zone_id: string;
  zone_name: string;
  position: { x: number; y: number; z: number };
  avatar_url?: string;
}

export interface StaffReallocation {
  staff_id: string;
  staff_code: string;
  staff_name: string;
  role: StaffRole;

  // 현재 배치
  from_zone_id: string;
  from_zone_name: string;
  from_position: { x: number; y: number; z: number };

  // 최적화 배치
  to_zone_id: string;
  to_zone_name: string;
  to_position: { x: number; y: number; z: number };

  // 재배치 정보
  reason: string;
  priority: 'high' | 'medium' | 'low';

  // 예상 효과
  expected_impact: {
    coverage_change_pct: number;
    response_time_change_sec: number;
    customers_served_change: number;
  };
}

export interface StaffOptimizationSummary {
  total_staff: number;
  reallocated_count: number;
  efficiency_before: number;
  efficiency_after: number;
  efficiency_change: number;
}

export interface StaffOverallImpact {
  customer_response_rate_change: number;
  wait_time_change: number;
  coverage_change: number;
  peak_hour_coverage: number;
}

export interface StaffOptimizationResult {
  // 요약
  summary: StaffOptimizationSummary;

  // 상세 재배치 목록
  reallocations: StaffReallocation[];

  // 전체 효과
  overall_impact: StaffOverallImpact;

  // AI 인사이트
  insights: string[];

  // 신뢰도
  confidence: number;
}
