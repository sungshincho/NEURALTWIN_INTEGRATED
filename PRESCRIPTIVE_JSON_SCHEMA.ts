/**
 * PRESCRIPTIVE_JSON_SCHEMA.ts
 *
 * 통합 AI 응답 TypeScript 인터페이스 V2
 * 모든 AI Edge Function이 준수해야 할 응답 스키마
 *
 * === 버전 히스토리 ===
 * v1.0.0 (2026-01-12): 초기 버전 - 기본 스키마 정의
 * v2.0.0 (2026-01-12): 고도화 버전
 *   - ConfidenceBreakdown: 신뢰도 분해 구조
 *   - StructuredReasoning: 구조화된 근거 체계
 *   - VMDRuleReference: VMD 룰 참조 구조화
 *   - Implementation/Validation 섹션 추가
 *   - 스키마 버전 관리 추가
 *
 * 작성일: 2026-01-12
 * 프로젝트: NEURALTWIN - AI 고도화 스프린트
 */

// ============================================================================
// 스키마 버전 관리
// ============================================================================

export const SCHEMA_VERSION = '2.0.0';

export interface SchemaMetadata {
  version: string;
  generated_at: string;
  generator: 'gemini-2.0-flash' | 'gemini-2.5-pro' | 'rule-based' | 'hybrid';
  schema_hash?: string;
}

// ============================================================================
// 공통 타입 정의
// ============================================================================

/** 3D 좌표 */
export interface Coordinate {
  x: number;
  y: number;
  z: number;
}

/** 우선순위 레벨 */
export type Priority = 'high' | 'medium' | 'low';

/** 리스크 레벨 */
export type RiskLevel = 'low' | 'medium' | 'high';

/** 구현 난이도 */
export type ImplementationDifficulty = 'easy' | 'medium' | 'hard';

/** 선반 레벨 (VMD 골든존 분석용) */
export type ShelfLevel = 'floor' | 'bottom' | 'middle' | 'eye_level' | 'top';

/** 계산 모델 유형 */
export type CalculationModel = 'rule_based' | 'statistical' | 'ml_prediction' | 'hybrid';

/** 비교 유형 */
export type ComparisonType = 'benchmark' | 'historical' | 'peer' | 'target';

// ============================================================================
// P0: 신뢰도 분해 (Confidence Breakdown)
// ============================================================================

/** 신뢰도 구성 요소 */
export interface ConfidenceComponents {
  /** 데이터 완전성 (0-1): 필요 데이터가 얼마나 있는가 */
  data_completeness: number;
  /** 룰 커버리지 (0-1): VMD 룰셋이 얼마나 적용되었는가 */
  rule_coverage: number;
  /** 계산 신뢰도 (0-1): 수치 계산의 신뢰도 */
  calculation_reliability: number;
  /** 과거 정확도 (0-1): 과거 예측이 얼마나 맞았는가 */
  historical_accuracy: number;
  /** 모델 신뢰도 (0-1): AI 모델 자체의 신뢰도 */
  model_confidence: number;
}

/** 신뢰도 가중치 */
export interface ConfidenceWeights {
  data_completeness: number;
  rule_coverage: number;
  calculation_reliability: number;
  historical_accuracy: number;
  model_confidence: number;
}

/** 신뢰도 분해 구조 (P0 핵심) */
export interface ConfidenceBreakdown {
  /** 종합 신뢰도 점수 (0-1) */
  overall_score: number;

  /** 구성 요소별 점수 */
  components: ConfidenceComponents;

  /** 가중치 (합계 = 1.0) */
  weights: ConfidenceWeights;

  /** 개선 제안 */
  improvement_suggestions: string[];

  /** 신뢰도 등급 */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';

  /** 최저 점수 구성요소 (개선 우선순위) */
  weakest_component?: keyof ConfidenceComponents;
}

/** 기본 신뢰도 가중치 */
export const DEFAULT_CONFIDENCE_WEIGHTS: ConfidenceWeights = {
  data_completeness: 0.25,
  rule_coverage: 0.20,
  calculation_reliability: 0.20,
  historical_accuracy: 0.15,
  model_confidence: 0.20,
};

/** 신뢰도 등급 계산 */
export function getConfidenceGrade(score: number): ConfidenceBreakdown['grade'] {
  if (score >= 0.85) return 'A';
  if (score >= 0.70) return 'B';
  if (score >= 0.55) return 'C';
  if (score >= 0.40) return 'D';
  return 'F';
}

// ============================================================================
// P1: VMD 룰 참조 구조화
// ============================================================================

/** VMD 룰 카테고리 */
export type VMDRuleCategory =
  | 'traffic_flow'
  | 'product_placement'
  | 'visual_merchandising'
  | 'customer_psychology';

/** VMD 룰 참조 (구조화) */
export interface VMDRuleReference {
  /** 룰 코드 (예: "VMD-003") */
  rule_code: string;
  /** 룰 이름 (예: "Golden Zone Placement") */
  rule_name: string;
  /** 룰 카테고리 */
  rule_category: VMDRuleCategory;
  /** 룰 자체의 신뢰도 (0-1) */
  confidence_level: number;
  /** 근거 출처 (연구, 보고서 등) */
  evidence_source?: string;
  /** 트리거 조건 매칭 여부 */
  trigger_matched: boolean;
  /** 매칭된 조건 상세 */
  trigger_details?: Record<string, unknown>;
  /** 예상 효과 */
  expected_effect?: {
    metric: string;
    change_percent: number;
  };
}

// ============================================================================
// P1: 데이터 기반 근거 (Data Evidence)
// ============================================================================

/** 데이터 기반 근거 */
export interface DataEvidence {
  /** 메트릭 이름 */
  metric_name: string;
  /** 현재 값 */
  current_value: number;
  /** 비교 유형 */
  comparison_type: ComparisonType;
  /** 비교 대상 값 */
  comparison_value: number;
  /** 갭 퍼센트 */
  gap_percent: number;
  /** 데이터 출처 (테이블/뷰 이름) */
  data_source: string;
  /** 샘플 크기 (일수, 건수 등) */
  sample_size?: number;
  /** 통계적 유의성 (p-value) */
  statistical_significance?: number;
  /** 데이터 기간 */
  date_range?: {
    start: string;
    end: string;
  };
}

// ============================================================================
// P1: 인과 관계 체인 (Causal Chain)
// ============================================================================

/** 인과 관계 단계 */
export interface CausalStep {
  /** 단계 순서 */
  step: number;
  /** 요인 이름 */
  factor: string;
  /** 기여도 (0-1) */
  contribution: number;
  /** 설명 */
  explanation: string;
  /** 관련 메트릭 */
  related_metric?: string;
}

// ============================================================================
// P1: 계산 추적 (Calculation Trace)
// ============================================================================

/** 계산 추적 */
export interface CalculationTrace {
  /** 계산 공식 (사람이 읽을 수 있는 형태) */
  formula: string;
  /** 입력값 */
  inputs: Record<string, number>;
  /** 출력값 */
  output: number;
  /** 신뢰 구간 (95%) */
  confidence_interval?: [number, number];
  /** 사용된 모델 */
  model_used?: CalculationModel;
  /** 계산 단계 (선택적) */
  steps?: {
    step_name: string;
    intermediate_value: number;
    formula_applied: string;
  }[];
}

// ============================================================================
// P1: 구조화된 근거 체계 (Structured Reasoning)
// ============================================================================

/** 구조화된 근거 (기존 reason: string 대체) */
export interface StructuredReasoning {
  /** 한 줄 요약 (기존 reason 필드 역할) */
  summary: string;

  /** 적용된 VMD 룰 목록 */
  vmd_rules: VMDRuleReference[];

  /** 데이터 기반 근거 목록 */
  data_evidence: DataEvidence[];

  /** 인과 관계 체인 (선택적) */
  causal_chain?: CausalStep[];

  /** 계산 추적 (선택적) */
  calculation?: CalculationTrace;

  /** 추가 맥락 정보 */
  context?: {
    store_type?: string;
    time_context?: string;
    seasonal_factor?: string;
    custom_notes?: string;
  };
}

// ============================================================================
// P2: 실행 가이드 (Implementation)
// ============================================================================

/** 실행 리스크 */
export interface ImplementationRisk {
  risk: string;
  likelihood: 'low' | 'medium' | 'high';
  impact: 'low' | 'medium' | 'high';
  mitigation: string;
}

/** 실행 전제조건 */
export interface Prerequisite {
  description: string;
  is_met: boolean;
  action_if_not_met?: string;
}

/** 실행 가이드 */
export interface ImplementationGuide {
  /** 구현 난이도 */
  difficulty: ImplementationDifficulty;
  /** 예상 소요 시간 (분) */
  estimated_time_minutes: number;
  /** 필요 인원 */
  required_staff?: number;
  /** 전제 조건 */
  prerequisites?: Prerequisite[];
  /** 단계별 가이드 */
  step_by_step?: string[];
  /** 리스크 및 완화 방안 */
  risks?: ImplementationRisk[];
  /** 롤백 계획 */
  rollback_plan?: string;
  /** 최적 실행 시간대 */
  best_execution_time?: string;
}

// ============================================================================
// P2: 검증 계획 (Validation)
// ============================================================================

/** 성공 기준 */
export interface SuccessCriterion {
  /** 메트릭 이름 */
  metric: string;
  /** 현재 값 */
  baseline_value?: number;
  /** 목표 값 */
  target_value: number;
  /** 측정 기간 (일) */
  timeframe_days: number;
  /** 최소 성공 기준 */
  minimum_threshold?: number;
}

/** 검증 계획 */
export interface ValidationPlan {
  /** 성공 기준 목록 */
  success_criteria: SuccessCriterion[];
  /** 측정 방법 */
  measurement_method: string;
  /** 검증 주기 */
  check_frequency?: 'daily' | 'weekly' | 'monthly';
  /** A/B 테스트 필요 여부 */
  requires_ab_test?: boolean;
  /** 데이터 수집 방법 */
  data_collection?: string;
  /** 의사결정 기준 */
  decision_criteria?: {
    success_action: string;
    failure_action: string;
  };
}

// ============================================================================
// VMD 원칙 및 배치 전략
// ============================================================================

/** VMD 원칙 */
export type VMDPrinciple =
  | 'focal_point_creation'      // 포컬포인트 생성
  | 'traffic_flow_optimization' // 동선 최적화
  | 'bottleneck_resolution'     // 병목 해소
  | 'dead_zone_activation'      // 데드존 활성화
  | 'sightline_improvement'     // 시야선 개선
  | 'accessibility_enhancement' // 접근성 향상
  | 'cross_sell_proximity'      // 크로스셀 근접 배치
  | 'negative_space_balance';   // 여백 균형

/** 배치 전략 */
export type PlacementStrategy =
  | 'golden_zone_placement'     // 골든존 배치
  | 'eye_level_optimization'    // 아이레벨 최적화
  | 'impulse_buy_position'      // 충동구매 위치
  | 'cross_sell_bundle'         // 크로스셀 번들
  | 'high_margin_spotlight'     // 고마진 스포트라이트
  | 'slow_mover_activation'     // 저회전 상품 활성화
  | 'seasonal_highlight'        // 시즌 하이라이트
  | 'new_arrival_feature'       // 신상품 피처링
  | 'clearance_optimization'    // 클리어런스 최적화
  | 'hero_product_display';     // 히어로 상품 진열

/** 인력 배치 전략 */
export type StaffingStrategy =
  | 'peak_coverage'             // 피크타임 커버리지
  | 'bottleneck_support'        // 병목 지원
  | 'high_value_zone_focus'     // 고가치 존 집중
  | 'cross_zone_flexibility'    // 교차 존 유연배치
  | 'customer_service_boost'    // 고객 서비스 강화
  | 'queue_management'          // 대기줄 관리
  | 'fitting_room_priority'     // 피팅룸 우선 배치
  | 'entrance_greeting';        // 입구 환영 서비스

// ============================================================================
// 최적화 액션 타입
// ============================================================================

/** 액션 타입 */
export type ActionType = 'MOVE' | 'ADD' | 'REMOVE' | 'ROTATE' | 'SWAP' | 'RESIZE';

/** 기본 액션 인터페이스 */
export interface BaseAction {
  action_type: ActionType;
  target: {
    id: string;
    name: string;
    type: 'furniture' | 'product' | 'zone' | 'staff';
  };
  instruction: {
    from?: Coordinate;
    to?: Coordinate;
    rotation_delta?: Coordinate;
    reason: string;
    rule_applied?: string;  // VMD 룰 코드 참조 (예: "VMD-001")
    data_evidence?: string; // 데이터 기반 근거
  };
  impact_prediction: {
    metric: string;
    current_value?: number;
    predicted_value: number;
    change_percent: number;
    confidence: number;
    calculation_breakdown?: {
      step: string;
      value: number;
      formula: string;
    }[];
  };
}

// ============================================================================
// 가구 변경 스키마
// ============================================================================

export interface FurnitureChange {
  furniture_id: string;
  furniture_type: string;
  movable: boolean;

  current: {
    zone_id: string;
    position: Coordinate;
    rotation: Coordinate;
  };

  suggested: {
    zone_id: string;
    position: Coordinate;
    rotation: Coordinate;
  };

  vmd_principle: VMDPrinciple;
  reason: string;
  priority: Priority;

  expected_impact: {
    traffic_change: number;      // -0.5 ~ 0.5
    dwell_time_change?: number;
    visibility_score?: number;   // 0-100
    confidence: number;          // 0-1
  };

  risk_level?: RiskLevel;
  implementation_difficulty?: ImplementationDifficulty;
}

// ============================================================================
// 가구 변경 스키마 V2 (고도화)
// ============================================================================

/** 가구 변경 V2 - 구조화된 근거 및 검증 계획 포함 */
export interface FurnitureChangeV2 {
  /** 기본 식별 정보 */
  furniture_id: string;
  furniture_type: string;
  furniture_name?: string;
  movable: boolean;

  /** 현재 상태 */
  current: {
    zone_id: string;
    zone_name?: string;
    position: Coordinate;
    rotation: Coordinate;
  };

  /** 제안 상태 */
  suggested: {
    zone_id: string;
    zone_name?: string;
    position: Coordinate;
    rotation: Coordinate;
  };

  /** 우선순위 */
  priority: Priority;

  /** 🆕 구조화된 근거 (기존 reason, vmd_principle 대체) */
  reasoning: StructuredReasoning;

  /** 🆕 상세 영향 분석 */
  expected_impact: {
    /** 주요 메트릭 */
    primary_metric: {
      name: string;
      current: number;
      predicted: number;
      change_percent: number;
    };
    /** 부수적 메트릭 */
    secondary_metrics?: {
      name: string;
      change_percent: number;
    }[];
    /** 🆕 분해된 신뢰도 */
    confidence: ConfidenceBreakdown;
  };

  /** 🆕 실행 가이드 */
  implementation: ImplementationGuide;

  /** 🆕 검증 계획 */
  validation: ValidationPlan;

  /** 리스크 레벨 */
  risk_level?: RiskLevel;

  /** 하위 호환성: 기존 필드 (Deprecated) */
  /** @deprecated Use reasoning.summary instead */
  reason?: string;
  /** @deprecated Use reasoning.vmd_rules[0] instead */
  vmd_principle?: VMDPrinciple;
}

// ============================================================================
// 상품 변경 스키마
// ============================================================================

export interface ProductChange {
  product_id: string;
  sku: string;

  current: {
    zone_id: string;
    furniture_id: string;
    slot_id: string;
    position?: Coordinate;
    shelf_level?: ShelfLevel;
  };

  suggested: {
    zone_id: string;
    furniture_id: string;
    slot_id: string;
    position?: Coordinate;
    shelf_level?: ShelfLevel;
  };

  placement_strategy: {
    type: PlacementStrategy;
    associated_products?: string[];  // 연관 상품 ID
    association_rule?: {
      confidence: number;  // 0-1
      lift: number;        // 1 이상
      support: number;     // 0-1
    };
  };

  reason: string;
  priority: Priority;

  expected_impact: {
    revenue_change: number;      // -0.5 ~ 1.0
    visibility_change?: number;
    conversion_change?: number;
    units_per_transaction_change?: number;
    confidence: number;
  };

  slot_compatibility?: {
    is_compatible: boolean;
    display_type_match: boolean;
    size_fit: 'exact' | 'acceptable' | 'tight';
  };
}

// ============================================================================
// 상품 변경 스키마 V2 (고도화)
// ============================================================================

/** 상품 변경 V2 - 구조화된 근거 및 검증 계획 포함 */
export interface ProductChangeV2 {
  /** 기본 식별 정보 */
  product_id: string;
  sku: string;
  product_name?: string;
  category?: string;

  /** 현재 상태 */
  current: {
    zone_id: string;
    zone_name?: string;
    furniture_id: string;
    furniture_name?: string;
    slot_id: string;
    position?: Coordinate;
    shelf_level?: ShelfLevel;
    facing_count?: number;
  };

  /** 제안 상태 */
  suggested: {
    zone_id: string;
    zone_name?: string;
    furniture_id: string;
    furniture_name?: string;
    slot_id: string;
    position?: Coordinate;
    shelf_level?: ShelfLevel;
    facing_count?: number;
  };

  /** 우선순위 */
  priority: Priority;

  /** 🆕 구조화된 근거 */
  reasoning: StructuredReasoning;

  /** 배치 전략 */
  placement_strategy: {
    type: PlacementStrategy;
    associated_products?: {
      product_id: string;
      product_name?: string;
      relationship: 'cross_sell' | 'upsell' | 'substitute' | 'complement';
    }[];
    association_rule?: {
      confidence: number;
      lift: number;
      support: number;
    };
  };

  /** 🆕 상세 영향 분석 */
  expected_impact: {
    /** 주요 메트릭 */
    primary_metric: {
      name: string;
      current: number;
      predicted: number;
      change_percent: number;
    };
    /** 부수적 메트릭 */
    secondary_metrics?: {
      name: string;
      change_percent: number;
    }[];
    /** ROI 예측 */
    roi_prediction?: {
      expected_revenue_lift: number;
      expected_margin_lift: number;
      payback_period_days?: number;
    };
    /** 🆕 분해된 신뢰도 */
    confidence: ConfidenceBreakdown;
  };

  /** 🆕 실행 가이드 */
  implementation: ImplementationGuide;

  /** 🆕 검증 계획 */
  validation: ValidationPlan;

  /** 슬롯 호환성 */
  slot_compatibility?: {
    is_compatible: boolean;
    display_type_match: boolean;
    size_fit: 'exact' | 'acceptable' | 'tight';
    issues?: string[];
  };

  /** 하위 호환성: 기존 필드 (Deprecated) */
  /** @deprecated Use reasoning.summary instead */
  reason?: string;
}

// ============================================================================
// 레이아웃 최적화 응답 스키마
// ============================================================================

export interface LayoutOptimizationResponse {
  /** 추론 요약 (500자 이내) */
  reasoning_summary?: string;

  /** 가구 변경 목록 */
  furniture_changes: FurnitureChange[];

  /** 상품 변경 목록 */
  product_changes: ProductChange[];

  /** 종합 요약 */
  summary: {
    total_furniture_changes: number;
    total_product_changes: number;

    expected_revenue_improvement: number;  // 0.05 = 5%
    expected_traffic_improvement?: number;
    expected_conversion_improvement: number;

    confidence_score: number;  // 0-1

    key_strategies?: string[];  // 핵심 전략 (3개 이내)
    ai_insights: string[];      // AI 인사이트 (3-5개)

    issues_addressed?: {
      issue_id: string;
      issue_type: string;
      resolution_approach: string;
      expected_resolution_rate: number;
    }[];

    risk_factors?: string[];
    environmental_adaptations?: string[];
  };

  /** 메타데이터 */
  _meta?: {
    model_version: string;
    generation_timestamp: string;
    processing_time_ms: number;
    fallback_used: boolean;
  };
}

// ============================================================================
// 레이아웃 최적화 응답 스키마 V2 (고도화)
// ============================================================================

/** 레이아웃 최적화 응답 V2 */
export interface LayoutOptimizationResponseV2 {
  /** 스키마 버전 */
  schema_version: typeof SCHEMA_VERSION;

  /** 추론 요약 (500자 이내) */
  reasoning_summary: string;

  /** 🆕 전체 분석 컨텍스트 */
  analysis_context: {
    store_id: string;
    store_name?: string;
    analysis_date: string;
    data_period: {
      start: string;
      end: string;
    };
    baseline_metrics: {
      daily_traffic: number;
      conversion_rate: number;
      avg_transaction_value: number;
      avg_dwell_time_seconds: number;
    };
  };

  /** 가구 변경 목록 (V2) */
  furniture_changes: FurnitureChangeV2[];

  /** 상품 변경 목록 (V2) */
  product_changes: ProductChangeV2[];

  /** 🆕 종합 요약 (확장) */
  summary: {
    total_furniture_changes: number;
    total_product_changes: number;

    /** 예상 개선 효과 */
    expected_improvements: {
      revenue: { percent: number; absolute?: number };
      traffic: { percent: number; absolute?: number };
      conversion: { percent: number; absolute?: number };
      dwell_time: { percent: number; absolute?: number };
    };

    /** 🆕 종합 신뢰도 분석 */
    overall_confidence: ConfidenceBreakdown;

    /** 핵심 전략 (3개 이내) */
    key_strategies: string[];

    /** AI 인사이트 (3-5개) */
    ai_insights: string[];

    /** 해결된 이슈 */
    issues_addressed?: {
      issue_id: string;
      issue_type: string;
      resolution_approach: string;
      expected_resolution_rate: number;
    }[];

    /** 리스크 요인 */
    risk_factors?: {
      risk: string;
      severity: RiskLevel;
      mitigation?: string;
    }[];

    /** 환경 적응 사항 */
    environmental_adaptations?: string[];

    /** 🆕 실행 요약 */
    implementation_summary: {
      total_estimated_time_minutes: number;
      required_staff: number;
      priority_order: string[];  // furniture_id 또는 product_id 순서
      best_execution_window?: string;
    };
  };

  /** 🆕 적용된 VMD 룰셋 요약 */
  vmd_rules_applied: {
    rule_code: string;
    rule_name: string;
    times_applied: number;
    affected_items: string[];
  }[];

  /** 메타데이터 */
  _meta: SchemaMetadata & {
    request_id: string;
    processing_time_ms: number;
    fallback_used: boolean;
    function_calls_made?: number;
  };
}

// ============================================================================
// 인력 배치 최적화 응답 스키마
// ============================================================================

export interface StaffPosition {
  staffId: string;
  staffCode?: string;
  staffName?: string;
  role: string;
  currentPosition: Coordinate;
  suggestedPosition: Coordinate;
  current_zone?: string;
  suggested_zone?: string;
  assignment_strategy: StaffingStrategy;
  coverageGain?: number;
  reason: string;
}

export interface ZoneCoverage {
  zoneId: string;
  zoneName: string;
  currentCoverage: number;
  suggestedCoverage: number;
  requiredStaff?: number;
  currentStaff?: number;
}

export interface StaffOptimizationResponse {
  staffPositions: StaffPosition[];
  zoneCoverage: ZoneCoverage[];
  metrics: {
    totalCoverage: number;
    avgResponseTime?: number;
    coverageGain: number;
    customerServiceRateIncrease: number;
  };
  insights: string[];
  confidence: number;
}

// ============================================================================
// 시뮬레이션 응답 스키마
// ============================================================================

export interface DiagnosticIssue {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  type?: string;
  title: string;
  message?: string;
  zone?: string;
  zone_id?: string;
  zone_name?: string;
  recommendation?: string;
  impact?: {
    metric: string;
    current_value: number;
    potential_improvement: number;
  };
}

export interface ZoneAnalytic {
  zone_id: string;
  zone_name: string;
  zone_type: string;
  metrics: {
    visitor_count: number;
    avg_dwell_time_seconds: number;
    conversion_rate: number;
    congestion_score: number;  // 0-1
    revenue_contribution: number;
  };
  issues?: DiagnosticIssue[];
}

export interface HeatmapPoint {
  x: number;
  y: number;
  z: number;
  intensity: number;  // 0-1
  type: 'traffic' | 'dwell' | 'conversion';
}

export interface SimulationResponse {
  scenario_id: string;
  scenario_type: 'baseline' | 'what-if' | 'comparison';

  metrics: {
    total_visitors: number;
    conversion_rate: number;
    avg_dwell_time: number;
    revenue_estimate: number;
    avg_basket_size?: number;
    peak_hour?: number;
  };

  zone_analytics: ZoneAnalytic[];
  heatmap_data: HeatmapPoint[];
  diagnostic_issues: DiagnosticIssue[];

  comparison?: {
    baseline_metrics: SimulationResponse['metrics'];
    improvement: {
      visitors_change: number;
      conversion_change: number;
      revenue_change: number;
    };
  };

  confidence: number;

  /** 폴백 여부 표시 */
  _fallback?: boolean;
}

// ============================================================================
// 통합 AI 응답 타입
// ============================================================================

export type AIResponseType =
  | 'layout_optimization'
  | 'staff_optimization'
  | 'simulation'
  | 'demand_forecast'
  | 'customer_segment'
  | 'recommendation';

export interface AIResponse<T = unknown> {
  success: boolean;
  type: AIResponseType;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
  meta: {
    request_id: string;
    model_used: string;
    processing_time_ms: number;
    token_usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    timestamp: string;
  };
}

/** AI 응답 V2 - 스키마 버전 포함 */
export interface AIResponseV2<T = unknown> {
  /** 스키마 버전 */
  schema_version: string;
  success: boolean;
  type: AIResponseType;
  data: T;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
    recoverable: boolean;
    suggested_action?: string;
  };
  meta: SchemaMetadata & {
    request_id: string;
    processing_time_ms: number;
    token_usage?: {
      prompt_tokens: number;
      completion_tokens: number;
      total_tokens: number;
    };
    function_calls_made?: number;
  };
}

// ============================================================================
// 타입 가드 함수
// ============================================================================

export function isLayoutOptimizationResponse(
  data: unknown
): data is LayoutOptimizationResponse {
  const obj = data as LayoutOptimizationResponse;
  return (
    obj !== null &&
    typeof obj === 'object' &&
    Array.isArray(obj.furniture_changes) &&
    Array.isArray(obj.product_changes) &&
    typeof obj.summary === 'object' &&
    typeof obj.summary.confidence_score === 'number'
  );
}

export function isSimulationResponse(
  data: unknown
): data is SimulationResponse {
  const obj = data as SimulationResponse;
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.scenario_id === 'string' &&
    typeof obj.metrics === 'object' &&
    Array.isArray(obj.zone_analytics)
  );
}

export function isStaffOptimizationResponse(
  data: unknown
): data is StaffOptimizationResponse {
  const obj = data as StaffOptimizationResponse;
  return (
    obj !== null &&
    typeof obj === 'object' &&
    Array.isArray(obj.staffPositions) &&
    Array.isArray(obj.zoneCoverage) &&
    typeof obj.metrics === 'object'
  );
}

/** V2 레이아웃 최적화 응답 타입 가드 */
export function isLayoutOptimizationResponseV2(
  data: unknown
): data is LayoutOptimizationResponseV2 {
  const obj = data as LayoutOptimizationResponseV2;
  return (
    obj !== null &&
    typeof obj === 'object' &&
    obj.schema_version === SCHEMA_VERSION &&
    Array.isArray(obj.furniture_changes) &&
    Array.isArray(obj.product_changes) &&
    typeof obj.summary === 'object' &&
    typeof obj.summary.overall_confidence === 'object'
  );
}

/** ConfidenceBreakdown 타입 가드 */
export function isConfidenceBreakdown(
  data: unknown
): data is ConfidenceBreakdown {
  const obj = data as ConfidenceBreakdown;
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.overall_score === 'number' &&
    typeof obj.components === 'object' &&
    typeof obj.grade === 'string'
  );
}

/** StructuredReasoning 타입 가드 */
export function isStructuredReasoning(
  data: unknown
): data is StructuredReasoning {
  const obj = data as StructuredReasoning;
  return (
    obj !== null &&
    typeof obj === 'object' &&
    typeof obj.summary === 'string' &&
    Array.isArray(obj.vmd_rules) &&
    Array.isArray(obj.data_evidence)
  );
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

/** 신뢰도 점수 계산 */
export function calculateConfidenceScore(
  components: ConfidenceComponents,
  weights: ConfidenceWeights = DEFAULT_CONFIDENCE_WEIGHTS
): ConfidenceBreakdown {
  const overall_score =
    components.data_completeness * weights.data_completeness +
    components.rule_coverage * weights.rule_coverage +
    components.calculation_reliability * weights.calculation_reliability +
    components.historical_accuracy * weights.historical_accuracy +
    components.model_confidence * weights.model_confidence;

  // 가장 약한 구성요소 찾기
  const componentEntries = Object.entries(components) as [keyof ConfidenceComponents, number][];
  const weakest = componentEntries.reduce((min, current) =>
    current[1] < min[1] ? current : min
  );

  // 개선 제안 생성
  const improvement_suggestions: string[] = [];
  if (components.data_completeness < 0.7) {
    improvement_suggestions.push('Zone VMD 속성 데이터 보완 필요');
  }
  if (components.rule_coverage < 0.7) {
    improvement_suggestions.push('추가 VMD 룰셋 적용 검토');
  }
  if (components.calculation_reliability < 0.7) {
    improvement_suggestions.push('Function Calling 기반 계산 활성화 필요');
  }
  if (components.historical_accuracy < 0.7) {
    improvement_suggestions.push('과거 예측 피드백 데이터 축적 필요');
  }
  if (components.model_confidence < 0.7) {
    improvement_suggestions.push('프롬프트 개선 또는 모델 업그레이드 검토');
  }

  return {
    overall_score,
    components,
    weights,
    improvement_suggestions,
    grade: getConfidenceGrade(overall_score),
    weakest_component: weakest[0],
  };
}

/** V1 → V2 마이그레이션 헬퍼 */
export function migrateToV2FurnitureChange(
  v1: FurnitureChange
): Partial<FurnitureChangeV2> {
  return {
    furniture_id: v1.furniture_id,
    furniture_type: v1.furniture_type,
    movable: v1.movable,
    current: v1.current,
    suggested: v1.suggested,
    priority: v1.priority,
    reasoning: {
      summary: v1.reason,
      vmd_rules: [{
        rule_code: 'LEGACY',
        rule_name: v1.vmd_principle.replace(/_/g, ' '),
        rule_category: 'traffic_flow',
        confidence_level: v1.expected_impact.confidence,
        trigger_matched: true,
      }],
      data_evidence: [],
    },
    risk_level: v1.risk_level,
    // V1 호환성 필드
    reason: v1.reason,
    vmd_principle: v1.vmd_principle,
  };
}

/** 빈 ConfidenceBreakdown 생성 */
export function createEmptyConfidenceBreakdown(): ConfidenceBreakdown {
  return {
    overall_score: 0.5,
    components: {
      data_completeness: 0.5,
      rule_coverage: 0.5,
      calculation_reliability: 0.5,
      historical_accuracy: 0.5,
      model_confidence: 0.5,
    },
    weights: DEFAULT_CONFIDENCE_WEIGHTS,
    improvement_suggestions: ['초기 데이터 - 모든 구성요소 개선 필요'],
    grade: 'C',
    weakest_component: 'data_completeness',
  };
}

/** 빈 ImplementationGuide 생성 */
export function createDefaultImplementationGuide(
  difficulty: ImplementationDifficulty = 'medium'
): ImplementationGuide {
  return {
    difficulty,
    estimated_time_minutes: difficulty === 'easy' ? 15 : difficulty === 'medium' ? 30 : 60,
    required_staff: 1,
    step_by_step: ['현재 상태 확인', '제안된 변경 적용', '결과 검증'],
    rollback_plan: '변경 전 상태로 원복',
  };
}

/** 빈 ValidationPlan 생성 */
export function createDefaultValidationPlan(
  metricName: string,
  targetChange: number
): ValidationPlan {
  return {
    success_criteria: [{
      metric: metricName,
      target_value: targetChange,
      timeframe_days: 7,
    }],
    measurement_method: '일별 KPI 대시보드 모니터링',
    check_frequency: 'daily',
    requires_ab_test: false,
  };
}

// ============================================================================
// JSON Schema for Gemini API (런타임 스키마)
// ============================================================================

export const LAYOUT_OPTIMIZATION_JSON_SCHEMA = {
  type: 'object',
  required: ['furniture_changes', 'product_changes', 'summary'],
  additionalProperties: false,
  properties: {
    reasoning_summary: {
      type: 'string',
      description: '핵심 최적화 전략 요약 (500자 이내)',
    },
    furniture_changes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['furniture_id', 'furniture_type', 'current', 'suggested',
                   'reason', 'priority', 'vmd_principle', 'expected_impact'],
        properties: {
          furniture_id: { type: 'string' },
          furniture_type: { type: 'string' },
          movable: { type: 'boolean' },
          current: {
            type: 'object',
            required: ['zone_id', 'position', 'rotation'],
            properties: {
              zone_id: { type: 'string' },
              position: {
                type: 'object',
                required: ['x', 'y', 'z'],
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
              rotation: {
                type: 'object',
                required: ['x', 'y', 'z'],
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
            },
          },
          suggested: {
            type: 'object',
            required: ['zone_id', 'position', 'rotation'],
            properties: {
              zone_id: { type: 'string' },
              position: {
                type: 'object',
                required: ['x', 'y', 'z'],
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
              rotation: {
                type: 'object',
                required: ['x', 'y', 'z'],
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  z: { type: 'number' },
                },
              },
            },
          },
          vmd_principle: { type: 'string' },
          reason: { type: 'string' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          expected_impact: {
            type: 'object',
            required: ['traffic_change', 'confidence'],
            properties: {
              traffic_change: { type: 'number' },
              dwell_time_change: { type: 'number' },
              visibility_score: { type: 'number' },
              confidence: { type: 'number' },
            },
          },
          risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
          implementation_difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
        },
      },
    },
    product_changes: {
      type: 'array',
      items: {
        type: 'object',
        required: ['product_id', 'sku', 'current', 'suggested',
                   'reason', 'priority', 'placement_strategy', 'expected_impact'],
        properties: {
          product_id: { type: 'string' },
          sku: { type: 'string' },
          current: {
            type: 'object',
            required: ['zone_id', 'furniture_id', 'slot_id'],
            properties: {
              zone_id: { type: 'string' },
              furniture_id: { type: 'string' },
              slot_id: { type: 'string' },
              shelf_level: { type: 'string' },
            },
          },
          suggested: {
            type: 'object',
            required: ['zone_id', 'furniture_id', 'slot_id'],
            properties: {
              zone_id: { type: 'string' },
              furniture_id: { type: 'string' },
              slot_id: { type: 'string' },
              shelf_level: { type: 'string' },
            },
          },
          placement_strategy: {
            type: 'object',
            required: ['type'],
            properties: {
              type: { type: 'string' },
              associated_products: { type: 'array', items: { type: 'string' } },
            },
          },
          reason: { type: 'string' },
          priority: { type: 'string', enum: ['high', 'medium', 'low'] },
          expected_impact: {
            type: 'object',
            required: ['revenue_change', 'confidence'],
            properties: {
              revenue_change: { type: 'number' },
              visibility_change: { type: 'number' },
              conversion_change: { type: 'number' },
              confidence: { type: 'number' },
            },
          },
        },
      },
    },
    summary: {
      type: 'object',
      required: ['total_furniture_changes', 'total_product_changes',
                 'expected_revenue_improvement', 'expected_conversion_improvement',
                 'confidence_score', 'ai_insights'],
      properties: {
        total_furniture_changes: { type: 'integer' },
        total_product_changes: { type: 'integer' },
        expected_revenue_improvement: { type: 'number' },
        expected_traffic_improvement: { type: 'number' },
        expected_conversion_improvement: { type: 'number' },
        confidence_score: { type: 'number' },
        key_strategies: { type: 'array', items: { type: 'string' } },
        ai_insights: { type: 'array', items: { type: 'string' } },
        risk_factors: { type: 'array', items: { type: 'string' } },
      },
    },
  },
} as const;

export const SIMULATION_JSON_SCHEMA = {
  type: 'object',
  required: ['scenario_id', 'metrics', 'zone_analytics', 'diagnostic_issues', 'confidence'],
  additionalProperties: false,
  properties: {
    scenario_id: { type: 'string' },
    scenario_type: { type: 'string', enum: ['baseline', 'what-if', 'comparison'] },
    metrics: {
      type: 'object',
      required: ['total_visitors', 'conversion_rate', 'avg_dwell_time', 'revenue_estimate'],
      properties: {
        total_visitors: { type: 'integer' },
        conversion_rate: { type: 'number' },
        avg_dwell_time: { type: 'number' },
        revenue_estimate: { type: 'number' },
        avg_basket_size: { type: 'number' },
        peak_hour: { type: 'integer' },
      },
    },
    zone_analytics: {
      type: 'array',
      items: {
        type: 'object',
        required: ['zone_id', 'zone_name', 'zone_type', 'metrics'],
        properties: {
          zone_id: { type: 'string' },
          zone_name: { type: 'string' },
          zone_type: { type: 'string' },
          metrics: {
            type: 'object',
            properties: {
              visitor_count: { type: 'integer' },
              avg_dwell_time_seconds: { type: 'number' },
              conversion_rate: { type: 'number' },
              congestion_score: { type: 'number' },
              revenue_contribution: { type: 'number' },
            },
          },
        },
      },
    },
    heatmap_data: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          x: { type: 'number' },
          y: { type: 'number' },
          z: { type: 'number' },
          intensity: { type: 'number' },
          type: { type: 'string' },
        },
      },
    },
    diagnostic_issues: {
      type: 'array',
      items: {
        type: 'object',
        required: ['id', 'severity', 'title'],
        properties: {
          id: { type: 'string' },
          severity: { type: 'string', enum: ['info', 'warning', 'error', 'critical'] },
          type: { type: 'string' },
          title: { type: 'string' },
          message: { type: 'string' },
          zone: { type: 'string' },
          recommendation: { type: 'string' },
        },
      },
    },
    confidence: { type: 'number' },
  },
} as const;

// ============================================================================
// JSON Schema V2 for Gemini API (구조화된 근거 포함)
// ============================================================================

/** ConfidenceBreakdown JSON Schema */
export const CONFIDENCE_BREAKDOWN_SCHEMA = {
  type: 'object',
  required: ['overall_score', 'components', 'grade'],
  properties: {
    overall_score: { type: 'number', minimum: 0, maximum: 1 },
    components: {
      type: 'object',
      required: ['data_completeness', 'rule_coverage', 'calculation_reliability', 'historical_accuracy', 'model_confidence'],
      properties: {
        data_completeness: { type: 'number', minimum: 0, maximum: 1 },
        rule_coverage: { type: 'number', minimum: 0, maximum: 1 },
        calculation_reliability: { type: 'number', minimum: 0, maximum: 1 },
        historical_accuracy: { type: 'number', minimum: 0, maximum: 1 },
        model_confidence: { type: 'number', minimum: 0, maximum: 1 },
      },
    },
    grade: { type: 'string', enum: ['A', 'B', 'C', 'D', 'F'] },
    improvement_suggestions: { type: 'array', items: { type: 'string' } },
    weakest_component: { type: 'string' },
  },
} as const;

/** VMDRuleReference JSON Schema */
export const VMD_RULE_REFERENCE_SCHEMA = {
  type: 'object',
  required: ['rule_code', 'rule_name', 'rule_category', 'confidence_level', 'trigger_matched'],
  properties: {
    rule_code: { type: 'string' },
    rule_name: { type: 'string' },
    rule_category: { type: 'string', enum: ['traffic_flow', 'product_placement', 'visual_merchandising', 'customer_psychology'] },
    confidence_level: { type: 'number', minimum: 0, maximum: 1 },
    evidence_source: { type: 'string' },
    trigger_matched: { type: 'boolean' },
    expected_effect: {
      type: 'object',
      properties: {
        metric: { type: 'string' },
        change_percent: { type: 'number' },
      },
    },
  },
} as const;

/** DataEvidence JSON Schema */
export const DATA_EVIDENCE_SCHEMA = {
  type: 'object',
  required: ['metric_name', 'current_value', 'comparison_type', 'comparison_value', 'gap_percent', 'data_source'],
  properties: {
    metric_name: { type: 'string' },
    current_value: { type: 'number' },
    comparison_type: { type: 'string', enum: ['benchmark', 'historical', 'peer', 'target'] },
    comparison_value: { type: 'number' },
    gap_percent: { type: 'number' },
    data_source: { type: 'string' },
    sample_size: { type: 'integer' },
    statistical_significance: { type: 'number' },
  },
} as const;

/** StructuredReasoning JSON Schema */
export const STRUCTURED_REASONING_SCHEMA = {
  type: 'object',
  required: ['summary', 'vmd_rules', 'data_evidence'],
  properties: {
    summary: { type: 'string', description: '한 줄 요약 (200자 이내)' },
    vmd_rules: { type: 'array', items: VMD_RULE_REFERENCE_SCHEMA },
    data_evidence: { type: 'array', items: DATA_EVIDENCE_SCHEMA },
    causal_chain: {
      type: 'array',
      items: {
        type: 'object',
        required: ['step', 'factor', 'contribution', 'explanation'],
        properties: {
          step: { type: 'integer' },
          factor: { type: 'string' },
          contribution: { type: 'number', minimum: 0, maximum: 1 },
          explanation: { type: 'string' },
        },
      },
    },
    calculation: {
      type: 'object',
      properties: {
        formula: { type: 'string' },
        inputs: { type: 'object' },
        output: { type: 'number' },
        confidence_interval: { type: 'array', items: { type: 'number' }, minItems: 2, maxItems: 2 },
        model_used: { type: 'string', enum: ['rule_based', 'statistical', 'ml_prediction', 'hybrid'] },
      },
    },
  },
} as const;

/** ImplementationGuide JSON Schema */
export const IMPLEMENTATION_GUIDE_SCHEMA = {
  type: 'object',
  required: ['difficulty', 'estimated_time_minutes'],
  properties: {
    difficulty: { type: 'string', enum: ['easy', 'medium', 'hard'] },
    estimated_time_minutes: { type: 'integer', minimum: 1 },
    required_staff: { type: 'integer', minimum: 1 },
    prerequisites: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          is_met: { type: 'boolean' },
          action_if_not_met: { type: 'string' },
        },
      },
    },
    step_by_step: { type: 'array', items: { type: 'string' } },
    risks: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          risk: { type: 'string' },
          likelihood: { type: 'string', enum: ['low', 'medium', 'high'] },
          impact: { type: 'string', enum: ['low', 'medium', 'high'] },
          mitigation: { type: 'string' },
        },
      },
    },
    rollback_plan: { type: 'string' },
    best_execution_time: { type: 'string' },
  },
} as const;

/** ValidationPlan JSON Schema */
export const VALIDATION_PLAN_SCHEMA = {
  type: 'object',
  required: ['success_criteria', 'measurement_method'],
  properties: {
    success_criteria: {
      type: 'array',
      items: {
        type: 'object',
        required: ['metric', 'target_value', 'timeframe_days'],
        properties: {
          metric: { type: 'string' },
          baseline_value: { type: 'number' },
          target_value: { type: 'number' },
          timeframe_days: { type: 'integer', minimum: 1 },
          minimum_threshold: { type: 'number' },
        },
      },
    },
    measurement_method: { type: 'string' },
    check_frequency: { type: 'string', enum: ['daily', 'weekly', 'monthly'] },
    requires_ab_test: { type: 'boolean' },
    data_collection: { type: 'string' },
  },
} as const;

/** FurnitureChangeV2 JSON Schema */
export const FURNITURE_CHANGE_V2_SCHEMA = {
  type: 'object',
  required: ['furniture_id', 'furniture_type', 'current', 'suggested', 'priority', 'reasoning', 'expected_impact', 'implementation', 'validation'],
  properties: {
    furniture_id: { type: 'string' },
    furniture_type: { type: 'string' },
    furniture_name: { type: 'string' },
    movable: { type: 'boolean' },
    current: {
      type: 'object',
      required: ['zone_id', 'position', 'rotation'],
      properties: {
        zone_id: { type: 'string' },
        zone_name: { type: 'string' },
        position: { type: 'object', required: ['x', 'y', 'z'], properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } },
        rotation: { type: 'object', required: ['x', 'y', 'z'], properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } },
      },
    },
    suggested: {
      type: 'object',
      required: ['zone_id', 'position', 'rotation'],
      properties: {
        zone_id: { type: 'string' },
        zone_name: { type: 'string' },
        position: { type: 'object', required: ['x', 'y', 'z'], properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } },
        rotation: { type: 'object', required: ['x', 'y', 'z'], properties: { x: { type: 'number' }, y: { type: 'number' }, z: { type: 'number' } } },
      },
    },
    priority: { type: 'string', enum: ['high', 'medium', 'low'] },
    reasoning: STRUCTURED_REASONING_SCHEMA,
    expected_impact: {
      type: 'object',
      required: ['primary_metric', 'confidence'],
      properties: {
        primary_metric: {
          type: 'object',
          required: ['name', 'current', 'predicted', 'change_percent'],
          properties: {
            name: { type: 'string' },
            current: { type: 'number' },
            predicted: { type: 'number' },
            change_percent: { type: 'number' },
          },
        },
        secondary_metrics: {
          type: 'array',
          items: {
            type: 'object',
            properties: { name: { type: 'string' }, change_percent: { type: 'number' } },
          },
        },
        confidence: CONFIDENCE_BREAKDOWN_SCHEMA,
      },
    },
    implementation: IMPLEMENTATION_GUIDE_SCHEMA,
    validation: VALIDATION_PLAN_SCHEMA,
    risk_level: { type: 'string', enum: ['low', 'medium', 'high'] },
  },
} as const;

/** LayoutOptimizationResponseV2 JSON Schema */
export const LAYOUT_OPTIMIZATION_V2_JSON_SCHEMA = {
  type: 'object',
  required: ['schema_version', 'reasoning_summary', 'analysis_context', 'furniture_changes', 'product_changes', 'summary', 'vmd_rules_applied', '_meta'],
  additionalProperties: false,
  properties: {
    schema_version: { type: 'string', const: '2.0.0' },
    reasoning_summary: { type: 'string', description: '핵심 최적화 전략 요약 (500자 이내)' },
    analysis_context: {
      type: 'object',
      required: ['store_id', 'analysis_date', 'data_period', 'baseline_metrics'],
      properties: {
        store_id: { type: 'string' },
        store_name: { type: 'string' },
        analysis_date: { type: 'string' },
        data_period: {
          type: 'object',
          properties: { start: { type: 'string' }, end: { type: 'string' } },
        },
        baseline_metrics: {
          type: 'object',
          properties: {
            daily_traffic: { type: 'number' },
            conversion_rate: { type: 'number' },
            avg_transaction_value: { type: 'number' },
            avg_dwell_time_seconds: { type: 'number' },
          },
        },
      },
    },
    furniture_changes: { type: 'array', items: FURNITURE_CHANGE_V2_SCHEMA },
    product_changes: { type: 'array' },  // ProductChangeV2 스키마는 유사하게 적용
    summary: {
      type: 'object',
      required: ['total_furniture_changes', 'total_product_changes', 'expected_improvements', 'overall_confidence', 'key_strategies', 'ai_insights', 'implementation_summary'],
      properties: {
        total_furniture_changes: { type: 'integer' },
        total_product_changes: { type: 'integer' },
        expected_improvements: {
          type: 'object',
          properties: {
            revenue: { type: 'object', properties: { percent: { type: 'number' }, absolute: { type: 'number' } } },
            traffic: { type: 'object', properties: { percent: { type: 'number' }, absolute: { type: 'number' } } },
            conversion: { type: 'object', properties: { percent: { type: 'number' }, absolute: { type: 'number' } } },
            dwell_time: { type: 'object', properties: { percent: { type: 'number' }, absolute: { type: 'number' } } },
          },
        },
        overall_confidence: CONFIDENCE_BREAKDOWN_SCHEMA,
        key_strategies: { type: 'array', items: { type: 'string' }, maxItems: 3 },
        ai_insights: { type: 'array', items: { type: 'string' }, minItems: 3, maxItems: 5 },
        implementation_summary: {
          type: 'object',
          properties: {
            total_estimated_time_minutes: { type: 'integer' },
            required_staff: { type: 'integer' },
            priority_order: { type: 'array', items: { type: 'string' } },
            best_execution_window: { type: 'string' },
          },
        },
      },
    },
    vmd_rules_applied: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          rule_code: { type: 'string' },
          rule_name: { type: 'string' },
          times_applied: { type: 'integer' },
          affected_items: { type: 'array', items: { type: 'string' } },
        },
      },
    },
    _meta: {
      type: 'object',
      properties: {
        version: { type: 'string' },
        generated_at: { type: 'string' },
        generator: { type: 'string' },
        request_id: { type: 'string' },
        processing_time_ms: { type: 'number' },
        fallback_used: { type: 'boolean' },
        function_calls_made: { type: 'integer' },
      },
    },
  },
} as const;

// ============================================================================
// Export
// ============================================================================

export default {
  // 버전
  SCHEMA_VERSION,

  // V1 스키마 (하위 호환성)
  LAYOUT_OPTIMIZATION_JSON_SCHEMA,
  SIMULATION_JSON_SCHEMA,

  // V2 스키마
  LAYOUT_OPTIMIZATION_V2_JSON_SCHEMA,
  CONFIDENCE_BREAKDOWN_SCHEMA,
  STRUCTURED_REASONING_SCHEMA,
  VMD_RULE_REFERENCE_SCHEMA,
  DATA_EVIDENCE_SCHEMA,
  IMPLEMENTATION_GUIDE_SCHEMA,
  VALIDATION_PLAN_SCHEMA,
  FURNITURE_CHANGE_V2_SCHEMA,

  // 타입 가드
  isLayoutOptimizationResponse,
  isLayoutOptimizationResponseV2,
  isSimulationResponse,
  isStaffOptimizationResponse,
  isConfidenceBreakdown,
  isStructuredReasoning,

  // 헬퍼 함수
  getConfidenceGrade,
  calculateConfidenceScore,
  migrateToV2FurnitureChange,
  createEmptyConfidenceBreakdown,
  createDefaultImplementationGuide,
  createDefaultValidationPlan,

  // 기본값
  DEFAULT_CONFIDENCE_WEIGHTS,
};
