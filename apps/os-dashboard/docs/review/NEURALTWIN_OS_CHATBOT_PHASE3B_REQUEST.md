# NEURALTWIN OS 챗봇 — Phase 3-B 기능 개발 요청서

> **버전**: v1.2 (인텐트 강화 반영)
> **작성일**: 2026-02-05
> **선행 Phase**: Phase 3-A (일반 대화 + AI 연동) 완료 필수
> **마스터 문서**: `NEURALTWIN_OS_CHATBOT_MASTER_REQUEST.md`
> **관련 문서**: `NEURALTWIN_OS_CHATBOT_INTENT_ENHANCEMENT_DESIGN.md`

---

## 1. Phase 3-B 목표

**KPI 조회(query_kpi) — 기존 DB 테이블 직접 쿼리 + 관련 탭 자동 이동** 구현

이 Phase가 완료되면:
- "오늘 매출 얼마야?", "방문객 몇 명이야?" 같은 질문에 실제 데이터로 응답
- 기존 daily_kpis_agg 테이블에서 데이터 조회
- 조회 결과를 자연어로 변환하여 응답
- **관련 탭으로 자동 이동** (예: 방문객 조회 → 인사이트 허브 고객탭)
- **커스텀 날짜 범위 지원** (예: "12월 1-15일 매출 보여줘", "25년 12월 첫째주 방문객")
- **확장 KPI 조회** (목표 달성률, 체류 시간, 신규/재방문 비율)
- **자연어 날짜 표현 지원** (12월 첫째주, 12월 초/중순/말, 연말/연초)

---

## 2. 제약조건

```
❌ 기존 Edge Function 코드 수정
❌ 기존 DB 테이블 구조 수정
❌ 기존 프론트엔드 코드 수정
✅ neuraltwin-assistant Edge Function 내 파일 추가
✅ 기존 DB 테이블 읽기 전용 쿼리
✅ 기존 네비게이션 액션 활용
```

---

## 3. 구현 범위

### 3.1 신규/수정 파일 목록

```
supabase/functions/neuraltwin-assistant/
├── intent/
│   └── patterns.ts         # 수정 (query_kpi 패턴 + 커스텀 날짜 파싱)
├── actions/
│   └── queryActions.ts     # 신규 (KPI 조회 + 네비게이션 액션)
└── index.ts                # 수정 (query_kpi 라우팅)
```

### 3.2 쿼리 대상 기존 테이블

| 테이블 | 용도 | 주요 컬럼 |
|:---|:---|:---|
| `daily_kpis_agg` | 일별 KPI 집계 | store_id, date, total_revenue, total_visitors, conversion_rate 등 |

### 3.3 쿼리 타입별 탭 매핑 (확장됨)

| 쿼리 타입 | 이동 페이지 | 이동 탭 | 섹션 (선택) |
|:---|:---|:---|:---|
| `revenue` | /insights | overview | kpi-cards |
| `visitors` | /insights | customer | customer-kpi |
| `conversion` | /insights | overview | kpi-cards |
| `avgTransaction` | /insights | overview | kpi-cards |
| `product` | /insights | product | product-performance |
| `inventory` | /insights | inventory | inventory-status |
| `goal` | /insights | overview | goal-achievement |
| `dwellTime` | /insights | customer | customer-kpi |
| `newVsReturning` | /insights | customer | customer-kpi |
| `summary` | /insights | overview | kpi-cards |

### 3.4 patterns.ts — query_kpi 패턴 + 커스텀 날짜

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
    // 커스텀 날짜 범위 + KPI (예: "12월 1-15일 방문객 보여줘")
    /(\d{1,2})월\s*(\d{1,2})[-~](\d{1,2})일?.*(?:매출|방문객|전환율|현황|데이터)/i,
    /(\d{1,2})[\/\-.](\d{1,2})\s*[-~]\s*(\d{1,2})[\/\-.]?(\d{1,2})?.*(?:매출|방문객|전환율|현황|데이터)/i,
  ],
  confidence: 0.85,
  extractors: {
    queryType: (_match, text) => extractQueryType(text),
    period: (_match, text) => extractPeriod(text),
  },
}

// 기간 추출 함수 — 커스텀 날짜 지원
function extractPeriod(text: string): { type: string; startDate?: string; endDate?: string } {
  const currentYear = new Date().getFullYear();

  // 커스텀 날짜 범위: "12월 1-15일"
  const koreanDateMatch = text.match(/(\d{1,2})월\s*(\d{1,2})일?\s*[-~]\s*(\d{1,2})일?/);
  if (koreanDateMatch) {
    const month = parseInt(koreanDateMatch[1], 10);
    const startDay = parseInt(koreanDateMatch[2], 10);
    const endDay = parseInt(koreanDateMatch[3], 10);
    return {
      type: 'custom',
      startDate: `${currentYear}-${String(month).padStart(2, '0')}-${String(startDay).padStart(2, '0')}`,
      endDate: `${currentYear}-${String(month).padStart(2, '0')}-${String(endDay).padStart(2, '0')}`,
    };
  }

  // 커스텀 날짜 범위: "12/1-15" 또는 "12/1-12/15"
  const slashDateMatch = text.match(/(\d{1,2})[\/\-.](\d{1,2})\s*[-~]\s*(\d{1,2})?[\/\-.]?(\d{1,2})?/);
  if (slashDateMatch) { /* 파싱 로직 */ }

  // 프리셋: 오늘, 어제, 이번 주, 이번 달
  if (/오늘|today/.test(text)) return { type: 'today' };
  if (/어제|yesterday/.test(text)) return { type: 'yesterday' };
  if (/이번\s*주/.test(text)) return { type: 'thisWeek' };
  if (/이번\s*달/.test(text)) return { type: 'thisMonth' };

  return { type: 'today' }; // 기본값
}
```

### 3.5 queryActions.ts — KPI 조회 + 네비게이션 액션

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

// 각 쿼리 함수에서 네비게이션 액션 반환
return {
  actions: createNavigationActions('visitors', dateRange),
  message: '오늘 방문객은 1,500명입니다.\n\n인사이트 허브 고객탭에서 확인해보세요.',
  suggestions: ['매출 알려줘', '전환율 어때?'],
};
```

---

## 4. 완료 체크리스트

### 파일 생성/수정
- [x] `actions/queryActions.ts` 신규 생성
- [x] `intent/patterns.ts`에 query_kpi 패턴 + 커스텀 날짜 파싱 추가
- [x] `index.ts`에 query_kpi 라우팅 추가

### 기능 테스트
- [ ] "오늘 매출 얼마야?" → 매출 데이터 + 개요탭 이동
- [ ] "방문객 몇 명이야?" → 방문객 수 + 고객탭 이동
- [ ] "12월 1-15일 방문객 보여줘" → 커스텀 날짜 + 고객탭 이동
- [ ] "전환율 어때?" → 전환율 데이터 + 개요탭 이동
- [ ] "오늘 현황 알려줘" → 전체 요약 + 개요탭 이동

---

## 5. 다음 Phase 예고

**Phase 3-C**: 시뮬레이션/최적화 오케스트레이션
- `actions/executionActions.ts` — run_simulation, run_optimization 처리
- 기존 `run-simulation`, `generate-optimization` EF 내부 호출
- 실행 결과 자연어 요약

---

## 6. 버전 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| v1.0 | 2026-02-05 | 최초 작성 |
| v1.1 | 2026-02-05 | 관련 탭 자동 이동 + 커스텀 날짜 범위 지원 추가 |
| v1.2 | 2026-02-05 | 인텐트 강화 반영 - 자연어 날짜, 확장 쿼리 타입 (goal, dwellTime, newVsReturning) |

---

**Phase 3-B 요청서 끝**
