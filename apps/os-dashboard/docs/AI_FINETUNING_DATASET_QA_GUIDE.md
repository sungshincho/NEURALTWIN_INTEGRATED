# AI 파인튜닝 데이터셋 QA 가이드

> 작성일: 2026-01-06
> 버전: 1.2
> 목적: AI 응답 로그 품질 검증 및 파인튜닝 데이터셋 추출
>
> **변경 이력**:
> - v1.2: 자동화된 배치 QA 테스트 시스템 추가 (ai-batch-qa-test)
> - v1.1: user_facing_texts 구조 반영, staffing 최적화 추가, advanced-ai-inference deprecated 표시

---

## 목차

1. [개요](#1-개요)
2. [로깅 시스템 현황](#2-로깅-시스템-현황)
3. [🆕 자동화된 배치 QA 테스트](#3-자동화된-배치-qa-테스트)
4. [데이터 품질 검증](#4-데이터-품질-검증)
5. [좋은 예시 선정 기준](#5-좋은-예시-선정-기준)
6. [데이터셋 추출 방법](#6-데이터셋-추출-방법)
7. [파인튜닝 파이프라인](#7-파인튜닝-파이프라인)
8. [QA 체크리스트](#8-qa-체크리스트)

---

## 1. 개요

### 1.1 목적

AI 시뮬레이션 및 최적화 응답을 수집하여:
- 모델 성능 모니터링
- 파인튜닝 데이터셋 구축
- 품질 개선 피드백 루프 구축

### 1.2 데이터 흐름

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  사용자 요청     │───▶│   AI 모델 추론   │───▶│   응답 로깅      │
│  (시뮬레이션)    │    │  (Gemini 2.5)   │    │ (ai_response_logs)│
└─────────────────┘    └─────────────────┘    └────────┬────────┘
                                                       │
                                                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   모델 학습      │◀───│  JSONL 변환      │◀───│   품질 평가      │
│  (Fine-tuning)  │    │                 │    │ (quality_score) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### 1.3 로깅 대상 Edge Functions

| Function | AI 모델 | 용도 | 로깅 | 상태 |
|----------|---------|------|------|------|
| `run-simulation` | Gemini 2.5 Flash | 매장 시뮬레이션 | ✅ | Active |
| `generate-optimization` | Gemini 2.5 Flash | 레이아웃/상품/인력 최적화 | ✅ | Active |
| `advanced-ai-inference` | Gemini 2.5 Flash/Pro | 고급 AI 추론 | ✅ | ⚠️ Deprecated |

> **참고**: `advanced-ai-inference`는 점진적으로 deprecated 예정입니다.
> - `layout_optimization` → `generate-optimization (both)` 로 마이그레이션
> - `staffing_optimization` → `generate-optimization (staffing)` 로 마이그레이션

### 1.4 시뮬레이션 → 최적화 연결 데이터 흐름

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ AI 시뮬레이션    │───▶│  진단 이슈 감지   │───▶│   AI 최적화     │
│ run-simulation  │    │ diagnostic_issues│    │ generate-optim  │
└────────┬────────┘    └─────────────────┘    └────────┬────────┘
         │                                             │
         ▼                                             ▼
┌─────────────────┐                          ┌─────────────────┐
│ ai_response_logs│                          │ ai_response_logs│
│ (simulation)    │                          │ (optimization)  │
│ + env_context   │                          │ + diag_issues   │
└─────────────────┘                          └─────────────────┘
```

**진단 이슈 컨텍스트 전달 항목:**
- `priority_issues`: 해결해야 할 문제점 목록
- `scenario_context`: 시뮬레이션 프리셋 시나리오
- `environment_context`: 환경 설정 (날씨, 휴일 등)
- `simulation_kpis`: 시뮬레이션 KPI 결과

---

## 2. 로깅 시스템 현황

### 2.1 테이블 스키마

```sql
CREATE TABLE ai_response_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL,
  user_id UUID,

  -- 함수 정보
  function_name TEXT NOT NULL,  -- 'run-simulation', 'generate-optimization', etc.
  simulation_type TEXT,          -- 아래 타입 참조

  -- simulation_type 목록:
  -- run-simulation: 'traffic_flow', 'demand_prediction', 'scenario_*'
  -- generate-optimization: 'furniture', 'product', 'staffing', 'both'
  -- advanced-ai-inference (deprecated): 'layout_optimization', 'flow_simulation', 'congestion'

  -- 입출력 데이터
  input_variables JSONB NOT NULL,   -- 전체 입력 파라미터
  ai_response JSONB NOT NULL,       -- 전체 AI 응답
  response_summary TEXT,            -- 요약 문자열

  -- 품질 평가 (나중에 업데이트)
  quality_score INTEGER,            -- 1-10 점수
  is_good_example BOOLEAN DEFAULT FALSE,
  review_notes TEXT,

  -- 메타데이터
  execution_time_ms INTEGER,
  context_metadata JSONB,

  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2.2 로깅 데이터 구조

#### input_variables 예시

```json
{
  "simulation_options": {
    "duration_minutes": 60,
    "customer_count": 100,
    "time_of_day": "afternoon",
    "simulation_type": "predictive"
  },
  "store_context": {
    "zone_count": 8,
    "furniture_count": 45,
    "transition_count": 120
  },
  "analysis_context": {
    "zone_stats": [...],
    "transition_probabilities": [...],
    "historical_kpis": {...}
  },
  "environment_context": {
    "weather": "rain",
    "temperature": 15,
    "humidity": 80,
    "holiday_type": "none",
    "day_of_week": "friday",
    "time_of_day": "afternoon",
    "impact": {
      "trafficMultiplier": 0.7,
      "dwellTimeMultiplier": 1.25,
      "conversionMultiplier": 1.0
    },
    "preset_scenario": {
      "id": "rainyWeekday",
      "name": "비 오는 평일",
      "traffic_multiplier": 0.7,
      "discount_percent": null,
      "event_type": null,
      "expected_impact": {
        "visitorsMultiplier": 0.7,
        "conversionMultiplier": 1.0,
        "basketMultiplier": 1.05,
        "dwellTimeMultiplier": 1.25
      },
      "risk_tags": ["매출 감소"]
    }
  }
}
```

#### ai_response 예시 (파인튜닝 최적화 구조)

> **변경사항 (v1.1)**: `ai_response`는 이제 `user_facing_texts` 중심으로 저장하여 파인튜닝 데이터 품질을 높입니다.

```json
{
  "user_facing_texts": {
    "ai_insights": [
      "피크 시간대 입구 혼잡이 예상됩니다",
      "상품존 체류시간이 평균보다 낮습니다"
    ],
    "diagnostic_texts": [
      {
        "title": "입구 혼잡 예상",
        "description": "피크 시간대 입구에서 고객 체류가 증가할 것으로 예상됩니다",
        "impact": "매출 손실 5-10% 예상",
        "suggested_action": "입구 레이아웃 조정 또는 인력 배치 강화",
        "severity": "warning"
      }
    ],
    "summary_text": "예상 방문객 120명, 전환율 6.5%, 혼잡도 75%"
  },
  "key_metrics": {
    "predicted_visitors": 120,
    "predicted_conversion_rate": 0.065,
    "predicted_revenue": 3500000,
    "peak_congestion_percent": 75,
    "confidence_score": 78
  },
  "zone_summary": [
    {"zone_name": "입구", "congestion_level": "high", "bottleneck_score": 8.5}
  ],
  "flow_summary": {
    "dead_zones": ["창고 앞 통로"],
    "congestion_points": ["메인 진열대 앞"]
  }
}
```

#### context_metadata 예시

```json
{
  "model_used": "gemini-2.5-flash",
  "zoneCount": 8,
  "issueCount": 3,
  "criticalIssues": 1,
  "weather": "rain",
  "holidayType": "none",
  "presetScenarioId": "rainyWeekday",
  "presetScenarioName": "비 오는 평일",
  "trafficMultiplier": 0.7,
  "hasEnvironmentContext": true,
  "hasPresetScenario": true
}
```

#### diagnostic_issues (generate-optimization 입력) 예시

시뮬레이션에서 최적화로 전달되는 진단 이슈 컨텍스트:

```json
{
  "priority_issues": [
    {
      "id": "issue-1",
      "type": "congestion",
      "severity": "critical",
      "title": "입구 존 혼잡 위험",
      "zone_id": "zone-entrance",
      "zone_name": "입구 존",
      "description": "피크 시간대 입구 혼잡도가 100%를 초과합니다",
      "impact": {
        "revenueImpact": 500000,
        "trafficImpact": 50,
        "conversionImpact": 0.02
      },
      "recommendations": ["입구 확장", "안내 인력 배치"]
    }
  ],
  "scenario_context": {
    "id": "blackFriday",
    "name": "블랙프라이데이",
    "description": "연중 최대 세일 이벤트",
    "risk_tags": ["혼잡 위험", "인력 부족", "병목 위험"]
  },
  "environment_context": {
    "weather": "clear",
    "holiday_type": "blackFriday",
    "time_of_day": "afternoon",
    "traffic_multiplier": 2.5
  },
  "simulation_kpis": {
    "visitors": 250,
    "revenue": 5000000,
    "conversion": 0.08,
    "avg_dwell": 180
  }
}
```

#### response_summary 예시 (run-simulation)

```json
{
  "text": "예상 방문객: 70명 | 예상 전환율: 5.0% | 예상 매출: 2,450,000원 | 발견 이슈: 2개 | 신뢰도: 75%",
  "visitors": 70,
  "conversionRate": 0.05,
  "revenue": 2450000,
  "issueCount": 2,
  "confidence": 75
}
```

---

## 3. 🆕 자동화된 배치 QA 테스트

> **NEW in v1.2**: 프론트엔드 없이 Edge Function만으로 모든 테스트 조합을 자동 실행

### 3.1 개요

`ai-batch-qa-test` Edge Function을 사용하여 AI 시뮬레이션/최적화 함수의 모든 변수 조합을 자동으로 테스트합니다.

```
┌─────────────────────────────────────────────────────────────┐
│                  배치 QA 테스트 시스템                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  [테스트 유형]                                                │
│                                                              │
│   simulation         run-simulation 변수 조합 테스트         │
│   ├─ 7개 프리셋 시나리오 × 고객수/시간대 조합                  │
│   └─ 품질 점수: KPIs, 인사이트, 진단이슈, 존분석               │
│                                                              │
│   optimization       generate-optimization 변수 조합 테스트  │
│   ├─ 4개 최적화 타입 × 파라미터 조합                          │
│   └─ 품질 점수: 변경수, 예상효과, 인사이트                     │
│                                                              │
│   linked             시뮬레이션 → 최적화 연결 테스트          │
│   ├─ 진단 이슈 전달 검증                                      │
│   └─ 시나리오별 최적화 타입 조합                              │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 테스트 실행

#### 기본 실행

```bash
# Store ID 확인
STORE_ID="d9830554-2688-4032-af40-acccda787ac4"

# minimal 모드: 시뮬레이션 테스트 (~7개)
curl -X POST "https://[PROJECT].supabase.co/functions/v1/ai-batch-qa-test" \
  -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "store_id": "'$STORE_ID'",
    "test_type": "simulation",
    "mode": "minimal"
  }'

# minimal 모드: 최적화 테스트 (~4개)
curl -X POST "..." -d '{"store_id": "...", "test_type": "optimization", "mode": "minimal"}'

# minimal 모드: 연결 테스트 (~14개)
curl -X POST "..." -d '{"store_id": "...", "test_type": "linked", "mode": "minimal"}'

# 전체 테스트 (sampled 모드)
curl -X POST "..." -d '{"store_id": "...", "test_type": "all", "mode": "sampled"}'
```

#### 테스트 모드

| 모드 | 시뮬레이션 | 최적화 | 연결 | 예상 시간 |
|------|-----------|-------|------|----------|
| `minimal` | ~7 | ~4 | ~14 | ~2분 |
| `sampled` | ~24 | ~10 | ~35 | ~10분 |
| `full` | ~32 | ~36 | ~56 | ~20분 |

### 3.3 결과 확인

#### 배치 요약 조회

```sql
-- 최신 배치 결과 요약
SELECT * FROM v_batch_test_summary
ORDER BY completed_at DESC
LIMIT 10;

-- 출력 예시:
-- test_batch_id | test_type    | total | success | failure | success_rate | avg_quality
-- ------------- | ------------ | ----- | ------- | ------- | ------------ | -----------
-- abc123...     | simulation   | 7     | 7       | 0       | 100.0        | 78.5
-- abc123...     | optimization | 4     | 4       | 0       | 100.0        | 65.2
-- abc123...     | linked       | 14    | 12      | 2       | 85.7         | 71.3
```

#### 실패 케이스 분석

```sql
-- 실패한 테스트 조회
SELECT
  combination_id,
  function_name,
  combination_variables,
  error_message
FROM v_batch_test_failures
WHERE test_batch_id = 'your-batch-id'
ORDER BY created_at DESC;
```

#### 시나리오별 성공률

```sql
-- 프리셋 시나리오별 성공률
SELECT * FROM v_batch_test_scenario_stats
WHERE test_batch_id = 'your-batch-id';

-- 출력 예시:
-- preset_scenario | optimization_type | total | success | success_rate | avg_quality
-- --------------- | ----------------- | ----- | ------- | ------------ | -----------
-- christmas       | both              | 1     | 1       | 100.0        | 82.0
-- blackFriday     | staffing          | 1     | 0       | 0.0          | NULL
```

#### 연결 테스트 분석

```sql
-- 시뮬레이션→최적화 연결 분석
SELECT * FROM v_batch_test_linked_analysis
WHERE test_batch_id = 'your-batch-id';

-- 출력 예시:
-- simulation_combination | optimization_combination | both_success | issues_passed
-- ---------------------- | ----------------------- | ------------ | -------------
-- linked_sim_christmas   | linked_christmas_both   | true         | 3
-- linked_sim_blackFriday | linked_blackFriday_staff| false        | 5
```

### 3.4 품질 점수 기준

#### 시뮬레이션 품질 (0-100점)

| 항목 | 배점 | 기준 |
|------|------|------|
| KPIs 완전성 | 30점 | 5개 필드 중 존재하는 수 |
| AI Insights | 20점 | 최대 5개 × 4점 |
| Diagnostic Issues | 20점 | 최대 5개 × 4점 |
| Zone Analysis | 15점 | 존재 시 15점 |
| Confidence Score | 15점 | confidence_score 비율 |

#### 최적화 품질 (0-100점)

| 항목 | 배점 | 기준 |
|------|------|------|
| Furniture Changes | 20점 | 최대 5개 × 4점 |
| Product Changes | 20점 | 최대 5개 × 4점 |
| Staffing Result | 20점 | 존재 시 20점 (staffing 타입만) |
| Summary & Impact | 20점 | 매출/트래픽 영향 존재 시 |
| AI Insights | 20점 | 최대 5개 × 4점 |

### 3.5 테스트 결과 테이블

```sql
-- ai_batch_test_results 테이블 구조
SELECT
  id,
  test_batch_id,
  test_type,           -- 'simulation', 'optimization', 'linked'
  combination_id,       -- 'sim_christmas', 'opt_both_mc20'
  combination_variables,-- {"preset_scenario": "christmas", ...}
  function_name,
  success,
  execution_time_ms,
  response_quality_score,
  response_metrics,     -- {"kpi_count": 5, "insights_count": 3, ...}
  linked_simulation_id, -- 연결 테스트 시 원본 시뮬레이션 ID
  created_at
FROM ai_batch_test_results
WHERE test_batch_id = 'your-batch-id';
```

### 3.6 정기 실행 권장

```bash
# 매일 minimal 테스트 실행 권장
# Cron: 0 3 * * * (매일 새벽 3시)

# 주간 sampled 테스트 실행 권장
# Cron: 0 3 * * 0 (매주 일요일 새벽 3시)
```

---

## 4. 데이터 품질 검증

### 4.1 필수 필드 완전성 체크

```sql
-- 필수 필드 누락 로그 조회
SELECT
  id,
  function_name,
  created_at,
  CASE
    WHEN input_variables IS NULL THEN 'input_variables 누락'
    WHEN ai_response IS NULL THEN 'ai_response 누락'
    WHEN input_variables = '{}' THEN 'input_variables 비어있음'
    WHEN ai_response = '{}' THEN 'ai_response 비어있음'
    ELSE 'OK'
  END as issue
FROM ai_response_logs
WHERE input_variables IS NULL
   OR ai_response IS NULL
   OR input_variables = '{}'
   OR ai_response = '{}';
```

### 4.2 응답 구조 검증

```sql
-- run-simulation 응답 구조 검증
SELECT
  id,
  function_name,
  CASE
    WHEN ai_response->'kpis' IS NULL THEN 'kpis 누락'
    WHEN ai_response->'zone_analysis' IS NULL THEN 'zone_analysis 누락'
    WHEN ai_response->'diagnostic_issues' IS NULL THEN 'diagnostic_issues 누락'
    WHEN ai_response->'ai_insights' IS NULL THEN 'ai_insights 누락'
    ELSE 'OK'
  END as structure_check
FROM ai_response_logs
WHERE function_name = 'run-simulation'
  AND (
    ai_response->'kpis' IS NULL OR
    ai_response->'zone_analysis' IS NULL OR
    ai_response->'diagnostic_issues' IS NULL
  );
```

### 4.3 에러 케이스 필터링

```sql
-- 에러 응답 조회
SELECT
  id,
  function_name,
  response_summary,
  context_metadata,
  created_at
FROM ai_response_logs
WHERE context_metadata->>'error' = 'true'
   OR ai_response->>'error' IS NOT NULL
   OR response_summary LIKE '에러:%';
```

### 4.4 이상치 탐지

```sql
-- KPI 이상치 탐지 (시뮬레이션)
SELECT
  id,
  store_id,
  (ai_response->'kpis'->>'predicted_visitors')::INTEGER as visitors,
  (ai_response->'kpis'->>'predicted_conversion_rate')::NUMERIC as conv_rate,
  (ai_response->'kpis'->>'peak_congestion_percent')::INTEGER as congestion
FROM ai_response_logs
WHERE function_name = 'run-simulation'
  AND (
    -- 방문객 수 이상 (음수 또는 10000 초과)
    (ai_response->'kpis'->>'predicted_visitors')::INTEGER < 0 OR
    (ai_response->'kpis'->>'predicted_visitors')::INTEGER > 10000 OR
    -- 전환율 이상 (0 미만 또는 1 초과)
    (ai_response->'kpis'->>'predicted_conversion_rate')::NUMERIC < 0 OR
    (ai_response->'kpis'->>'predicted_conversion_rate')::NUMERIC > 1 OR
    -- 혼잡도 이상 (0 미만 또는 100 초과)
    (ai_response->'kpis'->>'peak_congestion_percent')::INTEGER < 0 OR
    (ai_response->'kpis'->>'peak_congestion_percent')::INTEGER > 100
  );
```

### 4.5 실행 시간 분석

```sql
-- 함수별 실행 시간 통계
SELECT
  function_name,
  COUNT(*) as call_count,
  ROUND(AVG(execution_time_ms)) as avg_ms,
  MIN(execution_time_ms) as min_ms,
  MAX(execution_time_ms) as max_ms,
  PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY execution_time_ms) as p95_ms
FROM ai_response_logs
WHERE execution_time_ms IS NOT NULL
GROUP BY function_name
ORDER BY avg_ms DESC;

-- 느린 응답 조회 (10초 이상)
SELECT
  id,
  function_name,
  store_id,
  execution_time_ms,
  created_at
FROM ai_response_logs
WHERE execution_time_ms > 10000
ORDER BY execution_time_ms DESC;
```

---

## 5. 좋은 예시 선정 기준

### 5.1 자동 품질 점수 계산

```sql
-- quality_score 자동 계산 업데이트
UPDATE ai_response_logs
SET quality_score = (
  CASE
    -- 기본 점수 5점
    WHEN ai_response IS NOT NULL AND ai_response != '{}' THEN 5
    ELSE 0
  END
  -- 완전한 KPI 응답 +2점
  + CASE WHEN function_name = 'run-simulation'
         AND ai_response->'kpis'->>'predicted_visitors' IS NOT NULL
         AND ai_response->'kpis'->>'predicted_revenue' IS NOT NULL
         THEN 2 ELSE 0 END
  -- 3개 이상 인사이트 +1점
  + CASE WHEN jsonb_array_length(ai_response->'ai_insights') >= 3 THEN 1 ELSE 0 END
  -- 2개 이상 이슈 감지 +1점
  + CASE WHEN jsonb_array_length(ai_response->'diagnostic_issues') >= 2 THEN 1 ELSE 0 END
  -- 빠른 응답 (5초 미만) +1점
  + CASE WHEN execution_time_ms < 5000 THEN 1 ELSE 0 END
  -- 에러 없음 조건
  - CASE WHEN context_metadata->>'error' = 'true' THEN 5 ELSE 0 END
)
WHERE quality_score IS NULL;
```

### 5.2 is_good_example 선정 조건

```sql
-- 좋은 예시 자동 마킹 (quality_score 8점 이상)
UPDATE ai_response_logs
SET is_good_example = TRUE
WHERE quality_score >= 8
  AND context_metadata->>'error' IS DISTINCT FROM 'true'
  AND ai_response != '{}'
  AND function_name IN ('run-simulation', 'generate-optimization');
```

### 5.3 수동 검토가 필요한 케이스

```sql
-- 수동 검토 대상 (중간 품질)
SELECT
  id,
  function_name,
  quality_score,
  response_summary,
  execution_time_ms,
  created_at
FROM ai_response_logs
WHERE quality_score BETWEEN 5 AND 7
  AND is_good_example IS NULL
ORDER BY created_at DESC
LIMIT 50;
```

### 5.4 파인튜닝 제외 조건

다음 케이스는 파인튜닝 데이터셋에서 **제외**:

| 조건 | 이유 |
|------|------|
| `context_metadata->>'error' = 'true'` | 에러 응답 |
| `quality_score < 5` | 낮은 품질 |
| `ai_response = '{}'` | 빈 응답 |
| `execution_time_ms > 30000` | 타임아웃 근접 |
| `context_metadata->>'model_used' = 'rule-based'` | 규칙 기반 응답 (AI 아님) |

### 5.5 프리셋 시나리오별 데이터 조회

```sql
-- 프리셋 시나리오가 포함된 로그 조회
SELECT
  id,
  context_metadata->>'presetScenarioId' as scenario_id,
  context_metadata->>'presetScenarioName' as scenario_name,
  context_metadata->>'weather' as weather,
  context_metadata->>'trafficMultiplier' as traffic_mult,
  (ai_response->'kpis'->>'predicted_visitors')::INTEGER as visitors,
  quality_score,
  created_at
FROM ai_response_logs
WHERE function_name = 'run-simulation'
  AND context_metadata->>'hasPresetScenario' = 'true'
ORDER BY created_at DESC;

-- 시나리오별 통계
SELECT
  context_metadata->>'presetScenarioId' as scenario_id,
  context_metadata->>'presetScenarioName' as scenario_name,
  COUNT(*) as total_logs,
  ROUND(AVG(quality_score), 2) as avg_quality,
  SUM(CASE WHEN is_good_example THEN 1 ELSE 0 END) as good_examples,
  ROUND(AVG((ai_response->'kpis'->>'predicted_visitors')::NUMERIC)) as avg_visitors,
  ROUND(AVG((ai_response->'kpis'->>'predicted_revenue')::NUMERIC)) as avg_revenue
FROM ai_response_logs
WHERE function_name = 'run-simulation'
  AND context_metadata->>'hasPresetScenario' = 'true'
GROUP BY
  context_metadata->>'presetScenarioId',
  context_metadata->>'presetScenarioName'
ORDER BY total_logs DESC;
```

### 5.6 환경 컨텍스트별 분석

```sql
-- 날씨별 시뮬레이션 결과 분석
SELECT
  context_metadata->>'weather' as weather,
  COUNT(*) as log_count,
  ROUND(AVG((ai_response->'kpis'->>'predicted_visitors')::NUMERIC)) as avg_visitors,
  ROUND(AVG((ai_response->'kpis'->>'predicted_conversion_rate')::NUMERIC * 100), 2) as avg_conv_pct,
  ROUND(AVG((context_metadata->>'trafficMultiplier')::NUMERIC), 2) as avg_traffic_mult
FROM ai_response_logs
WHERE function_name = 'run-simulation'
  AND context_metadata->>'hasEnvironmentContext' = 'true'
  AND context_metadata->>'weather' IS NOT NULL
GROUP BY context_metadata->>'weather'
ORDER BY log_count DESC;

-- 휴일 타입별 분석
SELECT
  context_metadata->>'holidayType' as holiday_type,
  COUNT(*) as log_count,
  ROUND(AVG((ai_response->'kpis'->>'predicted_revenue')::NUMERIC)) as avg_revenue
FROM ai_response_logs
WHERE function_name = 'run-simulation'
  AND context_metadata->>'hasEnvironmentContext' = 'true'
  AND context_metadata->>'holidayType' IS NOT NULL
GROUP BY context_metadata->>'holidayType'
ORDER BY log_count DESC;
```

### 5.7 진단 이슈 컨텍스트 로깅 검증 (최적화)

시뮬레이션에서 전달된 진단 이슈가 최적화 로그에 포함되었는지 확인:

```sql
-- 진단 이슈가 포함된 최적화 로그 조회
SELECT
  id,
  input_variables->'layout'->'diagnostic_issues' as diag_issues,
  jsonb_array_length(
    input_variables->'layout'->'diagnostic_issues'->'priority_issues'
  ) as issue_count,
  input_variables->'layout'->'diagnostic_issues'->>'scenario_context' as scenario,
  response_summary,
  created_at
FROM ai_response_logs
WHERE function_name = 'generate-optimization'
  AND input_variables->'layout'->'diagnostic_issues' IS NOT NULL
ORDER BY created_at DESC
LIMIT 10;

-- 진단 이슈 포함 최적화 vs 일반 최적화 비교
SELECT
  CASE
    WHEN input_variables->'layout'->'diagnostic_issues' IS NOT NULL
    THEN '진단 이슈 기반'
    ELSE '일반 최적화'
  END as optimization_type,
  COUNT(*) as count,
  ROUND(AVG(quality_score), 2) as avg_quality,
  ROUND(AVG(execution_time_ms)) as avg_time_ms
FROM ai_response_logs
WHERE function_name = 'generate-optimization'
GROUP BY
  CASE
    WHEN input_variables->'layout'->'diagnostic_issues' IS NOT NULL
    THEN '진단 이슈 기반'
    ELSE '일반 최적화'
  END;

-- 시나리오별 진단 이슈 최적화 결과
SELECT
  input_variables->'layout'->'diagnostic_issues'->'scenario_context'->>'name' as scenario_name,
  COUNT(*) as count,
  ROUND(AVG(
    (input_variables->'layout'->'diagnostic_issues'->'simulation_kpis'->>'revenue')::NUMERIC
  )) as avg_sim_revenue,
  ROUND(AVG(quality_score), 2) as avg_quality
FROM ai_response_logs
WHERE function_name = 'generate-optimization'
  AND input_variables->'layout'->'diagnostic_issues'->'scenario_context' IS NOT NULL
GROUP BY input_variables->'layout'->'diagnostic_issues'->'scenario_context'->>'name'
ORDER BY count DESC;
```

---

## 6. 데이터셋 추출 방법

### 6.1 시뮬레이션 데이터셋 (JSONL)

```sql
-- 시뮬레이션 파인튜닝 데이터셋 추출
SELECT
  jsonb_build_object(
    'messages', jsonb_build_array(
      jsonb_build_object(
        'role', 'system',
        'content', '당신은 리테일 매장 시뮬레이션 전문가입니다. 매장 데이터를 분석하여 고객 행동을 예측하고 문제점을 진단합니다.'
      ),
      jsonb_build_object(
        'role', 'user',
        'content', format('매장 데이터: %s

시뮬레이션 조건:
- 시간: %s분
- 고객 수: %s명
- 시간대: %s

KPI를 예측하고 문제점을 분석해주세요.',
          input_variables->'analysis_context',
          input_variables->'simulation_options'->>'duration_minutes',
          input_variables->'simulation_options'->>'customer_count',
          input_variables->'simulation_options'->>'time_of_day'
        )
      ),
      jsonb_build_object(
        'role', 'assistant',
        'content', ai_response::TEXT
      )
    )
  ) as training_example
FROM ai_response_logs
WHERE function_name = 'run-simulation'
  AND is_good_example = TRUE
  AND context_metadata->>'model_used' = 'gemini-2.5-flash';
```

### 6.2 최적화 데이터셋 (JSONL)

```sql
-- 최적화 파인튜닝 데이터셋 추출
SELECT
  jsonb_build_object(
    'messages', jsonb_build_array(
      jsonb_build_object(
        'role', 'system',
        'content', '당신은 리테일 매장 레이아웃 최적화 전문가입니다. 매장 데이터와 문제점을 분석하여 개선안을 제시합니다.'
      ),
      jsonb_build_object(
        'role', 'user',
        'content', format('현재 레이아웃: %s

감지된 문제점: %s

최적화 방안을 제시해주세요.',
          input_variables->'layout_data',
          input_variables->'detected_issues'
        )
      ),
      jsonb_build_object(
        'role', 'assistant',
        'content', ai_response::TEXT
      )
    )
  ) as training_example
FROM ai_response_logs
WHERE function_name = 'generate-optimization'
  AND is_good_example = TRUE;
```

### 6.3 CSV 내보내기

```sql
-- 분석용 CSV 내보내기
COPY (
  SELECT
    id,
    store_id,
    function_name,
    simulation_type,
    response_summary,
    quality_score,
    is_good_example,
    execution_time_ms,
    context_metadata->>'model_used' as model_used,
    (ai_response->'kpis'->>'predicted_visitors')::INTEGER as predicted_visitors,
    (ai_response->'kpis'->>'predicted_conversion_rate')::NUMERIC as predicted_conversion,
    jsonb_array_length(ai_response->'diagnostic_issues') as issue_count,
    created_at
  FROM ai_response_logs
  WHERE function_name = 'run-simulation'
  ORDER BY created_at DESC
) TO '/tmp/simulation_logs.csv' WITH CSV HEADER;
```

### 6.4 통계 뷰 활용

```sql
-- 파인튜닝 데이터셋 통계 뷰
SELECT * FROM v_finetuning_dataset;

-- AI 응답 통계 뷰
SELECT * FROM v_ai_response_stats;
```

---

## 7. 파인튜닝 파이프라인

### 7.1 데이터 전처리 스크립트

```python
# scripts/prepare_finetuning_data.py

import json
from supabase import create_client

def extract_training_data(supabase_client, function_name: str):
    """파인튜닝 데이터 추출"""

    response = supabase_client.table('ai_response_logs').select('*').eq(
        'function_name', function_name
    ).eq(
        'is_good_example', True
    ).execute()

    training_examples = []

    for row in response.data:
        example = {
            'messages': [
                {'role': 'system', 'content': get_system_prompt(function_name)},
                {'role': 'user', 'content': format_user_prompt(row['input_variables'])},
                {'role': 'assistant', 'content': json.dumps(row['ai_response'], ensure_ascii=False)}
            ]
        }
        training_examples.append(example)

    return training_examples

def save_jsonl(examples: list, output_path: str):
    """JSONL 파일 저장"""
    with open(output_path, 'w', encoding='utf-8') as f:
        for example in examples:
            f.write(json.dumps(example, ensure_ascii=False) + '\n')
```

### 7.2 모델별 포맷 변환

#### Gemini Fine-tuning 형식

```json
{
  "text_input": "매장 데이터: {...}\n시뮬레이션 조건: 60분, 100명, afternoon",
  "output": "{\"kpis\": {...}, \"ai_insights\": [...]}"
}
```

#### OpenAI Fine-tuning 형식

```json
{
  "messages": [
    {"role": "system", "content": "..."},
    {"role": "user", "content": "..."},
    {"role": "assistant", "content": "..."}
  ]
}
```

### 7.3 검증 데이터셋 분리

```sql
-- 학습/검증 데이터셋 분리 (80/20)
WITH ranked AS (
  SELECT
    *,
    ROW_NUMBER() OVER (ORDER BY RANDOM()) as rn,
    COUNT(*) OVER () as total
  FROM ai_response_logs
  WHERE is_good_example = TRUE
)
SELECT
  *,
  CASE WHEN rn <= total * 0.8 THEN 'train' ELSE 'validation' END as split
FROM ranked;
```

---

## 8. QA 체크리스트

### 8.1 로깅 시스템 검증

- [ ] `run-simulation` Edge Function 로깅 동작 확인
- [ ] `generate-optimization` Edge Function 로깅 동작 확인
- [ ] `ai_response_logs` 테이블 데이터 삽입 확인
- [ ] 에러 케이스 로깅 확인

### 8.2 환경/시나리오 컨텍스트 로깅 검증

- [ ] `input_variables`에 `environment_context` 포함 확인
- [ ] `context_metadata`에 환경 메타데이터 포함 확인
  - [ ] `weather` 필드 존재
  - [ ] `holidayType` 필드 존재
  - [ ] `presetScenarioId` 필드 존재 (프리셋 사용 시)
  - [ ] `presetScenarioName` 필드 존재 (프리셋 사용 시)
  - [ ] `trafficMultiplier` 필드 존재
  - [ ] `hasEnvironmentContext` = true
  - [ ] `hasPresetScenario` = true (프리셋 사용 시)
- [ ] `simulation_type`이 프리셋 시나리오 반영 확인
  - 프리셋 사용 시: `scenario_christmas`, `scenario_blackFriday` 등
  - 일반 사용 시: `demand_prediction` 또는 `traffic_flow`

### 8.3 데이터 품질 검증

- [ ] 필수 필드 완전성 (input_variables, ai_response)
- [ ] 응답 구조 검증 (kpis, zone_analysis, ai_insights)
- [ ] 이상치 없음 확인 (음수 값, 범위 초과)
- [ ] 에러 케이스 분리 확인

### 8.4 품질 평가 시스템

- [ ] quality_score 자동 계산 동작 확인
- [ ] is_good_example 마킹 기준 적절성
- [ ] 수동 검토 대상 목록 생성

### 8.5 데이터셋 추출

- [ ] 시뮬레이션 JSONL 추출 확인
- [ ] 최적화 JSONL 추출 확인
- [ ] 학습/검증 분리 비율 확인
- [ ] 환경 컨텍스트 포함 데이터셋 추출 확인

### 8.6 진단 이슈 기반 최적화 로깅 검증

- [ ] `generate-optimization` 호출 시 `diagnostic_issues` 포함 확인
- [ ] `diagnostic_issues.priority_issues` 배열 존재
- [ ] `diagnostic_issues.scenario_context` 포함 (시뮬레이션 연결 시)
- [ ] `diagnostic_issues.environment_context` 포함
- [ ] `diagnostic_issues.simulation_kpis` 포함
- [ ] AI 프롬프트에 진단 이슈가 최우선으로 반영되는지 확인

### 8.7 파인튜닝 준비

- [ ] 데이터셋 크기 충분 (최소 100개 권장)
- [ ] 다양한 시나리오 포함 확인 (7개 프리셋 각각 포함)
- [ ] 다양한 환경 조건 포함 확인 (날씨, 휴일 등)
- [ ] 포맷 변환 정상 동작

### 8.8 단계별 환경 컨텍스트 QA

#### Step 1: 프리셋 시나리오 로깅 테스트

1. 디지털트윈 스튜디오에서 "크리스마스 시즌" 프리셋 선택
2. AI 시뮬레이션 실행
3. DB 확인:
   ```sql
   SELECT
     context_metadata->>'presetScenarioId',
     context_metadata->>'presetScenarioName',
     simulation_type
   FROM ai_response_logs
   WHERE function_name = 'run-simulation'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
4. 예상 결과:
   - `presetScenarioId` = 'christmas'
   - `presetScenarioName` = '크리스마스 시즌'
   - `simulation_type` = 'scenario_christmas'

#### Step 2: 환경 설정 로깅 테스트

1. "환경 설정" → "직접 설정" 모드 선택
2. 날씨: 비, 시간대: 오후, 공휴일: 주말 설정
3. AI 시뮬레이션 실행
4. DB 확인:
   ```sql
   SELECT
     input_variables->'environment_context'->>'weather' as weather,
     input_variables->'environment_context'->>'holiday_type' as holiday,
     context_metadata->>'weather',
     context_metadata->>'holidayType'
   FROM ai_response_logs
   WHERE function_name = 'run-simulation'
   ORDER BY created_at DESC
   LIMIT 1;
   ```
5. 예상 결과:
   - `weather` = 'rain'
   - `holidayType` = 'weekend'

#### Step 3: 다양한 시나리오 데이터 수집

7개 프리셋 시나리오 각각에 대해 최소 1회 이상 실행하여 다양한 파인튜닝 데이터 확보:

| 시나리오 | simulation_type | 예상 weather | 예상 holidayType |
|---------|-----------------|--------------|------------------|
| christmas | scenario_christmas | snow | christmas |
| rainyWeekday | scenario_rainyWeekday | rain | none |
| blackFriday | scenario_blackFriday | clear | blackFriday |
| newArrival | scenario_newArrival | clear | weekend |
| normalWeekend | scenario_normalWeekend | clear | weekend |
| coldWave | scenario_coldWave | heavySnow | none |
| yearEndParty | scenario_yearEndParty | clear | weekend |

---

## 부록

### A. SQL 쿼리 모음

```sql
-- 일별 로그 수 조회
SELECT
  DATE(created_at) as date,
  function_name,
  COUNT(*) as count
FROM ai_response_logs
GROUP BY DATE(created_at), function_name
ORDER BY date DESC;

-- 매장별 로그 수 조회
SELECT
  store_id,
  function_name,
  COUNT(*) as count,
  AVG(quality_score) as avg_quality
FROM ai_response_logs
GROUP BY store_id, function_name
ORDER BY count DESC;

-- 최근 좋은 예시 조회
SELECT
  id,
  function_name,
  response_summary,
  quality_score,
  created_at
FROM ai_response_logs
WHERE is_good_example = TRUE
ORDER BY created_at DESC
LIMIT 20;
```

### B. 관련 파일 위치

```
supabase/
├── functions/
│   ├── _shared/
│   │   └── aiResponseLogger.ts      # 공유 로깅 유틸리티
│   ├── run-simulation/
│   │   └── index.ts                 # 시뮬레이션 (로깅 포함)
│   ├── generate-optimization/
│   │   └── index.ts                 # 최적화 (로깅 포함)
│   └── advanced-ai-inference/
│       └── index.ts                 # 추론 (로깅 포함)
├── migrations/
│   └── 20260106_ai_response_logs.sql  # 로깅 테이블
└── queries/
    └── ai_response_logs_queries.sql   # 검증 쿼리
```

### C. 참고 문서

- [디지털트윈 스튜디오 QA 가이드](./DIGITAL_TWIN_STUDIO_QA_GUIDE.md)
- [데이터 흐름 아키텍처](./DATA_FLOW_ARCHITECTURE.md)
- [AI 추론 시스템](./ONTOLOGY_AI_INFERENCE_PHASE3.md)

### D. 버전 히스토리

| 버전 | 날짜 | 변경 사항 |
|------|------|----------|
| 1.0 | 2026-01-06 | 초기 문서 작성 |
| 1.1 | 2026-01-06 | 환경/시나리오 컨텍스트 로깅 검증 추가, 단계별 QA 가이드 확장 |
| 1.2 | 2026-01-06 | 시뮬레이션→최적화 연결 데이터 흐름 추가, 진단 이슈 컨텍스트 로깅 검증 추가 |

---

*문서 끝*
