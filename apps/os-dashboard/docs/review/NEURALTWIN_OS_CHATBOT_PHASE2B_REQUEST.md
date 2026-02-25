# NEURALTWIN OS 챗봇 — Phase 2-B 기능 개발 요청서

> **버전**: v1.0
> **작성일**: 2026-02-05
> **선행 Phase**: Phase 2-A (인텐트 분류 + 네비게이션) 완료 필수
> **마스터 문서**: `NEURALTWIN_OS_CHATBOT_MASTER_REQUEST.md`

---

## 1. Phase 2-B 목표

**엔티티 추출기 + set_tab, set_date_range 액션** 구현

이 Phase가 완료되면:
- 사용자 메시지에서 탭명, 날짜 범위를 추출할 수 있음
- "고객탭 보여줘", "11/4~11/15 기간으로 설정해줘" 같은 명령 처리 가능
- composite_navigate 인텐트 (페이지 + 탭 + 날짜 복합) 처리 가능

---

## 2. 제약조건

```
❌ 기존 Edge Function 코드 수정
❌ 기존 프론트엔드 코드 수정
✅ neuraltwin-assistant Edge Function 내 파일 추가/수정
```

---

## 3. 구현 범위

### 3.1 신규/수정 파일 목록

```
supabase/functions/neuraltwin-assistant/
├── intent/
│   ├── classifier.ts       # 수정
│   ├── patterns.ts         # 수정 (set_tab, set_date_range 패턴 추가)
│   └── entityExtractor.ts  # 신규
└── actions/
    └── navigationActions.ts  # 수정 (handleSetTab, handleSetDateRange 추가)
```

### 3.2 entityExtractor.ts — 엔티티 추출기

```typescript
/**
 * 사용자 메시지에서 엔티티 추출
 * - 페이지명, 탭명, 날짜 범위 등
 */

// 탭 매핑 (페이지별)
export const TAB_MAP: Record<string, Record<string, string>> = {
  insights: {
    '개요': 'overview',
    'overview': 'overview',
    '매장': 'store',
    'store': 'store',
    '고객': 'customer',
    'customer': 'customer',
    '상품': 'product',
    'product': 'product',
    '재고': 'inventory',
    'inventory': 'inventory',
    '예측': 'prediction',
    'prediction': 'prediction',
    'AI추천': 'ai',
    'AI 추천': 'ai',
    'ai': 'ai',
    'ai추천': 'ai',
  },
  settings: {
    '매장 관리': 'stores',
    '매장': 'stores',
    'stores': 'stores',
    '데이터': 'data',
    'data': 'data',
    '사용자': 'users',
    'users': 'users',
    '시스템': 'system',
    'system': 'system',
    '플랜': 'license',
    'license': 'license',
  },
  studio: {
    '레이어': 'layer',
    'layer': 'layer',
    'AI 시뮬레이션': 'ai-simulation',
    'ai 시뮬레이션': 'ai-simulation',
    '시뮬레이션': 'ai-simulation',
    'AI 최적화': 'ai-optimization',
    'ai 최적화': 'ai-optimization',
    '최적화': 'ai-optimization',
    '적용': 'apply',
    'apply': 'apply',
  },
};

// 날짜 프리셋 매핑
export const DATE_PRESET_MAP: Record<string, string> = {
  '오늘': 'today',
  'today': 'today',
  '7일': '7d',
  '일주일': '7d',
  '1주일': '7d',
  '7d': '7d',
  '30일': '30d',
  '한달': '30d',
  '1개월': '30d',
  '30d': '30d',
  '90일': '90d',
  '3개월': '90d',
  '90d': '90d',
};

/**
 * 탭명 추출
 */
export function extractTab(text: string, page?: string): string | null {
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ').trim();

  // 페이지가 지정되어 있으면 해당 페이지의 탭 매핑에서만 검색
  if (page) {
    const pageKey = page.replace('/', '').replace('/insights', 'insights');
    const tabMap = TAB_MAP[pageKey] || TAB_MAP.insights;

    for (const [keyword, tabValue] of Object.entries(tabMap)) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        return tabValue;
      }
    }
  }

  // 페이지가 없으면 모든 탭 매핑에서 검색
  for (const [pageKey, tabMap] of Object.entries(TAB_MAP)) {
    for (const [keyword, tabValue] of Object.entries(tabMap)) {
      if (normalizedText.includes(keyword.toLowerCase())) {
        return tabValue;
      }
    }
  }

  return null;
}

/**
 * 탭이 속한 페이지 추론
 */
export function inferPageFromTab(tab: string): string | null {
  for (const [pageKey, tabMap] of Object.entries(TAB_MAP)) {
    if (Object.values(tabMap).includes(tab)) {
      switch (pageKey) {
        case 'insights': return '/insights';
        case 'settings': return '/settings';
        case 'studio': return '/studio';
      }
    }
  }
  return null;
}

/**
 * 날짜 범위 추출
 */
export function extractDateRange(text: string): {
  preset?: string;
  startDate?: string;
  endDate?: string;
} | null {
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ').trim();

  // 프리셋 매칭
  for (const [keyword, preset] of Object.entries(DATE_PRESET_MAP)) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      return { preset };
    }
  }

  // 커스텀 범위 매칭: "11/4~11/15", "11월 4일부터 15일까지" 등
  const customRangePatterns = [
    // MM/DD~MM/DD 또는 MM-DD~MM-DD
    /(\d{1,2})[\/\-.](\d{1,2})\s*[~\-]\s*(\d{1,2})[\/\-.](\d{1,2})/,
    // MM월 DD일 ~ MM월 DD일
    /(\d{1,2})월\s*(\d{1,2})일?\s*[~부터\-]\s*(\d{1,2})월?\s*(\d{1,2})일/,
  ];

  for (const pattern of customRangePatterns) {
    const match = text.match(pattern);
    if (match) {
      const currentYear = new Date().getFullYear();
      const startMonth = match[1].padStart(2, '0');
      const startDay = match[2].padStart(2, '0');
      const endMonth = match[3].padStart(2, '0');
      const endDay = match[4].padStart(2, '0');

      return {
        startDate: `${currentYear}-${startMonth}-${startDay}`,
        endDate: `${currentYear}-${endMonth}-${endDay}`,
      };
    }
  }

  return null;
}

/**
 * 전체 엔티티 추출
 */
export function extractEntities(text: string, currentPage?: string): Record<string, any> {
  const entities: Record<string, any> = {};

  // 탭 추출
  const tab = extractTab(text, currentPage);
  if (tab) {
    entities.tab = tab;

    // 탭에서 페이지 추론 (페이지가 명시되지 않은 경우)
    if (!entities.page) {
      const inferredPage = inferPageFromTab(tab);
      if (inferredPage) {
        entities.inferredPage = inferredPage;
      }
    }
  }

  // 날짜 범위 추출
  const dateRange = extractDateRange(text);
  if (dateRange) {
    if (dateRange.preset) {
      entities.datePreset = dateRange.preset;
    }
    if (dateRange.startDate) {
      entities.dateStart = dateRange.startDate;
    }
    if (dateRange.endDate) {
      entities.dateEnd = dateRange.endDate;
    }
  }

  return entities;
}
```

### 3.3 patterns.ts 확장 — set_tab, set_date_range, composite_navigate

```typescript
// 기존 patterns.ts에 추가

import { extractTab, extractDateRange, inferPageFromTab, extractEntities } from './entityExtractor.ts';

// INTENT_PATTERNS 배열에 추가:

// set_tab — 탭 전환
{
  intent: 'set_tab',
  patterns: [
    /(?:고객|customer|매장|store|상품|product|재고|inventory|예측|prediction|AI\s*추천|개요|overview)\s*(?:탭|tab)?(?:을|를)?\s*(?:보여|열|선택|클릭|눌러)/i,
    /(?:보여|열어|선택|클릭)\s*(?:줘|해)?\s*(?:고객|customer|매장|store|상품|product|재고|inventory|예측|prediction|AI\s*추천|개요)\s*(?:탭|tab)?/i,
  ],
  confidence: 0.90,
  extractors: {
    tab: (match, text) => extractTab(text),
  },
},

// set_date_range — 날짜 필터 변경
{
  intent: 'set_date_range',
  patterns: [
    /(\d{1,2})[\/\-.](\d{1,2})\s*[~\-]\s*(\d{1,2})[\/\-.](\d{1,2})/,  // 11/4~11/15
    /(?:오늘|today)\s*(?:데이터|기간|날짜)?(?:로|으로)?/i,
    /(?:7일|일주일|1주일)\s*(?:데이터|기간)?(?:로|으로)?/i,
    /(?:30일|한달|1개월)\s*(?:데이터|기간)?(?:로|으로)?/i,
    /(?:90일|3개월)\s*(?:데이터|기간)?(?:로|으로)?/i,
    /기간\s*(?:을|를)?\s*(?:변경|설정|바꿔)/i,
  ],
  confidence: 0.90,
  extractors: {
    dateRange: (match, text) => extractDateRange(text),
  },
},

// composite_navigate — 복합 네비게이션 (페이지 + 탭 + 날짜)
{
  intent: 'composite_navigate',
  patterns: [
    /(?:인사이트|스튜디오|설정).*(?:에서|에|의)?\s*(?:\d{1,2}[\/\-]\d{1,2}.*)?(?:고객|매장|상품|재고|예측|AI|개요|시뮬레이션|최적화)?\s*(?:탭|tab)?/i,
    /(?:고객|매장|상품|재고|예측|AI|개요).*(?:탭|tab)?.*(?:보여|열어|가)/i,
  ],
  confidence: 0.85,
  extractors: {
    all: (match, text) => extractEntities(text),
  },
},
```

### 3.4 navigationActions.ts 확장 — handleSetTab, handleSetDateRange

```typescript
// 기존 navigationActions.ts에 추가

import { extractEntities, inferPageFromTab, TAB_MAP, DATE_PRESET_MAP } from '../intent/entityExtractor.ts';

// 탭 한글명 매핑
const TAB_NAMES: Record<string, string> = {
  'overview': '개요',
  'store': '매장',
  'customer': '고객',
  'product': '상품',
  'inventory': '재고',
  'prediction': '예측',
  'ai': 'AI추천',
  'stores': '매장 관리',
  'data': '데이터',
  'users': '사용자',
  'system': '시스템',
  'license': '플랜',
  'layer': '레이어',
  'ai-simulation': 'AI 시뮬레이션',
  'ai-optimization': 'AI 최적화',
  'apply': '적용',
};

/**
 * set_tab 인텐트 처리
 */
export function handleSetTab(
  classification: ClassificationResult,
  currentPage?: string
): ActionResult {
  const tab = classification.entities.tab;
  const inferredPage = classification.entities.inferredPage;

  if (!tab) {
    return {
      actions: [],
      message: '어느 탭을 열까요? 고객, 매장, 상품, 재고, 예측, AI추천 중에서 선택해주세요.',
      suggestions: ['고객탭 보여줘', '매장탭 열어줘', '예측탭 보여줘'],
    };
  }

  const tabName = TAB_NAMES[tab] || tab;
  const targetPage = inferredPage || currentPage || '/insights';

  // URL 쿼리 파라미터 방식으로 탭 전환
  const targetUrl = `${targetPage}?tab=${tab}`;

  return {
    actions: [
      {
        type: 'navigate',
        target: targetUrl,
      },
    ],
    message: `${tabName} 탭으로 이동합니다.`,
    suggestions: getSuggestionsForTab(tab),
  };
}

/**
 * set_date_range 인텐트 처리
 */
export function handleSetDateRange(
  classification: ClassificationResult
): ActionResult {
  const { datePreset, dateStart, dateEnd } = classification.entities;

  if (!datePreset && !dateStart) {
    return {
      actions: [],
      message: '어떤 기간으로 설정할까요? 오늘, 7일, 30일, 90일 또는 직접 날짜를 입력해주세요.',
      suggestions: ['오늘 데이터로 변경', '최근 7일로 설정', '11/4~11/15 기간으로'],
    };
  }

  const actions: UIAction[] = [];
  let message = '';

  if (datePreset) {
    actions.push({
      type: 'set_date_range',
      preset: datePreset,
    });

    const presetName = {
      'today': '오늘',
      '7d': '최근 7일',
      '30d': '최근 30일',
      '90d': '최근 90일',
    }[datePreset] || datePreset;

    message = `기간을 ${presetName}로 설정합니다.`;
  } else if (dateStart && dateEnd) {
    actions.push({
      type: 'set_date_range',
      startDate: dateStart,
      endDate: dateEnd,
    });
    message = `기간을 ${dateStart} ~ ${dateEnd}로 설정합니다.`;
  }

  return {
    actions,
    message,
    suggestions: ['매출 확인해줘', '고객 분석 보여줘', '인사이트 허브로 이동'],
  };
}

/**
 * composite_navigate 인텐트 처리 (복합)
 */
export function handleCompositeNavigate(
  classification: ClassificationResult,
  currentPage?: string
): ActionResult {
  const actions: UIAction[] = [];
  const messages: string[] = [];

  const { page, tab, inferredPage, datePreset, dateStart, dateEnd } = classification.entities;

  // 1. 페이지 이동
  const targetPage = page || inferredPage || currentPage;
  if (targetPage && targetPage !== currentPage) {
    let targetUrl = targetPage;

    // 2. 탭 설정 (URL 쿼리 파라미터)
    if (tab) {
      targetUrl = `${targetPage}?tab=${tab}`;
      const tabName = TAB_NAMES[tab] || tab;
      messages.push(`${PAGE_NAMES[targetPage] || targetPage}의 ${tabName} 탭`);
    } else {
      messages.push(`${PAGE_NAMES[targetPage] || targetPage} 페이지`);
    }

    actions.push({
      type: 'navigate',
      target: targetUrl,
    });
  } else if (tab) {
    // 페이지 이동 없이 탭만 변경
    const targetUrl = `${currentPage || '/insights'}?tab=${tab}`;
    const tabName = TAB_NAMES[tab] || tab;
    messages.push(`${tabName} 탭`);

    actions.push({
      type: 'navigate',
      target: targetUrl,
    });
  }

  // 3. 날짜 범위 설정
  if (datePreset) {
    actions.push({
      type: 'set_date_range',
      preset: datePreset,
    });
    messages.push(`기간: ${datePreset}`);
  } else if (dateStart && dateEnd) {
    actions.push({
      type: 'set_date_range',
      startDate: dateStart,
      endDate: dateEnd,
    });
    messages.push(`기간: ${dateStart}~${dateEnd}`);
  }

  return {
    actions,
    message: messages.length > 0
      ? `${messages.join(', ')}(으)로 이동합니다.`
      : '이동할 위치를 파악하지 못했어요. 다시 말씀해주세요.',
    suggestions: ['오늘 매출 얼마야?', '시뮬레이션 돌려줘'],
  };
}

/**
 * 탭별 후속 제안
 */
function getSuggestionsForTab(tab: string): string[] {
  switch (tab) {
    case 'customer':
      return ['고객 세그먼트 분석해줘', '방문객 수 알려줘'];
    case 'store':
      return ['존별 성과 보여줘', '히트맵 분석해줘'];
    case 'product':
      return ['베스트셀러 보여줘', '상품별 매출 알려줘'];
    default:
      return ['매출 알려줘', '데이터 분석해줘'];
  }
}

/**
 * 액션 디스패처 확장
 */
export function dispatchNavigationAction(
  classification: ClassificationResult,
  currentPage?: string
): ActionResult {
  switch (classification.intent) {
    case 'navigate':
      return handleNavigate(classification);

    case 'set_tab':
      return handleSetTab(classification, currentPage);

    case 'set_date_range':
      return handleSetDateRange(classification);

    case 'composite_navigate':
      return handleCompositeNavigate(classification, currentPage);

    default:
      return {
        actions: [],
        message: '',
        suggestions: [],
      };
  }
}
```

---

## 4. 완료 체크리스트

### 파일 생성/수정
- [ ] `intent/entityExtractor.ts` 신규 생성
- [ ] `intent/patterns.ts`에 set_tab, set_date_range, composite_navigate 패턴 추가
- [ ] `actions/navigationActions.ts`에 handleSetTab, handleSetDateRange, handleCompositeNavigate 추가

### 기능 구현
- [ ] TAB_MAP에 모든 페이지별 탭 매핑 완료
- [ ] DATE_PRESET_MAP에 프리셋 매핑 완료
- [ ] extractTab 함수 동작 확인
- [ ] extractDateRange 함수 동작 확인 (프리셋 + 커스텀 범위)
- [ ] composite_navigate 복합 처리 동작 확인

### 테스트
- [ ] "고객탭 보여줘" → set_tab 인텐트 + tab=customer
- [ ] "최근 7일로 변경해줘" → set_date_range + preset=7d
- [ ] "11/4~11/15 기간으로" → set_date_range + startDate/endDate
- [ ] "인사이트 허브 고객탭에서 11/4~11/15 보여줘" → composite_navigate

---

## 5. 다음 Phase 예고

**Phase 2-C**: 프론트엔드 통합
- `src/hooks/useAssistantChat.ts` — 실제 AI 연동 훅
- `src/features/assistant/utils/actionDispatcher.ts` — UIAction 실행
- `DashboardLayout.tsx` 최소 수정 — useChatPanel → useAssistantChat

---

**Phase 2-B 요청서 끝**
