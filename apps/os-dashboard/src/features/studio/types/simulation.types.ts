/**
 * simulation.types.ts
 *
 * 시뮬레이션 관련 타입 정의
 */

// 시뮬레이션 시나리오 타입
export type SimulationScenario =
  | 'demand'
  | 'inventory'
  | 'layout'
  | 'pricing'
  | 'marketing'
  | 'staffing'
  | 'congestion'
  | 'flow';

// 시뮬레이션 상태
export type SimulationStatus = 'idle' | 'running' | 'completed' | 'error';

// 시뮬레이션 설정
export interface SimulationConfig {
  id: SimulationScenario;
  name: string;
  description: string;
  enabled: boolean;
  parameters: Record<string, any>;
}

// 시뮬레이션 파라미터
export interface SimulationParameters {
  dataRange: number; // days
  forecastPeriod: number; // days
  confidenceLevel: number; // 0-1
  targetMetric?: string;
  constraints?: Record<string, any>;
}

// 시뮬레이션 결과
export interface SimulationResult {
  scenarioId: SimulationScenario;
  status: SimulationStatus;
  startTime: string;
  endTime?: string;
  kpis: KpiDelta[];
  recommendations: Recommendation[];
  confidence: ConfidenceDetails;
  insights: string[];
  visualData?: any;
}

// KPI 델타
export interface KpiDelta {
  name: string;
  baseline: number;
  predicted: number;
  delta: number;
  deltaPercent: number;
  unit?: string;
}

// 추천 사항
export interface Recommendation {
  id: string;
  type: 'action' | 'insight' | 'warning';
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  effort: 'high' | 'medium' | 'low';
  category: string;
  priority: number;
}

// 신뢰도 상세
export interface ConfidenceDetails {
  overall: number;
  factors: {
    dataQuality: number;
    modelAccuracy: number;
    sampleSize: number;
    variability: number;
  };
}

// 수요 예측 결과
export interface DemandForecastResult {
  productId: string;
  productName: string;
  currentDemand: number;
  predictedDemand: number;
  trend: 'up' | 'down' | 'stable';
  seasonality: number[];
  confidence: number;
}

// 재고 최적화 결과
export interface InventoryOptimizationResult {
  productId: string;
  productName: string;
  currentStock: number;
  optimalStock: number;
  reorderPoint: number;
  reorderQuantity: number;
  stockoutRisk: number;
  overstockCost: number;
}

// 가격 최적화 결과
export interface PricingOptimizationResult {
  productId: string;
  productName: string;
  currentPrice: number;
  optimalPrice: number;
  elasticity: number;
  expectedRevenue: number;
  expectedVolume: number;
  margin: number;
}

// 🆕 Display type: 상품이 진열될 수 있는 방식
export type DisplayType = 'hanging' | 'standing' | 'folded' | 'located' | 'boxed' | 'stacked';

// 🆕 Slot type: 가구의 슬롯 타입
export type SlotType = 'hanger' | 'mannequin' | 'shelf' | 'table' | 'rack' | 'hook' | 'drawer';

// 🆕 상품 배치 변경
export interface ProductPlacement {
  productId?: string;
  productSku?: string;
  productName?: string;
  displayType?: DisplayType;
  // FROM (현재 위치)
  fromFurnitureId?: string | null;
  fromSlotId?: string | null;
  fromPosition?: { x: number; y: number; z: number };
  fromSlotPosition?: { x: number; y: number; z: number };
  // TO (제안 위치)
  toSlotId?: string;
  toFurnitureId?: string;
  toPosition?: { x: number; y: number; z: number };
  toSlotPosition?: { x: number; y: number; z: number };
  // 메타데이터
  slotType?: SlotType;
  reason?: string;
  priority?: 'high' | 'medium' | 'low';
  displayTypeMatch?: boolean;
}

// 🆕 슬롯 호환성 정보
export interface SlotCompatibilityInfo {
  totalSlots: number;
  occupiedSlots: number;
  availableSlots: number;
  slotTypes: SlotType[];
  displayTypes: DisplayType[];
}

// 레이아웃 최적화 결과
export interface LayoutOptimizationResult {
  zoneChanges: ZoneChange[];
  furnitureMoves: FurnitureMove[];
  // 🆕 슬롯 기반 상품 배치 제안
  productPlacements?: ProductPlacement[];
  expectedImprovement: {
    traffic: number;
    conversion: number;
    revenue: number;
  };
  heatmapBefore?: any;
  heatmapAfter?: any;
  // 🆕 슬롯 호환성 정보
  slotCompatibility?: SlotCompatibilityInfo | null;
  // 🆕 데이터 소스 메타데이터
  dataSource?: {
    usedRealData: boolean;
    usedSlotSystem: boolean;
    slotsAvailable: number;
    furnitureAvailable: number;
    productsAvailable: number;
    note: string;
  };
}

// 존 변경
export interface ZoneChange {
  zoneId: string;
  zoneName: string;
  changeType: 'resize' | 'move' | 'merge' | 'split';
  before: any;
  after: any;
}

// 가구 이동
export interface FurnitureMove {
  furnitureId: string;
  furnitureName?: string;
  fromPosition?: { x: number; y: number; z: number };
  toPosition: { x: number; y: number; z: number };
  suggestedPosition?: { x: number; y: number; z: number };
  rotation?: number;
  reason?: string;
}

// 동선 시뮬레이션 결과
export interface FlowSimulationResult {
  paths: SimulatedPath[];
  bottlenecks: Bottleneck[];
  avgTravelTime: number;
  avgTravelDistance: number;
  congestionPoints: CongestionPoint[];
}

// 시뮬레이션된 경로
export interface SimulatedPath {
  id: string;
  points: { x: number; y: number; z: number; t: number }[];
  customerType: string;
  totalTime: number;
  totalDistance: number;
}

// 병목 지점
export interface Bottleneck {
  position: { x: number; y: number; z: number };
  severity: number;
  avgWaitTime: number;
  frequency: number;
}

// 혼잡 지점
export interface CongestionPoint {
  position: { x: number; y: number; z: number };
  density: number;
  peakTime: string;
  duration: number;
}

// 인력 배치 시뮬레이션 결과
export interface StaffingSimulationResult {
  currentStaff: number;
  optimalStaff: number;
  schedule: StaffSchedule[];
  costSavings: number;
  serviceImprovement: number;
}

// 인력 스케줄
export interface StaffSchedule {
  timeSlot: string;
  requiredStaff: number;
  currentStaff: number;
  gap: number;
}

// ===== AI 시뮬레이션 진단 타입 =====

export type IssueSeverity = 'critical' | 'warning' | 'info';
export type IssueCategory = 'congestion' | 'flow' | 'conversion' | 'dwell_time' | 'staffing';

export interface DiagnosticIssue {
  id: string;
  severity: IssueSeverity;
  category: IssueCategory;
  zone_id?: string;
  zone_name?: string;
  title: string;
  description: string;
  current_value: number;
  threshold_value: number;
  impact: string;
  suggested_action: string;
  // 추가 호환 필드 (DiagnosticIssueList와 호환)
  zone?: string;
  metric?: string;
  message?: string;
  value?: number;
  target?: number;
  recommendation?: string;
}

export interface SimulationKPIs {
  predicted_visitors: number;
  predicted_conversion_rate: number;
  predicted_revenue: number;
  avg_dwell_time_seconds: number;
  peak_congestion_percent: number;
}

export interface ZoneAnalysis {
  zone_id: string;
  zone_name: string;
  visitor_count: number;
  avg_dwell_seconds: number;
  congestion_level: number;
  conversion_contribution: number;
  bottleneck_score: number;
}

export interface FlowAnalysis {
  primary_paths: {
    from_zone: string;
    to_zone: string;
    traffic_volume: number;
    avg_transition_time: number;
  }[];
  dead_zones: string[];
  congestion_points: string[];
}

export interface AISimulationResult {
  simulation_id: string;
  timestamp: string;
  duration_minutes: number;
  kpis: SimulationKPIs;
  zone_analysis: ZoneAnalysis[];
  flow_analysis: FlowAnalysis;
  hourly_analysis: {
    hour: string;
    visitor_count: number;
    congestion_level: number;
    revenue_estimate: number;
  }[];
  diagnostic_issues: DiagnosticIssue[];
  customer_journeys: {
    journey_id: string;
    customer_type: string;
    zones_visited: string[];
    total_time_seconds: number;
    purchased: boolean;
    purchase_amount?: number;
  }[];
  ai_insights: string[];
  confidence_score: number;
}

export interface SimulationOptions {
  duration_minutes: number;
  customer_count: number;
  time_of_day: 'morning' | 'afternoon' | 'evening' | 'peak';
  simulation_type: 'realtime' | 'predictive' | 'scenario';

  // 환경 컨텍스트 (시뮬레이션/실시간 환경 설정)
  environment_context?: unknown;

  // 트래픽 배수 (이벤트/프로모션 시 증가율)
  traffic_multiplier?: number;

  // UI 옵션
  realTimeVisualization: boolean;
  showCustomerStates: boolean;
  showHeatmap: boolean;
  showCongestion: boolean;
}

// 시뮬레이션 히스토리 항목
export interface SimulationHistoryItem {
  id: string;
  scenario: SimulationScenario;
  status: SimulationStatus;
  createdAt: string;
  completedAt?: string;
  parameters: SimulationParameters;
  result?: SimulationResult;
  userId: string;
  storeId: string;
}
