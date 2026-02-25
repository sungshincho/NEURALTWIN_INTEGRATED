-- 데이터베이스 스키마 메타데이터를 조회하는 함수 생성
CREATE OR REPLACE FUNCTION public.get_schema_metadata()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
  table_record record;
  column_record record;
  fk_record record;
  pk_record record;
  table_metadata jsonb;
  columns_array jsonb;
  fks_array jsonb;
  pks_array jsonb;
  all_tables jsonb;
BEGIN
  all_tables := '{}'::jsonb;
  
  -- public 스키마의 모든 테이블 순회
  FOR table_record IN 
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      AND table_name NOT LIKE 'pg_%'
    ORDER BY table_name
  LOOP
    columns_array := '[]'::jsonb;
    fks_array := '[]'::jsonb;
    pks_array := '[]'::jsonb;
    
    -- 컬럼 정보 수집
    FOR column_record IN
      SELECT 
        c.column_name,
        c.data_type,
        CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END as is_nullable,
        c.column_default,
        CASE WHEN pk.column_name IS NOT NULL THEN true ELSE false END as is_primary_key
      FROM information_schema.columns c
      LEFT JOIN (
        SELECT kcu.column_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
          ON tc.constraint_name = kcu.constraint_name
        WHERE tc.table_schema = 'public'
          AND tc.table_name = table_record.table_name
          AND tc.constraint_type = 'PRIMARY KEY'
      ) pk ON pk.column_name = c.column_name
      WHERE c.table_schema = 'public'
        AND c.table_name = table_record.table_name
      ORDER BY c.ordinal_position
    LOOP
      columns_array := columns_array || jsonb_build_object(
        'column_name', column_record.column_name,
        'data_type', column_record.data_type,
        'is_nullable', column_record.is_nullable,
        'column_default', column_record.column_default,
        'is_primary_key', column_record.is_primary_key
      );
    END LOOP;
    
    -- Foreign Key 정보 수집
    FOR fk_record IN
      SELECT
        kcu.column_name,
        ccu.table_name AS foreign_table,
        ccu.column_name AS foreign_column
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = table_record.table_name
        AND tc.constraint_type = 'FOREIGN KEY'
    LOOP
      fks_array := fks_array || jsonb_build_object(
        'column_name', fk_record.column_name,
        'foreign_table', fk_record.foreign_table,
        'foreign_column', fk_record.foreign_column
      );
    END LOOP;
    
    -- Primary Key 정보 수집
    FOR pk_record IN
      SELECT kcu.column_name
      FROM information_schema.table_constraints tc
      JOIN information_schema.key_column_usage kcu
        ON tc.constraint_name = kcu.constraint_name
      WHERE tc.table_schema = 'public'
        AND tc.table_name = table_record.table_name
        AND tc.constraint_type = 'PRIMARY KEY'
      ORDER BY kcu.ordinal_position
    LOOP
      pks_array := pks_array || to_jsonb(pk_record.column_name);
    END LOOP;
    
    -- 테이블 메타데이터 구성
    table_metadata := jsonb_build_object(
      'table_name', table_record.table_name,
      'columns', columns_array,
      'foreign_keys', fks_array,
      'primary_keys', pks_array
    );
    
    -- 전체 결과에 추가
    all_tables := all_tables || jsonb_build_object(table_record.table_name, table_metadata);
  END LOOP;
  
  RETURN all_tables;
END;
$$;