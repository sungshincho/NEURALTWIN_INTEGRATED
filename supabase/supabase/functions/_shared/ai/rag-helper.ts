/**
 * RAG (Retrieval-Augmented Generation) Helper
 *
 * NeuralTwin 리테일 AI 시스템을 위한 RAG 검색 헬퍼.
 * retail_knowledge_chunks 테이블에서 관련 지식을 검색하고,
 * AI 프롬프트에 컨텍스트로 주입하여 도메인 특화 응답을 생성합니다.
 *
 * 의존성:
 *   - gateway.ts: generateEmbedding(), chatCompletion()
 *   - DB RPC: search_retail_knowledge (vector), search_retail_knowledge_text (full-text)
 *
 * @module rag-helper
 */

import { generateEmbedding, chatCompletion } from "./gateway.ts";
import type { ChatMessage, ChatCompletionOptions } from "./gateway.ts";

// ============================================================================
// Types
// ============================================================================

/** 검색된 지식 청크 */
export interface KnowledgeChunk {
  id: string;
  category: string;
  industry: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

/** retrieveContext() 입력 파라미터 */
export interface RetrieveContextParams {
  /** 사용자 질의 */
  query: string;
  /** Supabase 클라이언트 (RPC 호출용) */
  supabaseClient: SupabaseClient;
  /** 업종 필터 (fashion, beauty, fnb, lifestyle, general) */
  industry?: string;
  /** 카테고리 필터 (kpi_definition, benchmark, operation_tip, industry_insight, best_practice) */
  category?: string;
  /** 최대 검색 결과 수 (기본 5, 최대 20) */
  limit?: number;
}

/** retrieveContext() 반환값 */
export interface RetrieveContextResult {
  /** AI 프롬프트에 주입할 포맷된 컨텍스트 문자열 */
  context: string;
  /** 검색된 원본 청크 목록 */
  chunks: KnowledgeChunk[];
  /** 사용된 검색 방법 */
  searchMethod: "vector" | "text_fallback" | "none";
}

/** buildRAGPrompt() 입력 파라미터 */
export interface BuildRAGPromptParams {
  /** 사용자 질의 */
  userQuery: string;
  /** retrieveContext()에서 반환된 컨텍스트 문자열 */
  context: string;
  /** 시스템 프롬프트 (기본값: 리테일 도메인 시스템 프롬프트) */
  systemPrompt?: string;
}

/** ragEnhancedCompletion() 입력 파라미터 */
export interface RAGCompletionParams {
  /** 사용자 질의 */
  query: string;
  /** Supabase 클라이언트 */
  supabaseClient: SupabaseClient;
  /** 업종 필터 */
  industry?: string;
  /** 카테고리 필터 */
  category?: string;
  /** 시스템 프롬프트 */
  systemPrompt?: string;
  /** chatCompletion 추가 옵션 (model, temperature, maxTokens 등) */
  completionOptions?: Partial<Omit<ChatCompletionOptions, "messages">>;
}

/** ragEnhancedCompletion() 반환값 */
export interface RAGCompletionResult {
  /** AI 응답 텍스트 */
  content: string;
  /** 전체 chatCompletion 응답 (usage 등 포함) */
  raw: Record<string, unknown>;
  /** RAG 소스 메타데이터 */
  sources: {
    /** 사용된 검색 방법 */
    searchMethod: "vector" | "text_fallback" | "none";
    /** 참조된 청크 수 */
    chunkCount: number;
    /** 참조된 청크 요약 (id, title, similarity) */
    chunks: Array<{ id: string; title: string; similarity: number }>;
  };
}

/**
 * Supabase 클라이언트 타입 (경량 인터페이스).
 * @supabase/supabase-js의 SupabaseClient와 호환됩니다.
 * 전체 타입을 import하지 않아 gateway.ts와 동일한 패턴을 유지합니다.
 */
interface SupabaseClient {
  rpc(
    fn: string,
    params?: Record<string, unknown>,
  ): Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
}

// ============================================================================
// Constants
// ============================================================================

const MAX_LIMIT = 20;
const DEFAULT_LIMIT = 5;
const VECTOR_MATCH_THRESHOLD = 0.45;
const EMBEDDING_TIMEOUT_MS = 3000;

const DEFAULT_RAG_SYSTEM_PROMPT = `당신은 NeuralTwin의 리테일 AI 어시스턴트입니다.
오프라인 리테일 매장 운영에 대한 전문 지식을 바탕으로 사용자의 질문에 답변합니다.

## 규칙
1. 모든 응답은 한국어로 작성하세요.
2. 아래 [참고 자료]에 제공된 도메인 지식을 우선 활용하세요.
3. 참고 자료에 없는 내용은 일반적인 리테일 지식으로 보완하되, 추측임을 명시하세요.
4. 금액은 원화(₩)로, 비율은 소수점 첫째 자리까지, 숫자는 천 단위 콤마를 사용하세요.
5. 데이터에 근거한 분석만 제공하세요.`;

// ============================================================================
// retrieveContext — RAG 지식 검색
// ============================================================================

/**
 * retail_knowledge_chunks에서 관련 지식을 검색합니다.
 *
 * 1차: 벡터 유사도 검색 (generateEmbedding → search_retail_knowledge RPC)
 * 2차 (폴백): 풀텍스트 검색 (search_retail_knowledge_text RPC)
 *
 * 검색 실패 시에도 에러를 던지지 않고 빈 결과를 반환합니다.
 *
 * @param params - 검색 파라미터
 * @returns 포맷된 컨텍스트 문자열, 원본 청크, 검색 방법
 */
export async function retrieveContext(
  params: RetrieveContextParams,
): Promise<RetrieveContextResult> {
  const { query, supabaseClient, industry, category } = params;
  const limit = Math.min(Math.max(params.limit ?? DEFAULT_LIMIT, 1), MAX_LIMIT);

  const filterCategory = category ?? null;
  const filterIndustry = industry ?? null;

  let chunks: KnowledgeChunk[] = [];
  let searchMethod: RetrieveContextResult["searchMethod"] = "none";

  // ── 1차: 벡터 유사도 검색 ──
  try {
    const embedding = await generateEmbeddingWithTimeout(query);

    const { data, error } = await supabaseClient.rpc("search_retail_knowledge", {
      query_embedding: `[${embedding.join(",")}]`,
      match_threshold: VECTOR_MATCH_THRESHOLD,
      match_count: limit,
      filter_category: filterCategory,
      filter_industry: filterIndustry,
    });

    if (error) throw new Error(error.message);

    chunks = mapRowsToChunks(data);
    searchMethod = "vector";

    // 업종 필터가 적용되었으나 결과가 부족하면 필터 없이 재검색
    if (chunks.length === 0 && filterIndustry) {
      console.log("[rag-helper] No results with industry filter, retrying without filter");
      const { data: broadData, error: broadError } = await supabaseClient.rpc(
        "search_retail_knowledge",
        {
          query_embedding: `[${embedding.join(",")}]`,
          match_threshold: VECTOR_MATCH_THRESHOLD,
          match_count: limit,
          filter_category: filterCategory,
          filter_industry: null,
        },
      );
      if (!broadError && broadData) {
        chunks = mapRowsToChunks(broadData);
      }
    }

    console.log(
      `[rag-helper] Vector search: ${chunks.length} results` +
        (chunks[0] ? ` (top similarity: ${chunks[0].similarity.toFixed(3)})` : ""),
    );
  } catch (vectorErr) {
    console.warn("[rag-helper] Vector search failed, falling back to text search:", vectorErr);

    // ── 2차: 풀텍스트 검색 폴백 ──
    try {
      const { data, error } = await supabaseClient.rpc("search_retail_knowledge_text", {
        search_query: query,
        match_count: limit,
        filter_category: filterCategory,
        filter_industry: filterIndustry,
      });

      if (error) throw new Error(error.message);

      chunks = mapRowsToChunks(data);
      searchMethod = "text_fallback";

      console.log(`[rag-helper] Text fallback: ${chunks.length} results`);
    } catch (textErr) {
      console.error("[rag-helper] Text search also failed:", textErr);
      // 검색 실패 시 빈 결과 — 에러를 던지지 않음
      chunks = [];
      searchMethod = "none";
    }
  }

  const context = formatChunksAsContext(chunks);

  return { context, chunks, searchMethod };
}

// ============================================================================
// buildRAGPrompt — RAG 프롬프트 구성
// ============================================================================

/**
 * 검색된 컨텍스트를 시스템 메시지에 주입하여
 * chatCompletion()에 전달할 messages 배열을 생성합니다.
 *
 * @param params - 프롬프트 구성 파라미터
 * @returns ChatMessage 배열 (system + user)
 */
export function buildRAGPrompt(params: BuildRAGPromptParams): ChatMessage[] {
  const { userQuery, context, systemPrompt } = params;
  const basePrompt = systemPrompt ?? DEFAULT_RAG_SYSTEM_PROMPT;

  const systemContent = context
    ? `${basePrompt}\n\n[참고 자료]\n${context}`
    : basePrompt;

  return [
    { role: "system", content: systemContent },
    { role: "user", content: userQuery },
  ];
}

// ============================================================================
// ragEnhancedCompletion — RAG 전체 파이프라인
// ============================================================================

/**
 * RAG 검색 → 프롬프트 구성 → AI 완성을 한 번에 수행합니다.
 *
 * RAG 검색이 실패해도 컨텍스트 없이 AI 응답을 생성합니다 (graceful degradation).
 *
 * @param params - RAG 완성 파라미터
 * @returns AI 응답 + 소스 메타데이터
 */
export async function ragEnhancedCompletion(
  params: RAGCompletionParams,
): Promise<RAGCompletionResult> {
  const {
    query,
    supabaseClient,
    industry,
    category,
    systemPrompt,
    completionOptions,
  } = params;

  // 1. 검색
  const retrieval = await retrieveContext({
    query,
    supabaseClient,
    industry,
    category,
  });

  // 2. 프롬프트 구성
  const messages = buildRAGPrompt({
    userQuery: query,
    context: retrieval.context,
    systemPrompt,
  });

  // 3. AI 완성
  const response = await chatCompletion({
    messages,
    ...completionOptions,
  });

  const content =
    response?.choices?.[0]?.message?.content ?? "";

  return {
    content,
    raw: response,
    sources: {
      searchMethod: retrieval.searchMethod,
      chunkCount: retrieval.chunks.length,
      chunks: retrieval.chunks.map((c) => ({
        id: c.id,
        title: c.title,
        similarity: c.similarity,
      })),
    },
  };
}

// ============================================================================
// Internal Helpers
// ============================================================================

/**
 * 임베딩 생성에 타임아웃을 적용합니다.
 * EMBEDDING_TIMEOUT_MS 이내에 완료되지 않으면 에러를 던집니다.
 */
async function generateEmbeddingWithTimeout(text: string): Promise<number[]> {
  const embeddingPromise = generateEmbedding(text);
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(
      () => reject(new Error("Embedding generation timeout")),
      EMBEDDING_TIMEOUT_MS,
    ),
  );

  return Promise.race([embeddingPromise, timeoutPromise]);
}

/** RPC 결과 행을 KnowledgeChunk 배열로 변환합니다. */
function mapRowsToChunks(
  data: Record<string, unknown>[] | null,
): KnowledgeChunk[] {
  if (!data) return [];

  return data.map((row) => ({
    id: row.id as string,
    category: row.category as string,
    industry: row.industry as string,
    title: row.title as string,
    content: row.content as string,
    metadata: (row.metadata ?? {}) as Record<string, unknown>,
    similarity: row.similarity as number,
  }));
}

/**
 * 검색된 청크 배열을 AI 프롬프트에 삽입할 수 있는 텍스트로 포맷합니다.
 *
 * 형식:
 * ---
 * ### [1] {title} ({category} / {industry}) — 유사도: 0.85
 * {content}
 * ---
 */
function formatChunksAsContext(chunks: KnowledgeChunk[]): string {
  if (chunks.length === 0) return "";

  const sections = chunks.map((chunk, i) => {
    const header = `### [${i + 1}] ${chunk.title} (${chunk.category} / ${chunk.industry}) — 유사도: ${chunk.similarity.toFixed(3)}`;
    return `${header}\n${chunk.content}`;
  });

  return sections.join("\n\n---\n\n");
}
