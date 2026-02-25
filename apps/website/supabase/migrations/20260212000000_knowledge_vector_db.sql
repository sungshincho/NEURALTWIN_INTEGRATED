-- ═══════════════════════════════════════
-- Phase 1: Layer 1 벡터 지식 DB
-- pgvector + pg_trgm 확장 + retail_knowledge_chunks 테이블
-- ═══════════════════════════════════════

-- pgvector 확장 활성화
CREATE EXTENSION IF NOT EXISTS vector;

-- pg_trgm 확장 (폴백 텍스트 검색용)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ═══════════════════════════════════════
-- 지식 청크 테이블
-- ═══════════════════════════════════════
CREATE TABLE IF NOT EXISTS retail_knowledge_chunks (
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

-- 부분 유니크 인덱스 (insight_id가 있는 행만)
CREATE UNIQUE INDEX IF NOT EXISTS uq_knowledge_insight_id
  ON retail_knowledge_chunks(insight_id)
  WHERE insight_id IS NOT NULL;

-- 벡터 검색 인덱스 (IVFFlat)
CREATE INDEX IF NOT EXISTS idx_knowledge_embedding
  ON retail_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 20);

-- 토픽 필터링 인덱스
CREATE INDEX IF NOT EXISTS idx_knowledge_topic
  ON retail_knowledge_chunks(topic_id, chunk_type);

-- pg_trgm 텍스트 검색 인덱스
CREATE INDEX IF NOT EXISTS idx_knowledge_trgm_title
  ON retail_knowledge_chunks USING gin (title gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_knowledge_trgm_content
  ON retail_knowledge_chunks USING gin (content gin_trgm_ops);


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
-- RPC: pg_trgm 폴백 텍스트 검색
-- ═══════════════════════════════════════
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
