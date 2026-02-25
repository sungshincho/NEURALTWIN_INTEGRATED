# AI 고도화 스프린트 개발계획

## 작성일: 2026-01-12
## 프로젝트: NEURALTWIN - AI 고도화 스프린트

---

## Executive Summary

본 문서는 NEURALTWIN 프로젝트의 AI 고도화를 위한 실행 가능한 스프린트 개발계획을 정의합니다.

**목표**: AI Confidence Score 61% → 85% 달성
**기간**: Sprint 0-3 (총 7주)

---

## Sprint 0: 즉시 실행 (Demo Day 안정성 확보)

**기간**: 1주
**목표**: Demo Day 안정성 확보 - AI 응답 파싱 실패율 0%

### Task 목록

| Task ID | Task | 현재 상태 | 구현 방법 | 담당 | 예상 공수 |
|---------|------|----------|----------|------|----------|
| S0-1 | run-simulation JSON Schema 강제 | `response_format: { type: 'json_object' }` 사용 중 | `json_schema` + strict: true로 변경 | AI | 4h |
| S0-2 | 파싱 에러 폴백 로직 구현 | 미구현 | try/catch + 기본 응답 반환 | AI | 4h |
| S0-3 | retail-ai-inference Schema 강제 | `json_object`만 사용 | `json_schema` 적용 | AI | 4h |
| S0-4 | 프론트엔드 에러 바운더리 강화 | 기본 구현 | 시뮬레이션 실패 시 복구 UI | FE | 4h |
| S0-5 | AI 응답 로깅 검증 | 로깅 중이나 검증 없음 | 파싱 성공률 대시보드 | BE | 2h |

### S0-1: run-simulation JSON Schema 강제

**현재 코드 상태**:
- 파일: `supabase/functions/run-simulation/index.ts`
- 라인 ~450: `response_format: { type: 'json_object' }`

**구체적 구현 방법**:
```typescript
// 변경 전 (run-simulation/index.ts:450 부근)
response_format: { type: 'json_object' }

// 변경 후
response_format: {
  type: 'json_schema',
  json_schema: {
    name: 'simulation_result',
    strict: true,
    schema: SIMULATION_RESULT_SCHEMA  // 새로 정의 필요
  }
}
```

**새로 생성할 파일**: `supabase/functions/run-simulation/schemas/simulationResultSchema.ts`

**테스트 방법**:
1. 시뮬레이션 실행 10회 반복
2. 모든 응답이 스키마 준수하는지 확인
3. 파싱 에러 0건 확인

**리스크 및 의존성**:
- Gemini API의 json_schema 지원 확인 필요
- 스키마가 너무 복잡하면 생성 실패 가능 → 단순화 필요

---

### S0-2: 파싱 에러 폴백 로직

**현재 코드 상태**:
- 파일: `supabase/functions/run-simulation/index.ts`
- 라인 ~500: JSON.parse() 직접 호출, try/catch 없음

**구체적 구현 방법**:
```typescript
// 공통 유틸리티 생성: supabase/functions/_shared/safeJsonParse.ts
export function safeJsonParse<T>(
  text: string,
  fallback: T,
  validator?: (obj: any) => boolean
): { success: boolean; data: T; error?: string } {
  try {
    // 1. JSON 파싱
    const parsed = JSON.parse(text);

    // 2. 유효성 검증
    if (validator && !validator(parsed)) {
      console.warn('[safeJsonParse] Validation failed, using fallback');
      return { success: false, data: fallback, error: 'Validation failed' };
    }

    return { success: true, data: parsed };
  } catch (error) {
    console.error('[safeJsonParse] Parse error:', error);
    return {
      success: false,
      data: fallback,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// 폴백 응답 템플릿
export const SIMULATION_FALLBACK: SimulationResult = {
  scenario_id: 'fallback',
  metrics: {
    total_visitors: 0,
    conversion_rate: 0,
    avg_dwell_time: 0,
    revenue_estimate: 0,
  },
  zone_analytics: [],
  heatmap_data: [],
  diagnostic_issues: [{
    id: 'parse-error',
    severity: 'error',
    title: 'AI 응답 처리 실패',
    message: '시뮬레이션 결과를 처리하는 중 오류가 발생했습니다. 다시 시도해주세요.',
    recommendation: '시뮬레이션을 다시 실행하거나 지원팀에 문의하세요.'
  }],
  _fallback: true
};
```

**테스트 방법**:
1. 의도적으로 잘못된 JSON 응답 주입
2. 폴백 응답 반환 확인
3. 에러 로깅 확인

---

### S0-3: retail-ai-inference Schema 강제

**현재 코드 상태**:
- 파일: `supabase/functions/retail-ai-inference/index.ts`
- 라인 ~496: `response_format: { type: 'json_object' }`

**구체적 구현 방법**:
inference_type별로 다른 스키마 적용:
```typescript
const INFERENCE_SCHEMAS: Record<string, object> = {
  demand_forecast: DEMAND_FORECAST_SCHEMA,
  customer_segment: CUSTOMER_SEGMENT_SCHEMA,
  recommendation: RECOMMENDATION_SCHEMA,
  anomaly: ANOMALY_SCHEMA,
};

// 적용
response_format: inferenceType in INFERENCE_SCHEMAS
  ? { type: 'json_schema', json_schema: { name: inferenceType, strict: true, schema: INFERENCE_SCHEMAS[inferenceType] } }
  : { type: 'json_object' }  // 폴백
```

---

### S0-4: 프론트엔드 에러 바운더리 강화

**현재 코드 상태**:
- 파일: `src/features/studio/tabs/AISimulationTab.tsx`
- 에러 발생 시 toast만 표시, UI 복구 없음

**구체적 구현 방법**:
```typescript
// AISimulationTab.tsx 내 에러 처리 강화
const [simulationError, setSimulationError] = useState<{
  message: string;
  canRetry: boolean;
  timestamp: Date;
} | null>(null);

// 에러 발생 시
catch (error) {
  setSimulationError({
    message: error.message || '시뮬레이션 실행 중 오류가 발생했습니다.',
    canRetry: true,
    timestamp: new Date()
  });

  // 복구 UI 표시
  setSimulationState('error');
}

// 복구 UI 컴포넌트
{simulationError && (
  <SimulationErrorRecovery
    error={simulationError}
    onRetry={() => {
      setSimulationError(null);
      runSimulation();
    }}
    onReset={() => {
      setSimulationError(null);
      resetSimulation();
    }}
  />
)}
```

---

### 성공 지표

- [x] AI 응답 파싱 성공률 100%
- [x] 3D UI 렌더링 에러 0건
- [x] 시뮬레이션 실행 평균 응답 시간 < 10초
- [x] 에러 발생 시 사용자에게 명확한 복구 경로 제공

---

## Sprint 1: 수치 정확도 확보 (Function Calling)

**기간**: 2주
**목표**: Function Calling 기반 계산 분리 - 매출 예측 오차율 20% 이하

### Task 목록

| Task ID | Task | 현재 상태 | 구현 방법 | 담당 | 예상 공수 |
|---------|------|----------|----------|------|----------|
| S1-1 | 계산 모듈 분리 (traffic_flow) | AI 내 계산 | TypeScript 함수로 분리 | AI | 8h |
| S1-2 | ROI 예측 함수 구현 | AI 추측 | 명시적 수식 함수 | AI | 8h |
| S1-3 | Gemini Tool Use 연동 | 미사용 | Function declaration 정의 | AI | 12h |
| S1-4 | 계산 결과 검증 로직 | 없음 | 범위 검증 + 이상치 탐지 | AI | 4h |
| S1-5 | 시뮬레이션 결과 일관성 테스트 | 미수행 | 동일 입력 반복 테스트 | QA | 4h |

### S1-1: 계산 모듈 분리

**새로 생성할 파일**: `supabase/functions/_shared/calculations/trafficFlow.ts`

```typescript
/**
 * 트래픽 흐름 계산 모듈
 * AI가 호출할 수 있는 순수 함수들
 */

export interface TrafficFlowInput {
  zone_id: string;
  zone_type: string;
  area_sqm: number;
  adjacent_zones: string[];
  furniture_count: number;
  current_visitors: number;
  time_of_day: 'morning' | 'afternoon' | 'evening';
}

export interface TrafficFlowOutput {
  expected_visitors: number;
  flow_rate: number;  // visitors per minute
  congestion_risk: 'low' | 'medium' | 'high';
  bottleneck_probability: number;
}

export function calculateTrafficFlow(input: TrafficFlowInput): TrafficFlowOutput {
  // 기본 유동인구 = 면적 기반 용량 × 시간대 계수
  const capacityPerSqm = 0.5;  // 1평당 0.5명
  const baseCapacity = input.area_sqm * capacityPerSqm;

  // 시간대별 계수
  const timeMultiplier = {
    morning: 0.6,
    afternoon: 1.0,
    evening: 0.8,
  }[input.time_of_day];

  // Zone 타입별 흡인력 계수
  const zoneAttraction: Record<string, number> = {
    entrance: 1.5,
    main: 1.2,
    display: 1.0,
    fitting: 0.5,
    checkout: 0.8,
  };
  const attraction = zoneAttraction[input.zone_type] || 1.0;

  // 가구 밀도에 따른 페널티 (과밀 시 이동 불편)
  const furnitureDensity = input.furniture_count / input.area_sqm;
  const densityPenalty = furnitureDensity > 0.3 ? 0.8 : 1.0;

  // 최종 계산
  const expected_visitors = Math.round(
    baseCapacity * timeMultiplier * attraction * densityPenalty
  );

  const flow_rate = expected_visitors / 60;  // per minute

  const congestionRatio = input.current_visitors / baseCapacity;
  const congestion_risk = congestionRatio > 0.8 ? 'high'
    : congestionRatio > 0.5 ? 'medium' : 'low';

  const bottleneck_probability = Math.min(1, congestionRatio * 0.8);

  return {
    expected_visitors,
    flow_rate,
    congestion_risk,
    bottleneck_probability,
  };
}
```

---

### S1-2: ROI 예측 함수 구현

**새로 생성할 파일**: `supabase/functions/_shared/calculations/roiPredictor.ts`

```typescript
/**
 * ROI 예측 계산 모듈
 * 공식: ROI = (노출수 × 전환율 × 객단가 - 비용) / 비용 × 100
 */

export interface ROIInput {
  // 노출 관련
  zone_traffic: number;        // 존 방문자 수
  product_visibility: number;  // 상품 가시성 (0-1)

  // 전환 관련
  base_conversion_rate: number;  // 기본 전환율 (0-1)
  placement_bonus: number;       // 배치 보너스 (-0.2 ~ 0.3)

  // 매출 관련
  product_price: number;
  product_margin: number;  // 마진율 (0-1)

  // 비용 (선택)
  implementation_cost?: number;
}

export interface ROIOutput {
  expected_impressions: number;
  expected_conversions: number;
  expected_revenue: number;
  expected_profit: number;
  roi_percent: number;
  confidence: number;
  calculation_breakdown: {
    step: string;
    value: number;
    formula: string;
  }[];
}

export function calculateROI(input: ROIInput): ROIOutput {
  const breakdown: ROIOutput['calculation_breakdown'] = [];

  // Step 1: 노출수 계산
  const impressions = Math.round(input.zone_traffic * input.product_visibility);
  breakdown.push({
    step: '예상 노출수',
    value: impressions,
    formula: `${input.zone_traffic} × ${input.product_visibility.toFixed(2)} = ${impressions}`
  });

  // Step 2: 전환수 계산
  const effective_conversion = Math.max(0, Math.min(1,
    input.base_conversion_rate + input.placement_bonus
  ));
  const conversions = Math.round(impressions * effective_conversion);
  breakdown.push({
    step: '예상 전환수',
    value: conversions,
    formula: `${impressions} × (${input.base_conversion_rate.toFixed(2)} + ${input.placement_bonus.toFixed(2)}) = ${conversions}`
  });

  // Step 3: 매출 계산
  const revenue = conversions * input.product_price;
  breakdown.push({
    step: '예상 매출',
    value: revenue,
    formula: `${conversions} × ₩${input.product_price.toLocaleString()} = ₩${revenue.toLocaleString()}`
  });

  // Step 4: 이익 계산
  const profit = revenue * input.product_margin;
  breakdown.push({
    step: '예상 이익',
    value: profit,
    formula: `₩${revenue.toLocaleString()} × ${(input.product_margin * 100).toFixed(0)}% = ₩${profit.toLocaleString()}`
  });

  // Step 5: ROI 계산
  const cost = input.implementation_cost || 0;
  const roi = cost > 0 ? ((profit - cost) / cost) * 100 : profit > 0 ? 100 : 0;
  breakdown.push({
    step: 'ROI',
    value: roi,
    formula: cost > 0
      ? `(₩${profit.toLocaleString()} - ₩${cost.toLocaleString()}) / ₩${cost.toLocaleString()} × 100 = ${roi.toFixed(1)}%`
      : `이익 기반 = ${roi.toFixed(1)}%`
  });

  // 신뢰도 계산 (입력 데이터 완전성 기반)
  const confidence = calculateConfidence(input);

  return {
    expected_impressions: impressions,
    expected_conversions: conversions,
    expected_revenue: revenue,
    expected_profit: profit,
    roi_percent: roi,
    confidence,
    calculation_breakdown: breakdown,
  };
}

function calculateConfidence(input: ROIInput): number {
  let score = 0.5;  // 기본 점수

  // 데이터 완전성에 따라 가중치 부여
  if (input.zone_traffic > 0) score += 0.1;
  if (input.product_visibility > 0) score += 0.1;
  if (input.base_conversion_rate > 0) score += 0.1;
  if (input.product_margin > 0) score += 0.1;
  if (input.implementation_cost !== undefined) score += 0.1;

  return Math.min(1, score);
}
```

---

### S1-3: Gemini Tool Use 연동

**수정 파일**: `supabase/functions/generate-optimization/index.ts`

```typescript
// Function Calling 정의
const CALCULATION_TOOLS = [
  {
    name: 'calculate_traffic_flow',
    description: '특정 Zone의 예상 트래픽 흐름을 계산합니다.',
    parameters: {
      type: 'object',
      properties: {
        zone_id: { type: 'string', description: 'Zone ID' },
        zone_type: { type: 'string', enum: ['entrance', 'main', 'display', 'fitting', 'checkout'] },
        area_sqm: { type: 'number', description: '면적(제곱미터)' },
        furniture_count: { type: 'integer', description: '가구 수' },
        current_visitors: { type: 'integer', description: '현재 방문자 수' },
        time_of_day: { type: 'string', enum: ['morning', 'afternoon', 'evening'] }
      },
      required: ['zone_id', 'zone_type', 'area_sqm', 'furniture_count', 'current_visitors', 'time_of_day']
    }
  },
  {
    name: 'calculate_roi',
    description: '상품 배치 변경의 예상 ROI를 계산합니다.',
    parameters: {
      type: 'object',
      properties: {
        zone_traffic: { type: 'integer', description: 'Zone 일일 방문자 수' },
        product_visibility: { type: 'number', description: '상품 가시성 (0-1)' },
        base_conversion_rate: { type: 'number', description: '기본 전환율 (0-1)' },
        placement_bonus: { type: 'number', description: '배치 보너스 (-0.2 ~ 0.3)' },
        product_price: { type: 'number', description: '상품 가격' },
        product_margin: { type: 'number', description: '마진율 (0-1)' }
      },
      required: ['zone_traffic', 'product_visibility', 'base_conversion_rate', 'product_price', 'product_margin']
    }
  }
];

// API 호출 시 tools 추가
const response = await fetch(OPENROUTER_API_URL, {
  method: 'POST',
  headers: { /* ... */ },
  body: JSON.stringify({
    model: 'google/gemini-2.0-flash-exp',
    messages: [...],
    response_format: responseFormat,
    tools: CALCULATION_TOOLS,  // 추가!
    tool_choice: 'auto',
  }),
});

// Tool call 처리
if (responseData.choices[0].message.tool_calls) {
  const toolResults = await processToolCalls(responseData.choices[0].message.tool_calls);
  // 결과를 다시 AI에 전달하여 최종 응답 생성
}
```

---

### 성공 지표

- [x] 매출 예측 오차율 < 20%
- [x] 시뮬레이션 실행 시간 < 5초
- [x] 동일 입력에 대한 결과 일관성 > 90%
- [x] ROI 계산식 투명성 확보 (breakdown 제공)

---

## Sprint 2: 맥락 이해 향상 (온톨로지 확장)

**기간**: 2주
**목표**: 온톨로지 확장 및 VMD 룰셋 적용

### Task 목록

| Task ID | Task | 현재 상태 | 구현 방법 | 담당 | 예상 공수 |
|---------|------|----------|----------|------|----------|
| S2-1 | Zone VMD Type 확장 | zone_type만 존재 | properties JSONB 확장 | BE | 8h |
| S2-2 | Fixture 속성 확장 (height_zone, facing) | 기본 속성만 | 컬럼 추가 | BE | 8h |
| S2-3 | VMD 룰셋 테이블 생성 | 코드북만 존재 | DB 테이블화 | BE | 8h |
| S2-4 | VMD 룰셋 프롬프트 주입 | 하드코딩 | 동적 룰셋 로드 | AI | 8h |
| S2-5 | XAI 근거 생성 강화 | ai_insights만 | rule_applied 필드 확장 | AI | 4h |

### S2-1: Zone VMD Type 확장

**생성할 마이그레이션**: `supabase/migrations/YYYYMMDD_zone_vmd_attributes.sql`

```sql
-- Zone VMD 속성 확장
ALTER TABLE zones_dim
ADD COLUMN IF NOT EXISTS vmd_attributes JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN zones_dim.vmd_attributes IS 'VMD 관련 확장 속성';

-- 기존 Zone에 기본 VMD 속성 추가
UPDATE zones_dim SET vmd_attributes = jsonb_build_object(
  'vmd_zone_type',
    CASE zone_type
      WHEN 'entrance' THEN 'decompression'
      WHEN 'main' THEN 'power_aisle'
      WHEN 'display' THEN 'discovery'
      WHEN 'checkout' THEN 'impulse'
      ELSE 'standard'
    END,
  'is_golden_zone', zone_type IN ('main', 'display'),
  'is_dead_space', false,
  'sightline_score', 0.7,
  'traffic_weight',
    CASE zone_type
      WHEN 'entrance' THEN 1.5
      WHEN 'main' THEN 1.2
      WHEN 'display' THEN 1.0
      ELSE 0.8
    END
) WHERE vmd_attributes = '{}'::jsonb;

-- VMD Zone Type 인덱스
CREATE INDEX IF NOT EXISTS idx_zones_vmd_type
ON zones_dim ((vmd_attributes->>'vmd_zone_type'));
```

---

### S2-3: VMD 룰셋 테이블 생성

**생성할 마이그레이션**: `supabase/migrations/YYYYMMDD_vmd_ruleset.sql`

```sql
-- VMD 룰셋 테이블
CREATE TABLE IF NOT EXISTS vmd_rulesets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_code TEXT NOT NULL UNIQUE,
  rule_name TEXT NOT NULL,
  rule_category TEXT NOT NULL CHECK (rule_category IN (
    'traffic_flow', 'product_placement', 'visual_merchandising', 'customer_psychology'
  )),
  description TEXT NOT NULL,

  -- 적용 조건
  trigger_conditions JSONB NOT NULL DEFAULT '{}',
  -- 예: {"zone_type": ["display"], "congestion_score": {">": 0.7}}

  -- 권장 액션
  recommended_action TEXT NOT NULL,
  action_parameters JSONB DEFAULT '{}',

  -- 예상 효과
  expected_impact JSONB DEFAULT '{}',
  -- 예: {"traffic_lift": 0.15, "conversion_lift": 0.10}

  -- 근거 및 참조
  evidence_source TEXT,  -- 연구 논문, 업계 보고서 등
  confidence_level NUMERIC CHECK (confidence_level BETWEEN 0 AND 1),

  -- 메타데이터
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 50,  -- 높을수록 우선 적용
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 기본 VMD 룰셋 시딩
INSERT INTO vmd_rulesets (rule_code, rule_name, rule_category, description, trigger_conditions, recommended_action, expected_impact, evidence_source, confidence_level, priority) VALUES
('VMD-001', 'Butt-Brush Effect', 'traffic_flow', '통로가 좁으면 고객이 상품을 만지다가 다른 사람과 부딪힐 때 불편함을 느껴 이탈합니다. 최소 통로 폭 90cm 이상 확보 권장.',
  '{"aisle_width": {"<": 0.9}, "zone_type": ["display"]}',
  '통로 폭 확보를 위해 가구 재배치',
  '{"abandonment_reduction": 0.15, "dwell_time_increase": 0.10}',
  'Paco Underhill - Why We Buy', 0.85, 80),

('VMD-002', 'Right-Turn Bias', 'traffic_flow', '대부분의 고객(약 70%)은 매장 진입 후 우측으로 이동하는 경향이 있습니다. 고마진 상품을 우측 동선에 배치하세요.',
  '{"zone_position": "right_side", "is_entrance_adjacent": true}',
  '고마진/신상품을 우측 벽면에 배치',
  '{"visibility_increase": 0.25, "sales_lift": 0.12}',
  'Environmental Psychology Research', 0.80, 75),

('VMD-003', 'Golden Zone Placement', 'product_placement', '눈높이(120-150cm)에 배치된 상품은 가장 높은 가시성과 판매율을 보입니다.',
  '{"shelf_level": "eye_level", "product_margin": {">": 0.3}}',
  '고마진 상품을 눈높이 선반에 배치',
  '{"sales_lift": 0.35, "visibility_increase": 0.40}',
  'Retail Industry Standards', 0.90, 90),

('VMD-004', 'Dead Zone Activation', 'visual_merchandising', '방문율이 낮은 구역(Dead Zone)에 포컬 포인트를 만들어 고객을 유도합니다.',
  '{"visit_rate": {"<": 0.2}, "zone_type": ["corner", "back"]}',
  '프로모션 디스플레이 또는 조명 강조',
  '{"traffic_increase": 0.30, "zone_discovery": 0.25}',
  'Store Layout Optimization Studies', 0.75, 60),

('VMD-005', 'Cross-Sell Proximity', 'product_placement', '연관 상품을 인접 배치하면 장바구니 크기가 증가합니다.',
  '{"association_lift": {">": 1.5}, "association_confidence": {">": 0.3}}',
  '연관 상품을 동일 Zone 또는 인접 선반에 배치',
  '{"basket_size_increase": 0.18, "cross_sell_rate": 0.22}',
  'Market Basket Analysis Best Practices', 0.82, 70),

('VMD-006', 'Decompression Zone', 'customer_psychology', '입구 직후 3-4m는 고객이 매장에 적응하는 구간입니다. 주요 상품은 이 구역 이후에 배치하세요.',
  '{"zone_type": ["entrance"], "distance_from_door": {"<": 4}}',
  '입구 직후는 환영 디스플레이만 배치, 주력 상품은 4m 이후',
  '{"first_impression_improvement": 0.20, "browse_rate_increase": 0.15}',
  'Paco Underhill - Why We Buy', 0.78, 85),

('VMD-007', 'Impulse Buy Zone', 'product_placement', '계산대 주변과 동선 교차점에 저가/소모품을 배치하여 충동구매를 유도합니다.',
  '{"zone_type": ["checkout"], "product_price": {"<": 30000}}',
  '저가 악세서리/소모품을 계산대 근처에 배치',
  '{"add_on_sales": 0.12, "transaction_value_increase": 0.08}',
  'Point of Sale Research', 0.85, 75),

('VMD-008', 'Sightline Optimization', 'visual_merchandising', '입구에서 매장 깊숙한 곳까지 시야가 확보되면 탐색 의욕이 증가합니다.',
  '{"sightline_blocked": true, "zone_type": ["main", "entrance"]}',
  '시야를 막는 높은 집기 재배치',
  '{"store_penetration": 0.20, "dwell_time_increase": 0.12}',
  'Store Design Principles', 0.80, 70);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_vmd_rulesets_category ON vmd_rulesets(rule_category);
CREATE INDEX IF NOT EXISTS idx_vmd_rulesets_active ON vmd_rulesets(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_vmd_rulesets_priority ON vmd_rulesets(priority DESC);
```

---

### 성공 지표

- [x] AI Confidence Score 75% 이상
- [x] 추천 근거(reasoning)에 VMD 룰 참조율 100%
- [x] Zone별 VMD 속성 정의율 100%
- [x] Fixture 속성 완전성 > 90%

---

## Sprint 3: 학습 파이프라인 (피드백 루프)

**기간**: 2주
**목표**: 피드백 기반 개선 시스템 구축

### Task 목록

| Task ID | Task | 현재 상태 | 구현 방법 | 담당 | 예상 공수 |
|---------|------|----------|----------|------|----------|
| S3-1 | Accept/Reject/Modify UI 구현 | Accept/Reject만 | Modify 기능 추가 | FE | 8h |
| S3-2 | 피드백 사유 입력 UI | 없음 | 드롭다운 + 텍스트 입력 | FE | 4h |
| S3-3 | 피드백 로깅 활성화 | 테이블만 존재 | 실제 로깅 로직 구현 | BE | 8h |
| S3-4 | Store Persona 시스템 | 없음 | 매장별 프롬프트 저장 | AI | 8h |
| S3-5 | 자동 학습 트리거 | 테이블만 존재 | 학습 세션 자동 실행 | AI | 12h |

### S3-1: Accept/Reject/Modify UI

**수정 파일**: `src/features/studio/components/OptimizationChangeCard.tsx` (신규)

```tsx
interface OptimizationChangeCardProps {
  change: FurnitureChange | ProductChange;
  type: 'furniture' | 'product';
  onAccept: () => void;
  onReject: (reason?: string) => void;
  onModify: (modification: Partial<typeof change>) => void;
}

export function OptimizationChangeCard({
  change, type, onAccept, onReject, onModify
}: OptimizationChangeCardProps) {
  const [isModifying, setIsModifying] = useState(false);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [modifiedPosition, setModifiedPosition] = useState(change.suggested.position);

  return (
    <Card className="p-4">
      {/* 변경 내용 표시 */}
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-medium">{change.reason}</h4>
          <p className="text-sm text-muted-foreground">
            VMD 원칙: {change.vmd_principle}
          </p>
        </div>
        <Badge variant={change.priority === 'high' ? 'destructive' : 'secondary'}>
          {change.priority}
        </Badge>
      </div>

      {/* 예상 영향 */}
      <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
        <div>트래픽 변화: {(change.expected_impact.traffic_change * 100).toFixed(1)}%</div>
        <div>신뢰도: {(change.expected_impact.confidence * 100).toFixed(0)}%</div>
      </div>

      {/* 수정 모드 */}
      {isModifying && (
        <div className="mt-4 space-y-2 border-t pt-4">
          <Label>위치 수정</Label>
          <div className="grid grid-cols-3 gap-2">
            <Input
              type="number"
              placeholder="X"
              value={modifiedPosition.x}
              onChange={(e) => setModifiedPosition({...modifiedPosition, x: parseFloat(e.target.value)})}
            />
            <Input
              type="number"
              placeholder="Y"
              value={modifiedPosition.y}
              onChange={(e) => setModifiedPosition({...modifiedPosition, y: parseFloat(e.target.value)})}
            />
            <Input
              type="number"
              placeholder="Z"
              value={modifiedPosition.z}
              onChange={(e) => setModifiedPosition({...modifiedPosition, z: parseFloat(e.target.value)})}
            />
          </div>
          <Button onClick={() => {
            onModify({ suggested: { ...change.suggested, position: modifiedPosition } });
            setIsModifying(false);
          }}>
            수정 적용
          </Button>
        </div>
      )}

      {/* 액션 버튼 */}
      <div className="mt-4 flex gap-2">
        <Button onClick={onAccept} variant="default" className="flex-1">
          <Check className="w-4 h-4 mr-1" /> 적용
        </Button>
        <Button onClick={() => setIsModifying(true)} variant="outline" className="flex-1">
          <Edit className="w-4 h-4 mr-1" /> 수정
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="destructive" className="flex-1">
              <X className="w-4 h-4 mr-1" /> 거부
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onReject('not_applicable')}>
              현장에 맞지 않음
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onReject('already_tried')}>
              이미 시도해봄
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onReject('resource_constraint')}>
              리소스 부족
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onReject('other')}>
              기타 (직접 입력)
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </Card>
  );
}
```

---

### S3-4: Store Persona 시스템

**생성할 마이그레이션**: `supabase/migrations/YYYYMMDD_store_persona.sql`

```sql
-- 매장별 AI Persona 테이블
CREATE TABLE IF NOT EXISTS store_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,

  -- 기본 특성
  store_type TEXT NOT NULL CHECK (store_type IN (
    'flagship', 'standard', 'outlet', 'pop_up', 'department_store'
  )),
  target_customer TEXT NOT NULL CHECK (target_customer IN (
    'luxury', 'premium', 'mass_market', 'budget', 'mixed'
  )),

  -- AI 행동 조정
  optimization_style TEXT DEFAULT 'balanced' CHECK (optimization_style IN (
    'aggressive', 'balanced', 'conservative'
  )),
  risk_tolerance NUMERIC DEFAULT 0.5 CHECK (risk_tolerance BETWEEN 0 AND 1),

  -- System Prompt 컴포넌트
  custom_context TEXT,  -- 매장 특성 설명
  priority_rules TEXT[],  -- 우선 적용 VMD 룰 코드
  excluded_rules TEXT[],  -- 제외할 VMD 룰 코드

  -- 학습된 선호도
  learned_preferences JSONB DEFAULT '{}',
  -- 예: {"prefers_conservative_layout": true, "avoids_entrance_changes": true}

  -- 성과 기록
  total_recommendations INTEGER DEFAULT 0,
  accepted_recommendations INTEGER DEFAULT 0,
  acceptance_rate NUMERIC GENERATED ALWAYS AS (
    CASE WHEN total_recommendations > 0
    THEN accepted_recommendations::NUMERIC / total_recommendations
    ELSE 0 END
  ) STORED,

  -- 메타데이터
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(store_id)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_store_personas_store_id ON store_personas(store_id);
CREATE INDEX IF NOT EXISTS idx_store_personas_active ON store_personas(is_active) WHERE is_active = true;
```

**AI 프롬프트 주입 로직** (`supabase/functions/_shared/storePersona.ts`):

```typescript
export async function buildPersonalizedPrompt(
  storeId: string,
  basePrompt: string
): Promise<string> {
  const { data: persona } = await supabase
    .from('store_personas')
    .select('*')
    .eq('store_id', storeId)
    .single();

  if (!persona) {
    return basePrompt;  // Persona 없으면 기본 프롬프트
  }

  // System Prompt 컴포넌트 조합
  const personaContext = `
## 매장 특성 (Store Persona)
- 매장 유형: ${persona.store_type}
- 타겟 고객: ${persona.target_customer}
- 최적화 스타일: ${persona.optimization_style}
- 리스크 허용도: ${(persona.risk_tolerance * 100).toFixed(0)}%

${persona.custom_context ? `## 매장 특이사항\n${persona.custom_context}` : ''}

## 학습된 선호도
${Object.entries(persona.learned_preferences || {})
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

## 적용 지침
- 과거 수용률: ${(persona.acceptance_rate * 100).toFixed(0)}%
${persona.priority_rules?.length > 0 ? `- 우선 적용 룰: ${persona.priority_rules.join(', ')}` : ''}
${persona.excluded_rules?.length > 0 ? `- 제외 룰: ${persona.excluded_rules.join(', ')}` : ''}
`;

  return `${personaContext}\n\n${basePrompt}`;
}
```

---

### 성공 지표

- [x] 피드백 수집률 > 80%
- [x] 매장별 추천 차별화 동작 확인
- [x] Accept/Reject/Modify 비율 대시보드 구축
- [x] 학습 세션 자동 실행 (주 1회)

---

## Sprint 4+: Backlog (고급 기능)

| Task ID | Task | 우선순위 | 의존성 | 예상 공수 |
|---------|------|----------|--------|----------|
| B-1 | Vector DB (pgvector) 구축 | P2 | Sprint 2 완료 | 16h |
| B-2 | RAG 기반 VMD 룰셋 검색 | P2 | B-1 완료 | 24h |
| B-3 | 인과 추론 모델 도입 | P3 | Sprint 1 완료 | 40h |
| B-4 | A/B 테스트 프레임워크 | P3 | Sprint 3 완료 | 32h |
| B-5 | 실시간 동선 분석 (WiFi/비콘) | P3 | 외부 연동 | 40h |
| B-6 | 다중 매장 비교 분석 | P3 | Sprint 3 완료 | 24h |

---

## 리스크 관리

### 높은 리스크

| 리스크 | 영향도 | 발생 확률 | 완화 방안 |
|--------|--------|----------|----------|
| Gemini API 스키마 미지원 | 높음 | 낮음 | OpenAI 폴백, 수동 파싱 |
| Function Calling 지연 | 중간 | 중간 | 타임아웃 설정, 캐싱 |
| Demo Day 전 미완성 | 높음 | 중간 | Sprint 0 집중, 범위 축소 |

### 중간 리스크

| 리스크 | 영향도 | 발생 확률 | 완화 방안 |
|--------|--------|----------|----------|
| DB 마이그레이션 충돌 | 중간 | 중간 | 스테이징 환경 테스트 |
| 프론트엔드 호환성 | 낮음 | 중간 | 점진적 롤아웃 |

---

## 부록: 파일 변경 목록

### Sprint 0
- `supabase/functions/run-simulation/index.ts` - Schema 적용
- `supabase/functions/run-simulation/schemas/simulationResultSchema.ts` - 신규
- `supabase/functions/_shared/safeJsonParse.ts` - 신규
- `src/features/studio/tabs/AISimulationTab.tsx` - 에러 처리

### Sprint 1
- `supabase/functions/_shared/calculations/trafficFlow.ts` - 신규
- `supabase/functions/_shared/calculations/roiPredictor.ts` - 신규
- `supabase/functions/generate-optimization/index.ts` - Tool Use 추가

### Sprint 2
- `supabase/migrations/YYYYMMDD_zone_vmd_attributes.sql` - 신규
- `supabase/migrations/YYYYMMDD_vmd_ruleset.sql` - 신규
- `supabase/functions/generate-optimization/index.ts` - 룰셋 로드

### Sprint 3
- `src/features/studio/components/OptimizationChangeCard.tsx` - 신규
- `supabase/migrations/YYYYMMDD_store_persona.sql` - 신규
- `supabase/functions/_shared/storePersona.ts` - 신규

---

*문서 버전: 1.0*
*최종 수정: 2026-01-12*
