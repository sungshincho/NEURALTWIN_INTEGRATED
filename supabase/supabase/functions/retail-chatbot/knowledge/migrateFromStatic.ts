/**
 * Knowledge Layer 1 — 정적 지식 마이그레이션
 *
 * 기존 retailKnowledge.ts의 12개 토픽 데이터를 벡터 DB로 자동 변환
 * 각 토픽의 context 필드를 의미 단위로 분할하여 청크로 적재
 */

import { RETAIL_KNOWLEDGE } from '../retailKnowledge.ts';
import { upsertKnowledgeChunk } from './knowledgeBuilder.ts';

// deno-lint-ignore no-explicit-any
type SupabaseClient = any;

// 청크 최대 길이 (800자 — 테이블 포함 섹션이 잘리지 않도록)
const MAX_CHUNK_LENGTH = 800;

/**
 * 긴 단락을 의미 단위로 재분할
 * 줄바꿈(\n)을 우선 분할 기준으로 사용
 */
function splitLongParagraphs(paragraphs: string[], maxLength: number): string[] {
  const result: string[] = [];

  for (const para of paragraphs) {
    if (para.length <= maxLength) {
      result.push(para);
      continue;
    }

    // 줄바꿈 기준으로 분할 시도
    const lines = para.split('\n');
    let current = '';

    for (const line of lines) {
      if (current.length + line.length + 1 > maxLength && current.length > 0) {
        result.push(current.trim());
        current = line;
      } else {
        current += (current ? '\n' : '') + line;
      }
    }

    if (current.trim().length > 0) {
      result.push(current.trim());
    }
  }

  return result.filter(p => p.length > 30);
}

/**
 * retailKnowledge.ts의 12개 토픽을 벡터 DB로 마이그레이션
 */
export async function migrateStaticKnowledge(supabase: SupabaseClient): Promise<{
  totalChunks: number;
  topicResults: { topicId: string; chunks: number }[];
}> {
  console.log(`[Migration] Starting static knowledge migration (${RETAIL_KNOWLEDGE.length} topics)...`);

  const topicResults: { topicId: string; chunks: number }[] = [];
  let totalChunks = 0;

  for (const topic of RETAIL_KNOWLEDGE) {
    let topicChunkCount = 0;

    // context 필드를 단락으로 분할
    const paragraphs = topic.context.split('\n\n').filter(p => p.trim().length > 50);
    const chunks = splitLongParagraphs(paragraphs, MAX_CHUNK_LENGTH);

    // 첫 번째 청크: principle
    if (chunks[0]) {
      try {
        await upsertKnowledgeChunk(supabase, {
          topicId: topic.id,
          chunkType: 'principle',
          insightId: `${topic.id}-static-principle`,
          title: `${topic.nameKo} — 핵심 원칙`,
          content: chunks[0],
          source: 'migration_from_static',
        });
        topicChunkCount++;
      } catch (err) {
        console.error(`[Migration] Failed principle chunk for ${topic.id}:`, err);
      }
    }

    // 나머지 청크: insight
    for (let i = 1; i < chunks.length; i++) {
      try {
        await upsertKnowledgeChunk(supabase, {
          topicId: topic.id,
          chunkType: 'insight',
          insightId: `${topic.id}-static-insight-${i}`,
          title: `${topic.nameKo} — 인사이트 ${i}`,
          content: chunks[i],
          source: 'migration_from_static',
        });
        topicChunkCount++;
      } catch (err) {
        console.error(`[Migration] Failed insight chunk ${i} for ${topic.id}:`, err);
      }
    }

    topicResults.push({ topicId: topic.id, chunks: topicChunkCount });
    totalChunks += topicChunkCount;
    console.log(`[Migration] ${topic.id}: ${topicChunkCount} chunks`);
  }

  console.log(`[Migration] Static knowledge migrated: ${totalChunks} total chunks`);
  return { totalChunks, topicResults };
}
