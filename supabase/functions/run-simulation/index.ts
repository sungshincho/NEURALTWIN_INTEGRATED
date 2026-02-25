import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';
import { logAIResponse, createExecutionTimer, extractParseResultForLogging } from '../_shared/aiResponseLogger.ts';
import { safeJsonParse, SIMULATION_FALLBACK, logParseResult } from '../_shared/safeJsonParse.ts';

/**
 * run-simulation Edge Function
 *
 * AI 시뮬레이션 엔진
 * - 매장 데이터 기반 고객 행동 시뮬레이션
 * - 혼잡도/병목/동선 분석
 * - 진단 이슈 생성
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ===== 타입 정의 =====

// 🆕 Graph Layer 연동 타입 (Phase 3: Simulation-Graph 연결)
interface GraphEntity {
  id: string;
  entity_type_id: string;
  label: string;
  properties: Record<string, any>;
  entity_type?: {
    name: string;
    category: string;
  };
}

interface GraphRelation {
  id: string;
  relation_type_id: string;
  source_entity_id: string;
  target_entity_id: string;
  weight: number;
  properties?: Record<string, any>;
  relation_type?: {
    name: string;
  };
}

interface GraphContext {
  entities: GraphEntity[];
  relations: GraphRelation[];
  zone_entities: GraphEntity[];      // Zone 엔티티만 필터링
  product_entities: GraphEntity[];   // Product 엔티티만 필터링
  customer_entities: GraphEntity[];  // Customer 엔티티만 필터링
  zone_relations: {                   // Zone 간 관계 요약
    from_zone: string;
    to_zone: string;
    relation_type: string;
    weight: number;
  }[];
  entity_summary: {
    total_entities: number;
    by_type: Record<string, number>;
  };
}

// 🆕 환경/시나리오 컨텍스트 타입 (파인튜닝 데이터셋용)
interface EnvironmentContext {
  weather?: string;
  temperature?: number;
  humidity?: number;
  holiday_type?: string;
  day_of_week?: string;
  time_of_day?: string;
  impact?: {
    trafficMultiplier?: number;
    dwellTimeMultiplier?: number;
    conversionMultiplier?: number;
  };
  // 프리셋 시나리오 정보
  preset_scenario?: {
    id: string;
    name: string;
    traffic_multiplier?: number;
    discount_percent?: number;
    event_type?: string | null;
    expected_impact?: {
      visitorsMultiplier?: number;
      conversionMultiplier?: number;
      basketMultiplier?: number;
      dwellTimeMultiplier?: number;
    };
    risk_tags?: string[];
  } | null;
}

interface SimulationRequest {
  store_id: string;
  options: {
    duration_minutes: number;
    customer_count: number;
    time_of_day: 'morning' | 'afternoon' | 'evening' | 'peak';
    simulation_type: 'realtime' | 'predictive' | 'scenario';
  };
  // 🆕 환경/시나리오 컨텍스트 (파인튜닝용)
  environment_context?: EnvironmentContext | null;
}

interface DiagnosticIssue {
  id: string;
  severity: 'critical' | 'warning' | 'info';
  category: 'congestion' | 'flow' | 'conversion' | 'dwell_time' | 'staffing';
  zone_id?: string;
  zone_name?: string;
  title: string;
  description: string;
  current_value: number;
  threshold_value: number;
  impact: string;
  suggested_action: string;
}

interface ZoneAnalysis {
  zone_id: string;
  zone_name: string;
  visitor_count: number;
  avg_dwell_seconds: number;
  congestion_level: number;
  conversion_contribution: number;
  bottleneck_score: number;
}

// Graph 기반 최적화 추천 (Phase 3)
interface GraphRecommendation {
  id: string;
  type: 'layout' | 'product_placement' | 'staffing' | 'flow_optimization' | 'zone_connection';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  affected_zones: string[];
  expected_impact: {
    metric: string;
    improvement_percent: number;
  };
  implementation_steps: string[];
}

interface SimulationResult {
  simulation_id: string;
  timestamp: string;
  duration_minutes: number;
  kpis: {
    predicted_visitors: number;
    predicted_conversion_rate: number;
    predicted_revenue: number;
    avg_dwell_time_seconds: number;
    peak_congestion_percent: number;
  };
  zone_analysis: ZoneAnalysis[];
  flow_analysis: {
    primary_paths: {
      from_zone: string;
      to_zone: string;
      traffic_volume: number;
      avg_transition_time: number;
    }[];
    dead_zones: string[];
    congestion_points: string[];
  };
  hourly_analysis: {
    hour: string;
    visitor_count: number;
    congestion_level: number;
    revenue_estimate: number;
  }[];
  diagnostic_issues: DiagnosticIssue[];
  customer_journeys: {
    journey_id: string;
    customer_type: string;
    zones_visited: string[];
    total_time_seconds: number;
    purchased: boolean;
    purchase_amount?: number;
  }[];
  ai_insights: string[];
  confidence_score: number;
  // Phase 3: Graph 기반 추천
  graph_recommendations?: GraphRecommendation[];
}

// ===== 메인 핸들러 =====
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 🆕 실행 시간 측정 시작
  const timer = createExecutionTimer();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const authHeader = req.headers.get('Authorization');

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });

    // 🆕 사용자 인증 확인 (user_id 추출)
    let userId: string | null = null;
    if (authHeader) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser();
        userId = user?.id || null;
      } catch (authError) {
        console.warn('[Simulation] Auth check failed:', authError);
      }
    }
    console.log(`[Simulation] User: ${userId || 'anonymous'}`);

    const { store_id, options, environment_context }: SimulationRequest = await req.json();

    console.log(`[Simulation] 시작: store_id=${store_id}, options=`, options);
    if (environment_context) {
      console.log(`[Simulation] 환경 컨텍스트:`, environment_context);
    }

    // ===== 1. 매장 데이터 로드 =====
    const { data: zones } = await supabaseClient
      .from('zones_dim')
      .select('*')
      .eq('store_id', store_id);

    const { data: furniture } = await supabaseClient
      .from('furniture')
      .select('*')
      .eq('store_id', store_id);

    // 최근 30일 데이터
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

    const { data: transitions } = await supabaseClient
      .from('zone_transitions')
      .select('*')
      .eq('store_id', store_id)
      .gte('transition_date', dateStr);

    const { data: zoneMetrics } = await supabaseClient
      .from('zone_daily_metrics')
      .select('*')
      .eq('store_id', store_id)
      .gte('metric_date', dateStr);

    const { data: dailyKpis } = await supabaseClient
      .from('daily_kpis_agg')
      .select('*')
      .eq('store_id', store_id)
      .gte('kpi_date', dateStr);

    // ===== 1-B. Graph Layer 데이터 로드 (Phase 3: Simulation-Graph 연결) =====
    const { data: graphEntities } = await supabaseClient
      .from('graph_entities')
      .select(`
        id,
        entity_type_id,
        label,
        properties,
        ontology_entity_types (
          name,
          category
        )
      `)
      .eq('store_id', store_id);

    const { data: graphRelations } = await supabaseClient
      .from('graph_relations')
      .select(`
        id,
        relation_type_id,
        source_entity_id,
        target_entity_id,
        weight,
        properties,
        ontology_relation_types (
          name
        )
      `)
      .eq('store_id', store_id);

    // Graph 컨텍스트 구성
    const graphContext = buildGraphContext(graphEntities || [], graphRelations || []);

    console.log(`[Simulation] 데이터 로드: zones=${zones?.length || 0}, transitions=${transitions?.length || 0}, graph_entities=${graphEntities?.length || 0}, graph_relations=${graphRelations?.length || 0}`);

    // ===== 2. 분석 컨텍스트 구성 =====
    const analysisContext = buildAnalysisContext({
      zones: zones || [],
      furniture: furniture || [],
      transitions: transitions || [],
      zoneMetrics: zoneMetrics || [],
      dailyKpis: dailyKpis || [],
      options,
      graphContext,  // Phase 3: Graph 컨텍스트 추가
    });

    // ===== 3. AI 추론 또는 규칙 기반 시뮬레이션 =====
    let simulationResult: SimulationResult;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    if (LOVABLE_API_KEY) {
      // Gemini 2.5 Flash AI 호출 (Lovable API Gateway)
      // 🆕 environment_context를 AI 프롬프트에 전달하여 시뮬레이션 정확도 향상
      const aiResponse = await callGeminiForSimulation(analysisContext, LOVABLE_API_KEY, environment_context);
      simulationResult = parseAndValidateResult(aiResponse, zones || [], options);
    } else {
      // 규칙 기반 시뮬레이션 (API 키 없을 때)
      simulationResult = generateRuleBasedSimulation(analysisContext, zones || [], options);
    }

    // ===== 4. 진단 이슈 보완 =====
    simulationResult.diagnostic_issues = generateDiagnosticIssues(
      simulationResult.zone_analysis,
      simulationResult.flow_analysis,
      simulationResult.kpis
    );

    // ===== 4-B. Graph 기반 최적화 추천 생성 (Phase 3) =====
    if (graphContext.entity_summary.total_entities > 0) {
      simulationResult.graph_recommendations = generateGraphRecommendations(
        graphContext,
        simulationResult.zone_analysis,
        simulationResult.flow_analysis
      );
      console.log(`[Simulation] Graph 추천 ${simulationResult.graph_recommendations.length}개 생성`);
    }

    // ===== 5. 결과 저장 (선택적) =====
    try {
      await supabaseClient
        .from('simulation_history')
        .insert({
          id: simulationResult.simulation_id,
          store_id,
          simulation_type: options.simulation_type,
          input_params: options,
          result_data: simulationResult,
          created_at: new Date().toISOString(),
        });
    } catch (saveError) {
      console.warn('[Simulation] 결과 저장 실패 (테이블 없음?):', saveError);
    }

    // ===== 5-B. 시뮬레이션 결과를 Graph에 반영 (Phase 3) =====
    try {
      await saveSimulationToGraph(
        supabaseClient,
        store_id,
        userId,
        simulationResult,
        graphContext
      );
      console.log('[Simulation] Graph 반영 완료');
    } catch (graphSaveError) {
      console.warn('[Simulation] Graph 반영 실패 (무시):', graphSaveError);
    }

    console.log(`[Simulation] 완료: ${simulationResult.diagnostic_issues.length}개 이슈 발견`);

    // 🆕 AI 응답 로깅 (파인튜닝 데이터셋 수집)
    try {
      const executionTime = timer.getElapsedMs();

      // 시뮬레이션 결과 요약 생성
      const responseSummary = [
        `예상 방문객: ${simulationResult.kpis.predicted_visitors}명`,
        `예상 전환율: ${(simulationResult.kpis.predicted_conversion_rate * 100).toFixed(1)}%`,
        `예상 매출: ${simulationResult.kpis.predicted_revenue.toLocaleString()}원`,
        `발견 이슈: ${simulationResult.diagnostic_issues.length}개`,
        `신뢰도: ${simulationResult.confidence_score}%`,
      ].join(' | ');

      // 🆕 입력 변수 구성 (환경/시나리오 컨텍스트 포함)
      const inputVariables = {
        simulation_options: options,
        store_context: {
          zone_count: zones?.length || 0,
          furniture_count: furniture?.length || 0,
          transition_count: transitions?.length || 0,
        },
        analysis_context: analysisContext,
        // 🆕 파인튜닝용 환경/시나리오 컨텍스트
        environment_context: environment_context || null,
      };

      // 🆕 시나리오 타입 결정 (프리셋 시나리오 사용 시 반영)
      const logSimulationType = environment_context?.preset_scenario
        ? `scenario_${environment_context.preset_scenario.id}`
        : (options.simulation_type === 'predictive' ? 'demand_prediction' : 'traffic_flow');

      // 🆕 파인튜닝용: 사용자 화면에 표시되는 텍스트 응답 추출
      const userFacingTexts = {
        // AI 인사이트 (핵심 추천 메시지)
        ai_insights: simulationResult.ai_insights || [],
        // 진단 이슈 설명 및 권장 액션
        diagnostic_texts: simulationResult.diagnostic_issues.map((issue: DiagnosticIssue) => ({
          title: issue.title,
          description: issue.description,
          impact: issue.impact,
          suggested_action: issue.suggested_action,
          severity: issue.severity,
        })),
        // 요약 텍스트
        summary_text: responseSummary,
      };

      // 🆕 S0-5: 파싱 성공률 추적
      const isFallback = !!(simulationResult as any)?._fallback;

      await logAIResponse(supabaseClient, {
        storeId: store_id,
        userId: userId || undefined, // 🆕 user_id 추가
        functionName: 'run-simulation',
        simulationType: logSimulationType as any, // 동적 타입 허용
        inputVariables: inputVariables,
        // 🆕 aiResponse를 user_facing_texts로 변경 (파인튜닝 최적화)
        aiResponse: {
          user_facing_texts: userFacingTexts,
          // 핵심 지표만 포함 (전체 결과 제외)
          key_metrics: {
            predicted_visitors: simulationResult.kpis.predicted_visitors,
            predicted_conversion_rate: simulationResult.kpis.predicted_conversion_rate,
            predicted_revenue: simulationResult.kpis.predicted_revenue,
            peak_congestion_percent: simulationResult.kpis.peak_congestion_percent,
            confidence_score: simulationResult.confidence_score,
          },
          zone_summary: simulationResult.zone_analysis.map((z: ZoneAnalysis) => ({
            zone_name: z.zone_name,
            congestion_level: z.congestion_level,
            bottleneck_score: z.bottleneck_score,
          })),
          flow_summary: {
            dead_zones: simulationResult.flow_analysis.dead_zones,
            congestion_points: simulationResult.flow_analysis.congestion_points,
          },
        },
        responseSummary: {
          text: responseSummary,
          visitors: simulationResult.kpis.predicted_visitors,
          conversionRate: simulationResult.kpis.predicted_conversion_rate,
          revenue: simulationResult.kpis.predicted_revenue,
          issueCount: simulationResult.diagnostic_issues.length,
          confidence: simulationResult.confidence_score,
        },
        executionTimeMs: executionTime,
        modelUsed: LOVABLE_API_KEY ? 'gemini-2.5-flash' : 'rule-based',
        contextMetadata: {
          model_used: LOVABLE_API_KEY ? 'gemini-2.5-flash' : 'rule-based',
          zoneCount: zones?.length || 0,
          issueCount: simulationResult.diagnostic_issues.length,
          criticalIssues: simulationResult.diagnostic_issues.filter((i: any) => i.severity === 'critical').length,
          // 🆕 파인튜닝용 환경/시나리오 메타데이터
          weather: environment_context?.weather || null,
          holidayType: environment_context?.holiday_type || null,
          presetScenarioId: environment_context?.preset_scenario?.id || null,
          presetScenarioName: environment_context?.preset_scenario?.name || null,
          trafficMultiplier: environment_context?.impact?.trafficMultiplier || 1.0,
          hasEnvironmentContext: !!environment_context,
          hasPresetScenario: !!environment_context?.preset_scenario,
        },
        // 🆕 S0-5: 파싱 성공률 추적
        parseSuccess: !isFallback,
        usedFallback: isFallback,
        rawResponseLength: undefined, // AI 응답 원본이 함수 내부에서만 접근 가능
      });

      console.log(`[Simulation] 로깅 완료: ${executionTime}ms`);
    } catch (logError) {
      console.warn('[Simulation] 로깅 실패 (무시):', logError);
    }

    return new Response(JSON.stringify(simulationResult), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('[Simulation] 오류:', error);

    // 🆕 에러 로깅
    try {
      const supabaseClient = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      await logAIResponse(supabaseClient, {
        storeId: 'unknown',
        functionName: 'run-simulation',
        simulationType: 'traffic_flow',
        inputVariables: {},
        aiResponse: { error: error.message },
        executionTimeMs: timer.getElapsedMs(),
        hadError: true,
        errorMessage: error.message,
        // 🆕 S0-5: 파싱 성공률 추적 - 에러 시 실패 처리
        parseSuccess: false,
        usedFallback: false,
      });
    } catch {
      // 로깅 실패 무시
    }

    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

// ===== Graph 컨텍스트 구성 (Phase 3: Simulation-Graph 연결) =====
function buildGraphContext(entities: any[], relations: any[]): GraphContext {
  // 엔티티 타입별 분류
  const entityMap = new Map<string, GraphEntity>();
  const byType: Record<string, number> = {};

  const processedEntities: GraphEntity[] = entities.map((e: any) => {
    const typeName = e.ontology_entity_types?.name || 'unknown';
    byType[typeName] = (byType[typeName] || 0) + 1;

    const entity: GraphEntity = {
      id: e.id,
      entity_type_id: e.entity_type_id,
      label: e.label,
      properties: e.properties || {},
      entity_type: e.ontology_entity_types ? {
        name: e.ontology_entity_types.name,
        category: e.ontology_entity_types.category,
      } : undefined,
    };
    entityMap.set(e.id, entity);
    return entity;
  });

  // Zone/Product/Customer 엔티티 필터링
  const zone_entities = processedEntities.filter(
    (e) => e.entity_type?.name?.toLowerCase().includes('zone') ||
           e.entity_type?.category?.toLowerCase() === 'space'
  );

  const product_entities = processedEntities.filter(
    (e) => e.entity_type?.name?.toLowerCase().includes('product') ||
           e.entity_type?.category?.toLowerCase() === 'product'
  );

  const customer_entities = processedEntities.filter(
    (e) => e.entity_type?.name?.toLowerCase().includes('customer') ||
           e.entity_type?.category?.toLowerCase() === 'customer'
  );

  // 관계 처리
  const processedRelations: GraphRelation[] = relations.map((r: any) => ({
    id: r.id,
    relation_type_id: r.relation_type_id,
    source_entity_id: r.source_entity_id,
    target_entity_id: r.target_entity_id,
    weight: r.weight || 1.0,
    properties: r.properties || {},
    relation_type: r.ontology_relation_types ? {
      name: r.ontology_relation_types.name,
    } : undefined,
  }));

  // Zone 간 관계 추출
  const zoneEntityIds = new Set(zone_entities.map((z) => z.id));
  const zone_relations = processedRelations
    .filter((r) => zoneEntityIds.has(r.source_entity_id) && zoneEntityIds.has(r.target_entity_id))
    .map((r) => {
      const fromZone = entityMap.get(r.source_entity_id);
      const toZone = entityMap.get(r.target_entity_id);
      return {
        from_zone: fromZone?.label || r.source_entity_id,
        to_zone: toZone?.label || r.target_entity_id,
        relation_type: r.relation_type?.name || 'connected_to',
        weight: r.weight,
      };
    });

  return {
    entities: processedEntities,
    relations: processedRelations,
    zone_entities,
    product_entities,
    customer_entities,
    zone_relations,
    entity_summary: {
      total_entities: processedEntities.length,
      by_type: byType,
    },
  };
}

// ===== Graph 기반 최적화 추천 생성 (Phase 3) =====
function generateGraphRecommendations(
  graphContext: GraphContext,
  zoneAnalysis: ZoneAnalysis[],
  flowAnalysis: any
): GraphRecommendation[] {
  const recommendations: GraphRecommendation[] = [];
  let recId = 0;

  // 1. Zone 연결성 분석 - 고립된 Zone 개선
  const connectedZones = new Set([
    ...graphContext.zone_relations.map((r) => r.from_zone),
    ...graphContext.zone_relations.map((r) => r.to_zone),
  ]);
  const isolatedZones = graphContext.zone_entities.filter(
    (z) => !connectedZones.has(z.label)
  );

  if (isolatedZones.length > 0) {
    recommendations.push({
      id: `rec-${++recId}`,
      type: 'zone_connection',
      priority: 'high',
      title: '고립된 Zone 연결 개선',
      description: `${isolatedZones.map((z) => z.label).join(', ')} Zone이 그래프에서 연결되지 않았습니다. 동선 분석 정확도를 위해 연결 관계를 추가하세요.`,
      affected_zones: isolatedZones.map((z) => z.label),
      expected_impact: {
        metric: '동선 분석 정확도',
        improvement_percent: 15,
      },
      implementation_steps: [
        '고립된 Zone의 인접 Zone 파악',
        'connected_to 또는 leads_to 관계 추가',
        '동선 데이터 재수집 후 검증',
      ],
    });
  }

  // 2. 혼잡 구간 기반 레이아웃 최적화
  const congestionPoints = zoneAnalysis.filter((za) => za.congestion_level > 70);
  if (congestionPoints.length > 0) {
    // Graph에서 해당 Zone의 연결 관계 분석
    const highTrafficRelations = graphContext.zone_relations.filter(
      (r) => congestionPoints.some((cp) => cp.zone_name === r.to_zone) && r.weight > 0.5
    );

    if (highTrafficRelations.length > 0) {
      recommendations.push({
        id: `rec-${++recId}`,
        type: 'layout',
        priority: 'high',
        title: '혼잡 구간 레이아웃 최적화',
        description: `${congestionPoints.map((cp) => cp.zone_name).join(', ')}에 트래픽이 집중됩니다. 인접 Zone으로 트래픽을 분산시키세요.`,
        affected_zones: congestionPoints.map((cp) => cp.zone_name),
        expected_impact: {
          metric: '피크 혼잡도',
          improvement_percent: 20,
        },
        implementation_steps: [
          '혼잡 Zone의 가구/집기 배치 재검토',
          '대체 동선 유도 사이니지 설치',
          '인기 상품을 인접 Zone으로 분산 배치',
        ],
      });
    }
  }

  // 3. Dead Zone 활성화 추천
  if (flowAnalysis.dead_zones && flowAnalysis.dead_zones.length > 0) {
    // Graph에서 dead zone과 연결된 Zone 분석
    const deadZoneConnections = graphContext.zone_relations.filter(
      (r) => flowAnalysis.dead_zones.includes(r.to_zone) || flowAnalysis.dead_zones.includes(r.from_zone)
    );

    recommendations.push({
      id: `rec-${++recId}`,
      type: 'flow_optimization',
      priority: 'medium',
      title: 'Dead Zone 활성화',
      description: `${flowAnalysis.dead_zones.join(', ')} Zone의 방문율이 낮습니다. 동선 유도를 통해 방문율을 높이세요.`,
      affected_zones: flowAnalysis.dead_zones,
      expected_impact: {
        metric: 'Zone 방문율',
        improvement_percent: 30,
      },
      implementation_steps: [
        '주요 동선에서 Dead Zone으로의 시각적 연결 강화',
        '프로모션 상품 또는 체험 요소 배치',
        deadZoneConnections.length > 0
          ? `연결된 Zone(${[...new Set(deadZoneConnections.map((r) => r.from_zone))].join(', ')})에서 유도 배치`
          : '인접 Zone과의 연결 동선 생성',
      ],
    });
  }

  // 4. Product-Zone 관계 기반 상품 배치 추천
  if (graphContext.product_entities.length > 0 && graphContext.zone_entities.length > 0) {
    // 상품이 없는 고트래픽 Zone 찾기
    const highTrafficZones = zoneAnalysis
      .filter((za) => za.visitor_count > 50 && za.conversion_contribution < 10)
      .map((za) => za.zone_name);

    if (highTrafficZones.length > 0) {
      recommendations.push({
        id: `rec-${++recId}`,
        type: 'product_placement',
        priority: 'medium',
        title: '고트래픽 Zone 상품 배치 최적화',
        description: `${highTrafficZones.join(', ')}은 방문자가 많지만 전환 기여도가 낮습니다. 전략 상품 배치를 고려하세요.`,
        affected_zones: highTrafficZones,
        expected_impact: {
          metric: '전환율',
          improvement_percent: 10,
        },
        implementation_steps: [
          '고트래픽 Zone에 베스트셀러 상품 배치',
          '충동구매 유발 상품 디스플레이 추가',
          '시선 유도형 POP 설치',
        ],
      });
    }
  }

  // 5. 직원 배치 추천 (혼잡도 + 체류시간 기반)
  const staffingNeededZones = zoneAnalysis.filter(
    (za) => za.congestion_level > 60 && za.avg_dwell_seconds > 120
  );

  if (staffingNeededZones.length > 0) {
    recommendations.push({
      id: `rec-${++recId}`,
      type: 'staffing',
      priority: 'high',
      title: '피크 시간대 직원 배치 최적화',
      description: `${staffingNeededZones.map((z) => z.zone_name).join(', ')}에서 혼잡도와 체류시간이 높습니다. 추가 직원 배치를 고려하세요.`,
      affected_zones: staffingNeededZones.map((z) => z.zone_name),
      expected_impact: {
        metric: '고객 만족도',
        improvement_percent: 15,
      },
      implementation_steps: [
        '피크 시간대(오후 2-6시) 해당 Zone 직원 증원',
        '빠른 응대를 위한 모바일 POS 도입 고려',
        '고객 대기열 관리 시스템 도입',
      ],
    });
  }

  // 우선순위별 정렬
  const priorityOrder: Record<string, number> = { high: 0, medium: 1, low: 2 };
  recommendations.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return recommendations;
}

// ===== 시뮬레이션 결과를 Graph에 반영 (Phase 3) =====
async function saveSimulationToGraph(
  supabase: any,
  storeId: string,
  userId: string | null,
  result: SimulationResult,
  graphContext: GraphContext
): Promise<void> {
  if (!userId) {
    console.log('[Graph] userId 없음, Graph 반영 스킵');
    return;
  }

  // 1. SimulationEvent 엔티티 타입 조회 (또는 생성)
  let simulationEventTypeId: string | null = null;

  const { data: existingType } = await supabase
    .from('ontology_entity_types')
    .select('id')
    .eq('name', 'SimulationEvent')
    .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${userId}`)
    .limit(1)
    .single();

  if (existingType) {
    simulationEventTypeId = existingType.id;
  } else {
    // SimulationEvent 타입이 없으면 생성
    const { data: newType, error: typeError } = await supabase
      .from('ontology_entity_types')
      .insert({
        name: 'SimulationEvent',
        category: 'event',
        description: '시뮬레이션 실행 이벤트',
        user_id: userId,
        properties_schema: {
          simulation_id: { type: 'string' },
          simulation_type: { type: 'string' },
          predicted_visitors: { type: 'number' },
          predicted_revenue: { type: 'number' },
          confidence_score: { type: 'number' },
          issue_count: { type: 'number' },
        },
      })
      .select('id')
      .single();

    if (typeError) {
      console.warn('[Graph] SimulationEvent 타입 생성 실패:', typeError.message);
      return;
    }
    simulationEventTypeId = newType.id;
  }

  // 2. 시뮬레이션 이벤트 엔티티 생성
  const simulationEntity = {
    user_id: userId,
    store_id: storeId,
    entity_type_id: simulationEventTypeId,
    label: `Simulation_${result.simulation_id}`,
    properties: {
      simulation_id: result.simulation_id,
      timestamp: result.timestamp,
      duration_minutes: result.duration_minutes,
      predicted_visitors: result.kpis.predicted_visitors,
      predicted_conversion_rate: result.kpis.predicted_conversion_rate,
      predicted_revenue: result.kpis.predicted_revenue,
      peak_congestion_percent: result.kpis.peak_congestion_percent,
      confidence_score: result.confidence_score,
      issue_count: result.diagnostic_issues.length,
      critical_issues: result.diagnostic_issues.filter((i) => i.severity === 'critical').length,
      ai_insights: result.ai_insights,
    },
  };

  const { data: createdEntity, error: entityError } = await supabase
    .from('graph_entities')
    .insert(simulationEntity)
    .select('id')
    .single();

  if (entityError) {
    console.warn('[Graph] SimulationEvent 엔티티 생성 실패:', entityError.message);
    return;
  }

  console.log(`[Graph] SimulationEvent 엔티티 생성: ${createdEntity.id}`);

  // 3. Zone 엔티티와 관계 생성 (시뮬레이션이 분석한 Zone들)
  if (graphContext.zone_entities.length > 0) {
    // 'analyzed_by' 관계 타입 조회
    let analyzedByTypeId: string | null = null;

    const { data: relType } = await supabase
      .from('ontology_relation_types')
      .select('id')
      .eq('name', 'analyzed_by')
      .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${userId}`)
      .limit(1)
      .single();

    if (relType) {
      analyzedByTypeId = relType.id;
    } else {
      // 관계 타입 생성
      const { data: newRelType } = await supabase
        .from('ontology_relation_types')
        .insert({
          name: 'analyzed_by',
          description: '시뮬레이션에 의해 분석됨',
          user_id: userId,
        })
        .select('id')
        .single();

      if (newRelType) {
        analyzedByTypeId = newRelType.id;
      }
    }

    if (analyzedByTypeId) {
      // Zone 분석 결과와 연결
      const relations = result.zone_analysis.map((za) => {
        // 해당 zone_id를 가진 Graph 엔티티 찾기
        const zoneEntity = graphContext.zone_entities.find(
          (ze) => ze.label === za.zone_name || ze.properties?.zone_id === za.zone_id
        );

        if (!zoneEntity) return null;

        return {
          user_id: userId,
          store_id: storeId,
          relation_type_id: analyzedByTypeId,
          source_entity_id: zoneEntity.id,
          target_entity_id: createdEntity.id,
          weight: za.congestion_level / 100, // 혼잡도를 weight로 사용
          properties: {
            visitor_count: za.visitor_count,
            avg_dwell_seconds: za.avg_dwell_seconds,
            congestion_level: za.congestion_level,
            bottleneck_score: za.bottleneck_score,
            conversion_contribution: za.conversion_contribution,
          },
        };
      }).filter(Boolean);

      if (relations.length > 0) {
        const { error: relError } = await supabase
          .from('graph_relations')
          .insert(relations);

        if (relError) {
          console.warn('[Graph] Zone-Simulation 관계 생성 실패:', relError.message);
        } else {
          console.log(`[Graph] Zone-Simulation 관계 ${relations.length}개 생성`);
        }
      }
    }
  }

  // 4. 진단 이슈를 별도 엔티티로 저장 (critical 이슈만)
  const criticalIssues = result.diagnostic_issues.filter((i) => i.severity === 'critical');
  if (criticalIssues.length > 0) {
    // DiagnosticIssue 타입 조회/생성
    let issueTypeId: string | null = null;

    const { data: issueType } = await supabase
      .from('ontology_entity_types')
      .select('id')
      .eq('name', 'DiagnosticIssue')
      .or(`and(org_id.is.null,user_id.is.null),user_id.eq.${userId}`)
      .limit(1)
      .single();

    if (issueType) {
      issueTypeId = issueType.id;
    } else {
      const { data: newIssueType } = await supabase
        .from('ontology_entity_types')
        .insert({
          name: 'DiagnosticIssue',
          category: 'event',
          description: '시뮬레이션 진단 이슈',
          user_id: userId,
        })
        .select('id')
        .single();

      if (newIssueType) {
        issueTypeId = newIssueType.id;
      }
    }

    if (issueTypeId) {
      const issueEntities = criticalIssues.map((issue) => ({
        user_id: userId,
        store_id: storeId,
        entity_type_id: issueTypeId,
        label: `Issue_${issue.id}_${result.simulation_id}`,
        properties: {
          issue_id: issue.id,
          severity: issue.severity,
          category: issue.category,
          title: issue.title,
          description: issue.description,
          zone_name: issue.zone_name,
          current_value: issue.current_value,
          threshold_value: issue.threshold_value,
          impact: issue.impact,
          suggested_action: issue.suggested_action,
          simulation_id: result.simulation_id,
        },
      }));

      const { error: issueError } = await supabase
        .from('graph_entities')
        .insert(issueEntities);

      if (issueError) {
        console.warn('[Graph] DiagnosticIssue 엔티티 생성 실패:', issueError.message);
      } else {
        console.log(`[Graph] DiagnosticIssue 엔티티 ${issueEntities.length}개 생성`);
      }
    }
  }
}

// ===== 분석 컨텍스트 구성 =====
function buildAnalysisContext(data: any) {
  const { zones, furniture, transitions, zoneMetrics, dailyKpis, options, graphContext } = data;

  // 존별 평균 지표 계산
  const zoneStats = zones.map((zone: any) => {
    const metrics = zoneMetrics.filter((m: any) => m.zone_id === zone.id);
    const avgVisitors = metrics.length > 0
      ? metrics.reduce((sum: number, m: any) => sum + (m.total_visitors || 0), 0) / metrics.length
      : Math.floor(Math.random() * 50 + 20); // 데이터 없으면 랜덤
    const avgDwell = metrics.length > 0
      ? metrics.reduce((sum: number, m: any) => sum + (m.avg_dwell_seconds || 0), 0) / metrics.length
      : Math.floor(Math.random() * 60 + 30);

    return {
      zone_id: zone.id,
      zone_name: zone.zone_name || zone.zone_code,
      zone_code: zone.zone_code,
      zone_type: zone.zone_type,
      avg_daily_visitors: Math.round(avgVisitors),
      avg_dwell_seconds: Math.round(avgDwell),
      furniture_count: furniture.filter((f: any) => f.zone_id === zone.id).length,
    };
  });

  // 존 간 이동 확률 계산
  const transitionProbs: any[] = [];
  const transitionMap = new Map<string, any>();

  transitions.forEach((t: any) => {
    const key = `${t.from_zone_id}->${t.to_zone_id}`;
    const existing = transitionMap.get(key) || { count: 0, duration: 0, days: 0 };
    existing.count += t.transition_count || 1;
    existing.duration += (t.avg_duration_seconds || 60) * (t.transition_count || 1);
    existing.days += 1;
    existing.from_zone_id = t.from_zone_id;
    existing.to_zone_id = t.to_zone_id;
    transitionMap.set(key, existing);
  });

  const zoneOutbound = new Map<string, number>();
  transitionMap.forEach((v) => {
    const current = zoneOutbound.get(v.from_zone_id) || 0;
    zoneOutbound.set(v.from_zone_id, current + v.count);
  });

  transitionMap.forEach((v) => {
    const fromZone = zones.find((z: any) => z.id === v.from_zone_id);
    const toZone = zones.find((z: any) => z.id === v.to_zone_id);
    const outbound = zoneOutbound.get(v.from_zone_id) || v.count;

    transitionProbs.push({
      from_zone: fromZone?.zone_name || v.from_zone_id,
      to_zone: toZone?.zone_name || v.to_zone_id,
      probability: Math.round((v.count / outbound) * 100) / 100,
      avg_count_per_day: Math.round(v.count / Math.max(v.days, 1)),
      avg_duration_seconds: Math.round(v.duration / Math.max(v.count, 1)),
    });
  });

  // KPI 평균
  const avgKpis = {
    avg_daily_visitors: dailyKpis.length > 0
      ? Math.round(dailyKpis.reduce((s: number, k: any) => s + (k.total_visitors || 0), 0) / dailyKpis.length)
      : options.customer_count || 100,
    avg_conversion_rate: dailyKpis.length > 0
      ? Math.round(dailyKpis.reduce((s: number, k: any) => s + (k.conversion_rate || 0), 0) / dailyKpis.length * 100) / 100
      : 0.05,
    avg_daily_revenue: dailyKpis.length > 0
      ? Math.round(dailyKpis.reduce((s: number, k: any) => s + (k.total_revenue || 0), 0) / dailyKpis.length)
      : 500000,
  };

  // Graph 기반 인사이트 생성 (Phase 3)
  const graphInsights: string[] = [];
  if (graphContext && graphContext.entity_summary.total_entities > 0) {
    // Zone 엔티티와 zones_dim 비교
    if (graphContext.zone_entities.length !== zones.length) {
      graphInsights.push(
        `Graph Zone 엔티티(${graphContext.zone_entities.length}개)와 zones_dim(${zones.length}개) 불일치 - 동기화 필요`
      );
    }

    // Graph 관계 밀도 분석
    const relationDensity = graphContext.relations.length / Math.max(graphContext.entities.length, 1);
    if (relationDensity < 1) {
      graphInsights.push(
        `Graph 관계 밀도(${relationDensity.toFixed(2)})가 낮음 - 엔티티 간 연결 강화 권장`
      );
    }

    // 고립된 Zone 탐지
    const connectedZones = new Set([
      ...graphContext.zone_relations.map((r: any) => r.from_zone),
      ...graphContext.zone_relations.map((r: any) => r.to_zone),
    ]);
    const isolatedZones = graphContext.zone_entities.filter(
      (z: any) => !connectedZones.has(z.label)
    );
    if (isolatedZones.length > 0) {
      graphInsights.push(
        `고립된 Zone 엔티티 발견: ${isolatedZones.map((z: any) => z.label).join(', ')}`
      );
    }
  }

  return {
    store_summary: {
      zone_count: zones.length,
      furniture_count: furniture.length,
      data_days: dailyKpis.length || 30,
      // Phase 3: Graph 요약 추가
      graph_entity_count: graphContext?.entity_summary.total_entities || 0,
      graph_relation_count: graphContext?.relations.length || 0,
    },
    zone_stats: zoneStats,
    transition_probabilities: transitionProbs.sort((a: any, b: any) => b.avg_count_per_day - a.avg_count_per_day),
    historical_kpis: avgKpis,
    simulation_options: options,
    // Phase 3: Graph 컨텍스트 추가
    graph_context: graphContext ? {
      zone_entities: graphContext.zone_entities.map((e: any) => ({
        label: e.label,
        properties: e.properties,
      })),
      zone_relations: graphContext.zone_relations,
      entity_summary: graphContext.entity_summary,
      product_count: graphContext.product_entities.length,
      customer_count: graphContext.customer_entities.length,
    } : null,
    graph_insights: graphInsights,
  };
}

// ===== Gemini AI 호출 (Lovable API Gateway) =====
async function callGeminiForSimulation(
  context: any,
  apiKey: string,
  environmentContext?: EnvironmentContext | null
): Promise<string> {
  const systemPrompt = `당신은 리테일 매장 시뮬레이션 전문가입니다. 주어진 매장 데이터를 분석하여 고객 행동을 시뮬레이션하고 잠재적 문제점을 진단해주세요.

응답 형식 (JSON만 응답, 마크다운 코드블록 없이):
{
  "kpis": {
    "predicted_visitors": number,
    "predicted_conversion_rate": number (0-1),
    "predicted_revenue": number,
    "avg_dwell_time_seconds": number,
    "peak_congestion_percent": number (0-100)
  },
  "zone_analysis": [
    {
      "zone_id": "존 이름",
      "visitor_count": number,
      "avg_dwell_seconds": number,
      "congestion_level": number (0-100),
      "conversion_contribution": number (0-100),
      "bottleneck_score": number (0-100)
    }
  ],
  "flow_analysis": {
    "primary_paths": [
      { "from_zone": "존1", "to_zone": "존2", "traffic_volume": number, "avg_transition_time": number }
    ],
    "dead_zones": ["존 이름"],
    "congestion_points": ["존 이름"]
  },
  "ai_insights": ["인사이트1", "인사이트2", ...],
  "confidence_score": number (0-100)
}`;

  // 🆕 환경 컨텍스트 섹션 생성
  let environmentSection = '';
  if (environmentContext) {
    const envParts: string[] = [];

    if (environmentContext.weather) {
      envParts.push(`- 날씨: ${environmentContext.weather}`);
    }
    if (environmentContext.temperature !== undefined) {
      envParts.push(`- 기온: ${environmentContext.temperature}°C`);
    }
    if (environmentContext.humidity !== undefined) {
      envParts.push(`- 습도: ${environmentContext.humidity}%`);
    }
    if (environmentContext.holiday_type) {
      envParts.push(`- 휴일 유형: ${environmentContext.holiday_type}`);
    }
    if (environmentContext.day_of_week) {
      envParts.push(`- 요일: ${environmentContext.day_of_week}`);
    }
    if (environmentContext.time_of_day) {
      envParts.push(`- 시간대: ${environmentContext.time_of_day}`);
    }
    if (environmentContext.impact) {
      const impact = environmentContext.impact;
      if (impact.trafficMultiplier) {
        envParts.push(`- 트래픽 배율: ${impact.trafficMultiplier}x`);
      }
      if (impact.dwellTimeMultiplier) {
        envParts.push(`- 체류시간 배율: ${impact.dwellTimeMultiplier}x`);
      }
      if (impact.conversionMultiplier) {
        envParts.push(`- 전환율 배율: ${impact.conversionMultiplier}x`);
      }
    }

    // 프리셋 시나리오 정보
    if (environmentContext.preset_scenario) {
      const scenario = environmentContext.preset_scenario;
      envParts.push(`\n### 🎯 프리셋 시나리오`);
      envParts.push(`- 시나리오: ${scenario.name}`);
      if (scenario.traffic_multiplier) {
        envParts.push(`- 트래픽 배율: ${scenario.traffic_multiplier}x`);
      }
      if (scenario.discount_percent) {
        envParts.push(`- 할인율: ${scenario.discount_percent}%`);
      }
      if (scenario.event_type) {
        envParts.push(`- 이벤트 유형: ${scenario.event_type}`);
      }
      if (scenario.risk_tags?.length) {
        envParts.push(`- 리스크 태그: ${scenario.risk_tags.join(', ')}`);
      }
    }

    if (envParts.length > 0) {
      environmentSection = `\n### 🌤️ 환경 컨텍스트 (시뮬레이션 시 반드시 반영)\n${envParts.join('\n')}\n\n⚠️ **중요**: 위 환경/시나리오 조건을 KPI 예측 및 존 분석에 반영하세요.\n`;
    }
  }

  const userPrompt = `## 매장 데이터

### 존 통계 (최근 30일 평균)
${JSON.stringify(context.zone_stats, null, 2)}

### 존 간 이동 확률
${JSON.stringify(context.transition_probabilities.slice(0, 15), null, 2)}

### 역사적 KPI
${JSON.stringify(context.historical_kpis, null, 2)}

### 시뮬레이션 옵션
- 시뮬레이션 시간: ${context.simulation_options.duration_minutes}분
- 예상 고객 수: ${context.simulation_options.customer_count}명
- 시간대: ${context.simulation_options.time_of_day}
${environmentSection}
## 분석 요청

1. **KPI 예측**: 주어진 조건에서의 방문자 수, 전환율, 매출, 평균 체류시간, 피크 혼잡도를 예측해주세요.
${environmentContext ? '   - 환경 컨텍스트(날씨, 휴일, 시나리오 등)를 반드시 반영하세요.' : ''}

2. **존별 분석**: 각 존의 예상 방문자 수, 체류시간, 혼잡도, 병목 점수(0-100)를 분석해주세요.

3. **동선 분석**: 주요 이동 경로, 방문이 적은 존(dead zones), 혼잡 지점을 식별해주세요.

4. **AI 인사이트 (파인튜닝용 - 필수)**:
   - 데이터에서 발견한 주요 패턴과 개선 기회를 3-5개 한국어로 제시
   - 각 인사이트는 구체적 수치와 존 이름을 포함해야 함
   - 예시: "입구 존의 체류시간(평균 45초)이 전체 평균(30초) 대비 50% 높아 병목 발생 가능"
   - 예시: "프로모션 존 방문율(15%)이 낮아 동선 개선 또는 위치 변경 권장"

JSON 형식으로만 응답해주세요.`;

  console.log('[Simulation] Gemini API 호출 시작...');

  const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'google/gemini-2.5-flash',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[Simulation] Gemini API 에러:', response.status, errorText);
    throw new Error(`Gemini API 오류 (${response.status}): ${errorText}`);
  }

  const result = await response.json();

  if (result.error) {
    throw new Error(`Gemini API 오류: ${result.error.message || JSON.stringify(result.error)}`);
  }

  const content = result.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('Gemini API 응답에 content가 없습니다');
  }

  console.log('[Simulation] Gemini API 응답 수신 완료');
  return content;
}

// ===== 규칙 기반 시뮬레이션 (API 키 없을 때) =====
function generateRuleBasedSimulation(context: any, zones: any[], options: any): SimulationResult {
  const { zone_stats, historical_kpis, transition_probabilities } = context;

  // 시간대별 트래픽 배율
  const timeMultiplier: Record<string, number> = {
    morning: 0.6,
    afternoon: 1.0,
    evening: 0.8,
    peak: 1.4,
  };
  const multiplier = timeMultiplier[options.time_of_day] || 1.0;

  // KPI 예측
  const predictedVisitors = Math.round(options.customer_count * multiplier);
  const baseConversion = historical_kpis.avg_conversion_rate || 0.05;
  const predictedConversion = baseConversion * (0.9 + Math.random() * 0.2);
  const avgTicket = (historical_kpis.avg_daily_revenue || 500000) / (historical_kpis.avg_daily_visitors || 100);

  // 존별 분석 생성
  const zoneAnalysis: ZoneAnalysis[] = zone_stats.map((zs: any, idx: number) => {
    const visitorRatio = 0.3 + Math.random() * 0.7; // 30-100% 방문
    const visitors = Math.round(predictedVisitors * visitorRatio / zone_stats.length);

    // 혼잡도 계산 (방문자 수 기반)
    let congestion = Math.min(100, visitors * 2);
    if (zs.zone_type === 'entrance') congestion = Math.min(100, congestion * 1.3);
    if (zs.zone_type === 'checkout') congestion = Math.min(100, congestion * 1.5);

    // 병목 점수
    const bottleneck = congestion > 60 ? congestion - 20 + Math.random() * 20 : congestion * 0.5;

    return {
      zone_id: zs.zone_id,
      zone_name: zs.zone_name || `Zone ${idx + 1}`,
      visitor_count: visitors,
      avg_dwell_seconds: zs.avg_dwell_seconds || 60,
      congestion_level: Math.round(congestion),
      conversion_contribution: Math.round(10 + Math.random() * 20),
      bottleneck_score: Math.round(bottleneck),
    };
  });

  // 동선 분석
  const primaryPaths = transition_probabilities.slice(0, 5).map((tp: any) => ({
    from_zone: tp.from_zone,
    to_zone: tp.to_zone,
    traffic_volume: tp.avg_count_per_day * multiplier,
    avg_transition_time: tp.avg_duration_seconds,
  }));

  const deadZones = zoneAnalysis
    .filter((za: ZoneAnalysis) => za.visitor_count < predictedVisitors * 0.1)
    .map((za: ZoneAnalysis) => za.zone_name);

  const congestionPoints = zoneAnalysis
    .filter((za: ZoneAnalysis) => za.congestion_level > 70)
    .map((za: ZoneAnalysis) => za.zone_name);

  return {
    simulation_id: `sim-${Date.now()}`,
    timestamp: new Date().toISOString(),
    duration_minutes: options.duration_minutes,
    kpis: {
      predicted_visitors: predictedVisitors,
      predicted_conversion_rate: Math.round(predictedConversion * 1000) / 1000,
      predicted_revenue: Math.round(predictedVisitors * predictedConversion * avgTicket),
      avg_dwell_time_seconds: Math.round(zone_stats.reduce((s: number, z: any) => s + (z.avg_dwell_seconds || 60), 0) / Math.max(zone_stats.length, 1)),
      peak_congestion_percent: Math.max(...zoneAnalysis.map((za: ZoneAnalysis) => za.congestion_level)),
    },
    zone_analysis: zoneAnalysis,
    flow_analysis: {
      primary_paths: primaryPaths,
      dead_zones: deadZones,
      congestion_points: congestionPoints,
    },
    hourly_analysis: [],
    diagnostic_issues: [],
    customer_journeys: [],
    ai_insights: [
      `${options.time_of_day === 'peak' ? '피크 시간대' : '일반 시간대'} 기준 ${predictedVisitors}명 방문 예상`,
      `예상 전환율 ${(predictedConversion * 100).toFixed(1)}%로 평균 대비 ${predictedConversion > baseConversion ? '높음' : '낮음'}`,
      congestionPoints.length > 0 ? `${congestionPoints.join(', ')} 구역에서 혼잡 예상` : '전반적으로 혼잡도 양호',
      deadZones.length > 0 ? `${deadZones.join(', ')} 구역 방문율 저조 예상` : '모든 구역 방문율 양호',
    ],
    confidence_score: historical_kpis.avg_daily_visitors > 0 ? 75 : 50,
  };
}

// ===== 결과 파싱 및 검증 =====
function parseAndValidateResult(aiResponse: string, zones: any[], options: any): SimulationResult {
  // 🆕 safeJsonParse 사용 (Sprint 0: S0-2)
  const parseResult = safeJsonParse<Record<string, any>>(aiResponse, {
    fallback: {
      kpis: SIMULATION_FALLBACK.kpis,
      zone_analysis: [],
      flow_analysis: SIMULATION_FALLBACK.flow_analysis,
      ai_insights: SIMULATION_FALLBACK.ai_insights,
      confidence_score: 0,
    },
    stripMarkdown: true,
    enableLogging: true,
    functionName: 'run-simulation',
    validator: (obj: unknown) => {
      const o = obj as Record<string, unknown>;
      return (
        o !== null &&
        typeof o === 'object' &&
        (typeof o.kpis === 'object' || Array.isArray(o.zone_analysis))
      );
    },
  });

  // 파싱 결과 로깅
  logParseResult(parseResult, 'run-simulation');

  const parsed = parseResult.data;
  const isFallback = !parseResult.success;

  // 존 ID 매핑
  const zoneAnalysis = (parsed.zone_analysis || []).map((za: any) => {
    const zone = zones.find((z: any) => z.zone_name === za.zone_id || z.zone_name === za.zone_name);
    return {
      ...za,
      zone_id: zone?.id || za.zone_id,
      zone_name: zone?.zone_name || za.zone_name || za.zone_id,
    };
  });

  // 폴백인 경우 진단 이슈 추가
  const fallbackIssue: DiagnosticIssue | null = isFallback ? {
    id: 'parse-error',
    severity: 'warning',
    category: 'conversion',
    title: 'AI 응답 파싱 부분 실패',
    description: `AI 응답 처리 중 일부 오류가 발생했습니다. 결과가 불완전할 수 있습니다. (${parseResult.error})`,
    current_value: 0,
    threshold_value: 0,
    impact: '일부 분석 결과가 누락되었을 수 있습니다.',
    suggested_action: '시뮬레이션을 다시 실행하거나 결과를 주의해서 검토하세요.',
  } : null;

  return {
    simulation_id: `sim-${Date.now()}`,
    timestamp: new Date().toISOString(),
    duration_minutes: options.duration_minutes,
    kpis: parsed.kpis || SIMULATION_FALLBACK.kpis,
    zone_analysis: zoneAnalysis,
    flow_analysis: parsed.flow_analysis || SIMULATION_FALLBACK.flow_analysis,
    hourly_analysis: parsed.hourly_analysis || [],
    diagnostic_issues: fallbackIssue ? [fallbackIssue] : [],
    customer_journeys: [],
    ai_insights: parsed.ai_insights || [],
    confidence_score: isFallback ? 30 : (parsed.confidence_score || 70),
    // 🆕 폴백 여부 표시
    ...(isFallback ? { _fallback: true, _parseError: parseResult.error } : {}),
  } as SimulationResult;
}

// ===== 진단 이슈 생성 =====
function generateDiagnosticIssues(
  zoneAnalysis: ZoneAnalysis[],
  flowAnalysis: any,
  kpis: any
): DiagnosticIssue[] {
  const issues: DiagnosticIssue[] = [];
  let issueId = 0;

  // 존별 혼잡도 체크
  zoneAnalysis.forEach((zone) => {
    if (zone.congestion_level > 80) {
      issues.push({
        id: `issue-${++issueId}`,
        severity: 'critical',
        category: 'congestion',
        zone_id: zone.zone_id,
        zone_name: zone.zone_name,
        title: `${zone.zone_name} 혼잡도 위험`,
        description: `${zone.zone_name}의 혼잡도가 ${zone.congestion_level}%로 임계값(80%)을 초과했습니다.`,
        current_value: zone.congestion_level,
        threshold_value: 80,
        impact: '고객 이탈 증가, 구매 전환율 저하 예상',
        suggested_action: '가구 재배치 또는 동선 분산을 통한 혼잡도 완화',
      });
    } else if (zone.congestion_level > 60) {
      issues.push({
        id: `issue-${++issueId}`,
        severity: 'warning',
        category: 'congestion',
        zone_id: zone.zone_id,
        zone_name: zone.zone_name,
        title: `${zone.zone_name} 혼잡도 주의`,
        description: `${zone.zone_name}의 혼잡도가 ${zone.congestion_level}%로 주의가 필요합니다.`,
        current_value: zone.congestion_level,
        threshold_value: 60,
        impact: '피크 시간대 고객 불편 예상',
        suggested_action: '피크 시간대 직원 배치 강화 또는 동선 유도',
      });
    }

    // 병목 점수 체크
    if (zone.bottleneck_score > 70) {
      issues.push({
        id: `issue-${++issueId}`,
        severity: zone.bottleneck_score > 85 ? 'critical' : 'warning',
        category: 'flow',
        zone_id: zone.zone_id,
        zone_name: zone.zone_name,
        title: `${zone.zone_name} 병목 구간`,
        description: `${zone.zone_name}이 병목 구간으로 식별되었습니다. 높은 트래픽 대비 낮은 전환율을 보입니다.`,
        current_value: zone.bottleneck_score,
        threshold_value: 70,
        impact: '동선 효율성 저하, 전체 전환율에 부정적 영향',
        suggested_action: '레이아웃 재구성 또는 핵심 제품 재배치',
      });
    }

    // 체류시간 체크
    if (zone.avg_dwell_seconds < 30 && zone.visitor_count > 30) {
      issues.push({
        id: `issue-${++issueId}`,
        severity: 'warning',
        category: 'dwell_time',
        zone_id: zone.zone_id,
        zone_name: zone.zone_name,
        title: `${zone.zone_name} 체류시간 부족`,
        description: `${zone.zone_name}의 평균 체류시간이 ${zone.avg_dwell_seconds}초로 짧습니다.`,
        current_value: zone.avg_dwell_seconds,
        threshold_value: 60,
        impact: '제품 노출 효과 저하, 충동 구매 기회 손실',
        suggested_action: '시선을 끄는 디스플레이 배치 또는 체험 요소 추가',
      });
    }
  });

  // Dead zones 체크
  if (flowAnalysis.dead_zones && flowAnalysis.dead_zones.length > 0) {
    flowAnalysis.dead_zones.forEach((zoneName: string) => {
      issues.push({
        id: `issue-${++issueId}`,
        severity: 'warning',
        category: 'flow',
        zone_name: zoneName,
        title: `${zoneName} 방문율 저조`,
        description: `${zoneName}의 방문율이 저조합니다. 동선에서 소외되어 있을 수 있습니다.`,
        current_value: 0,
        threshold_value: 30,
        impact: '해당 존 제품 매출 기회 손실',
        suggested_action: '동선 유도 사이니지 설치 또는 인기 제품 배치',
      });
    });
  }

  // 전환율 체크
  if (kpis.predicted_conversion_rate && kpis.predicted_conversion_rate < 0.03) {
    issues.push({
      id: `issue-${++issueId}`,
      severity: 'critical',
      category: 'conversion',
      title: '전환율 심각 저하',
      description: `예상 전환율이 ${(kpis.predicted_conversion_rate * 100).toFixed(1)}%로 매우 낮습니다.`,
      current_value: kpis.predicted_conversion_rate * 100,
      threshold_value: 5,
      impact: '매출 목표 달성 어려움',
      suggested_action: '전체적인 레이아웃 및 제품 배치 최적화 필요',
    });
  }

  // severity 순으로 정렬
  const severityOrder: Record<string, number> = { critical: 0, warning: 1, info: 2 };
  issues.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return issues;
}
