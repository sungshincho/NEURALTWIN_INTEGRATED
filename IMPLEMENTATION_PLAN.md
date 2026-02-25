# 3계층 지식 아키텍처 — 수정 구현 계획

> 원본 명세서 1,592줄 기반 + 7개 이슈 해결방안 반영
> 작성일: 2026-02-12
> 최종 수정: 2026-02-12 (임베딩 → Google AI Studio 직접 호출 확정, 6개 발견사항 반영)

---

## 이슈 해결방안 요약

### 이슈 1: 임베딩 전략 — Google AI Studio 직접 호출 확정

**결정**: Lovable AI Gateway 임베딩 미지원 확인 (3개 모델 모두 400 에러) → Google AI Studio 직접 호출

```
API: https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent
모델: text-embedding-004
차원: 768
인증: GOOGLE_AI_API_KEY (Supabase Edge Function Secrets에 추가 완료)
비용: 무료 (분당 1,500건)
Lovable Gateway 미경유 — Google AI Studio 직접 호출
```

```typescript
// knowledge/embeddings.ts — Google AI Studio 직접 호출

const GOOGLE_EMBEDDING_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent';

export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set');

  const response = await fetch(`${GOOGLE_EMBEDDING_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] }
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`Google Embedding API error ${response.status}: ${errorBody}`);
  }

  const data = await response.json();
  return data.embedding.values;  // Google AI Studio 응답 형식
}

// 검색 쿼리용 임베딩 (질문 + 토픽 힌트 결합)
export async function generateQueryEmbedding(
  question: string,
  topicHint?: string
): Promise<number[]> {
  const enrichedQuery = topicHint
    ? `[${topicHint}] ${question}`
    : question;
  return generateEmbedding(enrichedQuery);
}

// 배치 임베딩 (마이그레이션/적재 시 사용)
export async function generateBatchEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set');

  const batchUrl =
    'https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:batchEmbedContents';

  const response = await fetch(`${batchUrl}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      requests: texts.map(text => ({
        model: 'models/text-embedding-004',
        content: { parts: [{ text }] }
      }))
    })
  });

  if (!response.ok) {
    throw new Error(`Google Batch Embedding API error: ${response.status}`);
  }

  const data = await response.json();
  return data.embeddings.map((e: { values: number[] }) => e.values);
}
```

**SQL 스키마**: `vector(768)` (Gemini text-embedding-004 기본 차원)

### 이슈 1-B: pg_trgm — 벡터 검색 실패 시 폴백 전용

**결정**: Gemini 임베딩이 주(primary) → pg_trgm은 임베딩 API 장애 시 폴백으로만 활성화

```sql
-- pg_trgm 확장 (폴백 검색용)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 한국어 텍스트 검색용 GIN 인덱스
CREATE INDEX idx_knowledge_trgm_title
  ON retail_knowledge_chunks USING gin (title gin_trgm_ops);
CREATE INDEX idx_knowledge_trgm_content
  ON retail_knowledge_chunks USING gin (content gin_trgm_ops);
```

```typescript
// knowledge/vectorStore.ts — pg_trgm 폴백 검색
// 임베딩 API 실패 시에만 사용

// 한국어 조사 제거 패턴 (pg_trgm 정확도 향상)
const KOREAN_PARTICLE_PATTERN = /(은|는|이|가|을|를|의|에|에서|로|으로|와|과|도|만|까지|부터|처럼|같은|대한|위한|관한)$/g;

function removeKoreanParticles(text: string): string {
  return text.split(/\s+/)
    .map(word => word.replace(KOREAN_PARTICLE_PATTERN, ''))
    .join(' ');
}

async function fallbackTrgmSearch(
  supabase: SupabaseClient,
  query: string,
  topicId?: string,
  limit: number = 5
): Promise<KnowledgeSearchResult[]> {
  const cleanedQuery = removeKoreanParticles(query);

  // threshold 0.1 (한국어 trigram은 유사도가 낮으므로)
  const { data, error } = await supabase.rpc('search_knowledge_trgm', {
    search_query: cleanedQuery,
    match_threshold: 0.1,
    match_count: limit,
    filter_topic: topicId || null
  });

  if (error) {
    console.error('[pg_trgm fallback] Search error:', error);
    return [];
  }

  return data || [];
}
```

```sql
-- pg_trgm 폴백 RPC 함수
CREATE OR REPLACE FUNCTION search_knowledge_trgm(
  search_query TEXT,
  match_threshold FLOAT DEFAULT 0.1,
  match_count INT DEFAULT 5,
  filter_topic TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  topic_id TEXT,
  chunk_type TEXT,
  title TEXT,
  content TEXT,
  conditions JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rkc.id,
    rkc.topic_id,
    rkc.chunk_type,
    rkc.title,
    rkc.content,
    rkc.conditions,
    GREATEST(
      similarity(rkc.title, search_query),
      similarity(rkc.content, search_query)
    ) AS similarity
  FROM retail_knowledge_chunks rkc
  WHERE
    (similarity(rkc.title, search_query) > match_threshold
     OR similarity(rkc.content, search_query) > match_threshold * 0.5)
    AND (filter_topic IS NULL OR rkc.topic_id = filter_topic)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;
```

---

### 이슈 2: SQL UNIQUE 제약 누락

**해결**: `insight_id`에 부분 유니크 인덱스 추가 (NULL 허용)

```sql
CREATE UNIQUE INDEX uq_knowledge_insight_id
  ON retail_knowledge_chunks(insight_id)
  WHERE insight_id IS NOT NULL;
```

---

### 이슈 3: 벡터검색 ↔ 웹검색 순환 의존

**해결**: 2단계 직렬로 변경

```
변경 전 (명세서 원본):
  [5a] 벡터 검색     ─┐
  [5b] 웹 검색 전략   ─┤ 병렬 (vectorResultCount = 0 고정 → 불필요한 검색 발생)
                      ─┘

변경 후:
  [5a] 벡터 검색 완료 → vectorResultCount 확인
  [5b] 검색 전략 판단 (vectorResultCount 반영) → 조건부 웹 검색

  * 단, [5a]와 파일 컨텍스트 구성은 여전히 병렬 가능
```

```typescript
// 수정된 파이프라인 (index.ts)

// ── 병렬 블록 2A: 벡터 검색 + 파일 컨텍스트 ──
const [vectorResults, fileContext] = await Promise.all([
  searchKnowledge({ supabase, question: message, topicId: classification.primaryTopic }),
  buildFileContext(attachments)
]);

// ── 직렬: 벡터 결과 기반으로 웹 검색 판단 ──
let searchContext = '';
const strategy = buildSearchStrategy({
  message,
  topicId: classification.primaryTopic,
  questionDepth: depthAnalysis.depth,
  turnCount,
  vectorResultCount: vectorResults.length,     // 실제 값 사용
  detectedEntities                              // queryRouter 결과 전달
});

if (strategy.shouldSearch) {
  const rawResults = await executeMultiSearch(strategy.queries);
  const filtered = filterAndFormatResults(rawResults.results, message);
  searchContext = filtered.context;
}
```

---

### 이슈 4: SSE 스트리밍 파이프라인 유지

**해결**: 기존 `createSSEStreamV2` 구조 유지, 조립된 컨텍스트만 주입

현재 index.ts의 SSE 파이프라인:

```
현재:
  enrichedPrompt = topicRouter.buildEnrichedPrompt(message, history)
  → systemPrompt = enrichedPrompt.systemPrompt + searchContext
  → createSSEStreamV2(upstreamResponse, { systemPrompt, ... })
```

```
변경 후:
  enrichedPrompt = topicRouter.buildEnrichedPrompt(message, history)
  assembled = contextAssembler.assembleContext({
    systemPrompt: enrichedPrompt.systemPrompt,
    knowledgeContext,    // Layer 1 벡터 검색 결과
    searchContext,       // Layer 2 웹 검색 결과
    profileContext,      // Layer 3 사용자 프로파일
    insightsContext,     // Layer 3 대화 인사이트
    history,
    userMessage: message
  })
  → finalSystemPrompt = assembled.systemPrompt + '\n' + assembled.injectedContext
  → AI 호출 시 이 finalSystemPrompt 사용
  → createSSEStreamV2(upstreamResponse, { ... })  // 기존 SSE 로직 그대로
```

**핵심**: createSSEStreamV2 내부는 변경 없음. AI 호출 **전에** 컨텍스트를 조립하여 시스템 프롬프트에 주입.

---

### 이슈 5: 지식 데이터 적재 전략

**3단계 접근**:

```
Phase A: retailKnowledge.ts 자동 마이그레이션 (구현 시 즉시)
  - 기존 12개 토픽의 context 필드를 청크로 분할
  - 각 토픽당 1~3개 청크 (principle, insight, case_study)
  - 자동 임베딩 생성 후 DB 적재
  - 초기 약 36~50개 청크

Phase B: 사용자 워크시트 적재 (추후 전달 시)
  - 토픽별 실무진 관점 워크시트 수신
  - seedCuratedKnowledge.ts 별도 제공 파일 + batchLoadTopic() 사용
  - 인터페이스 매칭 확인 완료 (layout_flow, vmd_display, sales_conversion 등)
  - 토픽당 10~20개 고품질 청크 추가

Phase C: 웹 검색 결과 자동 축적 (장기)
  - 고품질 검색 결과를 자동으로 지식 DB에 축적
  - 관리자 승인 후 임베딩 생성
```

**retailKnowledge.ts 마이그레이션 스크립트**:

```typescript
// knowledge/migrateFromStatic.ts
// 기존 retailKnowledge.ts의 12개 토픽 데이터를 벡터 DB로 자동 변환

import { RETAIL_KNOWLEDGE } from '../retailKnowledge.ts';  // 기존 데이터
import { upsertKnowledgeChunk } from './knowledgeBuilder.ts';

export async function migrateStaticKnowledge(supabase: SupabaseClient) {
  for (const topic of RETAIL_KNOWLEDGE) {
    // context 필드를 의미 단위로 분할 (단락 기준, maxLength 800자)
    // 테이블 포함 섹션이 잘리면 의미가 깨지므로 800자 상한 적용
    const paragraphs = topic.context.split('\n\n').filter(p => p.trim().length > 50);
    // 800자 초과 단락은 문단 경계에서 재분할
    const chunks = splitLongParagraphs(paragraphs, 800);

    // 첫 번째 청크: principle
    if (chunks[0]) {
      await upsertKnowledgeChunk(supabase, {
        topicId: topic.id,
        chunkType: 'principle',
        insightId: `${topic.id}-static-principle`,
        title: `${topic.nameKo} — 핵심 원칙`,
        content: chunks[0],
        source: 'migration_from_static'
      });
    }

    // 나머지 청크: insight
    for (let i = 1; i < chunks.length; i++) {
      await upsertKnowledgeChunk(supabase, {
        topicId: topic.id,
        chunkType: 'insight',
        insightId: `${topic.id}-static-insight-${i}`,
        title: `${topic.nameKo} — 인사이트 ${i}`,
        content: chunks[i],
        source: 'migration_from_static'
      });
    }
  }
  console.log('[Migration] Static knowledge migrated to vector DB');
}
```

---

### 이슈 6: 레이턴시 최적화

**해결**: 4가지 전략

```
1. 최대 병렬화
   병렬 블록 1: [토픽분류 | 질문수준 | 페인포인트 | 프로파일 | 메모리로드]
   병렬 블록 2: [벡터검색 | 파일컨텍스트]
   직렬: 웹검색 (벡터 결과 기반 판단)

   → 병렬화로 총 3 sequential step만 발생

2. 임베딩 캐시
   - 동일/유사 질문의 임베딩을 메모리 캐시 (LRU, 100개)
   - Edge Function cold start 대비 warming 불필요 (Deno Deploy 특성)

3. 타임아웃 관리
   - 임베딩 생성: 2초 타임아웃
   - 벡터 검색: 1초 타임아웃
   - 웹 검색: 3초 타임아웃 (per query)
   - 전체 pre-processing: 5초 내 완료 목표

4. 프론트엔드 "검색 중" 상태 표시 — **방법 B(meta 이벤트) 채택**
   - 검색은 AI 호출 전에 완료되므로 SSE 스트림 내 status 이벤트는 무의미
   - `createSSEStreamV2`의 meta 이벤트에 `knowledgeSourceCount`와 `webSearchPerformed` 포함
   - 프론트엔드는 isLoading 상태에서 "리서치 중..." 텍스트 표시
```

```typescript
// createSSEStreamV2의 meta 이벤트에 검색 메타데이터 추가
sendEvent(controller, 'meta', {
  suggestions: opts.suggestions,
  showLeadForm: opts.showLeadForm,
  knowledgeSourceCount: opts.knowledgeSourceCount,  // 벡터 검색 결과 수
  webSearchPerformed: opts.webSearchPerformed,      // 웹 검색 수행 여부
  // ... 기존 필드
});
```

---

### 이슈 7: 폴백 플랜 (기존 파일 유지)

**해결**: retailKnowledge.ts와 queryRouter.ts를 제거하지 않고 폴백으로 유지

```typescript
// knowledge/vectorStore.ts — 폴백 포함
import { combineKnowledgeContexts } from '../retailKnowledge.ts';

export async function searchKnowledgeWithFallback(params: {
  supabase: SupabaseClient;
  question: string;
  topicId: string;
  secondaryTopicId?: string;
}): Promise<{ results: KnowledgeSearchResult[]; usedFallback: boolean }> {
  try {
    const results = await searchKnowledge(params);

    if (results.length >= 2) {
      return { results, usedFallback: false };
    }

    // 벡터 결과 부족 → 기존 retailKnowledge 폴백
    console.log('[VectorStore] Insufficient results, falling back to static knowledge');
    const staticContext = combineKnowledgeContexts(
      [params.topicId, params.secondaryTopicId].filter(Boolean) as string[]
    );

    // 정적 지식을 결과 형태로 변환
    const fallbackResult: KnowledgeSearchResult = {
      id: 'fallback',
      topicId: params.topicId,
      chunkType: 'principle',
      title: `${params.topicId} 도메인 지식`,
      content: staticContext,
      conditions: {},
      similarity: 0.5
    };

    return { results: [fallbackResult, ...results], usedFallback: true };
  } catch (error) {
    // 벡터 검색 완전 실패 → 100% 정적 폴백
    console.error('[VectorStore] Search failed, full fallback:', error);
    const staticContext = combineKnowledgeContexts([params.topicId]);
    return {
      results: [{
        id: 'fallback',
        topicId: params.topicId,
        chunkType: 'principle',
        title: `${params.topicId} 도메인 지식`,
        content: staticContext,
        conditions: {},
        similarity: 0.5
      }],
      usedFallback: true
    };
  }
}
```

**파일 관리 정책**:
- `retailKnowledge.ts`: 유지 (폴백 + 마이그레이션 소스)
- `queryRouter.ts`: 유지 (엔티티 감지 로직은 searchStrategyEngine에서 재사용)
- 나중에 벡터 DB가 안정화되면 `retailKnowledge.ts`의 폴백 의존도 점진적 제거

---

## 수정된 SQL 스키마

```sql
-- pgvector + pg_trgm 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- 폴백 텍스트 검색용

-- ═══════════════════════════════════════
-- 지식 청크 테이블 (이슈 1, 2 반영)
-- ═══════════════════════════════════════
CREATE TABLE retail_knowledge_chunks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,

  -- 분류
  topic_id TEXT NOT NULL,
  chunk_type TEXT NOT NULL CHECK (chunk_type IN ('principle', 'insight', 'case_study', 'mistake', 'advanced_pattern')),
  insight_id TEXT,

  -- 내용
  title TEXT NOT NULL,
  content TEXT NOT NULL,

  -- 메타데이터
  conditions JSONB DEFAULT '{}',
  source TEXT DEFAULT 'curation',

  -- 벡터 임베딩 (Google text-embedding-004, 768차원)
  embedding vector(768),

  -- 관리
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- [이슈 2] 부분 유니크 인덱스 (insight_id가 있는 행만)
CREATE UNIQUE INDEX uq_knowledge_insight_id
  ON retail_knowledge_chunks(insight_id)
  WHERE insight_id IS NOT NULL;

-- 벡터 검색 인덱스
CREATE INDEX idx_knowledge_embedding
  ON retail_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);

-- 토픽 필터링 인덱스
CREATE INDEX idx_knowledge_topic
  ON retail_knowledge_chunks(topic_id, chunk_type);

-- ═══════════════════════════════════════
-- RPC: 벡터 유사도 검색 (768차원)
-- ═══════════════════════════════════════
CREATE OR REPLACE FUNCTION search_knowledge(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.65,
  match_count INT DEFAULT 5,
  filter_topic TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  topic_id TEXT,
  chunk_type TEXT,
  title TEXT,
  content TEXT,
  conditions JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rkc.id,
    rkc.topic_id,
    rkc.chunk_type,
    rkc.title,
    rkc.content,
    rkc.conditions,
    1 - (rkc.embedding <=> query_embedding) AS similarity
  FROM retail_knowledge_chunks rkc
  WHERE
    1 - (rkc.embedding <=> query_embedding) > match_threshold
    AND (filter_topic IS NULL OR rkc.topic_id = filter_topic)
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- ═══════════════════════════════════════
-- 대화 컨텍스트 메모리 테이블
-- ═══════════════════════════════════════
CREATE TABLE chat_context_memory (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL,
  session_id TEXT NOT NULL,

  user_profile JSONB DEFAULT '{}'::jsonb,
  conversation_insights JSONB DEFAULT '[]'::jsonb,
  conversation_summary TEXT DEFAULT '',

  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_context_memory_conv
  ON chat_context_memory(conversation_id);
CREATE INDEX idx_context_memory_session
  ON chat_context_memory(session_id);
```

---

## 수정된 파일 구조

```
supabase/functions/retail-chatbot/
├── index.ts                      # [수정] 파이프라인 통합 (SSE 유지)
│
├── systemPrompt.ts               # [수정] 페르소나 강화 + Few-shot + 응답 구조
│
├── knowledge/                    # [신규] Layer 1
│   ├── embeddings.ts             # Google AI Studio text-embedding-004
│   ├── vectorStore.ts            # pgvector 검색 + 폴백
│   ├── knowledgeBuilder.ts       # 지식 적재 유틸
│   ├── migrateFromStatic.ts      # retailKnowledge.ts → DB 마이그레이션
│   └── types.ts                  # 타입 정의
│
├── search/                       # [신규] Layer 2
│   ├── searchStrategyEngine.ts   # 스마트 검색 전략 (queryRouter 기반 확장)
│   ├── multiSourceSearch.ts      # 병렬 멀티 검색
│   └── resultFilter.ts           # 결과 필터링/점수화
│
├── memory/                       # [신규] Layer 3
│   ├── profileExtractor.ts       # 사용자 프로파일 자동 추출
│   ├── insightAccumulator.ts     # 턴별 인사이트 축적
│   ├── contextMemoryStore.ts     # DB 연동
│   └── types.ts                  # 타입 정의
│
├── questionDepthAnalyzer.ts      # [신규] 질문 수준 감지
├── contextAssembler.ts           # [신규] 토큰 예산 관리
│
├── topicRouter.ts                # [유지] 토픽 분류
├── queryRouter.ts                # [유지] 엔티티 감지 (searchStrategy에서 활용)
├── retailKnowledge.ts            # [유지] 폴백 데이터 소스
├── webSearch.ts                  # [유지] 기존 검색 함수 (multiSourceSearch에서 활용)
│
├── vizDirectiveGenerator.ts      # [유지]
├── painPointExtractor.ts         # [유지]
├── salesBridge.ts                # [유지]
└── suggestionGenerator.ts        # [수정] 맥락 인지형 강화
```

**핵심 변경**: 기존 파일 제거 없음. 새 모듈이 기존 모듈을 감싸는 래퍼 패턴.

---

## 수정된 파이프라인 (index.ts)

```
사용자 메시지 수신
     │
     ▼
[1] JWT 인증 + Rate Limiting (기존 유지)
[2] Action 분기 (기존 유지)
     │
     ▼ (chat인 경우)
     │
     ├─────── 병렬 블록 1: 분석 ────────────────────────────────┐
     │                                                          │
     │  [3a] 토픽 분류 (topicRouter - 기존)                     │
     │  [3b] 엔티티 감지 (queryRouter.routeQuery - 기존)        │
     │  [3c] 질문 수준 감지 (questionDepthAnalyzer - 신규)      │
     │  [3d] Pain Point 추출 (painPointExtractor - 기존)        │
     │  [3e] 대화 메모리 로드 (contextMemoryStore - 신규)       │
     │                                                          │
     ├─────────────────────────────────────────────────────────┘
     │
     ▼
     │  프로파일 업데이트 (profileExtractor - 신규)
     │
     ├─────── 병렬 블록 2: 지식 수집 ──────────────────────────┐
     │                                                          │
     │  [4a] 벡터 지식 검색 (vectorStore - 신규, 폴백 포함)     │
     │  [4b] 파일 컨텍스트 구성 (기존)                          │
     │                                                          │
     ├─────────────────────────────────────────────────────────┘
     │
     ▼
[5] 검색 전략 판단 + 조건부 웹 검색 (직렬, vectorResultCount 반영)
     │
     ▼
[6] 컨텍스트 조합 (contextAssembler - 신규)
    ─ systemPrompt + Layer 1~3 컨텍스트 + 히스토리 트리밍
     │
     ▼
[7] AI 호출 (Gemini 2.5 Pro via Lovable Gateway — 기존)
    ─ SSE 스트리밍: createSSEStreamV2 그대로 사용
    ─ JSON 폴백: processJsonResponse 그대로 사용
     │
     ▼
[8] 후처리 (기존 유지)
    ─ VizDirective 추출, Sales Bridge, Suggestions
     │
[9] 대화 메모리 저장 (비동기, 응답 반환 후 — 신규)
    ─ 프로파일 + 인사이트 축적
```

---

## 구현 순서 (4 Phase)

### Phase 0: 프롬프트 + 질문 감지 (즉시 효과, 위험도 낮음)

```
작업 0-1: questionDepthAnalyzer.ts 신규 생성
  - 6가지 고급 신호 패턴 감지
  - beginner / advanced 판정
  - 기존 코드 변경 없이 독립 모듈

작업 0-2: systemPrompt.ts 수정 (충돌 확인 필수)
  - 교체 전에 기존 섹션 1과 3.1의 정확한 라인 범위를 먼저 확인
  - 새 텍스트와 기존 섹션 3.0/3.5/3.6 규칙 간 충돌 여부 검증
  - 충돌 발견 시 기존 규칙을 우선 유지하고 새 페르소나를 조정
  - 섹션 1: 실무 전문가 페르소나 강화
  - 섹션 3.1: 질문 수준별 응답 구조 추가
  - Few-shot 예시 2개 추가 (기본 + 고급)
  - 기존 섹션 2~5는 유지

작업 0-3: index.ts 수정 (최소 변경)
  - questionDepthAnalyzer import 추가
  - 질문 수준에 따른 시스템 프롬프트 분기 추가
  - SSE 파이프라인 변경 없음

작업 0-4: suggestionGenerator.ts 수정
  - 질문 수준 파라미터 반영
  - 고급 질문 시 더 깊은 후속 질문 생성

테스트: 동일 질문으로 응답 품질 비교
```

### Phase 1: Layer 1 벡터 지식 DB (핵심 변화)

```
사전 작업: GOOGLE_AI_API_KEY 환경변수 등록 (Supabase Secrets — 추가 완료)

작업 1-1: SQL 마이그레이션 실행
  - pgvector 확장 활성화
  - retail_knowledge_chunks 테이블 생성
  - search_knowledge RPC 함수 생성

작업 1-2: knowledge/ 디렉토리 생성
  - knowledge/types.ts
  - knowledge/embeddings.ts (Google AI Studio text-embedding-004)
  - knowledge/vectorStore.ts (검색 + 폴백)
  - knowledge/knowledgeBuilder.ts (적재 유틸)

작업 1-3: knowledge/migrateFromStatic.ts 생성
  - retailKnowledge.ts 12개 토픽 → 벡터 DB 자동 마이그레이션

작업 1-4: 마이그레이션 실행용 Edge Function 생성
  - supabase/functions/knowledge-admin/index.ts
  - POST /knowledge-admin { action: 'migrate_static' }
  - POST /knowledge-admin { action: 'load_worksheet', data: {...} }

작업 1-5: index.ts에 Layer 1 통합
  - vectorStore 검색 추가 (병렬 블록 2)
  - 폴백 포함하여 안전하게 통합
  - 검색 결과를 시스템 프롬프트에 주입

테스트:
  - 벡터 검색 결과 확인 (similarity score)
  - 폴백 동작 확인 (DB 비어있을 때)
  - 응답에 도메인 지식이 정밀하게 반영되는지 확인
```

### Phase 2: Layer 2 스마트 검색 + Layer 3 대화 메모리 (동시 진행 가능)

```
작업 2-1: search/ 디렉토리 생성
  - search/searchStrategyEngine.ts (queryRouter 기반 확장)
  - search/multiSourceSearch.ts (기존 webSearch 활용)
  - search/resultFilter.ts

작업 2-2: memory/ 디렉토리 생성 + SQL
  - chat_context_memory 테이블 생성
  - memory/types.ts
  - memory/profileExtractor.ts
  - memory/insightAccumulator.ts
  - memory/contextMemoryStore.ts

작업 2-3: contextAssembler.ts 생성
  - Layer 1~3 통합 + 토큰 예산 관리

작업 2-4: index.ts 전체 파이프라인 통합
  - 병렬 블록 1 (분석) + 병렬 블록 2 (지식수집) + 직렬 (웹검색)
  - contextAssembler로 최종 조합
  - SSE 스트리밍 파이프라인 유지

테스트:
  - 멀티턴 대화에서 프로파일 축적 확인
  - 3턴 이후 "앞서 논의한~" 참조 응답 확인
  - 검색 전략 판단 로직 정상 동작 확인
  - 토큰 예산 초과 없이 정상 응답 확인
```

### Phase 3: 최적화 + 데이터 확충

```
작업 3-1: 사용자 워크시트 적재
  - 전달받은 토픽 1,2,3 워크시트를 knowledgeBuilder로 적재
  - 임베딩 생성 + 품질 검증

작업 3-2: 레이턴시 최적화
  - 임베딩 캐시 구현 (in-memory LRU)
  - 타임아웃 미세 조정
  - 로깅으로 병목 지점 분석

작업 3-3: 프론트엔드 UX 개선
  - "리서치 중..." 상태 표시 (SSE meta 이벤트)
  - 검색 소스 표시 (벡터 n개 + 웹 n개)

작업 3-4: 통합 테스트 시나리오 실행
  - 단일턴 기본/고급 질문 품질 테스트
  - 멀티턴 컨텍스트 축적 테스트
  - 브랜드 검색 + 벡터 지식 결합 테스트
  - 폴백 시나리오 테스트 (DB 장애, 검색 실패)
```

---

## 환경변수 최종 목록

| 변수 | 용도 | Phase |
|------|------|-------|
| LOVABLE_API_KEY | Gemini 2.5 Pro/Flash 채팅 (기존) | - |
| GOOGLE_AI_API_KEY | text-embedding-004 임베딩 (신규, Secrets 추가 완료) | Phase 1 |
| SUPABASE_URL | Supabase (기존) | - |
| SUPABASE_SERVICE_ROLE_KEY | DB 접근 (기존) | - |
| SERPER_API_KEY | 웹 검색 (기존) | - |

**추가 환경변수 1개**: `GOOGLE_AI_API_KEY` — Google AI Studio 임베딩 직접 호출용 (무료, 분당 1,500건)

---

## 예상 소요 시간

| Phase | 작업 수 | 신규 파일 | 수정 파일 |
|-------|---------|----------|----------|
| Phase 0 | 4 | 1 | 3 |
| Phase 1 | 5 | 6 | 1 |
| Phase 2 | 4 | 8 | 1 |
| Phase 3 | 4 | 0 | 3 |

---

## 핵심 설계 원칙

1. **기존 코드 제거 없음** — 새 모듈이 기존 모듈을 래핑
2. **점진적 활성화** — Phase별 독립 배포 가능
3. **폴백 필수** — 벡터 DB/검색 실패 시 100% 기존 로직으로 동작
4. **SSE 스트리밍 보존** — createSSEStreamV2 내부 로직 변경 없음
5. **비용 최적화** — 임베딩 768차원 (Google AI Studio 무료), 조건부 검색, 규칙 기반 우선
