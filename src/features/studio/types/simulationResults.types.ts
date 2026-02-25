/**
 * simulationResults.types.ts
 *
 * AI 시뮬레이션 결과 타입 정의
 * hooks와 utils 간 순환 참조를 방지하기 위해 분리
 */

import type {
  SimulationStatus,
  ConfidenceDetails,
  Bottleneck,
  SimulatedPath,
  DisplayType,
  SlotType,
  ProductPlacement,
  SlotCompatibilityInfo,
} from './simulation.types';

// ============================================================================
// 레이아웃 시뮬레이션 결과
// ============================================================================

export interface LayoutSimulationResultType {
  id: string;
  status: SimulationStatus;
  timestamp: string;

  // 메트릭
  currentEfficiency: number;
  optimizedEfficiency: number;
  expectedROI: number;

  // 예상 개선 효과
  improvements: {
    revenueIncrease: number;
    revenueIncreasePercent: number;
    dwellTimeIncrease: number;
    conversionIncrease: number;
    trafficIncrease: number;
  };

  // 변경 사항
  furnitureMoves: Array<{
    furnitureId: string;
    furnitureName?: string;
    fromPosition?: { x: number; y: number; z: number };
    toPosition: { x: number; y: number; z: number };
    suggestedPosition?: { x: number; y: number; z: number };
    rotation?: number;
    reason?: string;
  }>;

  // 🆕 슬롯 기반 상품 배치 제안
  productPlacements?: ProductPlacement[];

  zoneChanges: Array<{
    zoneId: string;
    zoneName: string;
    changeType: string;
    before: any;
    after: any;
    reason?: string;
  }>;

  // 신뢰도 (확장)
  confidence: ConfidenceDetails & {
    factors: ConfidenceDetails['factors'] & {
      slotDataAvailable?: number;
    };
  };

  // AI 인사이트
  insights: string[];
  warnings?: string[];

  // 🆕 레이아웃 변경 사항 (furnitureMoves의 별칭으로 사용될 수 있음)
  layoutChanges?: Array<{
    furnitureId: string;
    furnitureName: string;
    fromPosition: { x: number; y: number; z: number };
    toPosition: { x: number; y: number; z: number };
    rotation?: number;
    reason?: string;
  }>;

  // 🆕 최적화 요약 정보
  optimizationSummary?: {
    totalChanges: number;
    expectedRevenueIncrease: number;
    expectedConversionIncrease: number;
    confidence: number;
  };

  // 🆕 데이터 소스 메타데이터
  dataSource?: {
    usedRealData: boolean;
    usedSlotSystem: boolean;
    zonesAvailable: number;
    zoneMetricsAvailable: number;
    visitsAvailable: number;
    slotsAvailable: number;
    furnitureAvailable: number;
    productsAvailable: number;
    note: string;
  };

  // 🆕 슬롯 호환성 정보
  slotCompatibility?: SlotCompatibilityInfo | null;

  // 3D 시각화 데이터
  visualization: {
    beforeHeatmap: Array<{ x: number; z: number; intensity: number }>;
    afterHeatmap: Array<{ x: number; z: number; intensity: number }>;
    flowPaths: Array<{
      id: string;
      points: Array<{ x: number; y: number; z: number }>;
      type: 'current' | 'optimized';
    }>;
    highlightZones: Array<{
      zoneId?: string;
      position?: { x: number; y: number; z: number };
      color?: string;
      opacity?: number;
      type?: string;
      changeType?: 'improved' | 'degraded' | 'new' | 'removed' | 'suggested';
    }>;
  };
}

// ============================================================================
// 동선 시뮬레이션 결과
// ============================================================================

// 동선 포인트
export interface FlowPoint {
  x: number;
  y: number;
  z: number;
  t: number;
  speed?: number;
  dwell?: boolean;
}

// 동선 경로
export interface FlowPath {
  id: string;
  customerId: string;
  customerType: string;
  points: FlowPoint[];
  totalTime: number;
  totalDistance: number;
  dwellZones: Array<{
    zoneId: string;
    zoneName: string;
    duration: number;
  }>;
  purchaseIntent: number;
  converted: boolean;
}

// 동선 병목
export interface FlowBottleneck {
  id: string;
  position: { x: number; y: number; z: number };
  zoneName: string;
  severity: number;
  avgWaitTime: number;
  frequency: number;
  cause: string;
  suggestions: string[];
  impactLevel: 'high' | 'medium' | 'low';
  affectedCustomers: number;
}

export interface FlowSimulationResultType {
  id: string;
  status: SimulationStatus;
  timestamp: string;

  // 요약 메트릭
  summary: {
    totalCustomers: number;
    avgTravelTime: number;
    avgTravelDistance: number;
    avgDwellTime: number;
    conversionRate: number;
    bottleneckCount: number;
  };

  // 현재 vs 최적화 비교
  comparison: {
    currentPathLength: number;
    optimizedPathLength: number;
    pathLengthReduction: number;
    currentAvgTime: number;
    optimizedAvgTime: number;
    timeReduction: number;
    congestionReduction: number;
  };

  // 경로 데이터 (3D 시각화용)
  paths: FlowPath[];

  // 상세 데이터
  bottlenecks: FlowBottleneck[];

  optimizations: Array<{
    id: string;
    type: 'layout_change' | 'signage' | 'staff_position' | 'zone_resize';
    description: string;
    location: { x: number; y: number; z: number };
    expectedImprovement: number;
    effort: 'low' | 'medium' | 'high';
    priority: number;
  }>;

  // 존별 분석
  zoneAnalysis: Array<{
    zoneId: string;
    zoneName: string;
    visitCount: number;
    avgDwellTime: number;
    congestionLevel: number;
    conversionContribution: number;
  }>;

  // 신뢰도
  confidence: ConfidenceDetails;

  // 인사이트
  insights: string[];

  // 3D 시각화 데이터
  visualization: {
    animatedPaths: Array<{
      id: string;
      points: FlowPoint[];
      color: string;
      type: 'current' | 'optimized';
    }>;
    bottleneckMarkers: Array<{
      position: { x: number; y: number; z: number };
      severity: number;
      radius: number;
    }>;
    flowHeatmap: Array<{
      x: number;
      z: number;
      density: number;
    }>;
    zoneFlowArrows: Array<{
      from: { x: number; y: number; z: number };
      to: { x: number; y: number; z: number };
      volume: number;
    }>;
  };
}

// ============================================================================
// 혼잡도 시뮬레이션 결과
// ============================================================================

export interface CongestionSimulationResultType {
  id: string;
  status: SimulationStatus;
  timestamp: string;

  // 요약 메트릭
  summary: {
    peakHour: number;
    peakDensity: number;
    avgDensity: number;
    bottleneckCount: number;
  };

  // 시간별 혼잡도
  hourlyData: Array<{
    hour: number;
    avgDensity: number;
    peakDensity: number;
    customerCount: number;
  }>;

  // 존별 혼잡도
  zoneData: Array<{
    zoneId: string;
    zoneName: string;
    avgDensity: number;
    peakDensity: number;
    peakHour: number;
    recommendations: string[];
  }>;

  // 신뢰도
  confidence: ConfidenceDetails;

  // 인사이트
  insights: string[];
}

// ============================================================================
// 인력 배치 시뮬레이션 결과
// ============================================================================

export interface StaffingSimulationResultType {
  id: string;
  status: SimulationStatus;
  timestamp: string;

  // 요약 메트릭
  metrics: {
    totalCoverage: number;
    avgResponseTime: number;
    coverageGain: number;
    customerServiceRateIncrease: number;
  };

  // 인력 위치 데이터
  staffPositions: Array<{
    staffId: string;
    staffName: string;
    currentPosition: { x: number; y: number; z: number };
    suggestedPosition: { x: number; y: number; z: number };
    coverageGain: number;
    reason: string;
  }>;

  // 존별 커버리지
  zoneCoverage: Array<{
    zoneId: string;
    zoneName: string;
    currentCoverage: number;
    suggestedCoverage: number;
    requiredStaff: number;
    currentStaff: number;
  }>;

  // 신뢰도
  confidence: ConfidenceDetails;

  // 인사이트
  insights: string[];
}

// ============================================================================
// 🆕 Ultimate AI 최적화 응답 타입 (generate-optimization)
// ============================================================================

/**
 * 동선 분석 요약
 */
export interface FlowAnalysisSummary {
  total_zones: number;
  total_transitions: number;
  avg_path_length: number;
  avg_path_duration: number;
  overall_conversion_rate: number;
  bottleneck_count: number;
  dead_zone_count: number;
  opportunity_count: number;
  flow_health_score: number;
  key_paths: Array<{
    path: string;
    frequency: number;
    type: string;
  }>;
  bottlenecks: Array<{
    zone: string;
    severity: string;
    congestion: number;
  }>;
  dead_zones: Array<{
    zone: string;
    severity: string;
    visit_rate: number;
  }>;
  opportunities: Array<{
    type: string;
    priority: string;
    description: string;
  }>;
}

/**
 * 환경 분석 요약
 */
export interface EnvironmentSummary {
  weather: {
    condition: string;
    temperature: number;
    severity: string;
  } | null;
  events: Array<{
    name: string;
    type: string;
    impact: string;
  }>;
  temporal: {
    dayOfWeek: string;
    isWeekend: boolean;
    timeOfDay: string;
  };
  impact_multipliers: {
    traffic: number;
    dwell: number;
    conversion: number;
  };
  data_quality: {
    hasWeatherData: boolean;
    hasEventData: boolean;
    hasTemporalData: boolean;
  };
}

/**
 * 연관 분석 요약
 */
export interface AssociationSummary {
  total_transactions: number;
  avg_basket_size: number;
  strong_rules_count: number;
  very_strong_rules_count: number;
  data_quality: string;
  top_rules: Array<{
    rule: string;
    confidence: string;
    lift: string;
    strength: string;
  }>;
  category_affinities: Array<{
    pair: string;
    affinity: string;
    proximity: string;
  }>;
  placement_recommendations: number;
  recommendations: Array<{
    type: string;
    priority: string;
    product: string;
    reason: string;
  }>;
}

/**
 * 예측 요약
 */
export interface PredictionSummary {
  total_expected_revenue_change: number;
  total_daily_revenue_increase: number;
  high_confidence_changes: number;
  medium_confidence_changes: number;
  low_confidence_changes: number;
  overall_confidence: number;
  top_priority_changes: number;
  predictions_applied: number;
}

/**
 * 전환율 예측 요약
 */
export interface ConversionPredictionSummary {
  avg_conversion_change: number;
  changes_above_benchmark: number;
  changes_at_benchmark: number;
  changes_below_benchmark: number;
  high_confidence_count: number;
  avg_confidence: number;
  predictions_applied: number;
}

/**
 * VMD 분석 결과
 */
export interface VMDAnalysis {
  score: {
    overall: number;
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    balance: number;
    visibility: number;
    flow_integration: number;
    category_coherence: number;
    promotion_placement: number;
  };
  violations: Array<{
    type: string;
    severity: 'high' | 'medium' | 'low';
    description: string;
    location?: string;
    suggestion?: string;
  }>;
  recommendations: Array<{
    type: string;
    priority: 'high' | 'medium' | 'low';
    description: string;
    expected_impact: number;
  }>;
  zone_scores: Array<{
    zone_id: string;
    zone_name: string;
    score: number;
    grade: string;
    issues: string[];
  }>;
}

/**
 * 자동 학습 세션
 */
export interface LearningSession {
  session_id: string;
  store_id: string;
  started_at: string;
  adjustments_applied: number;
  improvement_metrics: {
    improvement_percentage: number;
    predictions_validated: number;
    accuracy_change: number;
  };
  parameter_updates: Array<{
    parameter: string;
    old_value: number;
    new_value: number;
    change_reason: string;
  }>;
}

/**
 * Ultimate 최적화 응답 전체 타입
 */
export interface UltimateOptimizationResponse {
  success: boolean;
  result: {
    optimization_id: string;
    store_id: string;
    created_at: string;
    optimization_type: 'furniture' | 'product' | 'both';
    furniture_changes: Array<{
      furniture_id: string;
      furniture_type: string;
      movable: boolean;
      current: {
        zone_id: string;
        position: { x: number; y: number; z: number };
        rotation: { x: number; y: number; z: number };
      };
      suggested: {
        zone_id: string;
        position: { x: number; y: number; z: number };
        rotation: { x: number; y: number; z: number };
      };
      reason: string;
      priority: 'high' | 'medium' | 'low';
      expected_impact: number;
    }>;
    product_changes: Array<{
      product_id: string;
      sku: string;
      current: {
        zone_id: string;
        furniture_id: string;
        slot_id: string;
        position: { x: number; y: number; z: number };
      };
      suggested: {
        zone_id: string;
        furniture_id: string;
        slot_id: string;
        position: { x: number; y: number; z: number };
      };
      reason: string;
      priority: 'high' | 'medium' | 'low';
      expected_revenue_impact: number;
      expected_visibility_impact: number;
      prediction?: {
        expected_revenue_change: number;
        confidence: number;
        factors: string[];
      };
      conversion_prediction?: {
        expected_conversion_change: number;
        confidence: number;
        benchmark_comparison: string;
      };
    }>;
    summary: {
      total_furniture_changes: number;
      total_product_changes: number;
      expected_revenue_improvement: number;
      expected_traffic_improvement: number;
      expected_conversion_improvement: number;
    };
  };
  data_summary: {
    furniture_analyzed: number;
    products_analyzed: number;
    slots_analyzed: number;
  };
  // 🆕 Ultimate 분석 결과
  environment_summary: EnvironmentSummary;
  flow_analysis_summary: FlowAnalysisSummary;
  association_summary: AssociationSummary;
  prediction_summary: PredictionSummary;
  conversion_prediction_summary: ConversionPredictionSummary;
  vmd_analysis: VMDAnalysis;
  learning_session: LearningSession | null;
}
