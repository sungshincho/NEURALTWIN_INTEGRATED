/**
 * Knowledge Layer 1 — 임베딩 생성
 *
 * Google AI Studio gemini-embedding-001 직접 호출
 * Google AI Studio 직접 호출 — 임베딩 전용
 *
 * 모델: gemini-embedding-001 (네이티브 3072차원 → outputDimensionality: 768로 truncate)
 * 비용: 무료 (분당 1,500건)
 * 인증: GOOGLE_AI_API_KEY
 *
 * Phase 3 추가: LRU 캐시 (검색 쿼리용, 100개)
 */

const GOOGLE_EMBEDDING_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:embedContent';

const GOOGLE_BATCH_EMBEDDING_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-embedding-001:batchEmbedContents';

// 임베딩 생성 타임아웃 (2초)
const EMBEDDING_TIMEOUT_MS = 2000;

// ═══════════════════════════════════════════
//  LRU 캐시 — 검색 쿼리 임베딩용
//  Deno Edge Function은 cold start 간 메모리 유지 (warm instance)
// ═══════════════════════════════════════════

const CACHE_MAX_SIZE = 100;

interface CacheEntry {
  embedding: number[];
  accessedAt: number;
}

const embeddingCache = new Map<string, CacheEntry>();

function getCachedEmbedding(key: string): number[] | null {
  const entry = embeddingCache.get(key);
  if (!entry) return null;
  // LRU: 접근 시간 갱신
  entry.accessedAt = Date.now();
  return entry.embedding;
}

function setCachedEmbedding(key: string, embedding: number[]): void {
  // 용량 초과 시 가장 오래된 항목 제거
  if (embeddingCache.size >= CACHE_MAX_SIZE) {
    let oldestKey = '';
    let oldestTime = Infinity;
    for (const [k, v] of embeddingCache) {
      if (v.accessedAt < oldestTime) {
        oldestTime = v.accessedAt;
        oldestKey = k;
      }
    }
    if (oldestKey) embeddingCache.delete(oldestKey);
  }
  embeddingCache.set(key, { embedding, accessedAt: Date.now() });
}

/** 캐시 통계 (디버깅용) */
export function getEmbeddingCacheStats(): { size: number; maxSize: number } {
  return { size: embeddingCache.size, maxSize: CACHE_MAX_SIZE };
}

// ═══════════════════════════════════════════
//  단일 임베딩 생성
// ═══════════════════════════════════════════

/**
 * 단일 텍스트 임베딩 생성
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), EMBEDDING_TIMEOUT_MS);

  try {
    const response = await fetch(`${GOOGLE_EMBEDDING_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: { parts: [{ text }] },
        outputDimensionality: 768,
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Google Embedding API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    return data.embedding.values;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ═══════════════════════════════════════════
//  검색 쿼리용 임베딩 (LRU 캐시 적용)
// ═══════════════════════════════════════════

/**
 * 검색 쿼리용 임베딩 (질문 + 토픽 힌트 결합)
 * LRU 캐시 적용: 동일/유사 질문 재검색 시 API 호출 없이 즉시 반환
 */
export async function generateQueryEmbedding(
  question: string,
  topicHint?: string
): Promise<number[]> {
  const enrichedQuery = topicHint
    ? `[${topicHint}] ${question}`
    : question;

  // 캐시 확인
  const cached = getCachedEmbedding(enrichedQuery);
  if (cached) {
    console.log(`[Embedding] Cache HIT (size=${embeddingCache.size})`);
    return cached;
  }

  // 캐시 미스 → API 호출
  const embedding = await generateEmbedding(enrichedQuery);

  // 캐시 저장
  setCachedEmbedding(enrichedQuery, embedding);
  console.log(`[Embedding] Cache MISS → stored (size=${embeddingCache.size})`);

  return embedding;
}

// ═══════════════════════════════════════════
//  배치 임베딩 (적재용, 캐시 미적용)
// ═══════════════════════════════════════════

/**
 * 배치 임베딩 생성 (마이그레이션/적재 시 사용)
 * Google batchEmbedContents API 사용
 * 최대 100개까지 한 번에 처리
 */
export async function generateBatchEmbeddings(
  texts: string[]
): Promise<number[][]> {
  const apiKey = Deno.env.get('GOOGLE_AI_API_KEY');
  if (!apiKey) throw new Error('GOOGLE_AI_API_KEY not set');

  // 빈 배열 처리
  if (texts.length === 0) return [];

  // 100개씩 분할 처리
  const BATCH_SIZE = 100;
  const allEmbeddings: number[][] = [];

  for (let i = 0; i < texts.length; i += BATCH_SIZE) {
    const batch = texts.slice(i, i + BATCH_SIZE);

    const response = await fetch(`${GOOGLE_BATCH_EMBEDDING_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requests: batch.map(text => ({
          model: 'models/gemini-embedding-001',
          content: { parts: [{ text }] },
          outputDimensionality: 768,
        }))
      })
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Google Batch Embedding API error ${response.status}: ${errorBody}`);
    }

    const data = await response.json();
    const embeddings = data.embeddings.map((e: { values: number[] }) => e.values);
    allEmbeddings.push(...embeddings);

    // 배치 간 짧은 딜레이 (rate limit 보호)
    if (i + BATCH_SIZE < texts.length) {
      await new Promise(r => setTimeout(r, 100));
    }
  }

  return allEmbeddings;
}
