# NEURALTWIN OS 챗봇 — Phase 2-A 기능 개발 요청서

> **버전**: v1.0
> **작성일**: 2026-02-05
> **선행 Phase**: Phase 1 (기반 인프라) 완료 필수
> **마스터 문서**: `NEURALTWIN_OS_CHATBOT_MASTER_REQUEST.md`

---

## 1. Phase 2-A 목표

**패턴 매칭 인텐트 분류기 + 페이지 네비게이션 액션** 구현

이 Phase가 완료되면:
- 사용자 메시지에서 `navigate` 인텐트를 패턴 매칭으로 분류할 수 있음
- "인사이트 허브로 가줘" 같은 명령 시 백엔드에서 `navigate` 액션을 반환함
- (프론트엔드 통합은 Phase 2-C에서 진행)

---

## 2. 제약조건

```
❌ 기존 Edge Function 코드 수정
❌ 기존 프론트엔드 코드 수정
✅ neuraltwin-assistant Edge Function 내 파일 추가
```

---

## 3. 구현 범위

### 3.1 신규 파일 목록

```
supabase/functions/neuraltwin-assistant/
├── intent/
│   ├── classifier.ts       # 신규
│   └── patterns.ts         # 신규
└── actions/
    └── navigationActions.ts  # 신규
```

### 3.2 patterns.ts — navigate 패턴 정의

```typescript
/**
 * 인텐트별 패턴 매칭 정의
 * Phase 2-A: navigate 인텐트만 구현
 */

export interface IntentPattern {
  intent: string;
  patterns: RegExp[];
  confidence: number;
  extractors?: {
    page?: (match: RegExpMatchArray, text: string) => string | null;
  };
}

// 페이지 매핑
export const PAGE_MAP: Record<string, string> = {
  '인사이트': '/insights',
  '인사이트 허브': '/insights',
  '인사이트허브': '/insights',
  'insight': '/insights',
  'insights': '/insights',

  '스튜디오': '/studio',
  '디지털트윈': '/studio',
  '디지털 트윈': '/studio',
  'studio': '/studio',

  'ROI': '/roi',
  'roi': '/roi',
  '알오아이': '/roi',
  'ROI 측정': '/roi',
  'roi 측정': '/roi',

  '설정': '/settings',
  'settings': '/settings',
  '세팅': '/settings',

  '데이터 컨트롤타워': '/data/control-tower',
  '데이터 컨트롤': '/data/control-tower',
  '데이터컨트롤타워': '/data/control-tower',
  'data control tower': '/data/control-tower',
  '컨트롤타워': '/data/control-tower',
};

// 페이지 추출 함수
function extractPage(text: string): string | null {
  const normalizedText = text.toLowerCase().replace(/\s+/g, ' ').trim();

  for (const [keyword, route] of Object.entries(PAGE_MAP)) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      return route;
    }
  }
  return null;
}

export const INTENT_PATTERNS: IntentPattern[] = [
  // navigate — 페이지 이동
  {
    intent: 'navigate',
    patterns: [
      /(?:인사이트|insight|스튜디오|studio|ROI|roi|설정|settings|데이터\s*컨트롤|컨트롤타워).*(?:로|으로|에)?\s*(?:가|이동|열|보여|가줘|이동해|열어|보여줘)/i,
      /(?:가|이동|열|보여)\s*(?:줘|해)?\s*(?:인사이트|insight|스튜디오|studio|ROI|roi|설정|settings)/i,
      /(?:인사이트|insight|스튜디오|studio|ROI|roi|설정|settings|컨트롤타워)\s*(?:페이지|화면)?\s*(?:열어|보여|가)/i,
    ],
    confidence: 0.95,
    extractors: {
      page: (match, text) => extractPage(text),
    },
  },
];

/**
 * 텍스트에서 패턴 매칭으로 인텐트 분류
 */
export function matchIntent(text: string): {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
} | null {
  const normalizedText = text.trim();

  for (const pattern of INTENT_PATTERNS) {
    for (const regex of pattern.patterns) {
      const match = normalizedText.match(regex);
      if (match) {
        const entities: Record<string, any> = {};

        // 엔티티 추출
        if (pattern.extractors?.page) {
          const page = pattern.extractors.page(match, normalizedText);
          if (page) {
            entities.page = page;
          }
        }

        return {
          intent: pattern.intent,
          confidence: pattern.confidence,
          entities,
        };
      }
    }
  }

  return null;
}
```

### 3.3 classifier.ts — 인텐트 분류기

```typescript
/**
 * 하이브리드 인텐트 분류기
 * Phase 2-A: 패턴 매칭만 구현, AI 폴백은 Phase 3-A에서 추가
 */

import { matchIntent } from './patterns.ts';

export interface ClassificationResult {
  intent: string;
  confidence: number;
  entities: Record<string, any>;
  method: 'pattern' | 'ai';
}

const CONFIDENCE_THRESHOLD = 0.7;

/**
 * 사용자 메시지에서 인텐트 분류
 */
export async function classifyIntent(
  message: string,
  _context?: any  // Phase 3-A에서 AI 분류 시 사용
): Promise<ClassificationResult> {
  // 1. 패턴 매칭 시도
  const patternResult = matchIntent(message);

  if (patternResult && patternResult.confidence >= CONFIDENCE_THRESHOLD) {
    return {
      intent: patternResult.intent,
      confidence: patternResult.confidence,
      entities: patternResult.entities,
      method: 'pattern',
    };
  }

  // 2. 패턴 매칭 실패 → 현재는 general_chat 폴백
  // Phase 3-A에서 AI 분류 추가 예정
  return {
    intent: 'general_chat',
    confidence: 0.5,
    entities: {},
    method: 'pattern',
  };
}
```

### 3.4 navigationActions.ts — 네비게이션 액션

```typescript
/**
 * 네비게이션 관련 액션 처리
 * Phase 2-A: navigate 액션만 구현
 * Phase 2-B: set_tab, set_date_range 추가 예정
 */

import { ClassificationResult } from '../intent/classifier.ts';

export interface UIAction {
  type: 'navigate' | 'set_tab' | 'set_date_range' | 'open_dialog' | 'run_simulation' | 'run_optimization';
  [key: string]: any;
}

export interface ActionResult {
  actions: UIAction[];
  message: string;
  suggestions: string[];
}

// 페이지 한글명 매핑
const PAGE_NAMES: Record<string, string> = {
  '/insights': '인사이트 허브',
  '/studio': '디지털트윈 스튜디오',
  '/roi': 'ROI 측정',
  '/settings': '설정',
  '/data/control-tower': '데이터 컨트롤타워',
};

/**
 * navigate 인텐트 처리
 */
export function handleNavigate(
  classification: ClassificationResult
): ActionResult {
  const targetPage = classification.entities.page;

  if (!targetPage) {
    return {
      actions: [],
      message: '어느 페이지로 이동할까요? 인사이트 허브, 스튜디오, ROI 측정, 설정 중에서 선택해주세요.',
      suggestions: [
        '인사이트 허브로 이동',
        '스튜디오 열어줘',
        'ROI 측정 페이지 보여줘',
      ],
    };
  }

  const pageName = PAGE_NAMES[targetPage] || targetPage;

  return {
    actions: [
      {
        type: 'navigate',
        target: targetPage,
      },
    ],
    message: `${pageName} 페이지로 이동합니다.`,
    suggestions: getSuggestionsForPage(targetPage),
  };
}

/**
 * 페이지별 후속 제안
 */
function getSuggestionsForPage(page: string): string[] {
  switch (page) {
    case '/insights':
      return [
        '고객탭 보여줘',
        '오늘 매출 얼마야?',
        '최근 7일 데이터로 변경해줘',
      ];
    case '/studio':
      return [
        'AI 시뮬레이션 탭 열어줘',
        '시뮬레이션 돌려줘',
        '최적화 해줘',
      ];
    case '/roi':
      return [
        '90일 기간으로 변경해줘',
        '적용된 전략 보여줘',
      ];
    case '/settings':
      return [
        '매장 관리 탭 열어줘',
        '데이터 연결 추가해줘',
      ];
    case '/data/control-tower':
      return [
        '새 연결 추가해줘',
        '데이터 품질 확인해줘',
      ];
    default:
      return [];
  }
}

/**
 * 액션 디스패처 (Phase 2-B에서 확장)
 */
export function dispatchNavigationAction(
  classification: ClassificationResult
): ActionResult {
  switch (classification.intent) {
    case 'navigate':
      return handleNavigate(classification);

    // Phase 2-B에서 추가
    // case 'set_tab':
    // case 'set_date_range':

    default:
      return {
        actions: [],
        message: '',
        suggestions: [],
      };
  }
}
```

### 3.5 index.ts 수정 — 인텐트 분류 연동

기존 Phase 1의 index.ts에서 TODO로 표시된 부분을 구현합니다.

```typescript
// index.ts 내 수정 부분

import { classifyIntent } from './intent/classifier.ts';
import { dispatchNavigationAction } from './actions/navigationActions.ts';

// ... 기존 코드 ...

// 7. 인텐트 분류 (Phase 2-A에서 구현)
const classification = await classifyIntent(message, context);

// 8. 액션 실행
let actionResult = { actions: [], message: '', suggestions: [] };

if (classification.intent === 'navigate') {
  actionResult = dispatchNavigationAction(classification);
}

// 9. 응답 생성
const assistantMessage = actionResult.message ||
  `[인텐트: ${classification.intent}] 메시지를 받았습니다: "${message}"`;
const suggestions = actionResult.suggestions.length > 0
  ? actionResult.suggestions
  : ['인사이트 허브로 이동', '오늘 매출 조회', '시뮬레이션 실행'];
const actions = actionResult.actions;

// ... 나머지 기존 코드 ...
```

---

## 4. 완료 체크리스트

### 파일 생성
- [ ] `intent/patterns.ts` 생성
- [ ] `intent/classifier.ts` 생성
- [ ] `actions/navigationActions.ts` 생성

### 기능 구현
- [ ] PAGE_MAP에 모든 페이지 매핑 완료
- [ ] navigate 인텐트 패턴 3개 이상 정의
- [ ] extractPage 함수로 페이지 추출 동작 확인
- [ ] classifyIntent 함수 패턴 매칭 동작 확인
- [ ] handleNavigate 함수 액션 반환 확인

### 통합
- [ ] index.ts에 classifier, navigationActions import 추가
- [ ] index.ts에서 classifyIntent 호출 연동
- [ ] index.ts에서 dispatchNavigationAction 호출 연동

### 테스트
- [ ] "인사이트 허브로 가줘" → navigate 인텐트 + /insights 반환
- [ ] "스튜디오 열어줘" → navigate 인텐트 + /studio 반환
- [ ] "ROI 페이지 보여줘" → navigate 인텐트 + /roi 반환
- [ ] "안녕" → general_chat 폴백

---

## 5. 테스트 시나리오

```bash
# Edge Function 로컬 실행
supabase functions serve neuraltwin-assistant --no-verify-jwt

# 테스트 1: navigate 인텐트
curl -X POST http://localhost:54321/functions/v1/neuraltwin-assistant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "message": "인사이트 허브로 가줘",
    "context": {
      "page": { "current": "settings" },
      "store": { "id": "store-uuid", "name": "테스트 매장" }
    }
  }'

# 예상 응답:
# {
#   "message": "인사이트 허브 페이지로 이동합니다.",
#   "actions": [{ "type": "navigate", "target": "/insights" }],
#   "suggestions": ["고객탭 보여줘", "오늘 매출 얼마야?", ...],
#   "meta": { "intent": "navigate", "confidence": 0.95, ... }
# }

# 테스트 2: general_chat 폴백
curl -X POST http://localhost:54321/functions/v1/neuraltwin-assistant \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -d '{
    "message": "안녕",
    "context": {
      "page": { "current": "insights" },
      "store": { "id": "store-uuid", "name": "테스트 매장" }
    }
  }'

# 예상 응답:
# {
#   "meta": { "intent": "general_chat", "confidence": 0.5, ... }
# }
```

---

## 6. 다음 Phase 예고

**Phase 2-B**: 엔티티 추출 + 탭/날짜 액션
- `intent/entityExtractor.ts` — 날짜, 탭명 추출
- `intent/patterns.ts` 확장 — set_tab, set_date_range 패턴 추가
- `actions/navigationActions.ts` 확장 — handleSetTab, handleSetDateRange 구현

---

**Phase 2-A 요청서 끝**
