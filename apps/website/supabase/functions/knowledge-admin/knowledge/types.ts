/**
 * Knowledge Layer 1 — 타입 정의
 *
 * 벡터 지식 DB의 청크, 검색 결과, 적재 입력 등 공통 타입
 *
 * NOTE: retail-chatbot/knowledge/types.ts 의 복사본
 * knowledge-admin이 cross-function import를 할 수 없어 자체 보유
 */

// ═══════════════════════════════════════════
//  DB 레코드 타입
// ═══════════════════════════════════════════

export type ChunkType = 'principle' | 'insight' | 'case_study' | 'mistake' | 'advanced_pattern';

export interface KnowledgeChunk {
  id: string;
  topic_id: string;
  chunk_type: ChunkType;
  insight_id: string | null;
  title: string;
  content: string;
  conditions: Record<string, unknown>;
  source: string;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════
//  검색 결과 타입
// ═══════════════════════════════════════════

export interface KnowledgeSearchResult {
  id: string;
  topicId: string;
  chunkType: ChunkType;
  title: string;
  content: string;
  conditions: Record<string, unknown>;
  similarity: number;
}

export interface KnowledgeSearchResponse {
  results: KnowledgeSearchResult[];
  usedFallback: boolean;
  searchMethod: 'vector' | 'trgm' | 'static_fallback';
}

// ═══════════════════════════════════════════
//  적재 입력 타입
// ═══════════════════════════════════════════

export interface KnowledgeChunkInput {
  topicId: string;
  chunkType: ChunkType;
  insightId?: string;
  title: string;
  content: string;
  source?: string;
  conditions?: Record<string, unknown>;
}

// ═══════════════════════════════════════════
//  seedCuratedKnowledge용 토픽 데이터 타입
// ═══════════════════════════════════════════

export interface CuratedInsight {
  id: string;
  title: string;
  textbook: string;
  reality: string;
  caseStudy: string;
  practicalTip: string;
  conditions: string;
}

export interface CuratedTopicData {
  topicId: string;
  principles: string;
  benchmarks: string;
  insights: CuratedInsight[];
  commonMistakes: string[];
  advancedPatterns: string[];
}
