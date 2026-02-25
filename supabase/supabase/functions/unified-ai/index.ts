import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

/**
 * unified-ai Edge Function
 *
 * Consolidates all AI-related functions:
 * - generate_recommendations: Rule-based KPI recommendations
 * - ontology_recommendation: AI-powered graph-based recommendations
 * - anomaly_detection: Knowledge graph anomaly detection
 * - pattern_analysis: Relation pattern analysis
 * - infer_relations: Entity relation inference
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============== Type Definitions ==============

interface UnifiedAIRequest {
  action: 'generate_recommendations' | 'ontology_recommendation' | 'anomaly_detection' | 'pattern_analysis' | 'infer_relations';
  store_id: string;
  entity_id?: string;
  parameters?: Record<string, any>;
}

interface KPI {
  // daily_kpis_agg 테이블 컬럼
  total_revenue: number;
  total_visitors: number;
  unique_visitors: number;
  total_transactions: number;
  conversion_rate: number;
  sales_per_sqm: number;
  sales_per_visitor: number;
  avg_transaction_value: number;
  avg_visit_duration_seconds: number;
  browse_to_engage_rate: number;
  engage_to_purchase_rate: number;
}

interface Recommendation {
  type: string;
  priority: string;
  title: string;
  description: string;
  category: string;
  impact: any;
  evidence: any;
}

interface GraphData {
  entities: any[];
  relations: any[];
  stats: {
    totalEntities: number;
    totalRelations: number;
    entityTypes: string[];
    relationTypes: string[];
  };
}

// ============== Main Handler ==============

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

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

    const body: UnifiedAIRequest = await req.json();
    const { action, store_id, entity_id, parameters = {} } = body;

    console.log(`[unified-ai] Action: ${action}, Store: ${store_id}, User: ${user.id}`);

    let result;

    switch (action) {
      case 'generate_recommendations':
        result = await handleGenerateRecommendations(supabase, user.id, store_id);
        break;

      case 'ontology_recommendation':
        if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured');
        result = await handleOntologyRecommendation(supabase, user.id, store_id, entity_id, parameters, lovableApiKey);
        break;

      case 'anomaly_detection':
        if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured');
        result = await handleAnomalyDetection(supabase, user.id, store_id, parameters, lovableApiKey);
        break;

      case 'pattern_analysis':
        if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured');
        result = await handlePatternAnalysis(supabase, user.id, store_id, parameters, lovableApiKey);
        break;

      case 'infer_relations':
        if (!lovableApiKey) throw new Error('LOVABLE_API_KEY is not configured');
        result = await handleInferRelations(supabase, user.id, store_id, entity_id, parameters, lovableApiKey);
        break;

      default:
        throw new Error(`Invalid action: ${action}. Valid actions: generate_recommendations, ontology_recommendation, anomaly_detection, pattern_analysis, infer_relations`);
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[unified-ai] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============== Action Handlers ==============

/**
 * Action: generate_recommendations
 * Rule-based KPI recommendations (from generate-ai-recommendations)
 */
async function handleGenerateRecommendations(supabase: any, userId: string, storeId: string) {
  // 1. Get latest KPI (daily_kpis_agg 테이블 사용)
  const { data: latestKpi, error: kpiError } = await supabase
    .from('daily_kpis_agg')
    .select('*')
    .eq('store_id', storeId)
    .order('date', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (kpiError) throw kpiError;
  if (!latestKpi) throw new Error('No KPI data found. Please aggregate KPIs first.');

  // 2. Get inventory data
  const { data: inventory, error: inventoryError } = await supabase
    .from('graph_entities')
    .select('*')
    .eq('user_id', userId)
    .eq('store_id', storeId);

  if (inventoryError) console.error('Inventory error:', inventoryError);

  // 3. Generate recommendations
  const recommendations = generateRuleBasedRecommendations(latestKpi, inventory || []);

  // 4. Deactivate existing recommendations for today
  const today = new Date().toISOString().split('T')[0];
  await supabase
    .from('ai_recommendations')
    .update({ is_displayed: false })
    .eq('user_id', userId)
    .eq('store_id', storeId)
    .gte('created_at', `${today}T00:00:00`);

  // 5. Save new recommendations (top 3)
  const topRecommendations = recommendations.slice(0, 3);
  const insertData = topRecommendations.map((rec) => ({
    user_id: userId,
    store_id: storeId,
    recommendation_type: rec.type,
    priority: rec.priority,
    title: rec.title,
    description: rec.description,
    action_category: rec.category,
    expected_impact: rec.impact,
    data_source: 'analysis',
    evidence: rec.evidence,
    status: 'pending',
    is_displayed: true,
    displayed_at: new Date().toISOString(),
  }));

  const { data: insertedRecs, error: insertError } = await supabase
    .from('ai_recommendations')
    .insert(insertData)
    .select();

  if (insertError) throw insertError;

  return {
    success: true,
    action: 'generate_recommendations',
    recommendations: insertedRecs,
    count: insertedRecs.length,
  };
}

/**
 * Action: ontology_recommendation
 * AI-powered graph-based recommendations (from ontology-ai-inference)
 */
async function handleOntologyRecommendation(
  supabase: any,
  userId: string,
  storeId: string,
  entityId: string | undefined,
  parameters: Record<string, any>,
  apiKey: string
) {
  const graphData = await loadOntologyGraph(supabase, storeId, userId);
  const recommendationType = parameters.recommendation_type || 'product';

  let contextEntity = null;
  if (entityId) {
    contextEntity = graphData.entities.find((e: any) => e.id === entityId);
  }

  const relationPatterns = analyzeRelationPatterns(graphData);
  const purchaseRelations = graphData.relations.filter((r: any) =>
    r.relation_type?.name === 'purchased' || r.relation_type?.name === 'bought'
  );

  const prompt = buildRecommendationPrompt(graphData, contextEntity, relationPatterns, purchaseRelations, recommendationType);
  const analysis = await callAIGateway(prompt, apiKey);

  // Save recommendations to database
  await saveRecommendationsToDatabase(supabase, userId, storeId, analysis.recommendations);

  return {
    success: true,
    action: 'ontology_recommendation',
    timestamp: new Date().toISOString(),
    context_entity: contextEntity,
    graph_stats: graphData.stats,
    ...analysis,
  };
}

/**
 * Action: anomaly_detection
 * Knowledge graph anomaly detection (from ontology-ai-inference)
 */
async function handleAnomalyDetection(
  supabase: any,
  userId: string,
  storeId: string,
  parameters: Record<string, any>,
  apiKey: string
) {
  const graphData = await loadOntologyGraph(supabase, storeId, userId);
  const structuralAnomalies = detectStructuralAnomalies(graphData);
  const valueAnomalies = detectValueAnomalies(graphData);

  const prompt = buildAnomalyDetectionPrompt(graphData, structuralAnomalies, valueAnomalies);
  const analysis = await callAIGateway(prompt, apiKey);

  return {
    success: true,
    action: 'anomaly_detection',
    timestamp: new Date().toISOString(),
    graph_stats: graphData.stats,
    statistical_baseline: {
      structural: structuralAnomalies,
      value: valueAnomalies,
    },
    ...analysis,
  };
}

/**
 * Action: pattern_analysis
 * Relation pattern analysis (from ontology-ai-inference)
 */
async function handlePatternAnalysis(
  supabase: any,
  userId: string,
  storeId: string,
  parameters: Record<string, any>,
  apiKey: string
) {
  const graphData = await loadOntologyGraph(supabase, storeId, userId);
  const analysisType = parameters.analysis_type || 'all';
  const frequencyPatterns = extractFrequencyPatterns(graphData);
  const coOccurrencePatterns = extractCoOccurrencePatterns(graphData);

  const prompt = buildPatternAnalysisPrompt(graphData, frequencyPatterns, coOccurrencePatterns, analysisType);
  const analysis = await callAIGateway(prompt, apiKey);

  return {
    success: true,
    action: 'pattern_analysis',
    timestamp: new Date().toISOString(),
    analysis_type: analysisType,
    graph_stats: graphData.stats,
    statistical_patterns: {
      frequency: frequencyPatterns,
      coOccurrence: coOccurrencePatterns,
    },
    ...analysis,
  };
}

/**
 * Action: infer_relations
 * Entity relation inference
 */
async function handleInferRelations(
  supabase: any,
  userId: string,
  storeId: string,
  entityId: string | undefined,
  parameters: Record<string, any>,
  apiKey: string
) {
  const graphData = await loadOntologyGraph(supabase, storeId, userId);

  let targetEntity = null;
  if (entityId) {
    targetEntity = graphData.entities.find((e: any) => e.id === entityId);
  }

  const prompt = buildRelationInferencePrompt(graphData, targetEntity, parameters);
  const analysis = await callAIGateway(prompt, apiKey);

  // Optionally save inferred relations
  if (parameters.auto_save && analysis.inferred_relations) {
    await saveInferredRelations(supabase, userId, storeId, analysis.inferred_relations);
  }

  return {
    success: true,
    action: 'infer_relations',
    timestamp: new Date().toISOString(),
    target_entity: targetEntity,
    graph_stats: graphData.stats,
    ...analysis,
  };
}

// ============== Graph Data Helpers ==============

async function loadOntologyGraph(supabase: any, storeId: string, userId: string): Promise<GraphData> {
  const { data: entities, error: entitiesError } = await supabase
    .from('graph_entities')
    .select(`
      *,
      entity_type:ontology_entity_types!graph_entities_entity_type_id_fkey(*)
    `)
    .eq('store_id', storeId)
    .eq('user_id', userId);

  if (entitiesError) throw entitiesError;

  const { data: relations, error: relationsError } = await supabase
    .from('graph_relations')
    .select(`
      *,
      source:graph_entities!graph_relations_source_entity_id_fkey(*),
      target:graph_entities!graph_relations_target_entity_id_fkey(*),
      relation_type:ontology_relation_types!graph_relations_relation_type_id_fkey(*)
    `)
    .eq('store_id', storeId)
    .eq('user_id', userId);

  if (relationsError) throw relationsError;

  return {
    entities: entities || [],
    relations: relations || [],
    stats: {
      totalEntities: entities?.length || 0,
      totalRelations: relations?.length || 0,
      entityTypes: [...new Set(entities?.map((e: any) => e.entity_type?.name).filter(Boolean) || [])] as string[],
      relationTypes: [...new Set(relations?.map((r: any) => r.relation_type?.name).filter(Boolean) || [])] as string[],
    }
  };
}

// ============== Rule-based Recommendations ==============

function generateRuleBasedRecommendations(kpi: KPI, inventory: any[]): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // 1. Low stock alert
  const lowStockItems = inventory.filter((item) => {
    const stock = item.properties?.stock_quantity || 0;
    const minStock = item.properties?.min_stock || 10;
    return stock < minStock;
  });

  if (lowStockItems.length > 0) {
    recommendations.push({
      type: 'alert',
      priority: 'high',
      title: '재고 부족 경고',
      description: `${lowStockItems.length}개 상품의 재고가 최소 수량 이하입니다. 즉시 발주가 필요합니다.`,
      category: 'inventory',
      impact: { revenue_loss_risk: lowStockItems.length * 50000 },
      evidence: {
        low_stock_count: lowStockItems.length,
        items: lowStockItems.slice(0, 5).map((i) => i.label),
      },
    });
  }

  // 2. Conversion rate improvement
  const conversionRate = kpi.conversion_rate || 0;
  if (conversionRate < 5) {
    const browseToEngage = kpi.browse_to_engage_rate || 0;
    recommendations.push({
      type: 'action',
      priority: 'medium',
      title: '전환율 개선 기회',
      description: `현재 전환율 ${conversionRate.toFixed(1)}%는 업계 평균(7-10%)보다 낮습니다. 상품 진열 개선과 직원 배치 최적화로 2-3% 향상 가능합니다.`,
      category: 'layout',
      impact: {
        cvr_increase: 2.5,
        revenue_increase: (kpi.total_revenue || 0) * 0.4,
      },
      evidence: {
        current_cvr: conversionRate,
        target_cvr: 7.0,
        browse_to_engage_rate: browseToEngage,
      },
    });
  }

  // 3. Sales per sqm optimization
  const salesPerSqm = kpi.sales_per_sqm || 0;
  if (salesPerSqm > 0 && salesPerSqm < 100000) {
    recommendations.push({
      type: 'action',
      priority: 'medium',
      title: '매장 공간 효율성 개선',
      description: `현재 매출/㎡가 ₩${Math.floor(salesPerSqm).toLocaleString()}로 목표치(₩150,000/㎡) 대비 낮습니다. 핫존 재배치로 20% 개선 가능합니다.`,
      category: 'layout',
      impact: {
        sales_per_sqm_increase: 30000,
        revenue_increase: (kpi.total_revenue || 0) * 0.2,
      },
      evidence: {
        current_sales_per_sqm: salesPerSqm,
        target_sales_per_sqm: 150000,
      },
    });
  }

  // 4. Customer engagement optimization (using browse_to_engage_rate)
  const browseToEngageRate = kpi.browse_to_engage_rate || 0;
  if (browseToEngageRate > 0 && browseToEngageRate < 50) {
    recommendations.push({
      type: 'insight',
      priority: 'low',
      title: '고객 참여율 개선',
      description: `탐색 고객 중 ${browseToEngageRate.toFixed(1)}%만 상품에 관심을 보입니다. 인터랙티브 디스플레이와 직원 안내 개선으로 15% 향상 가능합니다.`,
      category: 'staffing',
      impact: { engagement_rate_increase: 15 },
      evidence: {
        current_rate: browseToEngageRate,
        total_visitors: kpi.total_visitors,
        unique_visitors: kpi.unique_visitors,
      },
    });
  }

  // 5. Average transaction value improvement
  const avgTransactionValue = kpi.avg_transaction_value || 0;
  if (avgTransactionValue > 0 && avgTransactionValue < 50000) {
    recommendations.push({
      type: 'insight',
      priority: 'low',
      title: '객단가 향상 기회',
      description: `현재 평균 거래금액 ₩${Math.floor(avgTransactionValue).toLocaleString()}입니다. 교차판매와 번들 프로모션으로 20% 향상 가능합니다.`,
      category: 'promotion',
      impact: { atv_increase: avgTransactionValue * 0.2 },
      evidence: {
        current_atv: avgTransactionValue,
        total_transactions: kpi.total_transactions,
      },
    });
  }

  return recommendations;
}

// ============== AI Gateway Helper ==============

async function callAIGateway(prompt: string, apiKey: string): Promise<any> {
  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`AI API error: ${error}`);
  }

  const result = await response.json();
  return JSON.parse(result.choices[0].message.content);
}

// ============== Analysis Helpers ==============

function analyzeRelationPatterns(graphData: GraphData) {
  const relationTypeCounts: Record<string, number> = {};
  const entityPairCounts: Record<string, number> = {};

  graphData.relations.forEach((r: any) => {
    const relType = r.relation_type?.name || 'unknown';
    relationTypeCounts[relType] = (relationTypeCounts[relType] || 0) + 1;

    const sourceType = r.source?.entity_type?.name || 'unknown';
    const targetType = r.target?.entity_type?.name || 'unknown';
    const pairKey = `${sourceType}->${targetType}`;
    entityPairCounts[pairKey] = (entityPairCounts[pairKey] || 0) + 1;
  });

  return {
    relationTypeCounts,
    entityPairCounts,
    mostCommonRelation: Object.entries(relationTypeCounts).sort((a, b) => b[1] - a[1])[0],
  };
}

function detectStructuralAnomalies(graphData: GraphData) {
  const anomalies: any[] = [];

  // Isolated nodes detection
  const connectedEntityIds = new Set();
  graphData.relations.forEach((r: any) => {
    connectedEntityIds.add(r.source_entity_id);
    connectedEntityIds.add(r.target_entity_id);
  });

  const isolatedNodes = graphData.entities.filter((e: any) => !connectedEntityIds.has(e.id));

  if (isolatedNodes.length > 0) {
    anomalies.push({
      type: 'isolated_nodes',
      count: isolatedNodes.length,
      samples: isolatedNodes.slice(0, 5).map((e: any) => e.label),
    });
  }

  // Hub nodes detection
  const nodeDegrees: Record<string, number> = {};
  graphData.relations.forEach((r: any) => {
    nodeDegrees[r.source_entity_id] = (nodeDegrees[r.source_entity_id] || 0) + 1;
    nodeDegrees[r.target_entity_id] = (nodeDegrees[r.target_entity_id] || 0) + 1;
  });

  const degrees = Object.values(nodeDegrees);
  if (degrees.length > 0) {
    const avgDegree = degrees.reduce((a, b) => a + b, 0) / degrees.length;
    const stdDev = Math.sqrt(degrees.reduce((a, b) => a + Math.pow(b - avgDegree, 2), 0) / degrees.length);

    const hubThreshold = avgDegree + 2 * stdDev;
    const hubNodes = Object.entries(nodeDegrees)
      .filter(([_, degree]) => degree > hubThreshold)
      .map(([entityId, degree]) => {
        const entity = graphData.entities.find((e: any) => e.id === entityId);
        return { entityId, label: entity?.label, degree };
      });

    if (hubNodes.length > 0) {
      anomalies.push({
        type: 'hub_nodes',
        count: hubNodes.length,
        threshold: hubThreshold,
        samples: hubNodes.slice(0, 5),
      });
    }
  }

  return anomalies;
}

function detectValueAnomalies(graphData: GraphData) {
  const anomalies: any[] = [];

  const entityTypeGroups: Record<string, any[]> = {};
  graphData.entities.forEach((e: any) => {
    const typeName = e.entity_type?.name || 'unknown';
    if (!entityTypeGroups[typeName]) {
      entityTypeGroups[typeName] = [];
    }
    entityTypeGroups[typeName].push(e);
  });

  Object.entries(entityTypeGroups).forEach(([typeName, entities]) => {
    if (entities.length < 5) return;

    const propertyKeys = new Set<string>();
    entities.forEach(e => {
      if (e.properties) {
        Object.keys(e.properties).forEach(key => propertyKeys.add(key));
      }
    });

    propertyKeys.forEach(key => {
      const values = entities
        .map(e => e.properties?.[key])
        .filter(v => typeof v === 'number');

      if (values.length < 5) return;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const stdDev = Math.sqrt(values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length);

      const outliers = entities.filter(e => {
        const value = e.properties?.[key];
        if (typeof value !== 'number') return false;
        return Math.abs(value - mean) > 2 * stdDev;
      });

      if (outliers.length > 0) {
        anomalies.push({
          type: 'value_outlier',
          entityType: typeName,
          property: key,
          mean,
          stdDev,
          outlierCount: outliers.length,
          samples: outliers.slice(0, 3).map(e => ({
            label: e.label,
            value: e.properties[key],
          })),
        });
      }
    });
  });

  return anomalies;
}

function extractFrequencyPatterns(graphData: GraphData) {
  const patterns: Record<string, number> = {};

  graphData.relations.forEach((r: any) => {
    const relType = r.relation_type?.name || 'unknown';
    patterns[relType] = (patterns[relType] || 0) + 1;
  });

  graphData.entities.forEach((e: any) => {
    const entityType = e.entity_type?.name || 'unknown';
    const key = `entity:${entityType}`;
    patterns[key] = (patterns[key] || 0) + 1;
  });

  return Object.entries(patterns)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pattern, count]) => ({ pattern, count }));
}

function extractCoOccurrencePatterns(graphData: GraphData) {
  const coOccurrences: Record<string, number> = {};
  const sourceToTargets: Record<string, Set<string>> = {};

  graphData.relations.forEach((r: any) => {
    const sourceId = r.source_entity_id;
    const targetId = r.target_entity_id;

    if (!sourceToTargets[sourceId]) {
      sourceToTargets[sourceId] = new Set();
    }
    sourceToTargets[sourceId].add(targetId);
  });

  Object.values(sourceToTargets).forEach(targetSet => {
    const targets = Array.from(targetSet);
    for (let i = 0; i < targets.length; i++) {
      for (let j = i + 1; j < targets.length; j++) {
        const entity1 = graphData.entities.find((e: any) => e.id === targets[i]);
        const entity2 = graphData.entities.find((e: any) => e.id === targets[j]);

        if (entity1 && entity2) {
          const key = [entity1.label, entity2.label].sort().join(' & ');
          coOccurrences[key] = (coOccurrences[key] || 0) + 1;
        }
      }
    }
  });

  return Object.entries(coOccurrences)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pair, count]) => ({ pair, count }));
}

// ============== Prompt Builders ==============

function buildRecommendationPrompt(
  graphData: GraphData,
  contextEntity: any,
  relationPatterns: any,
  purchaseRelations: any[],
  recommendationType: string
): string {
  return `You are an expert recommendation system using knowledge graph analysis.

KNOWLEDGE GRAPH STATISTICS:
- Total Entities: ${graphData.stats.totalEntities}
- Total Relations: ${graphData.stats.totalRelations}
- Entity Types: ${graphData.stats.entityTypes.join(', ')}
- Relation Types: ${graphData.stats.relationTypes.join(', ')}

${contextEntity ? `CONTEXT ENTITY:
- ID: ${contextEntity.id}
- Label: ${contextEntity.label}
- Type: ${contextEntity.entity_type?.name}
- Properties: ${JSON.stringify(contextEntity.properties, null, 2)}
` : ''}

RELATION PATTERNS:
${JSON.stringify(relationPatterns, null, 2)}

PURCHASE PATTERNS (Sample of 20):
${JSON.stringify(purchaseRelations.slice(0, 20).map((r: any) => ({
  customer: r.source?.label,
  product: r.target?.label,
  properties: r.properties
})), null, 2)}

RECOMMENDATION TYPE: ${recommendationType}

Your task:
1. Analyze the knowledge graph structure and patterns
2. Identify collaborative filtering signals (products bought together)
3. Use graph traversal insights (customers with similar purchase patterns)
4. Consider entity properties (category, price, attributes)
5. Generate top recommendations with confidence scores

Return a JSON object:
{
  "recommendations": [
    {
      "entity_id": "recommended entity id",
      "entity_label": "Product Name or Customer Name",
      "entity_type": "Product|Customer|Category",
      "confidence": 0.92,
      "reasoning": "Why this is recommended (graph-based)",
      "supporting_relations": ["relation explanation 1", "relation explanation 2"],
      "expected_impact": {
        "conversion_probability": 0.15,
        "estimated_revenue": 45000,
        "cross_sell_potential": "high"
      }
    }
  ],
  "recommendation_strategy": {
    "primary_method": "collaborative_filtering|content_based|hybrid",
    "graph_depth_used": 2,
    "relation_types_analyzed": ["purchased", "located_in"],
    "confidence_threshold": 0.7
  },
  "insights": ["Key insight about recommendation patterns", "Graph structure observation"]
}`;
}

function buildAnomalyDetectionPrompt(
  graphData: GraphData,
  structuralAnomalies: any[],
  valueAnomalies: any[]
): string {
  return `You are an expert in graph-based anomaly detection for retail knowledge graphs.

KNOWLEDGE GRAPH OVERVIEW:
- Total Entities: ${graphData.stats.totalEntities}
- Total Relations: ${graphData.stats.totalRelations}
- Entity Types: ${graphData.stats.entityTypes.join(', ')}

STRUCTURAL ANOMALIES DETECTED (Statistical):
${JSON.stringify(structuralAnomalies, null, 2)}

VALUE ANOMALIES DETECTED (Statistical):
${JSON.stringify(valueAnomalies, null, 2)}

SAMPLE ENTITIES (20):
${JSON.stringify(graphData.entities.slice(0, 20).map((e: any) => ({
  id: e.id,
  label: e.label,
  type: e.entity_type?.name,
  properties: e.properties
})), null, 2)}

SAMPLE RELATIONS (20):
${JSON.stringify(graphData.relations.slice(0, 20).map((r: any) => ({
  source: r.source?.label,
  target: r.target?.label,
  type: r.relation_type?.name,
  weight: r.weight
})), null, 2)}

Your task:
1. Analyze graph patterns to identify anomalies
2. Detect unusual entity behaviors (isolated nodes, hub nodes)
3. Identify abnormal relation patterns (missing expected relations, unexpected relations)
4. Classify severity and business impact
5. Suggest root causes and remediation

Return a JSON object:
{
  "anomalies": [
    {
      "anomaly_id": "unique_id",
      "type": "structural|behavioral|temporal|value",
      "severity": "critical|high|medium|low",
      "entity_id": "affected entity id",
      "entity_label": "Product A",
      "description": "What is anomalous",
      "normal_pattern": "Expected behavior",
      "observed_pattern": "Actual behavior",
      "possible_causes": ["Data quality issue", "Business process change"],
      "business_impact": "Potential revenue loss, inventory issue, etc.",
      "recommended_action": "Investigate and fix",
      "confidence": 0.88
    }
  ],
  "anomaly_summary": {
    "total_anomalies": 5,
    "critical_count": 1,
    "high_count": 2,
    "graph_health_score": 0.78,
    "main_concerns": ["Isolated products", "Missing purchase relations"]
  },
  "insights": ["Pattern observation", "Recommendation for data quality"]
}`;
}

function buildPatternAnalysisPrompt(
  graphData: GraphData,
  frequencyPatterns: any[],
  coOccurrencePatterns: any[],
  analysisType: string
): string {
  return `You are an expert in graph pattern mining and retail analytics.

KNOWLEDGE GRAPH OVERVIEW:
- Total Entities: ${graphData.stats.totalEntities}
- Total Relations: ${graphData.stats.totalRelations}
- Entity Types: ${graphData.stats.entityTypes.join(', ')}
- Relation Types: ${graphData.stats.relationTypes.join(', ')}

FREQUENCY PATTERNS (Top patterns by occurrence):
${JSON.stringify(frequencyPatterns, null, 2)}

CO-OCCURRENCE PATTERNS (Products/Customers appearing together):
${JSON.stringify(coOccurrencePatterns, null, 2)}

ANALYSIS TYPE: ${analysisType}

Your task:
1. Identify significant patterns in the knowledge graph
2. Detect frequent subgraphs (e.g., Customer -> Purchase -> Product sequences)
3. Find association rules (If X then Y with confidence)
4. Analyze temporal patterns if timestamps available
5. Suggest business opportunities based on patterns

Return a JSON object:
{
  "patterns": [
    {
      "pattern_id": "pattern_1",
      "pattern_type": "frequency|association|sequential|cluster",
      "description": "Pattern description",
      "entities_involved": ["Product A", "Product B", "Customer C"],
      "relation_sequence": ["purchased", "located_in"],
      "support": 0.25,
      "confidence": 0.82,
      "lift": 1.5,
      "business_interpretation": "What this means for business",
      "actionable_insight": "Recommended action"
    }
  ],
  "association_rules": [
    {
      "antecedent": ["Product A"],
      "consequent": ["Product B"],
      "support": 0.15,
      "confidence": 0.75,
      "lift": 2.1,
      "interpretation": "Customers who buy A often buy B"
    }
  ],
  "clusters": [
    {
      "cluster_id": "cluster_1",
      "cluster_type": "Customer segment|Product category",
      "size": 45,
      "characteristics": "Common attributes",
      "representative_entities": ["Entity A", "Entity B"]
    }
  ],
  "insights": ["Key pattern finding", "Business opportunity"]
}`;
}

function buildRelationInferencePrompt(
  graphData: GraphData,
  targetEntity: any,
  parameters: Record<string, any>
): string {
  const inferenceScope = parameters.scope || 'all';
  const maxRelations = parameters.max_relations || 10;

  return `You are an expert in knowledge graph completion and relation inference.

KNOWLEDGE GRAPH OVERVIEW:
- Total Entities: ${graphData.stats.totalEntities}
- Total Relations: ${graphData.stats.totalRelations}
- Entity Types: ${graphData.stats.entityTypes.join(', ')}
- Relation Types: ${graphData.stats.relationTypes.join(', ')}

${targetEntity ? `TARGET ENTITY FOR INFERENCE:
- ID: ${targetEntity.id}
- Label: ${targetEntity.label}
- Type: ${targetEntity.entity_type?.name}
- Properties: ${JSON.stringify(targetEntity.properties, null, 2)}
- Existing Relations: ${graphData.relations.filter((r: any) =>
    r.source_entity_id === targetEntity.id || r.target_entity_id === targetEntity.id
  ).map((r: any) => ({
    type: r.relation_type?.name,
    connected_to: r.source_entity_id === targetEntity.id ? r.target?.label : r.source?.label
  })).slice(0, 10).map((r: any) => `${r.type} -> ${r.connected_to}`).join(', ')}
` : ''}

SAMPLE ENTITIES (30):
${JSON.stringify(graphData.entities.slice(0, 30).map((e: any) => ({
  id: e.id,
  label: e.label,
  type: e.entity_type?.name,
  properties: e.properties
})), null, 2)}

EXISTING RELATION PATTERNS (Sample of 30):
${JSON.stringify(graphData.relations.slice(0, 30).map((r: any) => ({
  source: r.source?.label,
  source_type: r.source?.entity_type?.name,
  relation: r.relation_type?.name,
  target: r.target?.label,
  target_type: r.target?.entity_type?.name
})), null, 2)}

INFERENCE SCOPE: ${inferenceScope}
MAX RELATIONS TO INFER: ${maxRelations}

Your task:
1. Analyze existing relation patterns to understand the graph schema
2. Identify missing relations that should logically exist
3. Infer new relations based on entity attributes and existing connections
4. Provide confidence scores based on supporting evidence
5. Suggest relation types that follow the existing ontology

Return a JSON object:
{
  "inferred_relations": [
    {
      "source_entity_id": "entity_id_1",
      "source_label": "Product A",
      "relation_type": "similar_to|purchased_with|located_in|...",
      "target_entity_id": "entity_id_2",
      "target_label": "Product B",
      "confidence": 0.85,
      "reasoning": "Why this relation should exist",
      "supporting_evidence": [
        "Shared attributes: category, price range",
        "Common customer purchasing pattern"
      ],
      "weight": 0.75
    }
  ],
  "inference_summary": {
    "total_inferred": 5,
    "high_confidence_count": 3,
    "relation_types_inferred": ["similar_to", "purchased_with"],
    "coverage_improvement": "15% more connections"
  },
  "insights": [
    "Pattern used for inference",
    "Potential data quality improvement"
  ]
}`;
}

// ============== Database Helpers ==============

async function saveRecommendationsToDatabase(
  supabase: any,
  userId: string,
  storeId: string,
  recommendations: any[]
) {
  if (!recommendations || recommendations.length === 0) return;

  const recordsToInsert = recommendations.slice(0, 3).map((rec, index) => ({
    user_id: userId,
    store_id: storeId,
    recommendation_type: 'insight',
    priority: index === 0 ? 'high' : index === 1 ? 'medium' : 'low',
    title: rec.entity_label || 'AI 추천',
    description: rec.reasoning || '',
    action_category: 'recommendation',
    expected_impact: rec.expected_impact,
    data_source: 'ontology_ai_inference',
    evidence: {
      confidence: rec.confidence,
      supporting_relations: rec.supporting_relations,
      entity_id: rec.entity_id,
      entity_type: rec.entity_type,
    },
    status: 'active',
    is_displayed: true,
    displayed_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('ai_recommendations')
    .insert(recordsToInsert);

  if (error) {
    console.error('Error saving recommendations to database:', error);
  } else {
    console.log(`Saved ${recordsToInsert.length} ontology-based recommendations to database`);
  }
}

async function saveInferredRelations(
  supabase: any,
  userId: string,
  storeId: string,
  relations: any[]
) {
  if (!relations || relations.length === 0) return;

  // Get relation type IDs
  const { data: relationTypes } = await supabase
    .from('ontology_relation_types')
    .select('id, name')
    .eq('user_id', userId);

  const relationTypeMap = new Map(relationTypes?.map((rt: any) => [rt.name, rt.id]) || []);

  const recordsToInsert = relations
    .filter((r: any) => r.confidence >= 0.7 && relationTypeMap.has(r.relation_type))
    .map((r: any) => ({
      user_id: userId,
      store_id: storeId,
      source_entity_id: r.source_entity_id,
      target_entity_id: r.target_entity_id,
      relation_type_id: relationTypeMap.get(r.relation_type),
      weight: r.weight || r.confidence,
      properties: {
        inferred: true,
        confidence: r.confidence,
        reasoning: r.reasoning,
      },
    }));

  if (recordsToInsert.length > 0) {
    const { error } = await supabase
      .from('graph_relations')
      .insert(recordsToInsert);

    if (error) {
      console.error('Error saving inferred relations:', error);
    } else {
      console.log(`Saved ${recordsToInsert.length} inferred relations to database`);
    }
  }
}
