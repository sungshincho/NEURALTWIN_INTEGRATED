/**
 * Knowledge Admin Edge Function
 *
 * 벡터 지식 DB 관리용 API
 * - migrate_static: retailKnowledge.ts → 벡터 DB 마이그레이션
 * - seed_curated: seedCuratedKnowledge.ts 큐레이션 데이터 적재
 * - stats: 지식 DB 통계 조회
 * - validate: 임베딩 품질 검증 (시딩 후 확인)
 *
 * 인증: SUPABASE_SERVICE_ROLE_KEY 필수 (관리자 전용)
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { migrateStaticKnowledge } from './knowledge/migrateFromStatic.ts';
import { seedAllCuratedKnowledge } from './knowledge/seedCuratedKnowledge.ts';

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

/**
 * 지식 DB 통계 조회
 */
async function getStats(supabase: SupabaseClient) {
  const { data: chunks, error } = await supabase
    .from('retail_knowledge_chunks')
    .select('topic_id, chunk_type, source');

  if (error) throw error;

  const stats = {
    totalChunks: chunks.length,
    byTopic: {} as Record<string, number>,
    byType: {} as Record<string, number>,
    bySource: {} as Record<string, number>,
    withEmbedding: 0,
    withoutEmbedding: 0,
  };

  for (const chunk of chunks) {
    stats.byTopic[chunk.topic_id] = (stats.byTopic[chunk.topic_id] || 0) + 1;
    stats.byType[chunk.chunk_type] = (stats.byType[chunk.chunk_type] || 0) + 1;
    stats.bySource[chunk.source] = (stats.bySource[chunk.source] || 0) + 1;
  }

  // 임베딩 유무 통계
  const { count: withEmbedding } = await supabase
    .from('retail_knowledge_chunks')
    .select('id', { count: 'exact', head: true })
    .not('embedding', 'is', null);

  stats.withEmbedding = withEmbedding || 0;
  stats.withoutEmbedding = stats.totalChunks - stats.withEmbedding;

  return stats;
}

/**
 * 임베딩 품질 검증: 임베딩 없는 청크 목록 + 토픽별 커버리지
 */
async function validateEmbeddings(supabase: SupabaseClient) {
  // 임베딩 없는 청크
  const { data: noEmbedding, error: noEmbErr } = await supabase
    .from('retail_knowledge_chunks')
    .select('id, topic_id, chunk_type, title')
    .is('embedding', null)
    .limit(50);

  if (noEmbErr) throw noEmbErr;

  // 토픽별 통계
  const { data: allChunks, error: allErr } = await supabase
    .from('retail_knowledge_chunks')
    .select('topic_id, chunk_type, source, embedding');

  if (allErr) throw allErr;

  const topicCoverage: Record<string, { total: number; withEmbedding: number; types: Set<string> }> = {};

  for (const chunk of allChunks) {
    if (!topicCoverage[chunk.topic_id]) {
      topicCoverage[chunk.topic_id] = { total: 0, withEmbedding: 0, types: new Set() };
    }
    topicCoverage[chunk.topic_id].total++;
    if (chunk.embedding) topicCoverage[chunk.topic_id].withEmbedding++;
    topicCoverage[chunk.topic_id].types.add(chunk.chunk_type);
  }

  // Set → Array 변환
  const coverage = Object.entries(topicCoverage).map(([topicId, data]) => ({
    topicId,
    total: data.total,
    withEmbedding: data.withEmbedding,
    coverage: data.total > 0 ? Math.round((data.withEmbedding / data.total) * 100) : 0,
    chunkTypes: [...data.types],
  }));

  return {
    missingEmbeddings: noEmbedding || [],
    topicCoverage: coverage.sort((a, b) => a.coverage - b.coverage),
    overallCoverage: allChunks.length > 0
      ? Math.round((allChunks.filter((c: { embedding: unknown }) => c.embedding).length / allChunks.length) * 100)
      : 0,
  };
}

serve(async (request: Request) => {
  // CORS Preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: CORS_HEADERS });
  }

  if (request.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json();
    const { action } = body;

    // Supabase 클라이언트 (서비스 키 사용)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let result: unknown;

    switch (action) {
      case 'migrate_static': {
        console.log('[KnowledgeAdmin] Starting static knowledge migration...');
        const startTime = Date.now();
        result = await migrateStaticKnowledge(supabase);
        console.log(`[KnowledgeAdmin] Migration completed in ${Date.now() - startTime}ms`);
        break;
      }

      case 'seed_curated': {
        console.log('[KnowledgeAdmin] Starting curated knowledge seeding...');
        const startTime = Date.now();
        await seedAllCuratedKnowledge(supabase);
        const elapsed = Date.now() - startTime;
        const stats = await getStats(supabase);
        result = {
          success: true,
          message: 'Curated knowledge seeded',
          elapsedMs: elapsed,
          stats,
        };
        break;
      }

      case 'stats': {
        console.log('[KnowledgeAdmin] Fetching stats...');
        result = await getStats(supabase);
        break;
      }

      case 'validate': {
        console.log('[KnowledgeAdmin] Validating embeddings...');
        result = await validateEmbeddings(supabase);
        break;
      }

      default:
        return new Response(
          JSON.stringify({
            error: 'Unknown action',
            validActions: ['migrate_static', 'seed_curated', 'stats', 'validate'],
          }),
          { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ success: true, action, result }),
      { status: 200, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('[KnowledgeAdmin] Error:', err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Internal error' }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  }
});
