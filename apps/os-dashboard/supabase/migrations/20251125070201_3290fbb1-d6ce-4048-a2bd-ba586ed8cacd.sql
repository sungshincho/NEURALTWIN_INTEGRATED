-- ============================================================================
-- Security Fixes: Add auth validation to SECURITY DEFINER functions
-- ============================================================================

-- Fix graph_n_hop_query to validate caller authorization
CREATE OR REPLACE FUNCTION public.graph_n_hop_query(p_user_id uuid, p_start_entity_id uuid, p_max_hops integer DEFAULT 3)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  -- Security: Verify caller matches requested user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot query data for other users';
  END IF;

  WITH RECURSIVE graph_traverse AS (
    -- Base case: start node
    SELECT 
      e.id as entity_id,
      e.label,
      e.properties,
      0 as depth,
      ARRAY[e.id] as path
    FROM graph_entities e
    WHERE e.id = p_start_entity_id AND e.user_id = p_user_id
    
    UNION ALL
    
    -- Recursive case: traverse edges
    SELECT 
      e.id as entity_id,
      e.label,
      e.properties,
      gt.depth + 1 as depth,
      gt.path || e.id as path
    FROM graph_traverse gt
    JOIN graph_relations r ON r.source_entity_id = gt.entity_id AND r.user_id = p_user_id
    JOIN graph_entities e ON e.id = r.target_entity_id
    WHERE gt.depth < p_max_hops
      AND NOT e.id = ANY(gt.path) -- Prevent cycles
  )
  SELECT jsonb_build_object(
    'nodes', (SELECT jsonb_agg(DISTINCT jsonb_build_object(
      'id', entity_id,
      'label', label,
      'properties', properties,
      'depth', depth
    )) FROM graph_traverse),
    'edges', (
      SELECT jsonb_agg(jsonb_build_object(
        'source', r.source_entity_id,
        'target', r.target_entity_id,
        'properties', r.properties,
        'weight', r.weight
      ))
      FROM graph_relations r
      WHERE r.source_entity_id IN (SELECT entity_id FROM graph_traverse)
        AND r.target_entity_id IN (SELECT entity_id FROM graph_traverse)
        AND r.user_id = p_user_id
    ),
    'paths', (SELECT jsonb_agg(DISTINCT path) FROM graph_traverse WHERE depth = p_max_hops)
  ) INTO result;
  
  RETURN result;
END;
$function$;

-- Fix graph_shortest_path to validate caller authorization
CREATE OR REPLACE FUNCTION public.graph_shortest_path(p_user_id uuid, p_start_id uuid, p_end_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
BEGIN
  -- Security: Verify caller matches requested user
  IF p_user_id != auth.uid() THEN
    RAISE EXCEPTION 'Unauthorized: Cannot query data for other users';
  END IF;

  WITH RECURSIVE bfs AS (
    -- Start node
    SELECT 
      e.id as entity_id,
      ARRAY[e.id] as path,
      0 as distance
    FROM graph_entities e
    WHERE e.id = p_start_id AND e.user_id = p_user_id
    
    UNION ALL
    
    -- BFS traversal
    SELECT 
      e.id as entity_id,
      bfs.path || e.id as path,
      bfs.distance + 1 as distance
    FROM bfs
    JOIN graph_relations r ON r.source_entity_id = bfs.entity_id AND r.user_id = p_user_id
    JOIN graph_entities e ON e.id = r.target_entity_id
    WHERE NOT e.id = ANY(bfs.path) -- Prevent cycles
      AND bfs.entity_id != p_end_id -- Stop when we reach the end
  )
  SELECT path INTO result
  FROM bfs
  WHERE entity_id = p_end_id
  ORDER BY distance ASC
  LIMIT 1;
  
  RETURN to_jsonb(result);
END;
$function$;

-- Add comment for future reference
COMMENT ON FUNCTION public.graph_n_hop_query IS 'Performs n-hop graph traversal. Validates caller authorization before querying.';
COMMENT ON FUNCTION public.graph_shortest_path IS 'Finds shortest path between entities. Validates caller authorization before querying.';