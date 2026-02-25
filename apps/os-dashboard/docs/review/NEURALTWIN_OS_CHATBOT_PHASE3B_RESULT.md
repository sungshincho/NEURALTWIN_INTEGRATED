# NEURALTWIN OS 챗봇 — Phase 3-B 개발 결과서

> **버전**: v1.2 (인텐트 강화 반영)
> **작성일**: 2026-02-05
> **개발자**: Claude AI Assistant
> **선행 Phase**: Phase 3-A 완료
> **관련 문서**: `NEURALTWIN_OS_CHATBOT_INTENT_ENHANCEMENT_DESIGN.md`

---

## 1. 개발 완료 요약

Phase 3-B **KPI 조회(query_kpi) + 인텐트 강화** 기능 구현 완료:
- "오늘 매출 얼마야?", "방문객 몇 명이야?" 질문에 실제 DB 데이터로 응답
- daily_kpis_agg 테이블에서 데이터 조회
- 전일 대비 변화율 계산 및 자연어 응답 생성
- **관련 탭으로 자동 이동** (방문객 → 고객탭, 매출 → 개요탭)
- **커스텀 날짜 범위 지원** ("12월 1-15일", "12/1~15" 형식)
- **인텐트 강화 적용**:
  - 자연어 날짜 표현 (12월 첫째주, 12월 초/중순/말, 연말/연초)
  - 연도 파싱 ("25년 12월" → 2025년)
  - 확장 쿼리 타입 (goal, dwellTime, newVsReturning)
  - 대시보드 구조 정의 및 용어-위치 매핑
  - scroll_to_section, open_modal 인텐트 추가

---

## 2. 구현 파일 목록

| 파일 | 상태 | 설명 |
|:---|:---|:---|
| `intent/patterns.ts` | 수정 | query_kpi 패턴 + 커스텀 날짜 파싱 |
| `actions/queryActions.ts` | 신규 | KPI 조회 + 네비게이션 액션 생성 |
| `index.ts` | 수정 | query_kpi 인텐트 라우팅 추가 |

---

## 3. 핵심 구현 코드

### 3.1 patterns.ts — query_kpi 패턴 + 커스텀 날짜

```typescript
// query_kpi — KPI 데이터 조회 (Phase 3-B)
{
  intent: 'query_kpi',
  patterns: [
    /(?:오늘|어제|이번\s*주|이번\s*달|최근)?\s*(?:매출|revenue)\s*(?:얼마|어때|어떻게|알려|보여)/i,
    /(?:오늘|어제)?\s*(?:방문객|visitor|고객|트래픽)\s*(?:수|몇|얼마|어때|명)/i,
    /(?:전환율|conversion)\s*(?:어때|어떻게|알려|몇|%)/i,
    /(?:평균\s*객단가|객단가|거래\s*금액)\s*(?:얼마|어때)/i,
    /(?:오늘|어제|최근)?\s*(?:성과|실적|현황)\s*(?:어때|알려|보여)/i,
    /(?:매출|방문객|전환율).*(?:알려|보여|어때|얼마)/i,
    // 커스텀 날짜 범위 (v1.1 추가)
    /(\d{1,2})월\s*(\d{1,2})[-~](\d{1,2})일?.*(?:매출|방문객|전환율|현황|데이터)/i,
    /(\d{1,2})[\/\-.](\d{1,2})\s*[-~]\s*(\d{1,2})[\/\-.]?(\d{1,2})?.*(?:매출|방문객|전환율|현황|데이터)/i,
  ],
  confidence: 0.85,
  extractors: {
    queryType: (_match, text) => extractQueryType(text),
    period: (_match, text) => extractPeriod(text),
  },
}

// 쿼리 타입: revenue | visitors | conversion | avgTransaction | summary
// 기간 타입: today | yesterday | thisWeek | thisMonth | custom
```

### 3.2 queryActions.ts — 네비게이션 액션 생성

```typescript
import { UIAction } from './navigationActions.ts';

// 쿼리 타입별 탭 매핑
const QUERY_TYPE_TO_TAB: Record<string, { page: string; tab: string }> = {
  revenue: { page: '/insights', tab: 'overview' },
  visitors: { page: '/insights', tab: 'customer' },
  conversion: { page: '/insights', tab: 'overview' },
  avgTransaction: { page: '/insights', tab: 'overview' },
  summary: { page: '/insights', tab: 'overview' },
};

// 네비게이션 액션 생성
function createNavigationActions(
  queryType: string,
  dateRange: { startDate: string; endDate: string }
): UIAction[] {
  const mapping = QUERY_TYPE_TO_TAB[queryType];

  return [
    { type: 'navigate', target: mapping.page },
    { type: 'set_tab', target: mapping.tab },
    { type: 'set_date_range', target: { startDate: dateRange.startDate, endDate: dateRange.endDate } },
  ];
}
```

### 3.3 extractPeriod — 커스텀 날짜 파싱

```typescript
function extractPeriod(text: string): { type: string; startDate?: string; endDate?: string } {
  const currentYear = new Date().getFullYear();

  // "12월 1-15일" 형식
  const koreanDateMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일?\s*[-~]\s*(\d{1,2})일?/);
  if (koreanDateMatch) {
    return {
      type: 'custom',
      startDate: `${currentYear}-${month}-${startDay}`,
      endDate: `${currentYear}-${month}-${endDay}`,
    };
  }

  // "12/1-15" 또는 "12/1-12/15" 형식
  const slashDateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})\s*[-~]\s*(\d{1,2})?[\/\-.]?(\d{1,2})?/);
  if (slashDateMatch) { /* 파싱 로직 */ }

  // 프리셋
  if (/오늘|today/.test(text)) return { type: 'today' };
  if (/어제|yesterday/.test(text)) return { type: 'yesterday' };
  // ...
}
```

### 3.4 index.ts — 라우팅

```typescript
} else if (classification.intent === 'query_kpi') {
  // KPI 데이터 조회 (Phase 3-B)
  const queryResult = await handleQueryKpi(supabase, classification, context.store.id);
  actionResult = {
    actions: queryResult.actions,
    message: queryResult.message,
    suggestions: queryResult.suggestions,
  };
}
```

---

## 4. 지원 쿼리 타입 + 탭 이동

| 쿼리 타입 | 트리거 예시 | 이동 탭 | 응답 예시 |
|:---|:---|:---|:---|
| `revenue` | "오늘 매출 얼마야?" | 개요 | "오늘 매출은 1,234만원입니다.\n\n인사이트 허브 개요탭에서 확인해보세요." |
| `visitors` | "방문객 몇 명이야?" | 고객 | "오늘 방문객은 1,500명입니다.\n\n인사이트 허브 고객탭에서 확인해보세요." |
| `conversion` | "전환율 어때?" | 개요 | "현재 전환율은 12.5%입니다.\n\n인사이트 허브 개요탭에서 확인해보세요." |
| `avgTransaction` | "객단가 얼마야?" | 개요 | "평균 객단가는 45,000원입니다.\n\n인사이트 허브 개요탭에서 확인해보세요." |
| `summary` | "오늘 현황 알려줘" | 개요 | "오늘의 주요 지표입니다:\n• 매출: 1,234만원\n• 방문객: 1,500명\n• 전환율: 12.5%" |

---

## 5. 지원 기간

| 기간 | 트리거 키워드 | 예시 |
|:---|:---|:---|
| 오늘 | "오늘", "today" (기본값) | "오늘 매출 얼마야?" |
| 어제 | "어제", "yesterday" | "어제 방문객 몇 명?" |
| 이번 주 | "이번 주", "this week" | "이번 주 매출" |
| 이번 달 | "이번 달", "this month" | "이번 달 전환율" |
| **커스텀** | "12월 1-15일", "12/1~15" | "12월 1-15일 방문객 보여줘" |

---

## 6. 데이터 소스

**조회 대상 테이블**: `daily_kpis_agg`

| 컬럼 | 용도 |
|:---|:---|
| `store_id` | 매장 식별자 |
| `date` | 날짜 |
| `total_revenue` | 총 매출 |
| `total_visitors` | 총 방문객 |
| `total_transactions` | 총 거래 수 |
| `conversion_rate` | 전환율 |
| `avg_transaction_value` | 평균 거래 금액 |

---

## 7. 체크리스트

### 파일 생성/수정
- [x] `actions/queryActions.ts` 신규 생성
- [x] `intent/patterns.ts`에 query_kpi 패턴 + 커스텀 날짜 파싱 추가
- [x] `index.ts`에 query_kpi 라우팅 추가
- [x] 네비게이션 액션 반환 구현

### 기능 (배포 후 테스트 필요)
- [ ] "오늘 매출 얼마야?" → 매출 데이터 + 개요탭 이동
- [ ] "방문객 몇 명이야?" → 방문객 수 + 고객탭 이동
- [ ] "12월 1-15일 방문객 보여줘" → 커스텀 날짜 + 고객탭 이동
- [ ] "전환율 어때?" → 전환율 데이터 + 개요탭 이동
- [ ] "오늘 현황 알려줘" → 전체 요약 + 개요탭 이동
- [ ] 날짜 범위 설정 액션 정상 동작

---

## 8. 다음 Phase 예고

**Phase 3-C**: 시뮬레이션/최적화 오케스트레이션
- `actions/executionActions.ts` — run_simulation, run_optimization 처리
- 기존 `run-simulation`, `generate-optimization` EF 내부 호출
- 실행 결과 자연어 요약

---

## 9. 버전 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-02-05 | 최초 작성 |
| v1.1 | 2026-02-05 | 관련 탭 자동 이동 + 커스텀 날짜 범위 지원 추가 |

---

**Phase 3-B 개발 완료**
