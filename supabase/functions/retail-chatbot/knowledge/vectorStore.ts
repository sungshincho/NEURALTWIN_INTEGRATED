/**
 * Knowledge Layer 1 — 벡터 검색 + 폴백
 *
 * 검색 우선순위:
 * 1. pgvector 벡터 유사도 검색 (Google text-embedding-004)
 * 2. pg_trgm 텍스트 검색 (임베딩 API 실패 시 폴백)
 * 3. 기존 retailKnowledge.ts 정적 지식 (DB 결과 부족 시 폴백)
 */

import { generateQueryEmbedding } from './embeddings.ts';
import { combineKnowledgeContexts } from '../retailKnowledge.ts';
import type { KnowledgeSearchResult, KnowledgeSearchResponse } from './types.ts';

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

// 벡터 검색 타임아웃 (1초)
const VECTOR_SEARCH_TIMEOUT_MS = 1000;

// 최소 유의미한 결과 수
const MIN_USEFUL_RESULTS = 2;

// ═══════════════════════════════════════════
//  한국어 조사 제거 (pg_trgm 정확도 향상)
// ═══════════════════════════════════════════

const KOREAN_PARTICLE_PATTERN = /(은|는|이|가|을|를|의|에|에서|로|으로|와|과|도|만|까지|부터|처럼|같은|대한|위한|관한)$/g;

function removeKoreanParticles(text: string): string {
  return text.split(/\s+/)
    .map(word => word.replace(KOREAN_PARTICLE_PATTERN, ''))
    .join(' ');
}

// ═══════════════════════════════════════════
//  벡터 유사도 검색
// ═══════════════════════════════════════════

async function vectorSearch(
  supabase: SupabaseClient,
  question: string,
  topicId?: string,
  limit: number = 5
): Promise<KnowledgeSearchResult[]> {
  // 임베딩 생성 (토픽 힌트 포함)
  const embedding = await generateQueryEmbedding(question, topicId);

  // RPC 호출
  const { data, error } = await supabase.rpc('search_knowledge', {
    query_embedding: `[${embedding.join(',')}]`,
    match_threshold: 0.65,
    match_count: limit,
    filter_topic: topicId || null,
  });

  if (error) {
    console.error('[VectorStore] Vector search RPC error:', error);
    throw error;
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    topicId: row.topic_id as string,
    chunkType: row.chunk_type as string,
    title: row.title as string,
    content: row.content as string,
    conditions: (row.conditions || {}) as Record<string, unknown>,
    similarity: row.similarity as number,
  }));
}

// ═══════════════════════════════════════════
//  pg_trgm 폴백 검색
// ═══════════════════════════════════════════

async function trgmSearch(
  supabase: SupabaseClient,
  question: string,
  topicId?: string,
  limit: number = 5
): Promise<KnowledgeSearchResult[]> {
  const cleanedQuery = removeKoreanParticles(question);

  const { data, error } = await supabase.rpc('search_knowledge_trgm', {
    search_query: cleanedQuery,
    match_threshold: 0.1,
    match_count: limit,
    filter_topic: topicId || null,
  });

  if (error) {
    console.error('[VectorStore] Trgm search RPC error:', error);
    return [];
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    topicId: row.topic_id as string,
    chunkType: row.chunk_type as string,
    title: row.title as string,
    content: row.content as string,
    conditions: (row.conditions || {}) as Record<string, unknown>,
    similarity: row.similarity as number,
  }));
}

// ═══════════════════════════════════════════
//  메인 검색 함수 (폴백 포함)
// ═══════════════════════════════════════════

/**
 * 벡터 검색 → pg_trgm 폴백 → 정적 지식 폴백
 *
 * 안전 보장: 어떤 상황에서도 결과를 반환하며,
 * 최악의 경우 기존 retailKnowledge.ts 정적 지식으로 100% 폴백
 */
export async function searchKnowledge(params: {
  supabase: SupabaseClient;
  question: string;
  topicId: string;
  secondaryTopicId?: string;
  limit?: number;
}): Promise<KnowledgeSearchResponse> {
  const { supabase, question, topicId, secondaryTopicId, limit = 5 } = params;

  // 1차: 벡터 검색 시도 (타임아웃 적용)
  try {
    const results = await Promise.race([
      vectorSearch(supabase, question, topicId, limit),
      new Promise<KnowledgeSearchResult[]>((_, reject) =>
        setTimeout(() => reject(new Error('Vector search timeout')), VECTOR_SEARCH_TIMEOUT_MS)
      ),
    ]);

    if (results.length >= MIN_USEFUL_RESULTS) {
      console.log(`[VectorStore] Vector search: ${results.length} results (top similarity: ${results[0]?.similarity.toFixed(3)})`);
      return { results, usedFallback: false, searchMethod: 'vector' };
    }

    // 결과 부족 → 토픽 필터 없이 재검색
    if (results.length < MIN_USEFUL_RESULTS) {
      const broadResults = await vectorSearch(supabase, question, undefined, limit);
      if (broadResults.length >= MIN_USEFUL_RESULTS) {
        console.log(`[VectorStore] Broad vector search: ${broadResults.length} results`);
        return { results: broadResults, usedFallback: false, searchMethod: 'vector' };
      }
    }

    // 벡터 결과가 있지만 부족 → 정적 폴백과 합침
    console.log(`[VectorStore] Insufficient vector results (${results.length}), adding static fallback`);
    const staticFallback = buildStaticFallback(topicId, secondaryTopicId);
    return {
      results: [...results, staticFallback],
      usedFallback: true,
      searchMethod: 'vector',
    };
  } catch (vectorErr) {
    console.warn('[VectorStore] Vector search failed:', vectorErr);
  }

  // 2차: pg_trgm 폴백
  try {
    const trgmResults = await trgmSearch(supabase, question, topicId, limit);
    if (trgmResults.length > 0) {
      console.log(`[VectorStore] Trgm fallback: ${trgmResults.length} results`);
      return { results: trgmResults, usedFallback: true, searchMethod: 'trgm' };
    }
  } catch (trgmErr) {
    console.warn('[VectorStore] Trgm search failed:', trgmErr);
  }

  // 3차: 100% 정적 폴백 (retailKnowledge.ts)
  console.log('[VectorStore] Full static fallback');
  const staticFallback = buildStaticFallback(topicId, secondaryTopicId);
  return {
    results: [staticFallback],
    usedFallback: true,
    searchMethod: 'static_fallback',
  };
}

// ═══════════════════════════════════════════
//  정적 지식 폴백 빌더
// ═══════════════════════════════════════════

function buildStaticFallback(
  topicId: string,
  secondaryTopicId?: string
): KnowledgeSearchResult {
  const topics = [topicId];
  if (secondaryTopicId) topics.push(secondaryTopicId);

  const staticContext = combineKnowledgeContexts(topics);

  return {
    id: 'static-fallback',
    topicId,
    chunkType: 'principle',
    title: `${topicId} 도메인 지식 (정적)`,
    content: staticContext,
    conditions: {},
    similarity: 0.5,
  };
}

// ═══════════════════════════════════════════
//  검색 결과 → 프롬프트 텍스트 변환
// ═══════════════════════════════════════════

/**
 * 검색 결과를 시스템 프롬프트에 주입할 텍스트로 변환
 */
export function formatSearchResultsForPrompt(
  results: KnowledgeSearchResult[]
): string {
  if (results.length === 0) return '';

  const sections = results.map((r, i) => {
    const header = `[지식 ${i + 1}] ${r.title}`;
    return `${header}\n${r.content}`;
  });

  return `\n[벡터 지식 DB 검색 결과]\n아래는 사용자 질문과 가장 관련성 높은 심화 지식입니다.\n이 정보를 답변에 자연스럽게 반영하되, 기계적으로 나열하지 마세요.\n\n${sections.join('\n\n---\n\n')}`;
}
