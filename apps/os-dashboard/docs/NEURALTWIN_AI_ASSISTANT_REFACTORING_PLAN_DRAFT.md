# NEURALTWIN AI Assistant 구조 개선 계획서 (Draft v0.1)

> **⚠️ 이 문서는 초안(Draft)입니다.**
> 이 계획서는 현재 코드베이스 분석과 제품 비전 논의를 기반으로 작성된 초기 draft입니다.
> Claude Code는 이 문서를 **그대로 실행하는 것이 아니라**, 현재 코드베이스를 직접 분석한 뒤
> 이 계획의 현실성과 기술적 타당성을 평가하고, 필요시 수정/보완하여
> 실제 개발 가능한 형태의 최종 계획서를 만들어야 합니다.
>
> 특히 "🔍 결정 필요" 태그가 붙은 항목은 아직 확정되지 않은 사항으로,
> Claude Code가 코드 분석 후 최적 방안을 판단해야 합니다.

---

## 1. 문서 개요

### 1.1 목적
NEURALTWIN AI Assistant (챗봇)의 아키텍처를 개선하여,
현재 "데이터 조회기 + 네비게이터" 역할에서 **"분석가 + 어드바이저"** 역할로 전환한다.

### 1.2 목표 수준 정의

| Level | 역할 | 예시 | 현재 상태 |
|-------|------|------|-----------|
| Level 1 | 단순 조회 | "매출 얼마야?" → "1,234만원입니다" | ✅ 구현 완료 |
| Level 2 | 맥락 해석 | "매출 얼마야?" → "1,234만원이고, 전주 대비 12% 하락. 오후 시간대 전환율 급감이 주원인" | 🎯 1차 목표 |
| Level 3 | 원인 추론 + 액션 제안 | 위에 더해 "의류존 진열 변경 이후 시작된 패턴. 레이아웃 시뮬레이션을 돌려보시겠어요?" | 🎯 최종 목표 |
| Level 4 | 선제적 분석 + 자동 실행 | 사용자가 묻기 전에 문제 감지, 3D 시뮬레이션 자동 세팅 및 실행 | ❌ 이 계획 범위 밖 |

### 1.3 핵심 원칙

**AI 챗봇의 진짜 가치는 "수치 전달"이 아니라 "해석과 방향 제시"다.**

사용자가 대시보드에서 매출 1,200만원을 볼 수 있다. 프론트엔드가 이미 보여주고 있다.
사용자가 모르는 것은 "이게 좋은 건지 나쁜 건지, 왜 이렇게 됐는지, 뭘 해야 하는지"다.
따라서 챗봇은:
- 데이터를 **유연하게 읽을 수 있어야** 하고
- 그 데이터가 **프론트엔드 결과와 일치해야** 하고
- 결과값을 사용해서 **추론하고 분석**해서 사용자에게 **방향을 제시**해야 한다

---

## 2. 현재 상태 분석

### 2.1 현재 아키텍처

```
사용자 메시지
    ↓
[Gemini 인텐트 분류] — 전체 프롬프트 40KB+ 매번 전송
    ↓
intent + entities 추출
    ↓
분기: navigate / set_tab / query_kpi / run_simulation / general_chat / ...
    ↓
query_kpi → 미리 정의된 RPC 함수 호출 → 결과를 템플릿에 넣어 응답 조립
general_chat → Gemini 2차 호출 → 응답 생성
```

### 2.2 관련 파일 목록 (주요)

| 파일 경로 | 역할 | 크기 |
|-----------|------|------|
| `supabase/functions/neuraltwin-assistant/index.ts` | 메인 엔트리포인트, 전체 파이프라인 오케스트레이션 | ~330줄 |
| `supabase/functions/neuraltwin-assistant/intent/classifier.ts` | AI-First 인텐트 분류기 (캐시, AI 분류, 후처리 보정) | ~495줄 |
| `supabase/functions/neuraltwin-assistant/intent/entityExtractor.ts` | 패턴 기반 날짜/시간 추출기 | - |
| `supabase/functions/neuraltwin-assistant/constants/systemPrompt.ts` | 프롬프트 조립기 (assembler) | - |
| `supabase/functions/neuraltwin-assistant/constants/prompts/basePersona.ts` | 어시스턴트 페르소나 정의 | 2KB |
| `supabase/functions/neuraltwin-assistant/constants/prompts/queryTypeDefinitions.ts` | queryType 정의 (50+ types) | **18KB** |
| `supabase/functions/neuraltwin-assistant/constants/prompts/intentDefinitions.ts` | 인텐트 정의 (navigate ~ general_chat) | 9.5KB |
| `supabase/functions/neuraltwin-assistant/constants/prompts/disambiguationRules.ts` | 중의성 해소 규칙 | 4.5KB |
| `supabase/functions/neuraltwin-assistant/constants/prompts/responseFormat.ts` | 날짜 파싱 + JSON 스키마 + 주의사항 | 3.5KB |
| `supabase/functions/neuraltwin-assistant/constants/prompts/productCatalog.ts` | 상품 카탈로그 동적 주입 | 5KB |
| `supabase/functions/neuraltwin-assistant/utils/geminiClient.ts` | Gemini 2.5 Flash API 클라이언트 | 2.5KB |
| `supabase/functions/neuraltwin-assistant/utils/intentCache.ts` | 인텐트 캐시 (메모리) | 3.5KB |
| `supabase/functions/neuraltwin-assistant/actions/queryActions/` | KPI 조회 액션 (도메인별 모듈) | **147KB** |
| `supabase/functions/neuraltwin-assistant/actions/queryActions/rpcHelpers.ts` | RPC 호출 래퍼 함수들 | 5KB |
| `supabase/functions/neuraltwin-assistant/actions/queryActions/overviewQueries.ts` | 개요 탭 쿼리 처리 | 16KB |
| `supabase/functions/neuraltwin-assistant/actions/queryActions/storeQueries.ts` | 매장 탭 쿼리 처리 | 17KB |
| `supabase/functions/neuraltwin-assistant/actions/queryActions/customerQueries.ts` | 고객 탭 쿼리 처리 | 13KB |
| `supabase/functions/neuraltwin-assistant/actions/queryActions/productQueries.ts` | 상품 탭 쿼리 처리 | 10KB |
| `supabase/functions/neuraltwin-assistant/actions/queryActions/inventoryQueries.ts` | 재고 탭 쿼리 처리 | 18KB |
| `supabase/functions/neuraltwin-assistant/actions/queryActions/roiQueries.ts` | ROI 탭 쿼리 처리 | 10KB |
| `supabase/functions/neuraltwin-assistant/actions/queryActions/controlTowerQueries.ts` | 컨트롤타워 쿼리 처리 | 19KB |
| `supabase/functions/neuraltwin-assistant/actions/navigationActions.ts` | 네비게이션 액션 디스패처 | 17KB |
| `supabase/functions/neuraltwin-assistant/actions/executionActions.ts` | 시뮬레이션/최적화 실행 액션 | 19KB |
| `supabase/functions/neuraltwin-assistant/actions/chatActions.ts` | 일반 대화 처리 (Gemini 2차 호출) | 3.5KB |

### 2.3 현재 Gemini 사용 패턴

| 호출 시점 | 모델 | 용도 | input 토큰 (추정) | 비고 |
|-----------|------|------|-------------------|------|
| 인텐트 분류 | Gemini 2.5 Flash | 사용자 의도 + 엔티티 추출 | ~5,000~8,000 | 전체 프롬프트 매번 전송 |
| 일반 대화 응답 | Gemini 2.5 Flash | 자연어 응답 생성 | ~1,000 | general_chat일 때만 |
| API Gateway | Lovable API Gateway 경유 | - | - | `ai.gateway.lovable.dev` |

### 2.4 식별된 문제점

#### 문제 1: 프롬프트 비대화
- `queryTypeDefinitions.ts` 단일 파일이 18KB
- 전체 분류 프롬프트가 40KB+ (모든 모듈 합산)
- 50개 이상의 queryType이 하나의 프롬프트에 존재
- LLM의 "lost in the middle" 현상으로 정확도 저하 우려
- 인텐트/queryType 추가 시마다 프롬프트가 비대해지는 구조

#### 문제 2: 하드코딩 규칙 누적
- 프롬프트에 `⚠️ 최우선 규칙`, `주의`, `중요` 강조 표현 다수
- visitors vs footfall, visitors vs hourlyPattern, summary vs storeSummary 등 경계 케이스 규칙 누적
- 규칙 간 충돌 가능성 증가
- 실사용 오분류 → 규칙 추가 → 프롬프트 복잡도 증가의 악순환

#### 문제 3: "이해" 레이어 부재
- 사용자 메시지가 바로 intent + entities로 매핑
- 복합 질문("비 오는 날에 의류존 전환율이 떨어지나?") 처리 불가
- "왜?", "어떻게 해야 해?" 같은 분석형 질문에 대한 경로 없음
- 단일 queryType에 억지 매핑으로 엉뚱한 응답 가능

#### 문제 4: 대화 히스토리 미활용
- `handleGeneralChat(message, [], context)` — 빈 배열 전달
- 인텐트 분류 시 이전 대화 맥락 미포함
- "그럼 지난달은?" 같은 후속 질문에서 인텐트 분류 실패
- DB에 `chat_messages` 저장 중이나 활용하지 않음

#### 문제 5: Gemini 이중 호출
- general_chat 경로: 분류 1회 + 응답 생성 1회 = 2회
- 분류에 매번 40KB+ 프롬프트 전송 → 토큰 낭비
- "히트맵 켜줘" 같은 명확한 요청에도 Gemini 호출

#### 문제 6: 분석/추론 기능 부재 (핵심)
- 현재는 RPC 결과를 템플릿에 넣어 응답 → 단순 조회기
- 비교 데이터, 하위 분해 데이터 수집 안 함
- Gemini가 데이터를 해석/추론하는 경로 없음
- "왜 떨어졌지?" "뭘 해야 해?" 에 답할 수 없음

---

## 3. 목표 아키텍처 (Level 3)

### 3.1 전체 파이프라인

```
사용자 메시지
    ↓
[1단계: 의도 분류] ← 임베딩 유사도 or 로컬 분류 (빠르고 저렴)
    │                  애매하면 → Gemini 경량 라우터 (폴백)
    ↓
[2단계: 요청 유형 판별]
    ├── 단순 조회형 ("매출 얼마야?") → 기존 RPC 경로 (Level 1)
    ├── 분석형 ("매출 어때?", "왜 떨어졌어?") → 분석 파이프라인 (Level 2~3)
    ├── 네비게이션/UI제어 → 기존 경로 (코드 직접 처리)
    └── 일반 대화 → Gemini 응답 생성
    ↓
[3단계: 데이터 수집] ← 분석형일 경우
    │  현재 기간 KPI + 비교 기간 KPI + 관련 지표 + 하위 분해
    │  (RPC 병렬 호출, 미래: Text-to-SQL)
    ↓
[4단계: 분석 & 해석] ← Gemini가 수집된 데이터셋을 분석
    │  수치 비교, 원인 추론, 문제 지적
    ↓
[5단계: 액션 제안] ← 대시보드에서 할 수 있는 구체적 행동 제시
    │  시뮬레이션 추천, 탭 이동, 필터 변경 등
    ↓
사용자 응답 (메시지 + UI 액션 + 제안 버튼)
```

### 3.2 핵심 설계 원칙

1. **LLM에게는 의미론적 판단을, 코드에게는 결정론적 판단을**
   - 임베딩/LLM: "이 질문이 매출에 대한 건지 방문객에 대한 건지" 판단
   - 코드: "시간 숫자가 포함되어 있는가", "특정 존 이름이 언급되었는가" 판단

2. **데이터 정확성은 RPC가 보장, 해석은 LLM이 담당**
   - RPC 함수는 데이터를 정확하게 가져오는 역할 (변경 없음)
   - Gemini는 수집된 데이터를 해석하고 인사이트를 생성

3. **단순 요청은 빠르게, 분석 요청은 풍부하게**
   - "매출 얼마야?" → Gemini 호출 0~1회, 100ms 이내
   - "매출 왜 떨어졌어?" → 데이터 수집 + Gemini 분석, 2~3초 허용

4. **기존 기능은 유지하면서 점진적 확장**
   - 현재 동작하는 RPC 경로, 네비게이션 경로 등은 건드리지 않음
   - 분석 레이어를 "위에 얹는" 방식

---

## 4. 개선 계획 상세

### Phase 1: 대화 히스토리 활용

**목표:** 후속 질문 처리 가능, 대화 맥락 유지
**난이도:** 낮음 | **영향도:** 높음 | **기존 코드 변경:** 최소

#### 4.1.1 문제

```
사용자: "매출 얼마야?"
챗봇: "오늘 매출은 1,234만원입니다."
사용자: "그럼 지난달은?"
챗봇: ??? ← "지난달은?"만으로는 매출인지 방문객인지 알 수 없음
```

현재 `index.ts`에서 `handleGeneralChat(message, [], context)` — 빈 배열 전달.
인텐트 분류 시에도 이전 대화 맥락 미포함.

#### 4.1.2 해결 방안

**A) 최근 대화 원문 주입 (단기 컨텍스트)**

`index.ts`에서 대화 세션의 최근 N턴을 DB에서 조회하여 분류 프롬프트에 포함.

```typescript
// index.ts — 세션 생성 후, 인텐트 분류 전
const { data: recentMessages } = await supabase
  .from('chat_messages')
  .select('role, content')
  .eq('conversation_id', session.conversationId)
  .order('created_at', { ascending: false })
  .limit(6);  // 최근 3턴 (user+assistant 각 3개)

const conversationHistory = recentMessages?.reverse() || [];
```

분류 프롬프트에 추가:
```
## 최근 대화
사용자: "매출 얼마야?"
어시스턴트: "오늘 매출은 1,234만원입니다."
사용자: "그럼 지난달은?"  ← 현재 메시지
```

**B) 세션 요약 누적 (장기 컨텍스트)**

매 턴마다 `channel_data`에 세션 요약을 누적 저장.
5턴 이상 된 대화에서 전체 원문 대신 요약 + 최근 2턴 원문 사용.

```json
{
  "session_summary": [
    { "turn": 1, "intent": "query_kpi", "queryType": "revenue", "result": "1,234만원" },
    { "turn": 2, "intent": "query_kpi", "queryType": "conversion", "result": "3.2%" }
  ]
}
```

#### 4.1.3 적용 위치

| 파일 | 변경 내용 |
|------|-----------|
| `index.ts` | 인텐트 분류 전 최근 대화 조회 로직 추가 |
| `intent/classifier.ts` | `classifyIntent()` 파라미터에 `conversationHistory` 추가 |
| `constants/systemPrompt.ts` | 프롬프트 조립 시 대화 히스토리 섹션 추가 |
| `actions/chatActions.ts` | `handleGeneralChat()` 호출 시 실제 히스토리 전달 |

#### 4.1.4 토큰 영향

- 최근 3턴 원문: 약 200~500 토큰 추가
- 세션 요약: 약 100~200 토큰 추가
- 총 증가분 대비 후속 질문 처리 능력 확보 → 트레이드오프 유리

#### 4.1.5 🔍 결정 필요

- **최근 몇 턴까지 원문으로 포함할 것인가?** (후보: 2턴, 3턴, 5턴)
  - 토큰 비용 vs 맥락 유지 트레이드오프. Claude Code가 실제 평균 메시지 길이와 프롬프트 총 크기를 분석하여 판단
- **세션 요약을 DB에 별도 컬럼으로 저장할 것인가, channel_data에 넣을 것인가?**
  - `chat_messages.channel_data`에 이미 구조화된 데이터 저장 중이므로 활용 가능
  - 또는 `chat_sessions` 테이블에 `summary` 컬럼 추가
- **대화 히스토리를 인텐트 분류 프롬프트에 넣을 것인가, 별도 전처리 단계로 뺄 것인가?**
  - 프롬프트에 직접 넣기: 구현 단순, 프롬프트 크기 증가
  - 별도 전처리: "그럼 지난달은?" → "지난달 매출" 으로 변환 후 분류기에 전달 (Gemini 추가 호출 필요)

---

### Phase 2: 후처리 보정 레이어 강화 + Few-shot 전환

**목표:** 프롬프트 규칙 의존도 감소, 분류 정확도 향상
**난이도:** 중간 | **영향도:** 중간 | **기존 코드 변경:** 중간

#### 4.2.1 문제

프롬프트에 `⚠️ 최우선 규칙` 같은 하드코딩 규칙 6~7개가 누적.
규칙이 늘어날수록 Gemini가 우선순위를 혼동하고, 프롬프트가 비대해짐.

#### 4.2.2 해결 방안

**A) 결정론적 규칙 → 코드 후처리로 이관**

현재 프롬프트에 있는 규칙 중, 코드로 100% 정확하게 판별 가능한 것들을 `classifier.ts`의 후처리 함수로 이동.

이관 대상 규칙 목록:

| 현재 프롬프트 규칙 | 코드 후처리 로직 |
|-------------------|-----------------|
| visitors + 특정시간(N시) → hourlyPattern | `extractHour()` 결과 있으면 queryType 강제 보정 |
| "개요" 포함 → summary, "매장" 포함 → storeSummary | 키워드 포함 여부로 보정 |
| visitors vs footfall ("몇 명" vs "몇 번") | 정규식 패턴 매칭 |
| 카테고리명/상품명이 포함된 판매량 → unitsSold 아님 | 상품 카탈로그 대조 (이미 `disambiguateCategoryVsProduct` 존재) |
| "탭" + "보여줘" → set_tab (query_kpi 아님) | "탭" 키워드 + 네비게이션 동사 패턴 |

```typescript
// classifier.ts — 강화된 후처리
function postCorrect(classification: ClassificationResult, message: string): ClassificationResult {
  const { intent, entities } = classification;
  
  // 규칙 1: visitors + hour → hourlyPattern
  if (intent === 'query_kpi' && entities.queryType === 'visitors') {
    const hour = extractHour(message);
    if (hour !== null) {
      entities.queryType = 'hourlyPattern';
      entities.hour = hour;
    }
  }
  
  // 규칙 2: summary vs storeSummary
  if (intent === 'query_kpi' && ['summary', 'storeSummary'].includes(entities.queryType)) {
    if (/매장/.test(message)) entities.queryType = 'storeSummary';
    else if (/개요/.test(message)) entities.queryType = 'summary';
  }
  
  // 규칙 3: visitors vs footfall
  if (intent === 'query_kpi' && entities.queryType === 'visitors') {
    if (/몇\s*번|몇\s*회|횟수|번\s*(입장|들어)/.test(message)) {
      entities.queryType = 'footfall';
    }
  }
  
  // ... 추가 규칙들
  return classification;
}
```

**B) 의미론적 규칙 → Few-shot 예시로 전환**

LLM이 판단해야 하는 규칙은 규칙 서술 대신 입출력 예시로 보여줌.

변환 전 (규칙 서술):
```
⚠️ 최우선 규칙: 메시지에 특정 시간("N시")이 포함되고 방문/트래픽을
묻는 질문은 무조건 hourlyPattern으로 분류. visitors로 분류하면 안 됨.
```

변환 후 (Few-shot 예시):
```
## 분류 예시
입력: "12시 방문자 몇명이야?"
→ {"intent":"query_kpi","queryType":"hourlyPattern","hour":12}

입력: "방문객 몇명이야?"
→ {"intent":"query_kpi","queryType":"visitors"}

입력: "오후 3시에 사람 몇명 왔어?"
→ {"intent":"query_kpi","queryType":"hourlyPattern","hour":15}
```

#### 4.2.3 적용 위치

| 파일 | 변경 내용 |
|------|-----------|
| `intent/classifier.ts` | `postCorrect()` 함수 추가/강화, `classifyIntent()` 반환 전 호출 |
| `constants/prompts/queryTypeDefinitions.ts` | ⚠️ 규칙 서술 제거, Few-shot 예시로 대체 |
| `constants/prompts/disambiguationRules.ts` | 코드로 이관 가능한 규칙 제거, 의미론적 규칙만 유지 |

#### 4.2.4 🔍 결정 필요

- **Few-shot 예시를 몇 개까지 포함할 것인가?**
  - 도메인당 3~5개면 충분한지, 경계 케이스까지 포함하면 10개+ 필요한지
  - 토큰 대비 정확도 개선 효과 측정 필요
- **현재 `transformEntities()`와 새 `postCorrect()`를 통합할 것인가, 분리할 것인가?**
  - `transformEntities()`는 AI 응답을 내부 형식으로 변환 (형식 변환)
  - `postCorrect()`는 분류 결과를 보정 (로직 보정)
  - 역할이 다르므로 분리 유지가 나을 수 있으나, Claude Code가 코드 흐름 분석 후 판단

---

### Phase 3: 2단계 계층적 분류 구조

**목표:** 프롬프트 크기 감소, 분류 정확도 향상, Gemini 호출 최적화
**난이도:** 높음 | **영향도:** 높음 | **기존 코드 변경:** 큼 (핵심 리팩토링)

#### 4.3.1 문제

현재 50개+ queryType이 하나의 프롬프트에 존재.
"50개 중 1개 고르기"는 LLM에게 어렵고, 프롬프트가 클수록 정확도 저하.

#### 4.3.2 해결 방안: 2단계 분류

**1단계 — 도메인 라우터 (경량)**

사용자 메시지를 13개 도메인 중 하나로 분류. 프롬프트 크기: ~2KB

```
도메인 목록:
- overview: 개요 관련 (매출, 전환율, 객단가, 퍼널, 목표 등)
- store: 매장 관련 (존, 체류시간, 피크타임, 시간대별 등)
- customer: 고객 관련 (방문객, 세그먼트, 재방문 등)
- product: 상품 관련 (베스트셀러, 카테고리, TOP 등)
- inventory: 재고 관련 (재고현황, 과잉재고, 부족경고 등)
- prediction: 예측 관련
- ai_recommendation: AI추천 관련
- control_tower: 데이터 컨트롤타워 관련
- roi: ROI 측정 관련
- settings: 설정 관련
- studio_control: 3D 스튜디오 제어 (오버레이, 시뮬레이션 등)
- navigation: 페이지/탭 이동
- general_chat: 일반 대화
```

**2단계 — 도메인 전문 분류기 (조건부 호출)**

1단계 결과에 따라 해당 도메인 전용 프롬프트만 로드하여 세부 분류.

예: `customer` 도메인이면 아래 queryType들만 프롬프트에 포함:
- visitors, newVsReturning, repeatRate, customerSegment, loyalCustomers
- segmentAvgPurchase, segmentVisitFrequency, segmentDetail, returnTrend
(9개 — 현재 50개+ 대비 1/5 이하)

**단순 도메인은 2단계 Gemini 호출 불필요:**
- `navigation`: 코드 기반 패턴 매칭으로 page/tab 추출
- `studio_control`: 키워드 기반으로 overlay/command 추출
- 이런 도메인은 1단계 분류 후 바로 코드 처리

#### 4.3.3 구현 구조

```typescript
// 새 파일: intent/domainRouter.ts
async function routeToDomain(message: string, context: any): Promise<{
  domain: string;
  confidence: number;
  method: 'local' | 'embedding' | 'ai';
}> {
  // 1차: 로컬 키워드 매칭 (빠른 경로)
  const localResult = classifyDomainLocal(message);
  if (localResult.confidence >= 0.85) {
    return { ...localResult, method: 'local' };
  }
  
  // 2차: 임베딩 유사도 (중간 경로) — Phase 4에서 도입
  // const embeddingResult = await classifyDomainByEmbedding(message);
  // if (embeddingResult.confidence >= 0.75) {
  //   return { ...embeddingResult, method: 'embedding' };
  // }
  
  // 3차: Gemini 경량 라우터 (폴백)
  const aiResult = await classifyDomainByAI(message, context);
  return { ...aiResult, method: 'ai' };
}

// 새 파일: intent/domainClassifiers/{domain}.ts
// 각 도메인별 세부 분류기
async function classifyCustomerQuery(message: string, context: any): Promise<ClassificationResult> {
  // customer 도메인 전용 프롬프트 사용
  // visitors, customerSegment, repeatRate 등 9개만 포함
}
```

```typescript
// 리팩토링된 classifier.ts
async function classifyIntent(message, context, loadProductCatalog) {
  // 캐시 확인 (기존 로직 유지)
  const cached = getCachedIntent(message, context?.page?.tab);
  if (cached) return { ...cached, method: 'cache' };
  
  // 1단계: 도메인 라우팅
  const { domain, confidence, method } = await routeToDomain(message, context);
  
  // 단순 도메인: 코드 직접 처리
  if (SIMPLE_DOMAINS.includes(domain)) {
    return handleSimpleDomain(domain, message, context);
  }
  
  // 2단계: 도메인별 세부 분류
  const domainClassifier = DOMAIN_CLASSIFIERS[domain];
  const result = await domainClassifier(message, context, loadProductCatalog);
  
  // 후처리 보정
  const corrected = postCorrect(result, message);
  
  // 캐시 저장
  setCachedIntent(message, corrected.intent, corrected.confidence, corrected.entities);
  
  return corrected;
}
```

#### 4.3.4 도메인별 프롬프트 분리

현재 `constants/prompts/` 디렉토리를 확장:

```
constants/prompts/
├── basePersona.ts          (유지)
├── responseFormat.ts        (유지, 공통)
├── domainRouter.ts          (신규: 1단계 도메인 분류 프롬프트)
├── domains/
│   ├── overview.ts          (개요 도메인 전용 프롬프트)
│   ├── store.ts             (매장 도메인 전용 프롬프트)
│   ├── customer.ts          (고객 도메인 전용 프롬프트)
│   ├── product.ts           (상품 도메인 전용 프롬프트)
│   ├── inventory.ts         (재고 도메인 전용 프롬프트)
│   ├── roi.ts               (ROI 도메인 전용 프롬프트)
│   ├── controlTower.ts      (컨트롤타워 도메인 전용 프롬프트)
│   └── settings.ts          (설정 도메인 전용 프롬프트)
├── productCatalog.ts        (유지, product/inventory 도메인에만 주입)
└── disambiguationRules.ts   (축소: 도메인 간 중의성 규칙만 유지)
```

#### 4.3.5 토큰 영향

| 경로 | 현재 | 개선 후 |
|------|------|---------|
| 명확한 네비게이션/UI | ~5,000 input | ~0 (코드 처리) |
| 일반 KPI 조회 | ~5,000 input | ~500 (1단계) + ~2,000 (2단계) = ~2,500 |
| 애매한 요청 | ~5,000 input | ~500 (1단계) + ~2,000 (2단계) = ~2,500 |
| 일반 대화 | ~5,000 + ~1,000 = ~6,000 | ~500 (1단계) + ~1,000 (응답) = ~1,500 |

#### 4.3.6 🔍 결정 필요

- **1단계 도메인 라우터를 Gemini 호출로 할 것인가, 로컬/임베딩으로 할 것인가?**
  - 후보 A: Gemini 경량 프롬프트 (~2KB) — 가장 정확하지만 호출 비용
  - 후보 B: 로컬 키워드 매칭 + Gemini 폴백 — 40~50% 로컬 처리, 나머지 Gemini
  - 후보 C: 임베딩 유사도 (Phase 4에서 도입) + Gemini 폴백 — 가장 효율적이지만 인프라 추가
  - **권장:** 초기에는 후보 B로 시작, Phase 4에서 후보 C로 전환
- **도메인 분류 결과를 캐싱할 것인가?**
  - 현재 `intentCache.ts`가 full classification을 캐싱 중
  - 2단계 구조에서는 1단계 결과도 별도 캐싱하면 2단계 호출 자체를 스킵 가능
- **`queryTypeDefinitions.ts` (18KB)를 어떻게 분해할 것인가?**
  - 현재 한 파일에 모든 queryType. 도메인별로 분리 시 기존 import 구조 변경 필요
  - Claude Code가 현재 import/export 패턴을 분석하여 안전한 분리 방법 결정

---

### Phase 4: 인텐트 분류 최적화 (임베딩 기반 도입)

**목표:** Gemini 생성 호출 의존도 감소, 비용 절감, 응답 속도 향상
**난이도:** 높음 | **영향도:** 높음 | **기존 코드 변경:** 중간 (새 모듈 추가)

> Phase 3의 2단계 분류 구조가 안정된 후 진행

#### 4.4.1 임베딩 기반 분류 개요

각 인텐트/queryType별로 대표 문장을 미리 임베딩(벡터 변환)해서 저장.
런타임에는 사용자 메시지를 임베딩하여 저장된 벡터와 코사인 유사도 비교.

```
"오늘 장사 좀 됐나?" → 임베딩 → [0.78, 0.19, ...]
    ↓ 유사도 비교
revenue "매출 얼마야?" [0.82, 0.15, ...] → 유사도 0.91 ✅
visitors "방문객 몇명?" [0.12, 0.88, ...] → 유사도 0.34
```

키워드가 하나도 겹치지 않아도 의미적 유사성으로 분류 가능.

#### 4.4.2 구현 요소

**A) 대표 문장 정의**

```typescript
// 새 파일: intent/embeddings/seedSentences.ts
export const SEED_SENTENCES: Record<string, string[]> = {
  // 도메인별로 그룹핑 가능
  revenue: [
    "매출 얼마야?", "오늘 매상 알려줘", "얼마나 벌었어?",
    "수익 보여줘", "매출 현황", "오늘 장사 어때?", "매출이 궁금해",
  ],
  visitors: [
    "방문객 몇 명이야?", "오늘 손님 얼마나 왔어?", "사람 몇 명 왔어?",
    "고객수 알려줘", "오늘 트래픽 어때?",
  ],
  // ... 50개+ queryType/intent 전부
  // 기존 queryTypeDefinitions.ts의 예시 문장을 구조화하여 활용
  
  // 네비게이션
  "navigate_insights": [
    "인사이트 허브로 가줘", "인사이트 페이지", "분석 화면 보여줘",
  ],
  
  // 스튜디오 제어
  "toggle_heatmap": [
    "히트맵 켜줘", "히트맵 보여줘", "히트맵 꺼", "heatmap on",
  ],
  // ...
};
```

**B) 임베딩 생성 및 저장**

```sql
-- 마이그레이션: pgvector 활성화 + 테이블 생성
create extension if not exists vector;

create table intent_embeddings (
  id uuid primary key default gen_random_uuid(),
  intent text not null,           -- 'query_kpi', 'navigate', 'toggle_overlay' 등
  query_type text,                -- 'revenue', 'visitors' 등 (query_kpi일 때)
  domain text not null,           -- 'overview', 'customer' 등
  sentence text not null,         -- 대표 문장 원문
  embedding vector(768),          -- 임베딩 벡터 (Gemini embedding 차원수에 맞춤)
  is_seed boolean default true,   -- 초기 문장 vs 자동 학습
  created_at timestamptz default now(),
  
  unique(sentence)                -- 중복 문장 방지
);

-- 유사도 검색 인덱스
create index idx_intent_embeddings_vector
  on intent_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 20);             -- 350개 벡터 기준 적절한 lists 수
```

**C) 임베딩 생성 Edge Function**

```typescript
// 새 함수: supabase/functions/generate-intent-embeddings/index.ts
// 배포 시 또는 관리자가 수동으로 실행

// 1. SEED_SENTENCES 로드
// 2. 각 문장을 Gemini Embedding API로 벡터 변환
// 3. intent_embeddings 테이블에 upsert
```

**D) 런타임 분류 흐름**

```typescript
// 새 파일: intent/embeddingClassifier.ts

// 콜드스타트 시 DB에서 전체 임베딩 로드 → 메모리 캐싱
let cachedEmbeddings: EmbeddingEntry[] | null = null;

async function classifyByEmbedding(
  message: string,
  supabase: SupabaseClient
): Promise<{ intent: string; queryType?: string; confidence: number } | null> {
  
  // 1. 캐시 로드 (콜드스타트 시 1회)
  if (!cachedEmbeddings) {
    const { data } = await supabase
      .from('intent_embeddings')
      .select('intent, query_type, domain, embedding');
    cachedEmbeddings = data;
  }
  
  // 2. 사용자 메시지 임베딩 (Gemini Embedding API 1회 호출)
  const messageVector = await getEmbedding(message);
  
  // 3. 코사인 유사도 비교
  const scored = cachedEmbeddings.map(entry => ({
    ...entry,
    similarity: cosineSimilarity(messageVector, entry.embedding),
  }));
  
  // 4. 상위 결과 확인
  scored.sort((a, b) => b.similarity - a.similarity);
  const top = scored[0];
  
  if (top.similarity >= 0.80) {
    return {
      intent: top.intent,
      queryType: top.query_type,
      confidence: top.similarity,
    };
  }
  
  return null; // 폴백: Gemini 분류로
}
```

**E) 자동 학습 (피드백 루프)**

Gemini 폴백으로 분류된 결과를 자동으로 임베딩 DB에 추가.
시간이 갈수록 Gemini 폴백 비율 감소.

```typescript
// classifier.ts — Gemini 분류 성공 후
if (classification.method === 'ai' && classification.confidence >= 0.8) {
  // 비동기로 임베딩 생성 및 저장 (응답 지연 없음)
  queueEmbeddingCreation(message, classification.intent, classification.entities.queryType);
}
```

#### 4.4.3 🔍 결정 필요

- **임베딩 모델 선택:**
  - 후보 A: Gemini Embedding API (`text-embedding-004`) — 현재 인프라(Lovable API Gateway) 호환 확인 필요
  - 후보 B: OpenAI Embedding API (`text-embedding-3-small`) — 범용적이나 별도 API 키 필요
  - 후보 C: Supabase 내장 embedding (pg_embedding 확장)
  - **핵심:** Lovable API Gateway가 임베딩 API도 지원하는지 확인 필요. 지원하지 않으면 별도 API 연동 필요
- **벡터 차원수:** 모델에 따라 다름 (Gemini: 768, OpenAI small: 1536). DB 스키마에 영향
- **pgvector 활성화 여부:** Supabase 프로젝트에서 pgvector 확장이 활성화되어 있는지 확인 필요
- **임베딩 캐싱 전략:**
  - 후보 A: Edge Function 메모리 캐싱 (콜드스타트마다 DB 조회)
  - 후보 B: DB에서 직접 유사도 검색 (pgvector의 `<=>` 연산자)
  - 후보 C: 하이브리드 (메모리 캐시 + DB 폴백)
- **자동 학습 시 품질 관리:**
  - 잘못 분류된 결과가 임베딩 DB에 들어가면 오염 발생
  - confidence 임계값, 관리자 검수 프로세스 필요 여부

---

### Phase 5: 분석 파이프라인 구축 (Level 2 → Level 3)

**목표:** 단순 조회에서 분석/추론/제안으로 전환
**난이도:** 높음 | **영향도:** 매우 높음 | **기존 코드 변경:** 큼 (새 레이어 추가)

> 이 Phase가 Level 2~3 도달의 핵심. Phase 1~4는 이를 위한 기반.

#### 4.5.1 요청 유형 분기

기존 분류 결과에 "분석 의도" 여부를 추가 판별.

```
단순 조회: "매출 얼마야?" → 기존 RPC 경로 (Level 1 응답)
분석 요청: "매출 어때?" "왜 떨어졌어?" "어떻게 해야 해?" → 분석 파이프라인
```

**분석 의도 신호 감지:**
- 키워드: "어때", "왜", "원인", "이유", "어떻게", "문제", "개선", "방향", "분석", "비교"
- 패턴: "~인 거 같은데", "~하는 느낌인데", "좀 안 되는데"
- 후속 질문: "그래서?", "더 자세히", "뭘 해야 해?"

```typescript
// 새 파일: intent/analysisDetector.ts
function detectAnalysisIntent(message: string, classification: ClassificationResult): AnalysisLevel {
  // Level 1: 단순 조회 (기본)
  // Level 2: 맥락 해석 (비교 + 원인 힌트)
  // Level 3: 원인 추론 + 액션 제안

  const analysisKeywords = /어때|왜|원인|이유|어떻게|문제|개선|방향|분석|비교|추세|추이|변화/;
  const deepAnalysisKeywords = /왜.*떨어|왜.*하락|왜.*감소|원인.*뭐|어떻게.*해야|뭘.*해야|개선.*방안/;
  
  if (deepAnalysisKeywords.test(message)) return 'level3';
  if (analysisKeywords.test(message)) return 'level2';
  return 'level1';
}
```

#### 4.5.2 분석 컨텍스트 수집기 (Analysis Context Collector)

분석형 요청이 감지되면, 단일 RPC가 아닌 관련 데이터를 병렬 수집.

```typescript
// 새 파일: analysis/contextCollector.ts

interface AnalysisContext {
  primary: any;          // 요청된 주요 지표
  comparison: any;       // 비교 기간 데이터
  relatedMetrics: any;   // 관련 지표들
  breakdown: any;        // 하위 분해 데이터
  historicalPattern?: any; // 과거 유사 패턴 (Level 3)
}

async function collectAnalysisContext(
  supabase: SupabaseClient,
  queryType: string,
  storeId: string,
  orgId: string,
  dateRange: DateRange,
  analysisLevel: 'level2' | 'level3'
): Promise<AnalysisContext> {
  
  // queryType별 수집 전략 정의
  const strategy = COLLECTION_STRATEGIES[queryType];
  
  // 병렬 데이터 수집
  const [primary, comparison, relatedMetrics, breakdown] = await Promise.all([
    strategy.primary(supabase, orgId, storeId, dateRange),
    strategy.comparison(supabase, orgId, storeId, getComparisonRange(dateRange)),
    strategy.relatedMetrics(supabase, orgId, storeId, dateRange),
    strategy.breakdown(supabase, orgId, storeId, dateRange),
  ]);
  
  let historicalPattern = null;
  if (analysisLevel === 'level3') {
    historicalPattern = await strategy.historicalPattern?.(supabase, orgId, storeId, dateRange);
  }
  
  return { primary, comparison, relatedMetrics, breakdown, historicalPattern };
}
```

**수집 전략 예시 (revenue 쿼리):**

```typescript
// 새 파일: analysis/strategies/revenueStrategy.ts

const revenueStrategy: CollectionStrategy = {
  // 현재 기간 매출
  primary: (supabase, orgId, storeId, range) =>
    rpcOverviewKpis(supabase, orgId, storeId, range.startDate, range.endDate),
  
  // 비교 기간 매출 (전주 동기간)
  comparison: (supabase, orgId, storeId, range) =>
    rpcOverviewKpis(supabase, orgId, storeId, range.startDate, range.endDate),
  
  // 관련 지표 (전환율, 방문자, 객단가 — 매출 구성 요소)
  relatedMetrics: async (supabase, orgId, storeId, range) => {
    // rpcOverviewKpis가 이미 이 데이터를 포함하고 있다면 primary 결과 재사용
    // 아니면 별도 호출
    return null; // Claude Code가 실제 RPC 반환값 확인 후 구현
  },
  
  // 하위 분해 (존별 매출)
  breakdown: (supabase, orgId, storeId, range) =>
    rpcZoneMetrics(supabase, orgId, storeId, range.startDate, range.endDate),
  
  // 과거 유사 패턴 (Level 3)
  historicalPattern: async (supabase, orgId, storeId, range) => {
    // 지난 4주 같은 요일 데이터 등
    // 🔍 구체적인 RPC 또는 직접 쿼리 방식은 Claude Code가 판단
    return null;
  },
};
```

#### 4.5.3 분석 프롬프트 설계

수집된 데이터를 Gemini에게 전달하여 분석/해석 요청.

```typescript
// 새 파일: analysis/analysisPrompt.ts

function buildAnalysisPrompt(
  queryType: string,
  analysisLevel: 'level2' | 'level3',
  context: AnalysisContext,
  userMessage: string
): string {
  const parts: string[] = [];
  
  parts.push(`당신은 리테일 매장 운영 분석가입니다.`);
  parts.push(`사용자 질문: "${userMessage}"`);
  parts.push(`아래 데이터를 기반으로 분석하세요.`);
  
  // 데이터 섹션
  parts.push(`\n## 현재 기간 데이터`);
  parts.push(formatDataForPrompt(context.primary));
  
  if (context.comparison) {
    parts.push(`\n## 비교 기간 데이터`);
    parts.push(formatDataForPrompt(context.comparison));
  }
  
  if (context.breakdown) {
    parts.push(`\n## 세부 분석 (존별/카테고리별)`);
    parts.push(formatDataForPrompt(context.breakdown));
  }
  
  if (context.historicalPattern) {
    parts.push(`\n## 과거 패턴 참고`);
    parts.push(formatDataForPrompt(context.historicalPattern));
  }
  
  // 분석 요구사항
  if (analysisLevel === 'level2') {
    parts.push(`\n## 분석 요구사항`);
    parts.push(`1. 핵심 변화를 수치와 함께 요약하세요.`);
    parts.push(`2. 가장 주목해야 할 포인트 1~2개를 지적하세요.`);
    parts.push(`3. 간결하게 2~3문장으로 응답하세요.`);
  } else if (analysisLevel === 'level3') {
    parts.push(`\n## 분석 요구사항`);
    parts.push(`1. 핵심 변화를 수치와 함께 요약하세요.`);
    parts.push(`2. 변화의 원인을 데이터 기반으로 추론하세요.`);
    parts.push(`3. 구체적인 개선 액션을 제안하세요.`);
    parts.push(`   - 가능한 액션: 특정 탭으로 이동하여 상세 확인, 시뮬레이션 실행, 필터 변경, 특정 존/상품 집중 분석`);
    parts.push(`4. 간결하게 3~5문장으로 응답하세요.`);
  }
  
  // 응답 형식
  parts.push(`\n## 응답 형식 (JSON)`);
  parts.push(`{`);
  parts.push(`  "analysis": "분석 결과 메시지 (한국어, 마크다운 가능)",`);
  parts.push(`  "keyFindings": ["핵심 발견사항1", "핵심 발견사항2"],`);
  parts.push(`  "suggestedActions": [`);
  parts.push(`    { "type": "navigate|simulate|filter|deep_dive", "description": "사용자에게 보여줄 설명", "params": {} }`);
  parts.push(`  ]`);
  parts.push(`}`);
  
  return parts.join('\n');
}
```

#### 4.5.4 분석 결과 → UI 액션 변환

Gemini의 분석 결과에서 `suggestedActions`를 기존 UI 액션 체계로 변환.

```typescript
// 새 파일: analysis/actionMapper.ts

function mapAnalysisActions(
  suggestedActions: SuggestedAction[]
): { uiActions: UIAction[], suggestions: string[] } {
  const uiActions: UIAction[] = [];
  const suggestions: string[] = [];
  
  for (const action of suggestedActions) {
    switch (action.type) {
      case 'navigate':
        uiActions.push({ type: 'navigate', page: action.params.page, tab: action.params.tab });
        suggestions.push(action.description);
        break;
      case 'simulate':
        suggestions.push(`🔬 ${action.description}`);
        break;
      case 'deep_dive':
        suggestions.push(`🔍 ${action.description}`);
        break;
    }
  }
  
  return { uiActions, suggestions };
}
```

#### 4.5.5 전체 분석 파이프라인 통합

```typescript
// index.ts에서의 분석 파이프라인 호출

} else if (classification.intent === 'query_kpi') {
  const analysisLevel = detectAnalysisIntent(message, classification);
  
  if (analysisLevel === 'level1') {
    // 기존 경로: RPC → 템플릿 응답
    const queryResult = await handleQueryKpi(supabase, classification, storeId, pageContext, orgId);
    actionResult = { actions: queryResult.actions, message: queryResult.message, suggestions: queryResult.suggestions };
    
  } else {
    // 분석 경로: 데이터 수집 → Gemini 분석 → 액션 매핑
    const analysisContext = await collectAnalysisContext(
      supabase, classification.entities.queryType,
      storeId, orgId, dateRange, analysisLevel
    );
    
    const analysisPrompt = buildAnalysisPrompt(
      classification.entities.queryType, analysisLevel,
      analysisContext, message
    );
    
    const analysisResult = await callGemini(
      [{ role: 'user', content: analysisPrompt }],
      { jsonMode: true, temperature: 0.3, maxTokens: 1024 }
    );
    
    const parsed = parseJsonResponse(analysisResult.content);
    const { uiActions, suggestions } = mapAnalysisActions(parsed.suggestedActions);
    
    actionResult = {
      actions: uiActions,
      message: parsed.analysis,
      suggestions,
    };
  }
}
```

#### 4.5.6 수집 전략 매트릭스

각 queryType(또는 도메인)별로 어떤 추가 데이터를 수집하는지 정의.

| queryType | primary | comparison | relatedMetrics | breakdown | historicalPattern |
|-----------|---------|------------|---------------|-----------|-------------------|
| revenue | overview KPIs | 전주 동기간 KPIs | 전환율, 방문자, 객단가 | 존별 매출 | 지난 4주 동요일 매출 |
| visitors | overview KPIs | 전주 동기간 | 전환율 | 시간대별 방문자 | 지난 4주 동요일 방문 |
| conversion | overview KPIs | 전주 동기간 | 방문자, 매출 | 존별 전환율 | 과거 전환율 추이 |
| storeSummary | overview KPIs + zone metrics | 전주 동기간 | 시간대별 패턴 | 존별 비교 | - |
| customerSegment | segments | 전기간 segments | 방문빈도, 구매액 | 세그먼트별 상세 | 세그먼트 변동 추이 |
| product/topProducts | product perf | 전기간 product perf | 재고 상태 | 카테고리별 | - |
| inventory | inventory status | - | 판매 속도 | 카테고리별 재고 | 과잉/부족 추이 |

> 🔍 **Claude Code 작업:** 각 queryType의 실제 RPC 함수가 어떤 데이터를 반환하는지 확인하고,
> comparison과 relatedMetrics를 위해 추가 RPC 호출이 필요한지, 기존 RPC 결과를 재활용할 수 있는지 판단해야 함.
> 특히 `rpcOverviewKpis`가 이미 전환율, 방문자, 객단가를 함께 반환한다면 별도 호출 불필요.

#### 4.5.7 🔍 결정 필요

- **비교 기간을 어떻게 결정할 것인가?**
  - 후보 A: 항상 동일 길이의 직전 기간 (7일 → 직전 7일)
  - 후보 B: 같은 요일 기준 (이번주 월~금 → 지난주 월~금)
  - 후보 C: 사용자가 선택하게 하거나, Gemini가 질문 맥락에서 추론
  - **권장:** 기본은 후보 A, "전주 대비", "지난달 대비" 같은 키워드가 있으면 그에 맞춤
- **분석 프롬프트에 basePersona를 포함할 것인가?**
  - 분석 프롬프트는 분류 프롬프트와 별도이므로, 분석 전용 페르소나를 정의할 수 있음
  - 또는 공통 basePersona를 공유
- **분석 응답의 최대 길이 제한:**
  - Level 2: 2~3문장 (간결)
  - Level 3: 3~5문장 + 액션 제안
  - maxTokens를 얼마로 설정할지
- **기존 Level 1 응답과 분석 응답을 어떻게 구분하여 프론트에 전달할 것인가?**
  - 응답 JSON에 `analysisLevel` 필드 추가?
  - 프론트엔드에서 분석 응답을 별도 UI로 렌더링할 것인가?
  - 이건 프론트엔드 측 변경사항이므로 백엔드 설계 시 고려만 해두면 됨

---

## 5. 데이터 흐름 비교

### 5.1 현재 (Level 1)

```
"매출 얼마야?"
    ↓
[Gemini 분류] — 40KB+ 프롬프트
    ↓
intent: query_kpi, queryType: revenue
    ↓
[rpcOverviewKpis] — 단일 RPC
    ↓
"오늘 매출은 1,234만원입니다." — 템플릿 응답
```

### 5.2 개선 후 Level 1 (단순 조회 — 변경 최소)

```
"매출 얼마야?"
    ↓
[임베딩 분류] — 빠르고 저렴 (또는 로컬 키워드)
    ↓
intent: query_kpi, queryType: revenue, analysisLevel: 1
    ↓
[rpcOverviewKpis] — 기존과 동일
    ↓
"오늘 매출은 1,234만원입니다." — 기존 템플릿 응답 (변경 없음)
```

### 5.3 개선 후 Level 2 (맥락 해석)

```
"매출 어때?"
    ↓
[임베딩 분류] → revenue
[분석 의도 감지] → "어때" → level2
    ↓
[분석 컨텍스트 수집 — 병렬]
├── rpcOverviewKpis(현재) → 매출 1,234만
├── rpcOverviewKpis(전주) → 매출 1,402만
├── (관련지표는 위 결과에 포함)
└── rpcZoneMetrics(현재) → 존별 매출
    ↓
[Gemini 분석] — 수집된 데이터 + 분석 프롬프트
    ↓
"매출이 1,234만원으로 전주 대비 12% 하락했습니다. 방문자는 비슷한데 
전환율이 3.8%→3.1%로 떨어졌네요. 특히 의류존 매출이 18% 급감한 게 
주원인으로 보입니다."
+ 제안: ["의류존 상세 분석", "시간대별 패턴 확인"]
```

### 5.4 개선 후 Level 3 (원인 추론 + 액션)

```
"매출이 왜 이렇게 떨어졌어?"
    ↓
[임베딩 분류] → revenue
[분석 의도 감지] → "왜" + "떨어졌어" → level3
    ↓
[분석 컨텍스트 수집 — 확장 병렬]
├── rpcOverviewKpis(현재)
├── rpcOverviewKpis(전주)
├── rpcZoneMetrics(현재)
├── rpcZoneMetrics(전주)            ← Level 3 추가
└── rpcHourlyVisitors(현재+전주)    ← Level 3 추가
    ↓
[Gemini 분석 — Level 3 프롬프트]
    ↓
"매출 12% 하락의 주원인은 의류존 전환율 저하입니다 (18% 급감).
시간대별로 보면 오후 2~4시에 집중적으로 하락했고, 이 시간대 
의류존 체류시간도 함께 줄었습니다. 진열 변경이나 프로모션 
영향일 가능성이 높으니, 디지털트윈에서 레이아웃 시뮬레이션을 
돌려보시겠어요?"
+ 제안: ["🔬 의류존 레이아웃 시뮬레이션", "🔍 오후 시간대 상세 분석"]
+ UI액션: [navigate → /studio]
```

---

## 6. 새로운 파일/모듈 구조

### 6.1 추가될 파일 목록

```
supabase/functions/neuraltwin-assistant/
├── intent/
│   ├── classifier.ts              (리팩토링: 2단계 분류 오케스트레이션)
│   ├── domainRouter.ts            (신규: 1단계 도메인 라우터)
│   ├── domainClassifiers/         (신규: 도메인별 2단계 분류기)
│   │   ├── overview.ts
│   │   ├── store.ts
│   │   ├── customer.ts
│   │   ├── product.ts
│   │   ├── inventory.ts
│   │   ├── roi.ts
│   │   ├── controlTower.ts
│   │   ├── settings.ts
│   │   └── simpleDomains.ts       (navigation, studio_control 등 코드 처리)
│   ├── postCorrector.ts           (신규: 후처리 보정 레이어)
│   ├── analysisDetector.ts        (신규: 분석 의도 감지)
│   ├── embeddingClassifier.ts     (신규: 임베딩 기반 분류 - Phase 4)
│   ├── entityExtractor.ts         (기존 유지)
│   └── embeddings/
│       └── seedSentences.ts       (신규: 대표 문장 정의 - Phase 4)
│
├── analysis/                      (신규 디렉토리: 분석 파이프라인)
│   ├── contextCollector.ts        (분석 컨텍스트 수집기)
│   ├── analysisPrompt.ts          (분석 프롬프트 빌더)
│   ├── actionMapper.ts            (분석 결과 → UI 액션 변환)
│   └── strategies/                (도메인별 수집 전략)
│       ├── revenueStrategy.ts
│       ├── visitorStrategy.ts
│       ├── conversionStrategy.ts
│       ├── storeStrategy.ts
│       ├── customerStrategy.ts
│       ├── productStrategy.ts
│       └── inventoryStrategy.ts
│
├── constants/prompts/
│   ├── basePersona.ts             (기존 유지)
│   ├── responseFormat.ts          (기존 유지, 공통)
│   ├── domainRouter.ts            (신규: 1단계 라우터 프롬프트)
│   ├── analysisPersona.ts         (신규: 분석 전용 페르소나)
│   ├── domains/                   (신규: 도메인별 프롬프트)
│   │   ├── overview.ts
│   │   ├── store.ts
│   │   ├── customer.ts
│   │   ├── product.ts
│   │   ├── inventory.ts
│   │   ├── roi.ts
│   │   ├── controlTower.ts
│   │   └── settings.ts
│   ├── productCatalog.ts          (기존 유지)
│   └── [기존 파일들 — 점진적 deprecated]
│
├── actions/                       (기존 유지 + 분석 연동)
│   ├── queryActions/              (기존 유지: Level 1 경로)
│   ├── navigationActions.ts       (기존 유지)
│   ├── executionActions.ts        (기존 유지)
│   └── chatActions.ts             (리팩토링: 히스토리 활용)
│
├── utils/
│   ├── geminiClient.ts            (기존 유지 + 임베딩 API 추가)
│   ├── intentCache.ts             (기존 유지)
│   ├── session.ts                 (기존 유지)
│   └── dateUtils.ts               (신규: 비교 기간 계산 등)
│
└── index.ts                       (리팩토링: 파이프라인 통합)


supabase/functions/
└── generate-intent-embeddings/    (신규: 임베딩 생성 관리 함수 - Phase 4)
    └── index.ts


supabase/migrations/
├── YYYYMMDD_add_intent_embeddings.sql  (Phase 4)
└── YYYYMMDD_add_session_summary.sql    (Phase 1)
```

### 6.2 기존 파일 변경 요약

| 파일 | Phase | 변경 유형 |
|------|-------|-----------|
| `index.ts` | 1, 3, 5 | 리팩토링: 히스토리 로드, 2단계 분류, 분석 파이프라인 분기 |
| `intent/classifier.ts` | 1, 2, 3 | 리팩토링: 파라미터 추가, 2단계 분류 오케스트레이션, 후처리 강화 |
| `constants/systemPrompt.ts` | 1, 3 | 리팩토링: 히스토리 섹션 추가, 도메인별 프롬프트 조립 |
| `constants/prompts/queryTypeDefinitions.ts` | 2, 3 | 축소 → 도메인별 분리 |
| `constants/prompts/disambiguationRules.ts` | 2 | 축소: 코드 이관 후 남은 규칙만 |
| `actions/chatActions.ts` | 1 | 리팩토링: 실제 히스토리 전달 |
| `utils/geminiClient.ts` | 4 | 확장: 임베딩 API 함수 추가 |

---

## 7. 마이그레이션 (DB 변경)

### 7.1 Phase 1: 세션 요약

```sql
-- 옵션 A: chat_sessions 테이블에 컬럼 추가
alter table chat_sessions add column if not exists 
  session_summary jsonb default '[]'::jsonb;

-- 옵션 B: chat_messages.channel_data 활용 (기존 구조 유지)
-- → 별도 마이그레이션 불필요
```

> 🔍 Claude Code가 현재 chat_sessions 테이블 구조를 확인하여 결정

### 7.2 Phase 4: 임베딩 테이블

```sql
-- pgvector 확장 활성화
create extension if not exists vector;

-- 임베딩 테이블
create table intent_embeddings (
  id uuid primary key default gen_random_uuid(),
  intent text not null,
  query_type text,
  domain text not null,
  sentence text not null,
  embedding vector(768),  -- 🔍 차원수는 선택한 임베딩 모델에 따라 조정
  is_seed boolean default true,
  confidence_avg float default 0,
  hit_count int default 0,
  created_at timestamptz default now(),
  
  unique(sentence)
);

-- 유사도 검색 인덱스
create index idx_intent_embeddings_vector
  on intent_embeddings using ivfflat (embedding vector_cosine_ops)
  with (lists = 20);

-- RLS 정책 (서비스 역할만 접근)
alter table intent_embeddings enable row level security;
create policy "service_role_only" on intent_embeddings
  for all using (auth.role() = 'service_role');
```

---

## 8. 구현 순서 및 의존관계

```
Phase 1: 대화 히스토리 ──────────────────┐
  (기존 코드 최소 변경, 독립적)              │
                                           │
Phase 2: 후처리 보정 + Few-shot ──────────┤
  (Phase 1과 독립적, 병렬 가능)              │
                                           ├── Phase 5: 분석 파이프라인
Phase 3: 2단계 계층적 분류 ──────────────┤    (Phase 1~3 완료 후)
  (Phase 2 완료 후 시작 권장)                │
                                           │
Phase 4: 임베딩 기반 분류 ──────────────┘
  (Phase 3 완료 후 시작)
```

### 8.1 Phase별 예상 작업량

| Phase | 신규 파일 | 수정 파일 | 예상 복잡도 | 의존성 |
|-------|-----------|-----------|-------------|--------|
| Phase 1 | 0~1 | 3~4 | 낮음 | 없음 |
| Phase 2 | 1 | 2~3 | 중간 | 없음 |
| Phase 3 | 8~12 | 3~4 | 높음 | Phase 2 권장 |
| Phase 4 | 3~4 + 마이그레이션 | 2 | 높음 | Phase 3 |
| Phase 5 | 7~10 | 2~3 | 높음 | Phase 1, 3 |

### 8.2 각 Phase 완료 기준

**Phase 1 완료:**
- 후속 질문("그럼 지난달은?")이 이전 맥락 기반으로 올바르게 분류됨
- 최근 N턴 대화가 인텐트 분류와 일반 대화 응답에 반영됨

**Phase 2 완료:**
- 프롬프트에서 ⚠️ 규칙 5개 이상이 코드 후처리로 이관됨
- 기존 분류 정확도가 저하되지 않음 (회귀 테스트)
- 프롬프트 크기가 측정 가능하게 감소함

**Phase 3 완료:**
- 1단계 도메인 라우터가 13개 도메인을 90%+ 정확도로 분류
- 2단계 도메인 분류기가 각 도메인 내 queryType을 정확히 분류
- 전체 프롬프트 토큰 사용량이 현재 대비 40%+ 감소
- 기존 모든 인텐트가 동일하게 동작 (회귀 테스트)

**Phase 4 완료:**
- 임베딩 기반 분류가 전체 요청의 50%+ 처리
- Gemini 생성 호출이 현재 대비 40~50% 감소
- 자동 학습으로 시간 경과에 따라 임베딩 처리율 증가

**Phase 5 완료:**
- "매출 어때?" 같은 질문에 비교 데이터 포함 분석 응답 (Level 2)
- "왜 떨어졌어?" 같은 질문에 원인 추론 + 액션 제안 (Level 3)
- 기존 Level 1 응답 경로는 그대로 유지

---

## 9. 리스크 및 고려사항

### 9.1 기술적 리스크

| 리스크 | 영향 | 완화 방안 |
|--------|------|-----------|
| 2단계 분류에서 1단계 오분류 시 연쇄 오류 | 높음 | 1단계 confidence 낮으면 전체 프롬프트 폴백 경로 유지 |
| 임베딩 모델이 한국어 성능이 낮을 수 있음 | 중간 | 모델 선택 시 한국어 벤치마크 확인, 대표 문장 충분히 확보 |
| Lovable API Gateway가 임베딩 API 미지원 | 중간 | 별도 Gemini API 직접 호출 또는 OpenAI embedding 대안 |
| 분석 파이프라인 추가 RPC 호출로 응답 지연 | 중간 | 병렬 호출, 스트리밍 응답, 분석 vs 단순조회 명확 분기 |
| Gemini 분석 응답 품질 불일치 | 중간 | 프롬프트 튜닝, temperature 조정, 출력 검증 레이어 |

### 9.2 비용 영향 예측

| 시나리오 | 현재 | Phase 3 완료 후 | Phase 5 완료 후 |
|---------|------|-----------------|-----------------|
| 단순 조회 (60%) | ~5,000 input | ~2,500 input | ~2,500 input (변경 없음) |
| 분석형 (25%) | ~5,000 input | ~2,500 input | ~2,500 (분류) + ~3,000 (분석) = ~5,500 |
| 일반대화 (15%) | ~6,000 input | ~1,500 input | ~1,500 input (변경 없음) |
| **가중 평균** | **~5,150** | **~2,250** | **~3,000** |

Phase 4(임베딩) 도입 시 분류 단계 Gemini 호출이 50%+ 감소하므로 추가 절감.

### 9.3 하위 호환성

- **프론트엔드 응답 형식:** 기존 `OSAssistantResponse` 인터페이스 유지. 분석 메타데이터는 `meta` 필드 확장으로 처리.
- **기존 RPC 함수:** 변경 없음. 분석 파이프라인은 기존 RPC를 재활용.
- **기존 인텐트:** 모두 동일하게 동작. 새 분류 구조는 기존 결과를 동일하게 생성해야 함.

---

## 10. Claude Code를 위한 평가 요청 사항

이 계획서를 검토하는 Claude Code에게 요청하는 구체적인 분석/판단 항목:

### 10.1 코드 분석 기반 판단

1. **`rpcOverviewKpis`가 반환하는 데이터 구조를 확인**하고, 전환율·방문자·객단가가 이미 포함되어 있는지 판단하라. 포함되어 있다면 분석 컨텍스트 수집 시 별도 RPC 호출 불필요.

2. **`chat_sessions` 테이블의 현재 스키마를 확인**하고, 세션 요약 저장을 위한 최적 방법을 결정하라.

3. **현재 `intentCache.ts`의 캐시 구조를 분석**하고, 2단계 분류 구조에서 1단계/2단계 결과를 각각 캐싱하는 것이 유리한지 판단하라.

4. **Lovable API Gateway (`ai.gateway.lovable.dev`)가 임베딩 API를 지원하는지 확인**하라. 지원하지 않으면 대안(직접 Gemini API 호출, OpenAI embedding 등)을 제시하라.

5. **Supabase 프로젝트에서 pgvector 확장이 활성화되어 있는지 확인**하라. 활성화되지 않았다면 대안 저장 방식을 제시하라.

6. **현재 queryTypeDefinitions.ts (18KB)의 실제 토큰 수를 측정**하고, 도메인별 분리 시 각 도메인 프롬프트의 예상 토큰 수를 산출하라.

### 10.2 아키텍처 판단

7. **Phase 3의 도메인 분류 목록 (13개)이 적절한지 평가**하라. 현재 queryType 분포를 분석하여, 너무 세분화되었거나 통합이 필요한 도메인이 있는지 확인하라.

8. **Phase 5의 수집 전략 매트릭스가 현실적인지 평가**하라. 각 전략에서 호출하는 RPC가 실제로 존재하고, 필요한 데이터를 반환하는지 확인하라.

9. **분석 의도 감지(analysisDetector.ts)의 키워드 목록이 충분한지 평가**하고, 한국어 사용 패턴에서 누락된 표현이 있으면 추가하라.

10. **전체 파이프라인에서 에러 핸들링 전략을 수립**하라. 특히 분석 컨텍스트 수집 중 일부 RPC가 실패했을 때 partial 분석으로 진행할지, Level 1로 폴백할지 결정하라.

### 10.3 실행 계획

11. **각 Phase의 구체적인 작업 단위(task)를 도출**하고, 작업 순서를 정의하라.

12. **회귀 테스트 전략을 수립**하라. 특히 Phase 3(분류 구조 변경) 시 기존 인텐트가 모두 동일하게 동작하는지 검증하는 방법을 구체적으로 정의하라.

13. **이 계획서에서 비현실적이거나 over-engineering인 부분을 지적**하라. 현재 프로젝트 규모와 트래픽 수준에서 불필요한 복잡성이 있는지 평가하라.

---

## 11. 미래 확장 (Level 4 — 이 계획 범위 밖)

> 참고용으로만 기록. 이 계획에서는 구현하지 않음.

Level 4에서 추가될 기능:
- **선제적 분석:** 사용자가 묻기 전에 이상 징후 감지 및 알림
- **3D 시뮬레이션 자동 연동:** 분석 결과 기반으로 시뮬레이션 파라미터 자동 세팅
- **Text-to-SQL:** 미리 정의된 RPC 없이도 동적 쿼리 생성
- **멀티턴 분석 워크플로:** "더 깊이 파봐" → 자동으로 연관 분석 체인 실행

이 기능들은 Level 3 구조가 안정된 후, 별도 계획서로 진행.

---

## 변경 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|-----------|
| v0.1 | 2025-02-20 | 초안 작성 (대화 기반) |
