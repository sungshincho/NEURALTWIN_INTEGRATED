-- =============================================================================
-- Migration: RAG Knowledge Base for Retail AI
-- Vector-based knowledge retrieval system for NeuralTwin AI assistant
-- 2026-03-02
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- EXTENSION: pgvector
-- ─────────────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS vector;

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: retail_knowledge_chunks
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.retail_knowledge_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,               -- 'kpi_definition', 'benchmark', 'operation_tip', 'industry_insight', 'best_practice'
  industry TEXT NOT NULL,               -- 'fashion', 'beauty', 'fnb', 'lifestyle', 'general'
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  embedding vector(768),                -- text-embedding-004 dimension
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Add table & column comments
COMMENT ON TABLE public.retail_knowledge_chunks IS
  'RAG knowledge base: Korean retail domain knowledge chunks with vector embeddings for semantic search.';
COMMENT ON COLUMN public.retail_knowledge_chunks.category IS
  'Knowledge category: kpi_definition, benchmark, operation_tip, industry_insight, best_practice';
COMMENT ON COLUMN public.retail_knowledge_chunks.industry IS
  'Target industry: fashion, beauty, fnb, lifestyle, general';
COMMENT ON COLUMN public.retail_knowledge_chunks.embedding IS
  'vector(768) — Google text-embedding-004 output dimension';
COMMENT ON COLUMN public.retail_knowledge_chunks.metadata IS
  'Flexible JSONB for extra structured data (unit, formula, source, etc.)';

-- ─────────────────────────────────────────────────────────────────────────────
-- INDEXES
-- ─────────────────────────────────────────────────────────────────────────────

-- Vector similarity search index (IVFFlat, cosine distance)
CREATE INDEX IF NOT EXISTS idx_retail_knowledge_chunks_embedding
  ON public.retail_knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);

-- Full-text search index (simple config for Korean compat)
CREATE INDEX IF NOT EXISTS idx_retail_knowledge_chunks_fts
  ON public.retail_knowledge_chunks
  USING GIN (to_tsvector('simple', title || ' ' || content));

-- Category + industry composite index (filter queries)
CREATE INDEX IF NOT EXISTS idx_retail_knowledge_chunks_cat_ind
  ON public.retail_knowledge_chunks (category, industry);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS: Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.retail_knowledge_chunks ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read knowledge chunks (shared knowledge base)
CREATE POLICY "rls_retail_knowledge_chunks_select"
  ON public.retail_knowledge_chunks
  FOR SELECT TO authenticated
  USING (true);

-- Only service_role (Edge Functions) can insert/update/delete
-- No explicit INSERT/UPDATE/DELETE policies for authenticated role;
-- the EF uses createSupabaseAdmin() which bypasses RLS with service_role.

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: search_retail_knowledge — Vector similarity search with filters
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_retail_knowledge(
  query_embedding vector(768),
  match_threshold FLOAT DEFAULT 0.5,
  match_count INT DEFAULT 5,
  filter_category TEXT DEFAULT NULL,
  filter_industry TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  industry TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rkc.id,
    rkc.category,
    rkc.industry,
    rkc.title,
    rkc.content,
    rkc.metadata,
    1 - (rkc.embedding <=> query_embedding) AS similarity
  FROM public.retail_knowledge_chunks rkc
  WHERE
    rkc.embedding IS NOT NULL
    AND (filter_category IS NULL OR rkc.category = filter_category)
    AND (filter_industry IS NULL OR rkc.industry = filter_industry OR rkc.industry = 'general')
    AND 1 - (rkc.embedding <=> query_embedding) > match_threshold
  ORDER BY rkc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.search_retail_knowledge IS
  'Vector similarity search on retail_knowledge_chunks with optional category/industry filters. Returns top-k results above threshold.';

-- ─────────────────────────────────────────────────────────────────────────────
-- RPC: search_retail_knowledge_text — Full-text search fallback
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.search_retail_knowledge_text(
  search_query TEXT,
  match_count INT DEFAULT 5,
  filter_category TEXT DEFAULT NULL,
  filter_industry TEXT DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  category TEXT,
  industry TEXT,
  title TEXT,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rkc.id,
    rkc.category,
    rkc.industry,
    rkc.title,
    rkc.content,
    rkc.metadata,
    ts_rank(
      to_tsvector('simple', rkc.title || ' ' || rkc.content),
      plainto_tsquery('simple', search_query)
    )::FLOAT AS similarity
  FROM public.retail_knowledge_chunks rkc
  WHERE
    to_tsvector('simple', rkc.title || ' ' || rkc.content) @@ plainto_tsquery('simple', search_query)
    AND (filter_category IS NULL OR rkc.category = filter_category)
    AND (filter_industry IS NULL OR rkc.industry = filter_industry OR rkc.industry = 'general')
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION public.search_retail_knowledge_text IS
  'Full-text search fallback for retail_knowledge_chunks when embedding generation fails.';
