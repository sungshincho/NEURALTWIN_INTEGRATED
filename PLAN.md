# NEURALTWIN 웹사이트 챗봇 통합 개선 실행 계획

> **작성일**: 2026-02-13
> **총 22개 항목 / 6 Phase / 예상 ~900줄 변경**

---

## Phase 1 — 즉시 수정 (systemPrompt + 텍스트 보정)

### 1-1. [A-5] 한국어 텍스트 너비 보정
**파일**: `src/components/chatbot/visualizer/StoreVisualizer.tsx`
**위치**: Line 77-78 (`charWidth = 7`)
**변경**: `estimateTextWidth()` 함수 추가 — 한글(AC00~D7AF)은 12px, 영문/숫자는 7px
**규모**: ~15줄

### 1-2. [B-1] 불필요한 3D 생성 방지
**파일**: `supabase/functions/retail-chatbot/systemPrompt.ts`
**위치**: Section 5 (Line 1141+) 앞에 삽입
**변경**: 3D 생성 조건 제한 규칙 추가
```
생성 O: "매장 레이아웃", "동선", "존 배치", "공간 구성", 특정 업종 매장 구성
생성 X: 솔루션 소개, 가격, 보고서/양식, 업계 통계, 서비스 질문
```
**규모**: ~20줄

### 1-3. [B-2] 프리셋 맥락 이탈 수정
**파일**: `supabase/functions/retail-chatbot/systemPrompt.ts`
**위치**: Section 3 (대화 행동 규칙) 내 삽입
**변경**: 역질문 금지 + 맥락 연속 + 액셔너블 규칙 추가
**추가 파일**: `supabase/functions/retail-chatbot/suggestionGenerator.ts`
- filterSuggestions()에 역질문 패턴 필터 추가 (현재 키워드 중복만 제거)
**규모**: ~30줄

### 1-4. [B-5] 첫 응답 길이 제한
**파일**: `supabase/functions/retail-chatbot/systemPrompt.ts`
**위치**: Section 3 내 삽입
**변경**: 핵심 3가지 이내, 300자 내외 규칙 추가
**규모**: ~10줄

---

## Phase 2 — 시각 정확도 (존 타입/폴백/3D 생성 조건)

### 2-1. [A-3] 존 타입 + 스마트 가구 생성
**파일 1**: `src/components/chatbot/visualizer/vizDirectiveTypes.ts`
**위치**: DynamicZone interface (Line 84-99)
**변경**: `type?: 'display' | 'entrance' | 'corridor' | 'checkout' | 'seating' | 'storage' | 'experience'` 추가

**파일 2**: `supabase/functions/retail-chatbot/index.ts`
**위치**: DynamicZone interface (Line 64-73, BE 사본)
**변경**: FE와 동일하게 `type` 필드 추가

**파일 3**: `src/components/chatbot/visualizer/sceneBuilder.ts`
**위치**: Line 155-198 (`generateFurnitureForZones()`)
**변경**:
- entrance/corridor 타입은 가구 생성 스킵
- FIXTURE_BY_ZONE_TYPE 매핑 추가
- 가구 타입 확장: refrigerator, gondola, seating_set, kiosk, showcase

**파일 4**: `supabase/functions/retail-chatbot/systemPrompt.ts`
**위치**: Section 5-1 (zones 설명)
**변경**: zone.type 필드 설명 + 타입별 예시 추가
**규모**: ~80줄

### 2-2. [A-6] 폴백 업종 확장
**파일**: `supabase/functions/retail-chatbot/vizDirectiveGenerator.ts`
**위치**: Line 57-65 (DEFAULT_FASHION_ZONES) + Line 96-104 (fallback)
**변경**:
- DEFAULT_ZONES_BY_INDUSTRY 딕셔너리 추가 (fashion/cafe/convenience/grocery/popup/general)
- detectIndustry() 함수 추가 — topicCategory + 대화 키워드 기반 업종 추론
- fallback 로직: 추론된 업종의 기본 존 사용
**규모**: ~60줄

### 2-3. [B-3] 필요 시 3D 미생성 수정
**파일 1**: `supabase/functions/retail-chatbot/systemPrompt.ts`
**위치**: Section 5 내
**변경**: 3D 자동 감지 키워드 목록 추가 (매장, 레이아웃, 동선, 존, 배치, 진열, VMD 등)

**파일 2**: `supabase/functions/retail-chatbot/vizDirectiveGenerator.ts`
**위치**: Line 87 (confidence threshold 0.05)
**변경**: 공간 관련 키워드 감지 시 confidence 부스팅
**규모**: ~30줄

### 2-4. [B-4] 존 크기 ↔ 수치 정합성
**파일**: `supabase/functions/retail-chatbot/systemPrompt.ts`
**위치**: Section 5-10 (Critical Rules) 내
**변경**: w×d 면적비 = 텍스트 퍼센티지 정합성 규칙 추가
**규모**: ~15줄

---

## Phase 3 — 카메라 + 동선 동적화

### 3-1. [A-1] focusZone + 동적 카메라 계산
**파일 1**: `src/components/chatbot/visualizer/vizDirectiveTypes.ts`
**위치**: VizDirective interface (Line 105-132)
**변경**: 4개 필드 추가
```typescript
focusZone?: string;
cameraAngle?: 'front' | 'side' | 'top' | 'perspective';
updateMode?: 'full' | 'partial';
changedZones?: string[];
```

**파일 2**: `supabase/functions/retail-chatbot/index.ts`
**위치**: VizDirective interface (Line 75-85, BE 사본)
**변경**: FE와 동일한 4개 필드 추가 + extractVizDirectiveFromResponse() 파싱 로직 업데이트

**파일 3**: `src/components/chatbot/visualizer/StoreVisualizer.tsx`
**위치**: Line 147-153 (카메라 타겟 상태)
**변경**: focusZone이 있으면 해당 존 좌표 기반 카메라 타겟 계산
- 기존 CAMERA_PRESETS는 focusZone 없을 때 폴백으로 유지
- lerp로 부드러운 전환

**파일 4**: `supabase/functions/retail-chatbot/systemPrompt.ts`
**위치**: Section 5-2 (vizState) 뒤
**변경**: focusZone 사용법 설명 추가
**규모**: ~60줄

### 3-2. [A-4] 동선 비선형 지원
**파일 1**: `src/components/chatbot/visualizer/vizDirectiveTypes.ts`
**위치**: flowPath 타입 (Line ~119)
**변경**: `flowPath?: boolean` → `flowPath?: boolean | string[]`

**파일 2**: `supabase/functions/retail-chatbot/index.ts`
**위치**: VizDirective BE 사본의 flowPath
**변경**: 동일하게 `boolean | string[]` 확장

**파일 3**: `src/components/chatbot/visualizer/sceneBuilder.ts`
**위치**: Line 104-121 (`generateFlowFromZones()`)
**변경**:
- string[]이면 존 ID 순서대로 동선 생성
- 첫/끝 ID 같으면 closed: true (루프 동선)
- CatmullRomCurve3 활용
- boolean true면 기존 Z좌표 정렬 폴백

**파일 4**: `supabase/functions/retail-chatbot/systemPrompt.ts`
**위치**: Section 5-5 (flowPath)
**변경**: 배열 형태 지원 설명 추가
**규모**: ~40줄

### 3-3. [B-8] systemPrompt 연속 대화 지시
**파일**: `supabase/functions/retail-chatbot/systemPrompt.ts`
**위치**: Section 5-10 뒤 (새 Section 5-11)
**변경**: 연속 대화 VizDirective 규칙 추가
- 부분 업데이트 vs 전체 교체 기준
- 변경된 존도 포함 필수
- highlights에 변경 존 포함
- focusZone 지정
- 업종 변경 시만 전체 교체
**규모**: ~40줄

---

## Phase 4 — 대화 연속성 + 검색 기반 (핵심 아키텍처)

### 4-1. [A-2] 대화 연속 반응형 3D
**파일 1**: `src/pages/Chat.tsx`
**위치**: Line 90 (vizDirective state), Line 469 (setVizDirective(null))
**변경**:
1. vizHistory 상태 추가: `useState<VizDirective[]>([])`
2. Line 469의 `setVizDirective(null)` 삭제 — 이전 viz 상태 유지
3. SSE viz 이벤트 병합 전략 (Line 293-301):
   - zones + vizState 포함 → 전체 교체 (이전 viz는 history에 push)
   - 부분 필드만 → mergeVizDirective로 기존 상태에 병합
4. fetch body에 currentVizState 추가 (현재 zones/vizState/highlights)

**파일 2**: `supabase/functions/retail-chatbot/index.ts`
**위치**: Line 1214 (body 파싱), Line 1276+ (시스템 프롬프트 조립)
**변경**:
- WebChatRequest에 `currentVizState?` 필드 추가
- currentVizState가 있으면 systemPrompt에 "[현재 3D 매장 상태]" 주입
- 토큰 예산: ~300 토큰 추가 (총 ~5,400/10,000)

**파일 3**: `src/components/chatbot/visualizer/StoreVisualizer.tsx`
**위치**: sceneConfigKey 의존성
**변경**: zones 변경 시 전체 재빌드 대신 인플레이스 업데이트
- sceneDiff.ts의 computeZoneDiff() 활용
- 추가 존: 바닥에서 페이드인
- 삭제 존: 스케일다운 → dispose()
- 이동/크기 변경: lerp 트랜지션
**규모**: ~150줄

### 4-2. [C-1] 출처 URL 노출
**파일 1**: `supabase/functions/retail-chatbot/index.ts`
**위치**: SSE meta 이벤트 전송부 (createSSEStreamV2 내)
**변경**: meta 이벤트에 `sources[]` 필드 추가
```typescript
sources: filteredResults.results.map(r => ({
  title: r.title, url: r.url, type: r.source
}))
```

**파일 2**: `src/pages/Chat.tsx`
**위치**: SSE meta 이벤트 핸들러 (Line 303-339)
**변경**: sources 상태 저장 + 답변 하단 출처 뱃지 UI 렌더링

**파일 3**: Non-streaming JSON 응답에도 sources 추가
**위치**: index.ts PATH B (Line 1644+)
**규모**: ~40줄

### 4-3. [C-6] 글로벌 레퍼런스 편향 해소
**파일 1**: `supabase/functions/retail-chatbot/search/searchStrategyEngine.ts`
**위치**: Line 63 (`buildSearchStrategy()`) 내 — vectorResultCount >= 3 체크 전
**변경**:
```typescript
const REFERENCE_PATTERNS = /레퍼런스|사례|케이스|case study|best practice|benchmark|글로벌.*사례|해외.*사례/i;
if (REFERENCE_PATTERNS.test(message)) {
  // 벡터 결과 충분해도 웹 검색 강제
  forceWebSearch = true;
}
```

**파일 2**: `supabase/functions/retail-chatbot/systemPrompt.ts`
**위치**: Section 3 (대화 행동 규칙)
**변경**: "이미 알려진 사례(Zara, Lululemon 등) 외에 다양한 브랜드 포함" 지시 추가

**파일 3**: `supabase/functions/retail-chatbot/contextAssembler.ts`
**위치**: Layer 2 주입부 (Line 145-164)
**변경**: 레퍼런스 질문 시 웹 검색 결과를 "최신 사례"로 우선 배치, 벡터는 "참고용"
**규모**: ~30줄

---

## Phase 5 — 인터랙션 + 검색 심화

### 5-1. [A-7] 존 클릭 인터랙션
**파일 1**: `src/components/chatbot/visualizer/StoreVisualizer.tsx`
**위치**: Line 536-564 (pointer-events-none)
**변경**:
- pointer-events-none → pointer-events-auto (존 라벨에만)
- Raycaster로 존 플레인 클릭 감지
- onZoneClick 콜백 prop 추가

**파일 2**: `src/pages/Chat.tsx`
**위치**: StoreVisualizer 렌더링부
**변경**: onZoneClick 핸들러 — 클릭된 존 ID/이름으로 자동 질문 삽입
**규모**: ~50줄

### 5-2. [C-2] Jina Reader 본문 크롤링
**파일 (신규)**: `supabase/functions/retail-chatbot/search/contentExtractor.ts`
**내용**:
```typescript
export async function extractPageContent(url: string, maxChars = 1500): Promise<string> {
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 3000); // 3초 타임아웃
  const res = await fetch(`https://r.jina.ai/${url}`, {
    signal: controller.signal,
    headers: { 'Accept': 'text/plain' }
  });
  const text = await res.text();
  return text.slice(0, maxChars);
}
```

**파일 2**: `supabase/functions/retail-chatbot/search/multiSourceSearch.ts`
**위치**: executeMultiSearch() 결과 후처리
**변경**: 상위 3개 URL에 대해 extractPageContent() 호출
- 실패 시 snippet 폴백 (fail-open)

**파일 3**: `supabase/functions/retail-chatbot/search/resultFilter.ts`
**위치**: buildContextText() (Line 215-258)
**변경**: fullContent 있는 결과는 snippet 대신 본문 요약 사용
- MAX_CONTEXT_CHARS 2000 → 3000 확대

**파일 4**: `supabase/functions/retail-chatbot/contextAssembler.ts`
**위치**: MAX_SEARCH_CONTEXT_TOKENS (Line 61)
**변경**: 1500 → 2500 (Jina 본문 반영)
**규모**: ~60줄

### 5-3. [C-3] 뉴스 검색 채널 추가
**파일**: `supabase/functions/retail-chatbot/webSearch.ts`
**위치**: Line 47 (SERPER_API_URL) 아래
**변경**:
```typescript
const SERPER_NEWS_URL = 'https://google.serper.dev/news';
export async function searchNews(query: string, numResults = 5): Promise<WebSearchResult> {
  // /news 엔드포인트 호출 — gl:kr, hl:ko
}
```

**파일 2**: `supabase/functions/retail-chatbot/search/searchStrategyEngine.ts`
**위치**: buildQueriesFromRoute() (Line 126-174)
**변경**: SearchQuery.type에 'news' 추가, 최신 정보 트리거 시 news 쿼리 생성

**파일 3**: `supabase/functions/retail-chatbot/search/multiSourceSearch.ts`
**위치**: executeSearchWithTimeout() (Line 114-125)
**변경**: type === 'news'일 때 searchNews() 호출
**규모**: ~40줄

### 5-4. [C-4] 경량 교차 검증
**파일**: `supabase/functions/retail-chatbot/search/resultFilter.ts`
**위치**: filterAndFormatResults() 결과 후처리
**변경**:
- extractFacts(): 수치+단위 패턴 추출 (`/[\d,.]+\s*(조|억|만|%|명|개|배|위)/`)
- crossVerify(): 2+ 소스 일치 → `[확인됨]`, 1 소스 → `[미확인]`
- buildContextText()에 팩트 태그 포함
**규모**: ~50줄

---

## Phase 6 — 고급 기능 (안정화 후)

### 6-1. [B-6] KPI 대시보드 시각화
**파일 (신규)**: `src/components/chatbot/visualizer/KPIChart.tsx`
**내용**: SVG 기반 미니 차트 (bar/gauge/comparison)
**파일 2**: `src/components/chatbot/visualizer/vizDirectiveTypes.ts`
**변경**: VizDirective에 `charts?` 필드 추가
**규모**: ~100줄

### 6-2. [B-7] 채팅↔3D 양방향 인터랙션
**파일**: `src/pages/Chat.tsx`
**변경**: AI 답변의 존 이름 → 클릭 가능 링크 변환
- 클릭 시 focusZone 설정 + 카메라 줌인
- 반대: 3D 존 클릭 → 채팅 존 설명 스크롤/하이라이트
**규모**: ~80줄

### 6-3. [C-5] AI 팩트 요약 (Gemini Flash)
**파일 (신규)**: `supabase/functions/retail-chatbot/search/factSummarizer.ts`
**내용**: 고급 질문 + 크롤링 본문 3개 이상일 때 Gemini Flash 호출
**파일 2**: `supabase/functions/retail-chatbot/index.ts`
**변경**: 파이프라인에 factSummarizer 통합 (depthAnalysis.depth === 'advanced' 조건)
**규모**: ~60줄

### 6-4. [A-8] Before/After 비교 모드
**파일 (신규)**: `src/components/chatbot/visualizer/CompareVisualizer.tsx`
**내용**: StoreVisualizer 2개 나란히 + OrbitControls 동기화
**파일 2**: `src/components/chatbot/visualizer/vizDirectiveTypes.ts`
**변경**: VizDirective에 `compare?` 필드 추가
**파일 3**: `src/pages/Chat.tsx`
**변경**: compare 모드 감지 시 CompareVisualizer 렌더링
**규모**: ~200줄

---

## 파일 변경 매트릭스

| 파일 | P1 | P2 | P3 | P4 | P5 | P6 |
|------|-----|-----|-----|-----|-----|-----|
| `systemPrompt.ts` (BE) | 60줄 | 15줄 | 40줄 | 10줄 | | |
| `vizDirectiveTypes.ts` (FE) | | 5줄 | 10줄 | | | 20줄 |
| `StoreVisualizer.tsx` (FE) | 15줄 | | 40줄 | 50줄 | 40줄 | |
| `sceneBuilder.ts` (FE) | | 60줄 | 30줄 | | | |
| `vizDirectiveGenerator.ts` (BE) | | 60줄 | | | | |
| `suggestionGenerator.ts` (BE) | 15줄 | | | | | |
| `Chat.tsx` (FE) | | | 3줄 | 80줄 | 10줄 | 30줄 |
| `index.ts` (BE) | | 5줄 | 5줄 | 60줄 | | 20줄 |
| `searchStrategyEngine.ts` (BE) | | | | 20줄 | 30줄 | |
| `contextAssembler.ts` (BE) | | | | 10줄 | 10줄 | |
| `webSearch.ts` (BE) | | | | | 30줄 | |
| `multiSourceSearch.ts` (BE) | | | | | 20줄 | |
| `resultFilter.ts` (BE) | | | | | 60줄 | |
| `contentExtractor.ts` (신규 BE) | | | | | 40줄 | |
| `KPIChart.tsx` (신규 FE) | | | | | | 100줄 |
| `CompareVisualizer.tsx` (신규 FE) | | | | | | 200줄 |

---

## 제약 조건

1. **변경 금지**: `run-simulation`, `generate-optimization` Edge Functions
2. **FE/BE 타입 동기화**: vizDirectiveTypes.ts (FE) + index.ts DynamicZone/VizDirective (BE) 3곳 동시 변경
3. **sceneConfigKey 주의**: focusZone을 sceneConfigKey에 넣으면 카메라 변경마다 씬 재빌드
4. **모바일 JSON 폴백**: Chat.tsx Line 505-519 — 신규 필드 파싱 필수
5. **dispose 누수**: zones 인플레이스 업데이트 시 삭제 존의 geometry/material dispose 필수
6. **토큰 예산**: systemPrompt ~5,100 + currentVizState ~300 = ~5,400 (10,000 내 OK)
7. **Jina Reader 타임아웃**: 3초, 실패 시 snippet 폴백
8. **레퍼런스 패턴 과잉 매칭 방지**: 정밀 튜닝 필요
