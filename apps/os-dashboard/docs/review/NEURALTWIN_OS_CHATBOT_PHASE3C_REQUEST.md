# NEURALTWIN OS 챗봇 — Phase 3-C 기능 개발 요청서

> **버전**: v1.0
> **작성일**: 2026-02-05
> **선행 Phase**: Phase 3-A (일반 대화 + AI 연동) 완료 필수
> **마스터 문서**: `NEURALTWIN_OS_CHATBOT_MASTER_REQUEST.md`

---

## 1. Phase 3-C 목표

**시뮬레이션/최적화 오케스트레이션 — 기존 EF 내부 호출** 구현

이 Phase가 완료되면:
- "시뮬레이션 돌려줘", "최적화 해줘" 명령 시 기존 EF 호출
- 기존 `run-simulation`, `generate-optimization` Edge Function 재사용
- 실행 결과를 자연어로 요약하여 응답

---

## 2. 제약조건

```
❌ 기존 Edge Function 코드 수정 (run-simulation, generate-optimization 등)
❌ 기존 프론트엔드 코드 수정
✅ neuraltwin-assistant에서 기존 EF 내부 호출 (오케스트레이션)
```

---

## 3. 구현 범위

### 3.1 신규/수정 파일 목록

```
supabase/functions/neuraltwin-assistant/
├── intent/
│   └── patterns.ts           # 수정 (run_simulation, run_optimization 패턴)
├── actions/
│   └── executionActions.ts   # 신규
└── response/
    └── generator.ts          # 수정 (실행 결과 요약 추가)
```

### 3.2 patterns.ts 추가 — 실행 관련 패턴

```typescript
// 기존 INTENT_PATTERNS 배열에 추가

// run_simulation — 시뮬레이션 실행
{
  intent: 'run_simulation',
  patterns: [
    /(?:시뮬레이션|simulation)\s*(?:돌려|실행|시작|해)/i,
    /(?:크리스마스|블랙프라이데이|christmas|black\s*friday|연말|추석|설날)\s*(?:시뮬|시나리오|예측)/i,
    /(?:트래픽|고객\s*흐름|동선)\s*(?:시뮬|예측|분석)/i,
    /(?:시뮬|시나리오)\s*(?:돌려|실행|해)/i,
  ],
  confidence: 0.90,
  extractors: {
    scenario: (match, text) => extractScenario(text),
    simulationType: (match, text) => extractSimulationType(text),
  },
},

// run_optimization — 최적화 실행
{
  intent: 'run_optimization',
  patterns: [
    /(?:최적화|optimization)\s*(?:해|실행|돌려|시작)/i,
    /(?:가구|배치|레이아웃|진열)\s*(?:최적화|추천)/i,
    /(?:동선|흐름)\s*(?:최적화|개선)/i,
    /(?:매출|전환율)\s*(?:올려|높여|최적화)/i,
  ],
  confidence: 0.90,
  extractors: {
    optimizationType: (match, text) => extractOptimizationType(text),
  },
},

// 시나리오 추출 함수
function extractScenario(text: string): string | null {
  const scenarios: Record<string, string> = {
    '크리스마스': 'christmas',
    'christmas': 'christmas',
    '블랙프라이데이': 'black_friday',
    'black friday': 'black_friday',
    '연말': 'year_end',
    '추석': 'chuseok',
    '설날': 'new_year',
    '주말': 'weekend',
    '평일': 'weekday',
  };

  const normalizedText = text.toLowerCase();
  for (const [keyword, scenario] of Object.entries(scenarios)) {
    if (normalizedText.includes(keyword.toLowerCase())) {
      return scenario;
    }
  }
  return null; // 기본 시나리오 사용
}

// 시뮬레이션 타입 추출 함수
function extractSimulationType(text: string): string {
  const normalizedText = text.toLowerCase();

  if (/트래픽|고객\s*흐름|동선/.test(normalizedText)) return 'traffic_flow';
  if (/혼잡|병목/.test(normalizedText)) return 'congestion';
  if (/매출|수익/.test(normalizedText)) return 'revenue';

  return 'traffic_flow'; // 기본값
}

// 최적화 타입 추출 함수
function extractOptimizationType(text: string): string {
  const normalizedText = text.toLowerCase();

  if (/가구|배치|레이아웃/.test(normalizedText)) return 'layout';
  if (/진열|상품\s*배치/.test(normalizedText)) return 'merchandising';
  if (/동선|흐름/.test(normalizedText)) return 'flow';
  if (/직원|스태프/.test(normalizedText)) return 'staffing';

  return 'layout'; // 기본값
}
```

### 3.3 executionActions.ts — 시뮬레이션/최적화 처리

```typescript
/**
 * 시뮬레이션/최적화 실행 처리
 * 기존 EF 내부 호출 (오케스트레이션)
 */

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { ClassificationResult } from '../intent/classifier.ts';

export interface ExecutionActionResult {
  actions: any[];
  message: string;
  suggestions: string[];
  data?: any;
}

/**
 * run_simulation 인텐트 처리
 */
export async function handleRunSimulation(
  supabase: SupabaseClient,
  classification: ClassificationResult,
  storeId: string,
  context?: any
): Promise<ExecutionActionResult> {
  const scenario = classification.entities.scenario;
  const simulationType = classification.entities.simulationType || 'traffic_flow';

  console.log('[executionActions] Running simulation:', { scenario, simulationType, storeId });

  try {
    // 기존 run-simulation EF 내부 호출
    const { data, error } = await supabase.functions.invoke('run-simulation', {
      body: {
        store_id: storeId,
        simulation_type: simulationType,
        scenario: scenario,
        options: {
          duration_minutes: 60,
          customer_count: 100,
          time_of_day: 'afternoon',
          simulation_type: 'predictive',
        },
      },
    });

    if (error) {
      console.error('[executionActions] run-simulation error:', error);
      throw new Error('EF_FAILED');
    }

    // 결과 요약
    const summary = summarizeSimulationResult(data);

    return {
      actions: [
        {
          type: 'run_simulation',
          status: 'completed',
          result: data,
        },
      ],
      message: summary.message,
      suggestions: summary.suggestions,
      data,
    };

  } catch (error) {
    console.error('[executionActions] handleRunSimulation error:', error);

    return {
      actions: [],
      message: '시뮬레이션 실행 중 오류가 발생했어요. 스튜디오에서 직접 실행해보시겠어요?',
      suggestions: ['스튜디오로 이동', '다시 시도해줘'],
    };
  }
}

/**
 * run_optimization 인텐트 처리
 */
export async function handleRunOptimization(
  supabase: SupabaseClient,
  classification: ClassificationResult,
  storeId: string,
  context?: any
): Promise<ExecutionActionResult> {
  const optimizationType = classification.entities.optimizationType || 'layout';

  console.log('[executionActions] Running optimization:', { optimizationType, storeId });

  try {
    // 기존 generate-optimization EF 내부 호출
    const { data, error } = await supabase.functions.invoke('generate-optimization', {
      body: {
        store_id: storeId,
        optimization_type: optimizationType,
        options: {
          include_layout: optimizationType === 'layout',
          include_flow: optimizationType === 'flow',
          include_merchandising: optimizationType === 'merchandising',
        },
      },
    });

    if (error) {
      console.error('[executionActions] generate-optimization error:', error);
      throw new Error('EF_FAILED');
    }

    // 결과 요약
    const summary = summarizeOptimizationResult(data, optimizationType);

    return {
      actions: [
        {
          type: 'run_optimization',
          status: 'completed',
          result: data,
        },
      ],
      message: summary.message,
      suggestions: summary.suggestions,
      data,
    };

  } catch (error) {
    console.error('[executionActions] handleRunOptimization error:', error);

    return {
      actions: [],
      message: '최적화 실행 중 오류가 발생했어요. 스튜디오에서 직접 실행해보시겠어요?',
      suggestions: ['스튜디오로 이동', '다시 시도해줘'],
    };
  }
}

/**
 * 시뮬레이션 결과 요약
 */
function summarizeSimulationResult(result: any): { message: string; suggestions: string[] } {
  if (!result) {
    return {
      message: '시뮬레이션이 완료되었지만 결과를 불러오지 못했어요.',
      suggestions: ['스튜디오에서 결과 확인'],
    };
  }

  // 결과 구조에 따라 요약 생성
  const predictions = result.predictions || {};
  const peakHour = predictions.peak_hour || '알 수 없음';
  const expectedVisitors = predictions.expected_visitors || 0;
  const congestionRisk = predictions.congestion_risk || 'unknown';

  let message = '시뮬레이션이 완료되었습니다.\n\n';
  message += `📊 예측 결과:\n`;
  message += `• 예상 방문객: ${expectedVisitors}명\n`;
  message += `• 피크 시간대: ${peakHour}\n`;
  message += `• 혼잡 위험도: ${translateRisk(congestionRisk)}`;

  return {
    message,
    suggestions: ['최적화 해줘', '스튜디오에서 자세히 보기', '다른 시나리오로 시뮬레이션'],
  };
}

/**
 * 최적화 결과 요약
 */
function summarizeOptimizationResult(result: any, type: string): { message: string; suggestions: string[] } {
  if (!result) {
    return {
      message: '최적화가 완료되었지만 결과를 불러오지 못했어요.',
      suggestions: ['스튜디오에서 결과 확인'],
    };
  }

  const recommendations = result.recommendations || [];
  const expectedImprovement = result.expected_improvement || {};

  let message = '최적화 분석이 완료되었습니다.\n\n';

  if (expectedImprovement.revenue_increase) {
    message += `💰 예상 매출 증가: +${expectedImprovement.revenue_increase}%\n`;
  }
  if (expectedImprovement.conversion_increase) {
    message += `📈 예상 전환율 증가: +${expectedImprovement.conversion_increase}%\n`;
  }

  if (recommendations.length > 0) {
    message += `\n🎯 주요 추천 사항:\n`;
    recommendations.slice(0, 3).forEach((rec: any, i: number) => {
      message += `${i + 1}. ${rec.description || rec.title || '추천 사항'}\n`;
    });
  }

  return {
    message,
    suggestions: ['스튜디오에서 적용하기', '시뮬레이션으로 검증', '다른 최적화 유형 시도'],
  };
}

/**
 * 위험도 한글 변환
 */
function translateRisk(risk: string): string {
  const riskMap: Record<string, string> = {
    'low': '낮음',
    'medium': '보통',
    'high': '높음',
    'critical': '매우 높음',
    'unknown': '알 수 없음',
  };
  return riskMap[risk.toLowerCase()] || risk;
}
```

### 3.4 index.ts 수정 — 실행 액션 연동

```typescript
// index.ts 내 수정 부분

import { handleRunSimulation, handleRunOptimization } from './actions/executionActions.ts';

// ... 기존 코드 ...

// 8. 액션 실행 부분 확장
let actionResult = { actions: [], message: '', suggestions: [] };

switch (classification.intent) {
  case 'navigate':
  case 'set_tab':
  case 'set_date_range':
  case 'composite_navigate':
    actionResult = dispatchNavigationAction(classification, context.page.current);
    break;

  case 'query_kpi':
    actionResult = await handleQueryKpi(supabase, classification, context.store.id);
    break;

  case 'run_simulation':
    actionResult = await handleRunSimulation(supabase, classification, context.store.id, context);
    break;

  case 'run_optimization':
    actionResult = await handleRunOptimization(supabase, classification, context.store.id, context);
    break;

  case 'general_chat':
    const chatResult = await handleGeneralChat(message, [], context);
    actionResult = {
      actions: [],
      message: chatResult.message,
      suggestions: chatResult.suggestions,
    };
    break;
}

// ... 나머지 코드 ...
```

---

## 4. 완료 체크리스트

### 파일 생성/수정
- [ ] `actions/executionActions.ts` 신규 생성
- [ ] `intent/patterns.ts`에 run_simulation, run_optimization 패턴 추가
- [ ] `index.ts`에 실행 액션 핸들러 연동

### 기능 테스트
- [ ] "시뮬레이션 돌려줘" → run-simulation EF 호출 + 결과 요약
- [ ] "크리스마스 시뮬레이션 해줘" → scenario: christmas 적용
- [ ] "최적화 해줘" → generate-optimization EF 호출 + 결과 요약
- [ ] "가구 배치 최적화" → optimization_type: layout 적용
- [ ] EF 호출 실패 시 에러 메시지 반환

### 주의 사항
- [ ] 기존 EF의 요청/응답 형식 확인 (run-simulation, generate-optimization)
- [ ] 타임아웃 처리 (시뮬레이션/최적화는 시간이 오래 걸릴 수 있음)

---

## 5. 다음 Phase 예고

**Phase 4**: 안정화
- 에러 핸들링 전체 정리
- Rate Limiting 적용 강화
- 대화 히스토리 로드/저장
- E2E 테스트 시나리오

---

**Phase 3-C 요청서 끝**
