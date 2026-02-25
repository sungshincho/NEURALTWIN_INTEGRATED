import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GraphQueryRequest {
  query_type: 'n_hop' | 'shortest_path' | 'pagerank' | 'community_detection' | 'cypher_like';
  start_entity_id?: string;
  end_entity_id?: string;
  max_hops?: number;
  cypher_query?: string;
  algorithm_params?: Record<string, any>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body: GraphQueryRequest = await req.json();
    console.log('Graph query request:', body);

    let result;
    switch (body.query_type) {
      case 'n_hop':
        result = await executeNHopQuery(supabase, user.id, body);
        break;
      case 'shortest_path':
        result = await executeShortestPath(supabase, user.id, body);
        break;
      case 'pagerank':
        result = await executePageRank(supabase, user.id, body);
        break;
      case 'community_detection':
        result = await executeCommunityDetection(supabase, user.id, body);
        break;
      case 'cypher_like':
        result = await executeCypherLike(supabase, user.id, body);
        break;
      default:
        throw new Error('Invalid query type');
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Graph query error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// N-hop query using recursive CTE
async function executeNHopQuery(supabase: any, userId: string, params: GraphQueryRequest) {
  const { start_entity_id, max_hops = 3 } = params;

  const { data, error } = await supabase.rpc('graph_n_hop_query', {
    p_user_id: userId,
    p_start_entity_id: start_entity_id,
    p_max_hops: max_hops,
  });

  if (error) {
    console.error('N-hop query error:', error);
    throw new Error(`N-hop query failed: ${error.message}`);
  }

  return { nodes: data.nodes || [], edges: data.edges || [], paths: data.paths || [] };
}

// Shortest path using BFS
async function executeShortestPath(supabase: any, userId: string, params: GraphQueryRequest) {
  const { start_entity_id, end_entity_id } = params;

  const { data, error } = await supabase.rpc('graph_shortest_path', {
    p_user_id: userId,
    p_start_id: start_entity_id,
    p_end_id: end_entity_id,
  });

  if (error) throw new Error(`Shortest path query failed: ${error.message}`);

  return { path: data || [], distance: data?.length || 0 };
}

// PageRank algorithm
async function executePageRank(supabase: any, userId: string, params: GraphQueryRequest) {
  const { algorithm_params = {} } = params;
  const damping = algorithm_params.damping || 0.85;
  const iterations = algorithm_params.iterations || 20;

  // Fetch all entities and relations
  const { data: entities, error: entitiesError } = await supabase
    .from('graph_entities')
    .select('id, label, entity_type_id')
    .eq('user_id', userId);

  if (entitiesError) throw new Error(`Failed to fetch entities: ${entitiesError.message}`);

  const { data: relations, error: relationsError } = await supabase
    .from('graph_relations')
    .select('source_entity_id, target_entity_id, weight')
    .eq('user_id', userId);

  if (relationsError) throw new Error(`Failed to fetch relations: ${relationsError.message}`);

  // Build adjacency list
  const graph: Record<string, Array<{ target: string; weight: number }>> = {};
  entities.forEach((e: any) => {
    graph[e.id] = [];
  });

  relations.forEach((r: any) => {
    if (graph[r.source_entity_id]) {
      graph[r.source_entity_id].push({ target: r.target_entity_id, weight: r.weight || 1 });
    }
  });

  // Calculate PageRank
  const ranks: Record<string, number> = {};
  entities.forEach((e: any) => {
    ranks[e.id] = 1.0 / entities.length;
  });

  for (let iter = 0; iter < iterations; iter++) {
    const newRanks: Record<string, number> = {};

    entities.forEach((e: any) => {
      let sum = 0;
      // Find all incoming edges
      relations.forEach((r: any) => {
        if (r.target_entity_id === e.id) {
          const outDegree = graph[r.source_entity_id]?.length || 1;
          sum += ranks[r.source_entity_id] / outDegree;
        }
      });

      newRanks[e.id] = (1 - damping) / entities.length + damping * sum;
    });

    Object.assign(ranks, newRanks);
  }

  // Sort by rank
  const rankedEntities = entities
    .map((e: any) => ({ ...e, pagerank: ranks[e.id] }))
    .sort((a: any, b: any) => b.pagerank - a.pagerank);

  return { entities: rankedEntities };
}

// Community detection using Label Propagation
async function executeCommunityDetection(supabase: any, userId: string, params: GraphQueryRequest) {
  const { algorithm_params = {} } = params;
  const iterations = algorithm_params.iterations || 10;

  // Fetch all entities and relations
  const { data: entities, error: entitiesError } = await supabase
    .from('graph_entities')
    .select('id, label')
    .eq('user_id', userId);

  if (entitiesError) throw new Error(`Failed to fetch entities: ${entitiesError.message}`);

  const { data: relations, error: relationsError } = await supabase
    .from('graph_relations')
    .select('source_entity_id, target_entity_id, weight')
    .eq('user_id', userId);

  if (relationsError) throw new Error(`Failed to fetch relations: ${relationsError.message}`);

  // Build adjacency list
  const graph: Record<string, string[]> = {};
  entities.forEach((e: any) => {
    graph[e.id] = [];
  });

  relations.forEach((r: any) => {
    if (graph[r.source_entity_id]) {
      graph[r.source_entity_id].push(r.target_entity_id);
    }
    if (graph[r.target_entity_id]) {
      graph[r.target_entity_id].push(r.source_entity_id);
    }
  });

  // Initialize communities (each node is its own community)
  const communities: Record<string, string> = {};
  entities.forEach((e: any) => {
    communities[e.id] = e.id;
  });

  // Label propagation
  for (let iter = 0; iter < iterations; iter++) {
    const nodeOrder = [...entities].sort(() => Math.random() - 0.5);

    nodeOrder.forEach((node: any) => {
      const neighbors = graph[node.id] || [];
      if (neighbors.length === 0) return;

      // Count community labels among neighbors
      const labelCount: Record<string, number> = {};
      neighbors.forEach((neighborId: string) => {
        const label = communities[neighborId];
        labelCount[label] = (labelCount[label] || 0) + 1;
      });

      // Assign most frequent label
      const maxLabel = Object.entries(labelCount).reduce((a, b) =>
        b[1] > a[1] ? b : a
      )[0];
      communities[node.id] = maxLabel;
    });
  }

  // Group by community
  const communityGroups: Record<string, any[]> = {};
  entities.forEach((e: any) => {
    const community = communities[e.id];
    if (!communityGroups[community]) {
      communityGroups[community] = [];
    }
    communityGroups[community].push({ ...e, community });
  });

  return {
    communities: Object.values(communityGroups),
    total_communities: Object.keys(communityGroups).length,
  };
}

// Cypher-like query parser (simplified)
async function executeCypherLike(supabase: any, userId: string, params: GraphQueryRequest) {
  const { cypher_query } = params;
  
  // Simple pattern: MATCH (a)-[r]->(b) WHERE ... RETURN ...
  // This is a simplified implementation
  
  if (!cypher_query) {
    throw new Error('Cypher query is required');
  }

  console.log('Executing Cypher-like query:', cypher_query);

  // Parse basic MATCH pattern
  const matchPattern = /MATCH\s+\((\w+):?(\w*)\)-\[(\w+):?(\w*)\]->\((\w+):?(\w*)\)/i;
  const match = cypher_query.match(matchPattern);

  if (!match) {
    throw new Error('Invalid Cypher query format. Use: MATCH (a:Type1)-[r:RelType]->(b:Type2)');
  }

  const [_, sourceVar, sourceType, relVar, relType, targetVar, targetType] = match;

  // Build query
  let query = supabase
    .from('graph_relations')
    .select(`
      id,
      source_entity:graph_entities!source_entity_id(id, label, entity_type_id),
      target_entity:graph_entities!target_entity_id(id, label, entity_type_id),
      relation_type:ontology_relation_types(name, label)
    `)
    .eq('user_id', userId);

  // Apply filters based on types
  if (relType) {
    const { data: relTypeData } = await supabase
      .from('ontology_relation_types')
      .select('id')
      .eq('name', relType)
      .eq('user_id', userId)
      .single();

    if (relTypeData) {
      query = query.eq('relation_type_id', relTypeData.id);
    }
  }

  const { data, error } = await query;

  if (error) throw new Error(`Cypher query failed: ${error.message}`);

  return { results: data || [] };
}
