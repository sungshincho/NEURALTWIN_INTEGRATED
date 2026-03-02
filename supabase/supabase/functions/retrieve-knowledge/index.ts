/**
 * retrieve-knowledge Edge Function
 *
 * RAG 지식 검색 엔드포인트
 * - 벡터 유사도 검색 (pgvector + text-embedding-004)
 * - 풀텍스트 검색 폴백 (임베딩 생성 실패 시)
 * - 업종/카테고리 필터링
 * - 인증 필수 (JWT)
 */

import { createSupabaseWithAuth } from "@shared/supabase-client.ts";
import { corsHeaders, handleCorsOptions } from "@shared/cors.ts";
import { errorResponse } from "@shared/error.ts";
import { generateEmbedding } from "@shared/ai/gateway.ts";

// ═══════════════════════════════════════════
//  Types
// ═══════════════════════════════════════════

interface RetrieveRequest {
  query: string;
  industry?: string;   // 'fashion' | 'beauty' | 'fnb' | 'lifestyle' | 'general'
  category?: string;   // 'kpi_definition' | 'benchmark' | 'operation_tip' | 'industry_insight' | 'best_practice'
  limit?: number;      // default: 5, max: 20
}

interface KnowledgeChunk {
  id: string;
  category: string;
  industry: string;
  title: string;
  content: string;
  metadata: Record<string, unknown>;
  similarity: number;
}

interface RetrieveResponse {
  success: boolean;
  results: KnowledgeChunk[];
  search_method: 'vector' | 'text_fallback';
  query: string;
  filters: {
    industry: string | null;
    category: string | null;
  };
}

// ═══════════════════════════════════════════
//  Constants
// ═══════════════════════════════════════════

const MAX_LIMIT = 20;
const DEFAULT_LIMIT = 5;
const VECTOR_SEARCH_TIMEOUT_MS = 3000;
const VECTOR_MATCH_THRESHOLD = 0.45;
const TEXT_MIN_RESULTS = 1;

// Valid filter values
const VALID_CATEGORIES = ['kpi_definition', 'benchmark', 'operation_tip', 'industry_insight', 'best_practice'];
const VALID_INDUSTRIES = ['fashion', 'beauty', 'fnb', 'lifestyle', 'general'];

// ═══════════════════════════════════════════
//  Vector search
// ═══════════════════════════════════════════

async function vectorSearch(
  supabase: any,
  queryEmbedding: number[],
  category: string | null,
  industry: string | null,
  limit: number,
): Promise<KnowledgeChunk[]> {
  const { data, error } = await supabase.rpc('search_retail_knowledge', {
    query_embedding: `[${queryEmbedding.join(',')}]`,
    match_threshold: VECTOR_MATCH_THRESHOLD,
    match_count: limit,
    filter_category: category,
    filter_industry: industry,
  });

  if (error) {
    console.error('[retrieve-knowledge] Vector search RPC error:', error);
    throw error;
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    category: row.category as string,
    industry: row.industry as string,
    title: row.title as string,
    content: row.content as string,
    metadata: (row.metadata || {}) as Record<string, unknown>,
    similarity: row.similarity as number,
  }));
}

// ═══════════════════════════════════════════
//  Full-text search fallback
// ═══════════════════════════════════════════

async function textSearch(
  supabase: any,
  query: string,
  category: string | null,
  industry: string | null,
  limit: number,
): Promise<KnowledgeChunk[]> {
  const { data, error } = await supabase.rpc('search_retail_knowledge_text', {
    search_query: query,
    match_count: limit,
    filter_category: category,
    filter_industry: industry,
  });

  if (error) {
    console.error('[retrieve-knowledge] Text search RPC error:', error);
    throw error;
  }

  return (data || []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    category: row.category as string,
    industry: row.industry as string,
    title: row.title as string,
    content: row.content as string,
    metadata: (row.metadata || {}) as Record<string, unknown>,
    similarity: row.similarity as number,
  }));
}

// ═══════════════════════════════════════════
//  Main handler
// ═══════════════════════════════════════════

Deno.serve(async (req: Request) => {
  // CORS preflight
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  // Only POST
  if (req.method !== 'POST') {
    return errorResponse('Method not allowed', 405);
  }

  try {
    // 1. Auth check
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = createSupabaseWithAuth(authHeader);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    // 2. Parse request
    const body: RetrieveRequest = await req.json();
    const { query, industry, category } = body;
    const limit = Math.min(Math.max(body.limit || DEFAULT_LIMIT, 1), MAX_LIMIT);

    if (!query || !query.trim()) {
      return errorResponse('query is required', 400);
    }

    // 3. Validate filters
    const filterCategory = category && VALID_CATEGORIES.includes(category) ? category : null;
    const filterIndustry = industry && VALID_INDUSTRIES.includes(industry) ? industry : null;

    console.log(`[retrieve-knowledge] Query: "${query.slice(0, 50)}...", industry=${filterIndustry}, category=${filterCategory}, limit=${limit}`);

    // 4. Try vector search first
    let results: KnowledgeChunk[] = [];
    let searchMethod: 'vector' | 'text_fallback' = 'vector';

    try {
      // Generate embedding with timeout
      const embeddingPromise = generateEmbedding(query);
      const timeoutPromise = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Embedding generation timeout')), VECTOR_SEARCH_TIMEOUT_MS)
      );

      const queryEmbedding = await Promise.race([embeddingPromise, timeoutPromise]);

      // Vector search
      results = await vectorSearch(supabase, queryEmbedding, filterCategory, filterIndustry, limit);

      // If insufficient results with industry filter, try without filter
      if (results.length < TEXT_MIN_RESULTS && filterIndustry) {
        console.log('[retrieve-knowledge] Insufficient results with industry filter, trying broader search');
        const broadResults = await vectorSearch(supabase, queryEmbedding, filterCategory, null, limit);
        if (broadResults.length > results.length) {
          results = broadResults;
        }
      }

      console.log(`[retrieve-knowledge] Vector search: ${results.length} results` +
        (results[0] ? ` (top similarity: ${results[0].similarity.toFixed(3)})` : ''));

    } catch (vectorErr) {
      console.warn('[retrieve-knowledge] Vector search failed, falling back to text search:', vectorErr);
      searchMethod = 'text_fallback';

      // 5. Fallback to full-text search
      try {
        results = await textSearch(supabase, query, filterCategory, filterIndustry, limit);
        console.log(`[retrieve-knowledge] Text fallback: ${results.length} results`);
      } catch (textErr) {
        console.error('[retrieve-knowledge] Text search also failed:', textErr);
        // Return empty results rather than error
        results = [];
      }
    }

    // 6. Return response
    const response: RetrieveResponse = {
      success: true,
      results,
      search_method: searchMethod,
      query,
      filters: {
        industry: filterIndustry,
        category: filterCategory,
      },
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[retrieve-knowledge] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(errorMessage, 500);
  }
});
