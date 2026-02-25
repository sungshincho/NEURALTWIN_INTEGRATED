# Confidence Score 향상 로드맵

## 작성일: 2026-01-12
## 프로젝트: NEURALTWIN - AI 고도화 스프린트

---

## 목표

**현재 Confidence Score: ~61%**
**목표 Confidence Score: 85%**

---

## 1. 현재 Confidence Score 구성 분석

### 1.1 측정 위치

Confidence Score는 `generate-optimization` Edge Function의 응답에서 `summary.confidence_score`로 반환됩니다.

**파일**: `supabase/functions/generate-optimization/index.ts`
**스키마**: `supabase/functions/generate-optimization/schemas/retailOptimizationSchema.ts`

### 1.2 현재 계산 방식

현재 Confidence Score는 **AI 모델이 자체적으로 추정**하며, 명시적인 계산 로직이 없습니다.

```typescript
// 현재 상태: AI가 프롬프트 기반으로 자체 추정
summary: {
  confidence_score: 0.61,  // AI가 생성한 값
  // ...
}
```

### 1.3 현재 점수 분해

관측된 Confidence Score (~61%)의 추정 구성:

| 구성 요소 | 기여도 | 현재 상태 | 개선 가능성 |
|----------|--------|----------|------------|
| AI 모델 자체 신뢰도 | 25% | 높음 (0.75-0.85) | 제한적 |
| 데이터 완전성 | 15% | 중간 (0.50-0.60) | **높음** |
| VMD 룰셋 적용 | 10% | 낮음 (0.40-0.50) | **높음** |
| 계산 정확도 | 8% | 낮음 (AI 추측) | **높음** |
| 피드백 학습 | 3% | 없음 | **높음** |
| **합계** | **61%** | - | +24% 가능 |

---

## 2. Confidence Score 향상 로드맵

### Phase 1: 데이터 완전성 향상 (Sprint 0-2)

**현재**: 15% → **목표**: 25%

| 개선 항목 | 현재 상태 | 목표 상태 | 기여도 증가 | Sprint |
|----------|----------|----------|------------|--------|
| Zone VMD 속성 | 미정의 | 전체 Zone에 정의 | +3% | Sprint 2 |
| Fixture height_zone | 미정의 | 전체 Slot에 정의 | +2% | Sprint 2 |
| Product margin_rate | 미정의 | 전체 Product에 정의 | +2% | Sprint 2 |
| Cross-sell 관계 | 미정의 | 주요 상품 정의 | +3% | Sprint 2 |

**구현 방법**:

```sql
-- Zone VMD 속성 완전성 체크
SELECT
  COUNT(*) as total_zones,
  COUNT(CASE WHEN vmd_attributes IS NOT NULL AND vmd_attributes != '{}'::jsonb THEN 1 END) as zones_with_vmd,
  ROUND(100.0 * COUNT(CASE WHEN vmd_attributes IS NOT NULL AND vmd_attributes != '{}'::jsonb THEN 1 END) / COUNT(*), 2) as completeness_percent
FROM zones_dim;

-- 목표: 100% 완전성
```

**Confidence 기여도 계산**:
```typescript
function calculateDataCompletenessScore(context: StoreContext): number {
  const scores = {
    zones_vmd: context.zones.filter(z => z.vmd_attributes).length / context.zones.length,
    slots_height: context.slots.filter(s => s.height_zone).length / context.slots.length,
    products_margin: context.products.filter(p => p.margin_rate).length / context.products.length,
    products_crosssell: context.products.filter(p => p.cross_sell_product_ids?.length > 0).length / context.products.length,
  };

  // 가중 평균
  return (
    scores.zones_vmd * 0.3 +
    scores.slots_height * 0.2 +
    scores.products_margin * 0.3 +
    scores.products_crosssell * 0.2
  );
}
```

---

### Phase 2: VMD 룰셋 적용 (Sprint 2)

**현재**: 10% → **목표**: 20%

| 개선 항목 | 현재 상태 | 목표 상태 | 기여도 증가 | Sprint |
|----------|----------|----------|------------|--------|
| 룰셋 DB화 | 코드북만 | DB 테이블 | +3% | Sprint 2 |
| 룰셋 매칭 | 수동 | 자동 조건 매칭 | +4% | Sprint 2 |
| 근거 참조 | 없음 | rule_code 참조 | +3% | Sprint 2 |

**구현 방법**:

```typescript
function calculateRulesetApplicationScore(
  recommendations: Recommendation[],
  appliedRules: string[]
): number {
  // 1. 적용된 룰셋 비율
  const ruleApplicationRate = appliedRules.length / recommendations.length;

  // 2. 룰셋의 평균 confidence
  const avgRuleConfidence = await getAverageRuleConfidence(appliedRules);

  // 3. 근거 완전성
  const evidenceCompleteness = recommendations.filter(r => r.rule_applied).length / recommendations.length;

  return (
    ruleApplicationRate * 0.4 +
    avgRuleConfidence * 0.3 +
    evidenceCompleteness * 0.3
  );
}
```

---

### Phase 3: Function Calling 기반 계산 (Sprint 1)

**현재**: 8% → **목표**: 18%

| 개선 항목 | 현재 상태 | 목표 상태 | 기여도 증가 | Sprint |
|----------|----------|----------|------------|--------|
| 트래픽 계산 | AI 추측 | 명시적 수식 | +4% | Sprint 1 |
| ROI 계산 | AI 추측 | 명시적 수식 | +4% | Sprint 1 |
| 전환율 예측 | AI 추측 | 데이터 기반 | +2% | Sprint 1 |

**구현 방법**:

```typescript
function calculateComputationConfidence(result: OptimizationResult): number {
  const scores = {
    // Function Calling 사용 여부
    function_calling_used: result._meta?.function_calls_count > 0 ? 1.0 : 0.3,

    // 계산 breakdown 존재 여부
    has_calculation_breakdown: result.summary.calculation_breakdown ? 1.0 : 0.5,

    // 값 범위 유효성
    values_in_range: validateValueRanges(result) ? 1.0 : 0.6,
  };

  return (
    scores.function_calling_used * 0.4 +
    scores.has_calculation_breakdown * 0.3 +
    scores.values_in_range * 0.3
  );
}
```

---

### Phase 4: 피드백 학습 (Sprint 3)

**현재**: 3% → **목표**: 12%

| 개선 항목 | 현재 상태 | 목표 상태 | 기여도 증가 | Sprint |
|----------|----------|----------|------------|--------|
| Accept 비율 추적 | 없음 | Store별 추적 | +3% | Sprint 3 |
| 선호도 학습 | 없음 | Store Persona 반영 | +3% | Sprint 3 |
| 실제 성과 비교 | 없음 | 예측 vs 실제 추적 | +3% | Sprint 3 |

**구현 방법**:

```typescript
async function calculateFeedbackLearningScore(storeId: string): Promise<number> {
  const persona = await getStorePersona(storeId);

  if (!persona) return 0.3;  // Persona 없으면 기본값

  const scores = {
    // 과거 수용률 반영
    acceptance_rate: persona.acceptance_rate || 0.5,

    // 학습된 선호도 존재
    has_learned_preferences: Object.keys(persona.learned_preferences || {}).length > 0 ? 1.0 : 0.3,

    // 피드백 샘플 크기
    feedback_sample_size: Math.min(1, persona.total_recommendations / 50),
  };

  return (
    scores.acceptance_rate * 0.4 +
    scores.has_learned_preferences * 0.3 +
    scores.feedback_sample_size * 0.3
  );
}
```

---

## 3. 통합 Confidence Score 계산 로직

### 3.1 제안된 계산 공식

```typescript
// supabase/functions/_shared/confidenceCalculator.ts

export interface ConfidenceComponents {
  data_completeness: number;      // 0-1
  ruleset_application: number;    // 0-1
  computation_accuracy: number;   // 0-1
  feedback_learning: number;      // 0-1
  model_confidence: number;       // AI 자체 신뢰도 (0-1)
}

export interface ConfidenceResult {
  overall_score: number;          // 0-1
  components: ConfidenceComponents;
  improvement_suggestions: string[];
}

const WEIGHTS = {
  data_completeness: 0.25,        // 25%
  ruleset_application: 0.20,      // 20%
  computation_accuracy: 0.20,     // 20%
  feedback_learning: 0.15,        // 15%
  model_confidence: 0.20,         // 20%
};

export async function calculateConfidenceScore(
  storeId: string,
  context: StoreContext,
  result: OptimizationResult,
  modelConfidence: number
): Promise<ConfidenceResult> {
  const components: ConfidenceComponents = {
    data_completeness: calculateDataCompletenessScore(context),
    ruleset_application: calculateRulesetApplicationScore(result.recommendations, result.applied_rules),
    computation_accuracy: calculateComputationConfidence(result),
    feedback_learning: await calculateFeedbackLearningScore(storeId),
    model_confidence: modelConfidence,
  };

  // 가중 합계
  const overall_score =
    components.data_completeness * WEIGHTS.data_completeness +
    components.ruleset_application * WEIGHTS.ruleset_application +
    components.computation_accuracy * WEIGHTS.computation_accuracy +
    components.feedback_learning * WEIGHTS.feedback_learning +
    components.model_confidence * WEIGHTS.model_confidence;

  // 개선 제안 생성
  const improvement_suggestions = generateImprovementSuggestions(components);

  return {
    overall_score: Math.round(overall_score * 100) / 100,  // 소수점 2자리
    components,
    improvement_suggestions,
  };
}

function generateImprovementSuggestions(components: ConfidenceComponents): string[] {
  const suggestions: string[] = [];

  if (components.data_completeness < 0.7) {
    suggestions.push('Zone VMD 속성 및 Product 마진율 데이터를 보완하세요.');
  }
  if (components.ruleset_application < 0.6) {
    suggestions.push('VMD 룰셋 매칭 조건을 확인하세요.');
  }
  if (components.computation_accuracy < 0.6) {
    suggestions.push('Function Calling 기반 계산을 활성화하세요.');
  }
  if (components.feedback_learning < 0.5) {
    suggestions.push('더 많은 피드백을 수집하여 학습 품질을 높이세요.');
  }

  return suggestions;
}
```

---

## 4. Sprint별 목표 Confidence Score

```
┌───────────────────────────────────────────────────────────────────────┐
│                    Confidence Score 향상 로드맵                        │
├─────────────┬─────────────┬─────────────┬─────────────┬──────────────┤
│   현재      │  Sprint 0   │  Sprint 1   │  Sprint 2   │  Sprint 3    │
│   61%       │   65%       │   72%       │   78%       │   85%        │
├─────────────┴─────────────┴─────────────┴─────────────┴──────────────┤
│                                                                       │
│  61% ────▶ 65% ────▶ 72% ────▶ 78% ────▶ 85%                         │
│       +4%       +7%       +6%       +7%                               │
│                                                                       │
│  주요 개선:                                                           │
│  - Sprint 0: 파싱 안정화, 에러 처리                                   │
│  - Sprint 1: Function Calling, ROI 계산                               │
│  - Sprint 2: 온톨로지 확장, VMD 룰셋                                  │
│  - Sprint 3: 피드백 학습, Store Persona                               │
│                                                                       │
└───────────────────────────────────────────────────────────────────────┘
```

---

## 5. 측정 및 모니터링

### 5.1 측정 대시보드 쿼리

```sql
-- 일별 Confidence Score 추이
SELECT
  DATE(created_at) as date,
  function_name,
  AVG((result->>'summary'->>'confidence_score')::NUMERIC) as avg_confidence,
  MIN((result->>'summary'->>'confidence_score')::NUMERIC) as min_confidence,
  MAX((result->>'summary'->>'confidence_score')::NUMERIC) as max_confidence,
  COUNT(*) as call_count
FROM ai_response_logs
WHERE function_name IN ('generate-optimization', 'run-simulation')
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at), function_name
ORDER BY date DESC;

-- Confidence Score 구성 요소별 분포
SELECT
  CASE
    WHEN confidence < 0.5 THEN '0-50%'
    WHEN confidence < 0.6 THEN '50-60%'
    WHEN confidence < 0.7 THEN '60-70%'
    WHEN confidence < 0.8 THEN '70-80%'
    ELSE '80%+'
  END as confidence_bucket,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM (
  SELECT (result->'summary'->>'confidence_score')::NUMERIC as confidence
  FROM ai_response_logs
  WHERE function_name = 'generate-optimization'
    AND created_at >= NOW() - INTERVAL '7 days'
) sub
GROUP BY 1
ORDER BY 1;
```

### 5.2 알림 조건

```typescript
// Confidence Score 알림 임계값
const ALERT_THRESHOLDS = {
  critical: 0.50,  // 50% 미만: 즉시 조치 필요
  warning: 0.65,   // 65% 미만: 주의 필요
  target: 0.85,    // 85%: 목표 달성
};

// 일별 평균이 임계값 미달 시 알림
if (dailyAverageConfidence < ALERT_THRESHOLDS.critical) {
  alert('CRITICAL: AI Confidence Score가 50% 미만입니다. 즉시 확인 필요.');
}
```

---

## 6. 성공 지표 (KPI)

| KPI | 현재 값 | Sprint 0 | Sprint 1 | Sprint 2 | Sprint 3 |
|-----|--------|----------|----------|----------|----------|
| 평균 Confidence Score | 61% | 65% | 72% | 78% | **85%** |
| 파싱 성공률 | 85% | **100%** | 100% | 100% | 100% |
| 데이터 완전성 | 50% | 55% | 60% | **90%** | 95% |
| VMD 룰 참조율 | 30% | 35% | 50% | **100%** | 100% |
| Function Call 사용률 | 0% | 0% | **80%** | 90% | 95% |
| 피드백 수집률 | 10% | 15% | 30% | 50% | **80%** |

---

## 7. 리스크 및 완화 방안

### 높은 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| 데이터 완전성 미달 | Confidence 목표 미달 | Sprint 2 전 데이터 보완 우선 |
| Function Calling 지연 | 계산 정확도 저하 | 캐싱 + 타임아웃 설정 |

### 중간 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|----------|
| 피드백 수집률 저조 | 학습 품질 저하 | UI/UX 개선, 인센티브 |
| VMD 룰셋 매칭 오류 | 잘못된 근거 제시 | 테스트 케이스 확보 |

---

## 부록: Confidence Score 검증 테스트

```typescript
// __tests__/confidenceCalculator.test.ts

describe('ConfidenceCalculator', () => {
  it('should return 85%+ with complete data', async () => {
    const result = await calculateConfidenceScore(
      'store-001',
      completeContext,      // 모든 데이터 100% 완전
      goodResult,           // Function Calling 사용
      0.85                  // AI 자체 신뢰도 85%
    );

    expect(result.overall_score).toBeGreaterThanOrEqual(0.85);
  });

  it('should return ~61% with current state', async () => {
    const result = await calculateConfidenceScore(
      'store-001',
      currentContext,       // 현재 데이터 상태
      currentResult,        // Function Calling 미사용
      0.75                  // AI 자체 신뢰도 75%
    );

    expect(result.overall_score).toBeCloseTo(0.61, 1);
  });

  it('should generate improvement suggestions', async () => {
    const result = await calculateConfidenceScore(
      'store-001',
      incompleteContext,
      result,
      0.70
    );

    expect(result.improvement_suggestions.length).toBeGreaterThan(0);
    expect(result.improvement_suggestions).toContain(
      expect.stringContaining('VMD 속성')
    );
  });
});
```

---

*문서 버전: 1.0*
*최종 수정: 2026-01-12*
