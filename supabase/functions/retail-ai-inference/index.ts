import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';
import { safeJsonParse, INFERENCE_FALLBACK, logParseResult } from '../_shared/safeJsonParse.ts';

/**
 * retail-ai-inference Edge Function
 *
 * 리테일 전문 AI 추론 엔진
 * 온톨로지 그래프 + 리테일 개념 + AI를 결합하여 인사이트 생성
 *
 * Inference Types:
 * - layout_optimization: 매장 레이아웃 최적화
 * - zone_analysis: 구역별 성과 분석
 * - traffic_flow: 고객 동선 분석
 * - demand_forecast: 수요 예측
 * - inventory_optimization: 재고 최적화
 * - cross_sell: 교차 판매 기회
 * - customer_segmentation: 고객 세분화
 * - anomaly_detection: 이상 탐지
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

type InferenceType =
  | 'layout_optimization'
  | 'zone_analysis'
  | 'traffic_flow'
  | 'demand_forecast'
  | 'inventory_optimization'
  | 'cross_sell'
  | 'customer_segmentation'
  | 'anomaly_detection';

interface RetailAIRequest {
  inference_type: InferenceType;
  store_id: string;
  parameters?: {
    days?: number;
    zone_id?: string;
    product_id?: string;
    forecast_days?: number;
    segment_count?: number;
    [key: string]: any;
  };
}

interface AIInferenceResult {
  insights: string[];
  recommendations: Array<{
    title: string;
    description: string;
    priority: 'critical' | 'high' | 'medium' | 'low';
    category: string;
    expected_impact?: string;
    action_items?: string[];
  }>;
  metrics: Record<string, any>;
  confidence: number;
}

// 추론 타입별 프롬프트 템플릿
const inferencePrompts: Record<InferenceType, string> = {
  layout_optimization: `You are a retail store layout optimization expert.
Analyze the provided store data including zone performance, customer flow patterns, and sales metrics.
Recommend specific layout changes to:
1. Improve customer flow and reduce bottlenecks
2. Increase product visibility for underperforming zones
3. Optimize high-value product placement
4. Enhance customer experience and dwell time

Provide actionable recommendations with expected ROI estimates.`,

  zone_analysis: `You are a retail zone performance analyst.
Analyze each zone's performance metrics including:
1. Visitor traffic and conversion rates
2. Average dwell time and engagement
3. Revenue contribution and sales per sqm
4. Cross-zone customer movement patterns

Identify underperforming zones and recommend specific improvements.`,

  traffic_flow: `You are a customer journey optimization specialist.
Analyze customer movement patterns to:
1. Identify the most common customer journeys
2. Detect bottlenecks and dead zones
3. Find opportunities for impulse purchase placement
4. Recommend signage and navigation improvements

Focus on maximizing customer engagement and conversion.`,

  demand_forecast: `You are a retail demand forecasting expert.
Based on historical sales data and patterns:
1. Predict demand for the next 7-30 days by product/category
2. Identify seasonal trends and anomalies
3. Account for promotional impacts
4. Recommend optimal inventory levels

Provide confidence intervals for predictions.`,

  inventory_optimization: `You are an inventory management specialist.
Analyze inventory data to:
1. Identify slow-moving and excess inventory
2. Detect stockout risks and reorder points
3. Optimize safety stock levels
4. Recommend markdown strategies for aging inventory

Focus on maximizing inventory turnover while minimizing stockouts.`,

  cross_sell: `You are a cross-selling and merchandising expert.
Analyze co-purchase patterns to:
1. Identify strong product affinities
2. Recommend product bundling opportunities
3. Suggest complementary product placements
4. Design effective cross-sell promotions

Quantify expected revenue uplift for each recommendation.`,

  customer_segmentation: `You are a customer analytics expert.
Segment customers based on:
1. Purchase behavior and frequency
2. Product preferences and categories
3. Shopping patterns (time, zone visits)
4. Lifetime value and engagement

Provide actionable marketing strategies for each segment.`,

  anomaly_detection: `You are a retail operations anomaly detection specialist.
Identify unusual patterns in:
1. Sales spikes or drops
2. Traffic anomalies
3. Inventory discrepancies
4. Conversion rate changes

Classify anomalies by severity and recommend investigation actions.`,
};

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

    const body: RetailAIRequest = await req.json();
    const { inference_type, store_id, parameters = {} } = body;

    console.log(`[retail-ai-inference] Type: ${inference_type}, Store: ${store_id}`);

    // 1. 온톨로지 그래프 데이터 로드
    const graphData = await loadGraphData(supabase, store_id, user.id);

    // 2. 리테일 개념 계산
    const conceptsData = await computeRetailConcepts(supabase, store_id, parameters.days || 30);

    // 3. 추가 컨텍스트 데이터 로드
    const contextData = await loadContextData(supabase, store_id, inference_type, parameters);

    // 4. AI 프롬프트 구성
    const prompt = buildPrompt(inference_type, graphData, conceptsData, contextData, parameters);

    // 5. AI 추론 실행
    let aiResult: AIInferenceResult;

    if (lovableApiKey) {
      aiResult = await callAI(prompt, lovableApiKey);
    } else {
      // API 키가 없을 경우 룰 기반 폴백
      aiResult = generateRuleBasedResult(inference_type, graphData, conceptsData);
    }

    // 6. 결과 저장
    await supabase.from('ai_inference_results').insert({
      user_id: user.id,
      store_id,
      inference_type,
      result: aiResult,
      parameters,
    });

    return new Response(JSON.stringify({
      success: true,
      inference_type,
      store_id,
      result: aiResult,
      data_summary: {
        entities_analyzed: graphData.entities.length,
        relations_analyzed: graphData.relations.length,
        concepts_computed: Object.keys(conceptsData).length,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[retail-ai-inference] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============== Data Loading ==============

async function loadGraphData(supabase: any, storeId: string, userId: string) {
  // 엔티티 로드
  const { data: entities, error: entitiesError } = await supabase
    .from('graph_entities')
    .select(`
      id, label, properties,
      entity_type:ontology_entity_types(id, name, label)
    `)
    .eq('store_id', storeId)
    .eq('user_id', userId)
    .limit(500);

  if (entitiesError) throw entitiesError;

  // 관계 로드
  const { data: relations, error: relationsError } = await supabase
    .from('graph_relations')
    .select(`
      id, weight, properties,
      source:graph_entities!graph_relations_source_entity_id_fkey(id, label),
      target:graph_entities!graph_relations_target_entity_id_fkey(id, label),
      relation_type:ontology_relation_types(id, name, label)
    `)
    .eq('store_id', storeId)
    .eq('user_id', userId)
    .limit(1000);

  if (relationsError) throw relationsError;

  // 엔티티 타입별 집계
  const entityByType: Record<string, number> = {};
  (entities || []).forEach((e: any) => {
    const typeName = e.entity_type?.name || 'unknown';
    entityByType[typeName] = (entityByType[typeName] || 0) + 1;
  });

  // 관계 타입별 집계
  const relationByType: Record<string, number> = {};
  (relations || []).forEach((r: any) => {
    const typeName = r.relation_type?.name || 'unknown';
    relationByType[typeName] = (relationByType[typeName] || 0) + 1;
  });

  return {
    entities: entities || [],
    relations: relations || [],
    stats: {
      totalEntities: entities?.length || 0,
      totalRelations: relations?.length || 0,
      entityByType,
      relationByType,
    },
  };
}

async function computeRetailConcepts(supabase: any, storeId: string, days: number) {
  try {
    const { data, error } = await supabase.rpc('compute_all_retail_concepts', {
      p_store_id: storeId,
      p_days: days,
    });

    if (error) {
      console.warn('Could not compute retail concepts:', error);
      return {};
    }

    return data || {};
  } catch (e) {
    console.warn('Retail concepts computation failed:', e);
    return {};
  }
}

async function loadContextData(
  supabase: any,
  storeId: string,
  inferenceType: InferenceType,
  parameters: any
) {
  const contextData: Record<string, any> = {};

  // 최근 KPI 데이터 (daily_kpis_agg 테이블 사용)
  const { data: kpis } = await supabase
    .from('daily_kpis_agg')
    .select('*')
    .eq('store_id', storeId)
    .order('kpi_date', { ascending: false })
    .limit(7);

  contextData.recent_kpis = kpis || [];

  // 추론 타입별 추가 데이터
  switch (inferenceType) {
    case 'layout_optimization':
    case 'zone_analysis':
    case 'traffic_flow':
      // 구역 데이터 (zones_dim 테이블 우선 사용)
      const { data: zones } = await supabase
        .from('zones_dim')
        .select(`
          id, zone_name, zone_type, display_name, description,
          model_3d_position, model_3d_rotation, model_3d_scale,
          area_sqm, capacity, is_active
        `)
        .eq('store_id', storeId)
        .eq('is_active', true);

      // zones_dim에 데이터가 없으면 graph_entities 폴백
      if (zones && zones.length > 0) {
        contextData.zones = zones;
      } else {
        const { data: graphZones } = await supabase
          .from('graph_entities')
          .select('*')
          .eq('store_id', storeId)
          .ilike('entity_type_id', '%zone%');
        contextData.zones = graphZones || [];
      }

      // zone_daily_metrics 추가 로드
      const { data: zoneMetrics } = await supabase
        .from('zone_daily_metrics')
        .select('*')
        .eq('store_id', storeId)
        .gte('date', new Date(Date.now() - (parameters.days || 30) * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('date', { ascending: false });
      contextData.zone_metrics = zoneMetrics || [];
      break;

    case 'demand_forecast':
    case 'inventory_optimization':
      // 재고 데이터
      const { data: inventory } = await supabase
        .from('graph_entities')
        .select('*')
        .eq('store_id', storeId)
        .not('properties->stock_quantity', 'is', null);
      contextData.inventory = inventory || [];

      // hourly_metrics 추가 로드 (시간대별 수요 패턴)
      const { data: hourlyMetrics } = await supabase
        .from('hourly_metrics')
        .select('*')
        .eq('store_id', storeId)
        .gte('hour_timestamp', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        .order('hour_timestamp', { ascending: false });
      contextData.hourly_metrics = hourlyMetrics || [];
      break;

    case 'cross_sell':
      // 최근 거래 데이터는 이미 그래프에 포함
      break;

    case 'customer_segmentation':
      // 고객 데이터
      const { data: customers } = await supabase
        .from('graph_entities')
        .select('*')
        .eq('store_id', storeId)
        .ilike('entity_type_id', '%customer%');
      contextData.customers = customers || [];

      // store_visits 추가 로드 (방문 패턴)
      const { data: visits } = await supabase
        .from('store_visits')
        .select('*')
        .eq('store_id', storeId)
        .gte('visit_date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
        .order('visit_date', { ascending: false })
        .limit(1000);
      contextData.store_visits = visits || [];
      break;
  }

  return contextData;
}

// ============== Prompt Building ==============

function buildPrompt(
  inferenceType: InferenceType,
  graphData: any,
  conceptsData: any,
  contextData: any,
  parameters: any
): string {
  const systemPrompt = inferencePrompts[inferenceType];

  const graphSummary = `
## Knowledge Graph Summary
- Total Entities: ${graphData.stats.totalEntities}
- Total Relations: ${graphData.stats.totalRelations}
- Entity Types: ${JSON.stringify(graphData.stats.entityByType, null, 2)}
- Relation Types: ${JSON.stringify(graphData.stats.relationByType, null, 2)}

### Sample Entities (Top 20)
${JSON.stringify(graphData.entities.slice(0, 20).map((e: any) => ({
  label: e.label,
  type: e.entity_type?.name,
  properties: e.properties,
})), null, 2)}

### Sample Relations (Top 20)
${JSON.stringify(graphData.relations.slice(0, 20).map((r: any) => ({
  source: r.source?.label,
  relation: r.relation_type?.name,
  target: r.target?.label,
  weight: r.weight,
})), null, 2)}
`;

  const conceptsSummary = `
## Retail Concepts Analysis
${JSON.stringify(conceptsData, null, 2)}
`;

  const contextSummary = `
## Additional Context
### Recent KPIs
${JSON.stringify(contextData.recent_kpis?.slice(0, 7), null, 2)}

### Analysis Parameters
${JSON.stringify(parameters, null, 2)}
`;

  const responseFormat = `
## Response Format
Respond with a JSON object containing:
{
  "insights": ["Key insight 1", "Key insight 2", ...],
  "recommendations": [
    {
      "title": "Recommendation title",
      "description": "Detailed description",
      "priority": "critical|high|medium|low",
      "category": "layout|inventory|marketing|operations",
      "expected_impact": "Expected business impact",
      "action_items": ["Action 1", "Action 2"]
    }
  ],
  "metrics": {
    "key_metric_1": value,
    "key_metric_2": value
  },
  "confidence": 0.85
}
`;

  return `${systemPrompt}

${graphSummary}

${conceptsSummary}

${contextSummary}

${responseFormat}`;
}

// ============== AI Execution ==============

async function callAI(prompt: string, apiKey: string): Promise<AIInferenceResult> {
  try {
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
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`AI API error: ${error}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || '';

    // 🆕 safeJsonParse 사용 (Sprint 0: S0-3)
    const parseResult = safeJsonParse<AIInferenceResult>(content, {
      fallback: {
        insights: ['AI 응답 파싱에 실패했습니다.'],
        recommendations: [],
        metrics: {},
        confidence: 0,
      },
      stripMarkdown: true,
      enableLogging: true,
      functionName: 'retail-ai-inference',
      validator: (obj: unknown) => {
        const o = obj as Record<string, unknown>;
        return o !== null && typeof o === 'object';
      },
    });

    // 파싱 결과 로깅
    logParseResult(parseResult, 'retail-ai-inference');

    if (!parseResult.success) {
      console.warn('[retail-ai-inference] Parse failed, using partial data');
    }

    const result = parseResult.data;

    return {
      insights: result.insights || [],
      recommendations: result.recommendations || [],
      metrics: result.metrics || {},
      confidence: parseResult.success ? (result.confidence || 0.7) : 0.3,
      // 🆕 폴백 여부 표시
      ...(parseResult.success ? {} : { _fallback: true, _parseError: parseResult.error }),
    } as AIInferenceResult;
  } catch (e) {
    console.error('AI call failed:', e);
    // 폴백
    return {
      insights: ['AI 분석 중 오류가 발생했습니다.'],
      recommendations: [],
      metrics: {},
      confidence: 0,
      _fallback: true,
    } as AIInferenceResult;
  }
}

// ============== Rule-based Fallback ==============

function generateRuleBasedResult(
  inferenceType: InferenceType,
  graphData: any,
  conceptsData: any
): AIInferenceResult {
  const insights: string[] = [];
  const recommendations: AIInferenceResult['recommendations'] = [];
  const metrics: Record<string, any> = {};

  // 기본 통계 기반 인사이트
  insights.push(`분석 대상: ${graphData.stats.totalEntities}개 엔티티, ${graphData.stats.totalRelations}개 관계`);

  // 구역 전환 퍼널 분석
  if (conceptsData.zone_conversion_funnel?.length > 0) {
    const topZone = conceptsData.zone_conversion_funnel[0];
    const lowConversionZones = conceptsData.zone_conversion_funnel.filter(
      (z: any) => z.conversion_rate < 10
    );

    if (lowConversionZones.length > 0) {
      insights.push(`${lowConversionZones.length}개 구역의 전환율이 10% 미만입니다.`);
      recommendations.push({
        title: '저전환율 구역 개선',
        description: `${lowConversionZones.map((z: any) => z.zone_name).join(', ')} 구역의 상품 구성 및 배치를 점검하세요.`,
        priority: 'high',
        category: 'layout',
        expected_impact: '전환율 5-10% 개선 예상',
        action_items: ['구역별 상품 구성 분석', '고객 피드백 수집', '시범 레이아웃 변경'],
      });
    }

    metrics.top_zone = topZone?.zone_name;
    metrics.avg_conversion_rate = conceptsData.zone_conversion_funnel.reduce(
      (sum: number, z: any) => sum + (z.conversion_rate || 0),
      0
    ) / conceptsData.zone_conversion_funnel.length;
  }

  // 재고 회전율 분석
  if (conceptsData.inventory_turnover?.length > 0) {
    const slowMoving = conceptsData.inventory_turnover.filter(
      (p: any) => p.turnover_rate < 2
    );

    if (slowMoving.length > 0) {
      insights.push(`${slowMoving.length}개 상품의 재고 회전율이 낮습니다 (회전율 < 2).`);
      recommendations.push({
        title: '저회전 재고 처리',
        description: `${slowMoving.slice(0, 3).map((p: any) => p.product_name).join(', ')} 등의 재고 처리가 필요합니다.`,
        priority: 'medium',
        category: 'inventory',
        expected_impact: '재고 비용 15-20% 절감 예상',
        action_items: ['할인 프로모션 계획', '번들 상품 구성', '반품 또는 이전 검토'],
      });
    }

    metrics.slow_moving_count = slowMoving.length;
    metrics.avg_turnover_rate = conceptsData.inventory_turnover.reduce(
      (sum: number, p: any) => sum + (p.turnover_rate || 0),
      0
    ) / conceptsData.inventory_turnover.length;
  }

  // 교차 판매 분석
  if (conceptsData.cross_sell_affinity?.length > 0) {
    const topPairs = conceptsData.cross_sell_affinity.slice(0, 3);
    insights.push(`상위 교차 판매 조합: ${topPairs.map((p: any) => `${p.product_a} + ${p.product_b}`).join(', ')}`);

    recommendations.push({
      title: '교차 판매 기회 활용',
      description: `${topPairs[0]?.product_a}와 ${topPairs[0]?.product_b}의 번들 프로모션을 고려하세요.`,
      priority: 'medium',
      category: 'marketing',
      expected_impact: '객단가 10-15% 증가 예상',
      action_items: ['번들 상품 기획', '인접 배치 구현', '크로스셀 POP 제작'],
    });

    metrics.top_cross_sell_pairs = topPairs.length;
  }

  return {
    insights,
    recommendations,
    metrics,
    confidence: 0.6, // 룰 기반 결과는 신뢰도가 낮음
  };
}
