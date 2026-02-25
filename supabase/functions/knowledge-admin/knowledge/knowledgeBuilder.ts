/**
 * Knowledge Layer 1 — 지식 적재 유틸리티
 *
 * 청크 단위로 벡터 DB에 적재 (upsert)
 * seedCuratedKnowledge.ts의 batchLoadTopic() 구현 포함
 *
 * NOTE: retail-chatbot/knowledge/knowledgeBuilder.ts 의 복사본
 * knowledge-admin이 cross-function import를 할 수 없어 자체 보유
 */

import { generateEmbedding, generateBatchEmbeddings } from './embeddings.ts';
import type { KnowledgeChunkInput, CuratedTopicData } from './types.ts';

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

// ═══════════════════════════════════════════
//  단일 청크 upsert
// ═══════════════════════════════════════════

/**
 * 단일 지식 청크를 벡터 DB에 upsert
 * insight_id가 있으면 기존 데이터 업데이트, 없으면 새로 삽입
 */
export async function upsertKnowledgeChunk(
  supabase: SupabaseClient,
  chunk: KnowledgeChunkInput
): Promise<{ id: string }> {
  // 1. 임베딩 생성 (title + content 결합)
  const embeddingText = `${chunk.title}\n${chunk.content}`;
  let embedding: number[];
  try {
    embedding = await generateEmbedding(embeddingText);
  } catch (err) {
    console.error(`[KnowledgeBuilder] Embedding failed for "${chunk.title}":`, err);
    throw err;
  }

  // 2. upsert (insight_id 기반)
  const record = {
    topic_id: chunk.topicId,
    chunk_type: chunk.chunkType,
    insight_id: chunk.insightId || null,
    title: chunk.title,
    content: chunk.content,
    conditions: chunk.conditions || {},
    source: chunk.source || 'curation',
    embedding: `[${embedding.join(',')}]`,
    updated_at: new Date().toISOString(),
  };

  if (chunk.insightId) {
    // insight_id가 있으면 conflict 시 update
    const { data, error } = await supabase
      .from('retail_knowledge_chunks')
      .upsert(record, { onConflict: 'insight_id' })
      .select('id')
      .single();

    if (error) {
      console.error(`[KnowledgeBuilder] Upsert error for "${chunk.title}":`, error);
      throw error;
    }
    return { id: data.id };
  } else {
    // insight_id가 없으면 항상 insert
    const { data, error } = await supabase
      .from('retail_knowledge_chunks')
      .insert(record)
      .select('id')
      .single();

    if (error) {
      console.error(`[KnowledgeBuilder] Insert error for "${chunk.title}":`, error);
      throw error;
    }
    return { id: data.id };
  }
}

// ═══════════════════════════════════════════
//  배치 적재 (batchLoadTopic)
// ═══════════════════════════════════════════

/**
 * 큐레이션된 토픽 데이터를 일괄 적재
 * seedCuratedKnowledge.ts에서 호출
 *
 * 각 토픽을 다음 청크로 분해:
 * - principles → 'principle' 청크 1개
 * - benchmarks → 'principle' 청크 1개
 * - insights[] → 'insight' 청크 N개 (textbook + reality + caseStudy + tip 결합)
 * - commonMistakes[] → 'mistake' 청크 1개
 * - advancedPatterns[] → 'advanced_pattern' 청크 1개
 */
export async function batchLoadTopic(
  supabase: SupabaseClient,
  topicData: CuratedTopicData
): Promise<{ chunkCount: number }> {
  const chunks: KnowledgeChunkInput[] = [];

  // 1. Principles 청크
  chunks.push({
    topicId: topicData.topicId,
    chunkType: 'principle',
    insightId: `${topicData.topicId}-curated-principles`,
    title: `${topicData.topicId} — 핵심 원칙`,
    content: topicData.principles,
    source: 'curated_knowledge',
  });

  // 2. Benchmarks 청크
  if (topicData.benchmarks) {
    chunks.push({
      topicId: topicData.topicId,
      chunkType: 'principle',
      insightId: `${topicData.topicId}-curated-benchmarks`,
      title: `${topicData.topicId} — 벤치마크`,
      content: topicData.benchmarks,
      source: 'curated_knowledge',
    });
  }

  // 3. Insights → 각각 개별 청크
  for (const insight of topicData.insights) {
    const content = [
      `[교과서] ${insight.textbook}`,
      `[현실] ${insight.reality}`,
      `[사례] ${insight.caseStudy}`,
      `[실전 팁] ${insight.practicalTip}`,
    ].join('\n\n');

    chunks.push({
      topicId: topicData.topicId,
      chunkType: 'insight',
      insightId: insight.id,
      title: insight.title,
      content,
      source: 'curated_knowledge',
      conditions: insight.conditions ? { description: insight.conditions } : {},
    });
  }

  // 4. Common Mistakes → 하나로 결합
  if (topicData.commonMistakes.length > 0) {
    chunks.push({
      topicId: topicData.topicId,
      chunkType: 'mistake',
      insightId: `${topicData.topicId}-curated-mistakes`,
      title: `${topicData.topicId} — 흔한 실수`,
      content: topicData.commonMistakes.map((m, i) => `${i + 1}. ${m}`).join('\n'),
      source: 'curated_knowledge',
    });
  }

  // 5. Advanced Patterns → 하나로 결합
  if (topicData.advancedPatterns.length > 0) {
    chunks.push({
      topicId: topicData.topicId,
      chunkType: 'advanced_pattern',
      insightId: `${topicData.topicId}-curated-advanced`,
      title: `${topicData.topicId} — 고급 패턴`,
      content: topicData.advancedPatterns.map((p, i) => `${i + 1}. ${p}`).join('\n'),
      source: 'curated_knowledge',
    });
  }

  // 6. 배치 임베딩 생성 + DB 적재
  //    개별 upsert 대신 배치 임베딩을 먼저 만들고 일괄 upsert
  const texts = chunks.map(c => `${c.title}\n${c.content}`);

  let embeddings: number[][];
  try {
    embeddings = await generateBatchEmbeddings(texts);
  } catch (err) {
    console.error(`[KnowledgeBuilder] Batch embedding failed for topic ${topicData.topicId}:`, err);
    // 임베딩 실패 시 개별 처리로 폴백
    let count = 0;
    for (const chunk of chunks) {
      try {
        await upsertKnowledgeChunk(supabase, chunk);
        count++;
      } catch {
        console.error(`[KnowledgeBuilder] Skipping chunk: ${chunk.title}`);
      }
    }
    return { chunkCount: count };
  }

  // 7. 일괄 upsert
  let successCount = 0;
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    const embedding = embeddings[i];

    const record = {
      topic_id: chunk.topicId,
      chunk_type: chunk.chunkType,
      insight_id: chunk.insightId || null,
      title: chunk.title,
      content: chunk.content,
      conditions: chunk.conditions || {},
      source: chunk.source || 'curated_knowledge',
      embedding: `[${embedding.join(',')}]`,
      updated_at: new Date().toISOString(),
    };

    try {
      if (chunk.insightId) {
        const { error } = await supabase
          .from('retail_knowledge_chunks')
          .upsert(record, { onConflict: 'insight_id' });
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('retail_knowledge_chunks')
          .insert(record);
        if (error) throw error;
      }
      successCount++;
    } catch (err) {
      console.error(`[KnowledgeBuilder] Failed to upsert chunk "${chunk.title}":`, err);
    }
  }

  return { chunkCount: successCount };
}
