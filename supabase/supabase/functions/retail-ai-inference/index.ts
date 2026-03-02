import { createSupabaseWithAuth } from "../_shared/supabase-client.ts";
import { corsHeaders, handleCorsOptions } from "../_shared/cors.ts";
import { errorResponse } from "../_shared/error.ts";
import { chatCompletion } from "../_shared/ai/gateway.ts";
import { safeJsonParse, logParseResult } from '../_shared/safeJsonParse.ts';
import {
  type FourLayerResponse,
  parseFourLayerResponse,
  convertFlatToFourLayer,
  fourLayerToText,
  type StoreContext,
} from '../_shared/ai/response-framework.ts';
import {
  buildRetailInferencePrompt,
  formatKPIDataForPrompt,
  formatGraphDataForPrompt,
  formatRetailConceptsForPrompt,
  formatZoneDataForPrompt,
} from '../_shared/ai/prompts.ts';

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
  /** 4-Layer 구조화 응답 포함 여부 (기본: true) */
  include_layers?: boolean;
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

/**
 * @deprecated 4-Layer 전환 완료. buildRetailInferencePrompt(prompts.ts)로 대체되었습니다.
 * 기존 참조 코드 호환을 위해 유지합니다.
 */
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
  const corsResponse = handleCorsOptions(req);
  if (corsResponse) return corsResponse;

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return errorResponse('Unauthorized', 401);
    }

    const supabase = createSupabaseWithAuth(authHeader);
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return errorResponse('Unauthorized', 401);
    }

    const body: RetailAIRequest = await req.json();
    const { inference_type, store_id, include_layers = true, parameters = {} } = body;

    console.log(`[retail-ai-inference] Type: ${inference_type}, Store: ${store_id}, Layers: ${include_layers}`);

    // 1. 온톨로지 그래프 데이터 로드
    const graphData = await loadGraphData(supabase, store_id, user.id);

    // 2. 리테일 개념 계산
    const conceptsData = await computeRetailConcepts(supabase, store_id, parameters.days || 30);

    // 3. 추가 컨텍스트 데이터 로드
    const contextData = await loadContextData(supabase, store_id, inference_type, parameters);

    // 3-1. 매장 컨텍스트 로드 (4-Layer 프롬프트용)
    let storeContext: StoreContext | undefined;
    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('id, name, store_type, area_sqm')
        .eq('id', store_id)
        .single();

      if (storeData) {
        storeContext = {
          storeId: storeData.id,
          storeName: storeData.name ?? store_id,
          storeType: storeData.store_type ?? undefined,
          areaSqm: storeData.area_sqm ?? undefined,
          zoneCount: contextData.zones?.length ?? undefined,
          productCount: graphData.stats.entityByType?.['product'] ?? undefined,
        };
      }
    } catch (e) {
      console.warn('[retail-ai-inference] Could not load store context:', e);
    }

    // 4. AI 프롬프트 구성 (4-Layer 시스템 프롬프트 사용)
    const prompt = buildPromptWithLayers(inference_type, graphData, conceptsData, contextData, parameters, storeContext);

    // 5. AI 추론 실행 (4-Layer 파싱 포함)
    const { aiResult, layers } = await callAIWithLayers(prompt, include_layers);

    // 6. 결과 저장
    await supabase.from('ai_inference_results').insert({
      user_id: user.id,
      store_id,
      inference_type,
      result: aiResult,
      parameters,
    });

    // 7. 응답 구성 (기존 필드 + 선택적 4-Layer)
    const responseBody: Record<string, unknown> = {
      success: true,
      inference_type,
      store_id,
      result: aiResult,
      data_summary: {
        entities_analyzed: graphData.entities.length,
        relations_analyzed: graphData.relations.length,
        concepts_computed: Object.keys(conceptsData).length,
      },
    };

    if (include_layers && layers) {
      responseBody.layers = layers;
      responseBody.layerSummary = fourLayerToText(layers);
    }

    return new Response(JSON.stringify(responseBody), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[retail-ai-inference] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(errorMessage, 500);
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

// ============== Prompt Building (4-Layer Enhanced) ==============

/**
 * 4-Layer 시스템 프롬프트 + 데이터 컨텍스트를 결합한 프롬프트를 생성합니다.
 * 기존 buildPrompt를 대체하며, 4-Layer 응답 구조를 AI에게 지시합니다.
 */
function buildPromptWithLayers(
  inferenceType: InferenceType,
  graphData: any,
  conceptsData: any,
  contextData: any,
  parameters: any,
  storeContext?: StoreContext,
): string {
  // 4-Layer 시스템 프롬프트 (리테일 도메인 + 한국어 + JSON 스키마 포함)
  const systemPrompt = buildRetailInferencePrompt(inferenceType, storeContext);

  // 데이터 컨텍스트 조립
  const graphSection = formatGraphDataForPrompt(graphData);
  const conceptsSection = formatRetailConceptsForPrompt(conceptsData);
  const kpiSection = formatKPIDataForPrompt(contextData.recent_kpis || []);

  // 추론 타입별 추가 데이터 섹션
  let additionalDataSection = '';
  if (contextData.zones && contextData.zones.length > 0) {
    additionalDataSection += '\n' + formatZoneDataForPrompt(contextData.zones);
  }
  if (contextData.zone_metrics && contextData.zone_metrics.length > 0) {
    additionalDataSection += `\n## 구역 일별 성과 데이터 (최근 ${contextData.zone_metrics.length}건)\n${JSON.stringify(contextData.zone_metrics.slice(0, 30), null, 2)}`;
  }
  if (contextData.inventory && contextData.inventory.length > 0) {
    additionalDataSection += `\n## 재고 데이터 (${contextData.inventory.length}개 항목)\n${JSON.stringify(contextData.inventory.slice(0, 30).map((e: any) => ({ label: e.label, properties: e.properties })), null, 2)}`;
  }
  if (contextData.hourly_metrics && contextData.hourly_metrics.length > 0) {
    additionalDataSection += `\n## 시간대별 성과 데이터 (${contextData.hourly_metrics.length}건)\n${JSON.stringify(contextData.hourly_metrics.slice(0, 24), null, 2)}`;
  }
  if (contextData.customers && contextData.customers.length > 0) {
    additionalDataSection += `\n## 고객 데이터 (${contextData.customers.length}명)\n${JSON.stringify(contextData.customers.slice(0, 20).map((e: any) => ({ label: e.label, properties: e.properties })), null, 2)}`;
  }
  if (contextData.store_visits && contextData.store_visits.length > 0) {
    additionalDataSection += `\n## 방문 데이터 (최근 ${contextData.store_visits.length}건)\n${JSON.stringify(contextData.store_visits.slice(0, 30), null, 2)}`;
  }

  const parametersSection = `\n## 분석 파라미터\n${JSON.stringify(parameters, null, 2)}`;

  return `${systemPrompt}

${graphSection}

${conceptsSection}

${kpiSection}

${additionalDataSection}

${parametersSection}`;
}

/** @deprecated buildPromptWithLayers를 사용하세요. 기존 호환용으로 유지합니다. */
function buildPrompt(
  inferenceType: InferenceType,
  graphData: any,
  conceptsData: any,
  contextData: any,
  parameters: any
): string {
  return buildPromptWithLayers(inferenceType, graphData, conceptsData, contextData, parameters);
}

// ============== AI Execution (4-Layer Enhanced) ==============

/**
 * AI 호출 결과를 기존 flat 형식 + 4-Layer 구조 양쪽으로 파싱합니다.
 * 4-Layer 파싱이 실패해도 기존 flat 결과는 유지됩니다 (하위 호환).
 *
 * @param prompt - AI 프롬프트 (4-Layer 시스템 프롬프트 포함)
 * @param includeLayers - 4-Layer 파싱 수행 여부
 * @returns { aiResult, layers }
 */
async function callAIWithLayers(
  prompt: string,
  includeLayers: boolean,
): Promise<{ aiResult: AIInferenceResult; layers: FourLayerResponse | null }> {
  try {
    const data = await chatCompletion({
      model: 'gemini-2.5-flash',
      messages: [
        { role: 'system', content: prompt.split('\n\n')[0] },  // 시스템 프롬프트 부분
        { role: 'user', content: prompt },
      ],
      jsonMode: true,
      maxTokens: 4000,
    });

    const content = data.choices?.[0]?.message?.content || '';

    // 기존 flat 파싱 (하위 호환 유지)
    const parseResult = safeJsonParse<AIInferenceResult & Record<string, unknown>>(content, {
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

    logParseResult(parseResult, 'retail-ai-inference');

    if (!parseResult.success) {
      console.warn('[retail-ai-inference] Parse failed, using partial data');
    }

    const result = parseResult.data;

    const aiResult: AIInferenceResult = {
      insights: result.insights || [],
      recommendations: result.recommendations || [],
      metrics: result.metrics || {},
      confidence: parseResult.success ? (result.confidence || 0.7) : 0.3,
      ...(parseResult.success ? {} : { _fallback: true, _parseError: parseResult.error }),
    } as AIInferenceResult;

    // 4-Layer 파싱 (선택적)
    let layers: FourLayerResponse | null = null;
    if (includeLayers && parseResult.success) {
      // AI 응답에 4-layer 구조가 포함되어 있으면 직접 파싱
      layers = parseFourLayerResponse(content);

      if (!layers) {
        // 4-Layer 직접 파싱 실패 시, flat 결과를 변환하여 생성
        console.log('[retail-ai-inference] 4-layer direct parse failed, converting from flat result');
        layers = convertFlatToFourLayer(aiResult);
      } else {
        console.log('[retail-ai-inference] 4-layer response parsed successfully');
      }
    }

    return { aiResult, layers };
  } catch (e) {
    console.error('AI call failed:', e);
    const fallbackResult: AIInferenceResult = {
      insights: ['AI 분석 중 오류가 발생했습니다.'],
      recommendations: [],
      metrics: {},
      confidence: 0,
      _fallback: true,
    } as AIInferenceResult;

    return {
      aiResult: fallbackResult,
      layers: includeLayers ? convertFlatToFourLayer(fallbackResult) : null,
    };
  }
}

/** @deprecated callAIWithLayers를 사용하세요. 기존 호환용으로 유지합니다. */
async function callAI(prompt: string): Promise<AIInferenceResult> {
  const { aiResult } = await callAIWithLayers(prompt, false);
  return aiResult;
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
