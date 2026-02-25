# 매장 탭 챗봇 이슈 검토 보고서

**작성일:** 2026-02-12
**대상:** 인사이트 허브 > 매장 탭 관련 챗봇 응답
**관련 파일:**
- `supabase/functions/neuraltwin-assistant/actions/queryActions.ts`
- `supabase/functions/neuraltwin-assistant/intent/classifier.ts` (systemPrompt)
- `src/features/insights/tabs/StoreTab.tsx`
- `src/features/insights/context/InsightDataContext.tsx`
- `supabase/migrations/20260211000002_insight_hub_rpc_functions_v2.sql`

---

## Q1. "25년 11월 1일 평균 체류시간 얼마야?"

### 현상
- 챗봇 응답: `"현재 매장 탭에서 평균 체류시간을(를) 확인할 수 있습니다."`
- **실제 데이터 값을 응답하지 않음** (단순 네비게이션 안내만 수행)

### 근본 원인: `queryStoreDwell` 함수가 RPC 호출 없이 네비게이션만 수행

**`queryActions.ts:1776-1781`**
```ts
function queryStoreDwell(
  dateRange: { startDate: string; endDate: string },
  pageContext?: PageContext
): QueryActionResult {
  return createGenericNavigationResult('storeDwell', dateRange, pageContext);
}
```

- `supabase`, `storeId`, `orgId` 파라미터조차 받지 않음
- `createGenericNavigationResult`는 메시지만 생성하고 실제 DB 조회 없음

### 사용 가능한 데이터 소스 (이미 존재)

`get_overview_kpis` RPC가 v2 마이그레이션에서 `avg_dwell_minutes` 반환하도록 이미 수정됨:
```sql
-- 20260211000002_insight_hub_rpc_functions_v2.sql:64-69
CASE WHEN SUM(k.total_visitors) > 0
     THEN ROUND(
       SUM(COALESCE(k.avg_visit_duration_seconds, 0) * COALESCE(k.total_visitors, 0))
       / SUM(k.total_visitors) / 60.0, 1
     )::numeric
     ELSE 0 END AS avg_dwell_minutes
```

### 수정 방향

`queryStoreDwell`에서 `rpcOverviewKpis`를 호출하여 `avg_dwell_minutes` 값을 가져와 응답에 포함.

### 우선도: **높음**

---

## Q2. "25년 11월 1일 센서 커버율은?"

### 현상
- 챗봇 응답: `"센서 커버율은 100%입니다 (7/7 존 활성)."`
- 프론트엔드 KPI 카드: **0%**
- 양쪽 수치 모두 실제와 맞지 않음

### 근본 원인: 챗봇과 프론트엔드가 완전히 다른 방식으로 계산 (양쪽 모두 미구현)

| 구분 | 챗봇 | 프론트엔드 |
|------|------|-----------|
| **계산 방식** | `active_zones / total_zones * 100` | 하드코딩 `0` |
| **데이터 소스** | `zones_dim.is_active` | `IntegratedMetrics` (기본값 0) |
| **코드 위치** | `queryActions.ts:1647-1649` | `InsightDataContext.tsx:977-979` |

**챗봇 문제:**
```ts
// queryActions.ts:1647-1649
const totalZones = zones.length;
const activeZones = zones.filter((z: any) => z.is_active !== false).length;
const coverage = totalZones > 0 ? Math.round((activeZones / totalZones) * 100) : 0;
```
`rpcZonesDimList`가 이미 `is_active=true`만 반환하므로 항상 100%.

**프론트엔드 문제:**
```ts
// InsightDataContext.tsx:977-979
avgDwellTime: 0,
trackedVisitors: 0,    // ← 하드코딩 0
trackingCoverage: 0,   // ← 하드코딩 0
```
주석: "행동 지표는 별도 쿼리 필요 - 기본값 제공" → 실제 구현이 안 되어 있음.

### 수정 방향

1. 센서 커버율의 정의를 확정해야 함 (존 활성화 비율 vs 방문자 추적 비율)
2. 프론트엔드: `useIntegratedMetrics`에서 `trackedVisitors`, `trackingCoverage` 실제 계산 로직 구현
3. 챗봇: 프론트엔드와 동일한 계산 방식 적용

### 우선도: 중간 (정의 확정 필요)

---

## Q3. "25년 11월 1일 존별 방문자 분포 알려줘"

### 현상
챗봇 응답:
```
존별 분석 결과:
• 액세서리존: 방문 25명, 체류 3분
• 의류존: 방문 21명, 체류 3분
• 계산대: 방문 21명, 체류 4분
• 피팅룸: 방문 19명, 체류 3분
• 휴식공간: 방문 18명, 체류 4분
```

### 이슈 3-1: 퍼센트가 아닌 방문자 수+체류시간으로 응답

**원인:** "존별 방문자 분포"와 "존별 분석"이 하나의 queryType(`zoneAnalysis`)으로 통합되어 있음.

`queryZoneAnalysis` 함수(`queryActions.ts:1761-1762`)는 방문자 수와 체류시간만 포맷:
```ts
const zoneList = results.slice(0, 5).map((z: any) =>
  `• ${z.zone_name || z.zone_id}: 방문 ${(z.visitors || 0).toLocaleString()}명, 체류 ${Math.round((z.avg_dwell_seconds || 0) / 60)}분`
).join('\n');
```

프론트엔드의 "존별 방문자 분포" 섹션(`StoreTab.tsx:772-780`)은 도넛 차트로 **퍼센트 비율**을 보여줌.

**수정 방향:**
- 옵션 A: `zoneAnalysis` 내에서 "분포" 키워드 감지 시 퍼센트 계산 포함
- 옵션 B: 새 queryType `zoneDistribution` 분리

### 이슈 3-2: 메인홀, 입구가 누락됨

**원인:** `.slice(0, 5)` 하드코딩

```ts
// queryActions.ts:1761
const zoneList = results.slice(0, 5).map(...)
```

RPC `get_zone_metrics`는 `ORDER BY SUM(total_visitors) DESC`로 정렬. 방문자가 적은 메인홀, 입구가 5위 밖으로 밀려 잘림. 프론트엔드는 전체 존을 표시하므로 메인홀, 입구가 보임.

**수정 방향:** `.slice(0, 5)` 제한 제거하여 모든 존 표시 (또는 최소 zones_dim 등록된 전체 존)

### 이슈 3-3: 존별 방문자 합계 138명 vs 개요탭 총 입장 101명

| 지표 | 소스 | 의미 |
|------|------|------|
| 총 입장 101명 | `funnel_events` (event_type='entry') | 매장 입구를 통한 고유 입장 이벤트 |
| 존별 합계 138명 | `zone_daily_metrics.total_visitors` SUM | 각 존 방문의 합계 (1명이 3존 방문 → 3으로 카운트) |

**결론:** 이것은 **구조적으로 정상적인 차이**. 1명이 여러 존을 방문하면 존별 합계 > 총 입장. 그러나 사용자 입장에서 혼동을 유발.

**수정 방향:** 프론트엔드 차트와 챗봇 응답에 "중복 포함 (연 방문 기준)" 안내 추가

### 우선도: **높음** (3-1, 3-2) / 낮음 (3-3)

---

## Q4. "25년 11월 1일 존별 성과 비교해줘"

### 현상
챗봇 응답이 Q3과 동일 (방문자+체류시간). 프론트엔드의 "존별 성과 비교" 테이블은 **존, 방문자, 체류시간, 전환율** 4개 컬럼을 표시.

### 이슈 4-1: 전환율이 응답에 포함되지 않음

**원인:** `queryZoneAnalysis` 응답 포맷에 `conversion_count`를 사용하지 않음.

RPC `get_zone_metrics`는 이미 `conversion_count`를 반환하도록 v2에서 수정됨:
```sql
-- get_zone_metrics RPC
COALESCE(SUM(zdm.conversion_count), 0)::bigint AS conversion_count
```

프론트엔드(`StoreTab.tsx:643`)는 전환율을 계산:
```ts
conversion: data.visitors > 0 ? ((data.conversion / data.visitors) * 100).toFixed(1) : '0',
```

그러나 `queryZoneAnalysis`의 응답 메시지에는 이 필드가 전혀 사용되지 않음.

### 이슈 4-2: 존 누락

Q3 이슈 3-2와 동일 원인 (`.slice(0, 5)` 제한)

### 이슈 4-3: "존별 성과 비교" 인텐트 미분리

"존별 성과 비교"와 "존 분석"이 동일한 `zoneAnalysis` queryType으로 처리됨. 프론트엔드에서는 별도 섹션(`store-zone-performance`)으로 구분되어 있으나 챗봇 인텐트에서는 구분 없음.

**수정 방향:**
1. `queryZoneAnalysis` 응답에 `conversion_count / visitors * 100` 전환율 추가
2. `.slice(0, 5)` 제한 제거
3. (선택) `zonePerformance` queryType 분리 가능

### 우선도: **높음**

---

## 수정 사항 종합

| # | 파일 | 수정 내용 | 우선도 | 난이도 |
|---|------|----------|--------|--------|
| 1 | `queryActions.ts` - `queryStoreDwell()` | `rpcOverviewKpis` 호출하여 `avg_dwell_minutes` 실제 값 반환 | **높음** | 낮음 |
| 2 | `queryActions.ts` - `queryZoneAnalysis()` | `.slice(0, 5)` 제한 제거 → 전체 존 표시 | **높음** | 낮음 |
| 3 | `queryActions.ts` - `queryZoneAnalysis()` | 전환율(`conversion_count / visitors * 100`) 응답 포함 | **높음** | 낮음 |
| 4 | `queryActions.ts` - `queryTrackingCoverage()` | 센서 커버율 계산 로직 수정 (프론트엔드 정의 확정 후) | 중간 | 중간 |
| 5 | `InsightDataContext.tsx` | `trackedVisitors`, `trackingCoverage` 실제 계산 로직 구현 | 중간 | 중간 |
| 6 | 인텐트 분류 (systemPrompt) | "존별 방문자 분포" / "존별 성과 비교" queryType 분리 검토 | 중간 | 중간 |
| 7 | 프론트엔드 + 챗봇 | 존별 방문자 합계에 "중복 포함 기준" 안내 추가 | 낮음 | 낮음 |

### 즉시 수정 가능 (#1, #2, #3)
- queryStoreDwell: RPC 호출 추가 (기존 `rpcOverviewKpis` 활용)
- queryZoneAnalysis: slice 제한 제거 + 전환율 포함

### 정의 확정 후 수정 (#4, #5)
- 센서 커버율: "존 활성화 비율"과 "방문자 추적 비율" 중 어떤 의미로 쓸 것인지 결정 필요

### 인텐트 구조 검토 후 수정 (#6)
- zoneAnalysis 하나로 통합 유지할지, zoneDistribution/zonePerformance로 분리할지 결정 필요
