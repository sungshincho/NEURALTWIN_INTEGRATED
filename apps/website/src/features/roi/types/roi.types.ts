/**
 * ROI 측정 대시보드 타입 정의
 */

export type SimulationSource = '2d_simulation' | '3d_simulation';

export type SourceModule =
  // 2D 시뮬레이션
  | 'price_optimization'
  | 'inventory_optimization'
  | 'promotion'
  | 'promotion_optimization'
  | 'demand_forecast'
  | 'ai_recommendation'
  // 3D 시뮬레이션
  | 'layout_optimization'
  | 'flow_optimization'
  | 'congestion_simulation'
  | 'staffing_optimization';

export type StrategyStatus = 'active' | 'completed' | 'cancelled';
export type StrategyResult = 'success' | 'partial' | 'failed' | null;

export interface AppliedStrategy {
  id: string;
  storeId: string;
  orgId: string;

  // 출처
  source: SimulationSource;
  sourceModule: SourceModule;

  // 전략 정보
  name: string;
  description: string | null;
  settings: Record<string, any>;

  // 기간
  startDate: string; // ISO date
  endDate: string;

  // ROI
  expectedRoi: number;
  targetRoi: number | null;
  currentRoi: number | null;
  finalRoi: number | null;

  // 금액
  expectedRevenue: number | null;
  actualRevenue: number | null;

  // 상태
  status: StrategyStatus;
  result: StrategyResult;

  // 메트릭
  baselineMetrics: Record<string, number>;

  // 메타
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
}

export interface StrategyDailyMetric {
  id: string;
  strategyId: string;
  date: string;
  metrics: Record<string, number>;
  dailyRoi: number | null;
  cumulativeRoi: number | null;
}

// ROI 대시보드 요약
export interface ROISummary {
  totalApplied: number;
  activeCount: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  averageRoi: number;
  totalRevenueImpact: number;
  expectedRevenueTotal: number;
  revenueChangePercent?: number;
}

// 카테고리별 성과
export interface CategoryPerformance {
  source: SimulationSource;
  sourceModule: SourceModule;
  appliedCount: number;
  successCount: number;
  averageRoi: number;
  totalImpact: number;
  trend: 'up' | 'down' | 'stable';
}

// 적용 모달 입력
export interface ApplyStrategyInput {
  source: SimulationSource;
  sourceModule: SourceModule;
  name: string;
  description?: string;
  settings: Record<string, any>;
  startDate: string;
  endDate: string;
  expectedRoi: number;
  expectedRevenue?: number;
  targetRoi?: number;
  baselineMetrics: Record<string, number>;
  notes?: string;
}

// DB에서 가져온 raw 데이터 타입
export interface AppliedStrategyRow {
  id: string;
  store_id: string;
  org_id: string;
  source: SimulationSource;
  source_module: SourceModule;
  name: string;
  description: string | null;
  settings: Record<string, any>;
  start_date: string;
  end_date: string;
  expected_roi: number;
  target_roi: number | null;
  current_roi: number | null;
  final_roi: number | null;
  expected_revenue: number | null;
  actual_revenue: number | null;
  status: StrategyStatus;
  result: StrategyResult;
  baseline_metrics: Record<string, number>;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

// 날짜 범위 타입
export type DateRange = '7d' | '30d' | '90d' | 'all';

// 필터 옵션
export interface StrategyFilters {
  dateRange: DateRange;
  source?: SimulationSource;
  sourceModule?: SourceModule;
  status?: StrategyStatus;
  result?: StrategyResult;
}

// 정렬 옵션
export interface StrategySortOptions {
  field: 'createdAt' | 'startDate' | 'expectedRoi' | 'currentRoi' | 'name';
  direction: 'asc' | 'desc';
}
