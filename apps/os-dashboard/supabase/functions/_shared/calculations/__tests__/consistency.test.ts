/**
 * consistency.test.ts
 *
 * 시뮬레이션 결과 일관성 테스트
 * 동일 입력에 대한 결과의 재현성과 일관성을 검증
 *
 * Sprint 1 Task: S1-5
 * 작성일: 2026-01-12
 *
 * 실행 방법:
 * deno test --allow-read supabase/functions/_shared/calculations/__tests__/consistency.test.ts
 */

import {
  assertEquals,
  assertAlmostEquals,
  assert,
} from 'https://deno.land/std@0.208.0/assert/mod.ts';

import {
  calculateTrafficFlow,
  type TrafficFlowInput,
  type TrafficFlowOutput,
} from '../trafficFlow.ts';

import {
  calculateROI,
  type ROIInput,
  type ROIOutput,
} from '../roiPredictor.ts';

import {
  validateTrafficFlowOutput,
  validateROIOutput,
  checkResultConsistency,
  checkMultiFieldConsistency,
  detectOutliers,
  type ConsistencyResult,
} from '../validation.ts';

// ============================================================================
// 테스트 데이터
// ============================================================================

const SAMPLE_TRAFFIC_INPUT: TrafficFlowInput = {
  zone_id: 'zone-test-001',
  zone_type: 'display',
  area_sqm: 25,
  adjacent_zones: ['zone-002', 'zone-003'],
  furniture_count: 4,
  current_visitors: 8,
  time_of_day: 'afternoon',
  day_of_week: 'saturday',
};

const SAMPLE_ROI_INPUT: ROIInput = {
  zone_traffic: 500,
  product_visibility: 0.7,
  position_bonus: 0.2,
  base_conversion_rate: 0.03,
  placement_bonus: 0.02,
  product_price: 45000,
  product_margin: 0.4,
  avg_purchase_quantity: 1,
};

// ============================================================================
// 트래픽 흐름 계산 일관성 테스트
// ============================================================================

Deno.test('TrafficFlow: 동일 입력에 대해 동일 결과 반환', () => {
  const results: TrafficFlowOutput[] = [];

  // 동일 입력으로 10회 실행
  for (let i = 0; i < 10; i++) {
    results.push(calculateTrafficFlow(SAMPLE_TRAFFIC_INPUT));
  }

  // 모든 결과가 동일해야 함 (결정론적 함수)
  const firstResult = results[0];
  for (let i = 1; i < results.length; i++) {
    assertEquals(results[i].expected_visitors, firstResult.expected_visitors);
    assertEquals(results[i].flow_rate, firstResult.flow_rate);
    assertEquals(results[i].congestion_risk, firstResult.congestion_risk);
    assertEquals(results[i].bottleneck_probability, firstResult.bottleneck_probability);
    assertEquals(results[i].density_index, firstResult.density_index);
  }
});

Deno.test('TrafficFlow: 결과 변동 계수 0% (결정론적)', () => {
  const results: number[] = [];

  for (let i = 0; i < 10; i++) {
    const result = calculateTrafficFlow(SAMPLE_TRAFFIC_INPUT);
    results.push(result.expected_visitors);
  }

  const consistency = checkResultConsistency(results);

  assertEquals(consistency.coefficient_of_variation, 0);
  assert(consistency.consistent);
});

Deno.test('TrafficFlow: 입력 변화에 따른 비례적 출력 변화', () => {
  // 면적 2배 → 방문자 수 증가
  const baseResult = calculateTrafficFlow(SAMPLE_TRAFFIC_INPUT);
  const doubleAreaResult = calculateTrafficFlow({
    ...SAMPLE_TRAFFIC_INPUT,
    area_sqm: SAMPLE_TRAFFIC_INPUT.area_sqm * 2,
  });

  assert(
    doubleAreaResult.expected_visitors > baseResult.expected_visitors,
    '면적 증가 시 방문자 수 증가해야 함'
  );
});

Deno.test('TrafficFlow: 시간대별 결과 차이', () => {
  const morningResult = calculateTrafficFlow({
    ...SAMPLE_TRAFFIC_INPUT,
    time_of_day: 'morning',
  });

  const afternoonResult = calculateTrafficFlow({
    ...SAMPLE_TRAFFIC_INPUT,
    time_of_day: 'afternoon',
  });

  const nightResult = calculateTrafficFlow({
    ...SAMPLE_TRAFFIC_INPUT,
    time_of_day: 'night',
  });

  // 오후 > 오전 > 야간 순서
  assert(
    afternoonResult.expected_visitors > morningResult.expected_visitors,
    '오후가 오전보다 방문자 많아야 함'
  );
  assert(
    morningResult.expected_visitors > nightResult.expected_visitors,
    '오전이 야간보다 방문자 많아야 함'
  );
});

Deno.test('TrafficFlow: 검증 통과', () => {
  const result = calculateTrafficFlow(SAMPLE_TRAFFIC_INPUT);
  const validation = validateTrafficFlowOutput(result);

  assert(validation.valid, `검증 실패: ${validation.errors.map(e => e.message).join(', ')}`);
  assert(validation.confidence >= 0.5, '신뢰도가 50% 이상이어야 함');
});

Deno.test('TrafficFlow: 경계 조건 테스트 - 최소 면적', () => {
  const result = calculateTrafficFlow({
    ...SAMPLE_TRAFFIC_INPUT,
    area_sqm: 1, // 최소 면적
    furniture_count: 0,
    current_visitors: 0,
  });

  const validation = validateTrafficFlowOutput(result);
  assert(validation.valid);
  assert(result.expected_visitors >= 0);
});

Deno.test('TrafficFlow: 경계 조건 테스트 - 높은 혼잡도', () => {
  const result = calculateTrafficFlow({
    ...SAMPLE_TRAFFIC_INPUT,
    area_sqm: 10,
    current_visitors: 20, // 높은 밀도
  });

  assert(
    result.congestion_risk === 'high' || result.congestion_risk === 'critical',
    '높은 밀도에서는 혼잡 위험이 높아야 함'
  );
  assert(result.density_index > 0.5, '밀도 지수가 높아야 함');
});

// ============================================================================
// ROI 계산 일관성 테스트
// ============================================================================

Deno.test('ROI: 동일 입력에 대해 동일 결과 반환', () => {
  const results: ROIOutput[] = [];

  for (let i = 0; i < 10; i++) {
    results.push(calculateROI(SAMPLE_ROI_INPUT));
  }

  const firstResult = results[0];
  for (let i = 1; i < results.length; i++) {
    assertEquals(results[i].expected_impressions, firstResult.expected_impressions);
    assertEquals(results[i].expected_conversions, firstResult.expected_conversions);
    assertEquals(results[i].expected_revenue, firstResult.expected_revenue);
    assertEquals(results[i].expected_profit, firstResult.expected_profit);
    assertEquals(results[i].roi_percent, firstResult.roi_percent);
  }
});

Deno.test('ROI: 결과 변동 계수 0% (결정론적)', () => {
  const results: number[] = [];

  for (let i = 0; i < 10; i++) {
    const result = calculateROI(SAMPLE_ROI_INPUT);
    results.push(result.roi_percent);
  }

  const consistency = checkResultConsistency(results);

  assertEquals(consistency.coefficient_of_variation, 0);
  assert(consistency.consistent);
});

Deno.test('ROI: 입력 변화에 따른 비례적 출력 변화', () => {
  // 트래픽 2배 → 노출수, 전환수, 매출 증가
  const baseResult = calculateROI(SAMPLE_ROI_INPUT);
  const doubleTrafficResult = calculateROI({
    ...SAMPLE_ROI_INPUT,
    zone_traffic: SAMPLE_ROI_INPUT.zone_traffic * 2,
  });

  assert(
    doubleTrafficResult.expected_impressions > baseResult.expected_impressions,
    '트래픽 증가 시 노출수 증가해야 함'
  );
  assert(
    doubleTrafficResult.expected_conversions > baseResult.expected_conversions,
    '트래픽 증가 시 전환수 증가해야 함'
  );
});

Deno.test('ROI: 전환수 <= 노출수 관계 유지', () => {
  const result = calculateROI(SAMPLE_ROI_INPUT);

  assert(
    result.expected_conversions <= result.expected_impressions,
    '전환수는 노출수를 초과할 수 없음'
  );
});

Deno.test('ROI: 이익 <= 매출 관계 유지', () => {
  const result = calculateROI(SAMPLE_ROI_INPUT);

  assert(
    result.expected_profit <= result.expected_revenue,
    '이익은 매출을 초과할 수 없음'
  );
});

Deno.test('ROI: 검증 통과', () => {
  const result = calculateROI(SAMPLE_ROI_INPUT);
  const validation = validateROIOutput(result);

  assert(validation.valid, `검증 실패: ${validation.errors.map(e => e.message).join(', ')}`);
  assert(validation.confidence >= 0.5, '신뢰도가 50% 이상이어야 함');
});

Deno.test('ROI: 배치 보너스에 따른 ROI 변화', () => {
  const negativeBonus = calculateROI({
    ...SAMPLE_ROI_INPUT,
    placement_bonus: -0.1,
  });

  const positiveBonus = calculateROI({
    ...SAMPLE_ROI_INPUT,
    placement_bonus: 0.3,
  });

  assert(
    positiveBonus.roi_percent > negativeBonus.roi_percent,
    '양수 배치 보너스가 ROI를 높여야 함'
  );
});

Deno.test('ROI: 구현 비용에 따른 ROI 변화', () => {
  const noCost = calculateROI(SAMPLE_ROI_INPUT);
  const withCost = calculateROI({
    ...SAMPLE_ROI_INPUT,
    implementation_cost: 100000,
  });

  // 비용이 있으면 ROI 계산 방식이 달라짐
  // 월간 이익 기준으로 계산됨
  assert(
    typeof withCost.roi_percent === 'number' && !isNaN(withCost.roi_percent),
    '비용이 있어도 ROI가 유효해야 함'
  );
});

// ============================================================================
// 다중 필드 일관성 테스트
// ============================================================================

Deno.test('TrafficFlow: 다중 필드 일관성', () => {
  const results: TrafficFlowOutput[] = [];

  for (let i = 0; i < 10; i++) {
    results.push(calculateTrafficFlow(SAMPLE_TRAFFIC_INPUT));
  }

  const numericResults = results.map(r => ({
    expected_visitors: r.expected_visitors,
    flow_rate: r.flow_rate,
    bottleneck_probability: r.bottleneck_probability,
    density_index: r.density_index,
    confidence: r.confidence,
  }));

  const consistency = checkMultiFieldConsistency(
    numericResults,
    ['expected_visitors', 'flow_rate', 'bottleneck_probability', 'density_index', 'confidence']
  );

  // 모든 필드가 일관성 있어야 함
  for (const [field, result] of Object.entries(consistency)) {
    assert(result.consistent, `필드 ${field}가 일관성 없음`);
    assertEquals(result.coefficient_of_variation, 0, `필드 ${field}의 변동 계수가 0이어야 함`);
  }
});

Deno.test('ROI: 다중 필드 일관성', () => {
  const results: ROIOutput[] = [];

  for (let i = 0; i < 10; i++) {
    results.push(calculateROI(SAMPLE_ROI_INPUT));
  }

  const numericResults = results.map(r => ({
    expected_impressions: r.expected_impressions,
    expected_conversions: r.expected_conversions,
    expected_revenue: r.expected_revenue,
    expected_profit: r.expected_profit,
    roi_percent: r.roi_percent,
  }));

  const consistency = checkMultiFieldConsistency(
    numericResults,
    ['expected_impressions', 'expected_conversions', 'expected_revenue', 'expected_profit', 'roi_percent']
  );

  for (const [field, result] of Object.entries(consistency)) {
    assert(result.consistent, `필드 ${field}가 일관성 없음`);
    assertEquals(result.coefficient_of_variation, 0, `필드 ${field}의 변동 계수가 0이어야 함`);
  }
});

// ============================================================================
// 이상치 탐지 테스트
// ============================================================================

Deno.test('이상치 탐지: 정상 데이터에서 이상치 없음', () => {
  const normalData = [10, 11, 12, 9, 10, 11, 10, 12, 9, 11];
  const result = detectOutliers(normalData);

  assertEquals(result.outliers.length, 0, '정상 데이터에서 이상치 없어야 함');
});

Deno.test('이상치 탐지: 명확한 이상치 탐지', () => {
  const dataWithOutlier = [10, 11, 12, 9, 10, 100, 10, 12, 9, 11]; // 100은 이상치
  const result = detectOutliers(dataWithOutlier);

  assert(result.outliers.includes(100), '100이 이상치로 탐지되어야 함');
});

Deno.test('이상치 탐지: 음수 이상치 탐지', () => {
  const dataWithOutlier = [10, 11, 12, 9, 10, -50, 10, 12, 9, 11]; // -50은 이상치
  const result = detectOutliers(dataWithOutlier);

  assert(result.outliers.includes(-50), '-50이 이상치로 탐지되어야 함');
});

// ============================================================================
// 계산 정확도 테스트
// ============================================================================

Deno.test('TrafficFlow: 계산 breakdown 정확성', () => {
  const result = calculateTrafficFlow(SAMPLE_TRAFFIC_INPUT);

  // breakdown이 존재해야 함
  assert(result.calculation_breakdown.length > 0, 'breakdown이 있어야 함');

  // 각 단계가 유효한 값을 가져야 함
  for (const step of result.calculation_breakdown) {
    assert(typeof step.value === 'number', `${step.step}의 값이 숫자여야 함`);
    assert(!isNaN(step.value), `${step.step}의 값이 NaN이면 안 됨`);
    assert(step.formula.length > 0, `${step.step}의 formula가 있어야 함`);
  }
});

Deno.test('ROI: 계산 breakdown 정확성', () => {
  const result = calculateROI(SAMPLE_ROI_INPUT);

  assert(result.calculation_breakdown.length > 0, 'breakdown이 있어야 함');

  for (const step of result.calculation_breakdown) {
    assert(typeof step.value === 'number', `${step.step}의 값이 숫자여야 함`);
    assert(!isNaN(step.value), `${step.step}의 값이 NaN이면 안 됨`);
    assert(step.formula.length > 0, `${step.step}의 formula가 있어야 함`);
  }
});

Deno.test('ROI: recommendation 유효성', () => {
  const result = calculateROI(SAMPLE_ROI_INPUT);

  assert(
    ['strongly_recommend', 'recommend', 'neutral', 'not_recommend', 'strongly_not_recommend']
      .includes(result.recommendation.action),
    'action이 유효한 값이어야 함'
  );

  assert(
    ['critical', 'high', 'medium', 'low'].includes(result.recommendation.priority),
    'priority가 유효한 값이어야 함'
  );

  assert(result.recommendation.reasoning.length > 0, 'reasoning이 있어야 함');
});

// ============================================================================
// 성능 테스트
// ============================================================================

Deno.test('TrafficFlow: 성능 - 1000회 실행 < 100ms', () => {
  const start = performance.now();

  for (let i = 0; i < 1000; i++) {
    calculateTrafficFlow(SAMPLE_TRAFFIC_INPUT);
  }

  const elapsed = performance.now() - start;

  assert(elapsed < 100, `1000회 실행이 100ms 이내여야 함 (실제: ${elapsed.toFixed(2)}ms)`);
});

Deno.test('ROI: 성능 - 1000회 실행 < 100ms', () => {
  const start = performance.now();

  for (let i = 0; i < 1000; i++) {
    calculateROI(SAMPLE_ROI_INPUT);
  }

  const elapsed = performance.now() - start;

  assert(elapsed < 100, `1000회 실행이 100ms 이내여야 함 (실제: ${elapsed.toFixed(2)}ms)`);
});

// ============================================================================
// 엣지 케이스 테스트
// ============================================================================

Deno.test('TrafficFlow: 제로 면적 처리', () => {
  const result = calculateTrafficFlow({
    ...SAMPLE_TRAFFIC_INPUT,
    area_sqm: 0,
  });

  // 0 면적이어도 크래시 없이 처리되어야 함
  assert(typeof result.expected_visitors === 'number');
  assert(!isNaN(result.expected_visitors));
});

Deno.test('ROI: 제로 트래픽 처리', () => {
  const result = calculateROI({
    ...SAMPLE_ROI_INPUT,
    zone_traffic: 0,
  });

  assertEquals(result.expected_impressions, 0);
  assertEquals(result.expected_conversions, 0);
  assertEquals(result.expected_revenue, 0);
});

Deno.test('ROI: 제로 전환율 처리', () => {
  const result = calculateROI({
    ...SAMPLE_ROI_INPUT,
    base_conversion_rate: 0,
    placement_bonus: 0,
  });

  assertEquals(result.expected_conversions, 0);
  assertEquals(result.expected_revenue, 0);
});

Deno.test('TrafficFlow: 인접 Zone 없는 경우', () => {
  const result = calculateTrafficFlow({
    ...SAMPLE_TRAFFIC_INPUT,
    adjacent_zones: [],
  });

  // 인접 Zone 없어도 처리되어야 함
  assert(typeof result.expected_visitors === 'number');
  // 고립된 구역은 방문자가 적어야 함
  const normalResult = calculateTrafficFlow(SAMPLE_TRAFFIC_INPUT);
  assert(result.expected_visitors <= normalResult.expected_visitors);
});

console.log('✅ 모든 일관성 테스트 정의 완료');
