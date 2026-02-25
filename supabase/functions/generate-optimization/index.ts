import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2.89.0';

// AI 응답 로깅 시스템
import {
  logAIResponse,
  createOptimizationSummary,
  createOptimizationContextMetadata,
  createExecutionTimer,
  type AIResponseLogInput,
} from '../_shared/aiResponseLogger.ts';

// Phase 0.1: 환경 데이터 로딩 시스템
import {
  loadEnvironmentDataBundle,
  type EnvironmentDataBundle,
  type EnvironmentImpact,
} from './data/environmentLoader.ts';

// Phase 0.2: 고객 동선 분석 시스템
import {
  analyzeCustomerFlow,
  type FlowAnalysisResult,
} from './data/flowAnalyzer.ts';

// Phase 0.3: 상품 연관성 분석 시스템
import {
  analyzeProductAssociations,
  type ProductAssociationResult,
} from './data/associationMiner.ts';

// Phase 1.1: Chain-of-Thought 프롬프트 빌더
import {
  buildAdvancedOptimizationPrompt,
  extractThinkingBlock,
  createPromptContext,
  createPromptConfig,
  type BuiltPrompt,
} from './ai/promptBuilder.ts';

// Phase 2.1: 매출 예측 모델
import {
  predictRevenue,
  summarizePredictions,
  createPredictionInput,
  formatPredictionForResponse,
  type RevenuePredictionOutput,
  type PredictionSummary,
} from './prediction/revenuePredictor.ts';

// Phase 2.2: 전환율 예측 모델
import {
  predictConversion,
  summarizeConversionPredictions,
  createConversionPredictionInput,
  formatConversionPredictionForResponse,
  type ConversionPredictionOutput,
  type ConversionPredictionSummary,
} from './prediction/conversionPredictor.ts';

// Phase 3: VMD 엔진
import {
  analyzeVMD,
  buildVMDContext,
  formatVMDAnalysisForResponse,
  type VMDAnalysisResult,
} from './vmd/vmdEngine.ts';

// 🆕 Sprint 2: VMD 룰셋 동적 로드 (S2-4)
import {
  loadVMDRulesets,
  buildVMDRulesetContext,
  findMatchingRules,
  recordRuleApplication,
  type VMDRule,
  type VMDRulesetContext,
} from '../_shared/vmd/vmdRulesetLoader.ts';

// 🆕 Sprint 3: Store Persona 로드 (S3-4)
import {
  buildPersonaPromptContext,
  learnFromFeedback,
  type PersonaPromptContext,
} from '../_shared/persona/storePersonaLoader.ts';

// Phase 4.2: 자동 학습 시스템
import {
  loadStoredParameters,
  runAutoLearning,
  formatLearningSessionForResponse,
  DEFAULT_MODEL_PARAMETERS,
  type ModelParameters,
  type LearningSessionSummary,
} from './feedback/autoLearning.ts';

// 🆕 B안: 통합 최적화 유틸리티
import {
  enhanceLayoutResultWithStaff,
  enhanceStaffingResultWithFurniture,
  type StaffSuggestions,
  type FurnitureAdjustments,
} from '../_shared/optimization/integratedOptimization.ts';

// 🆕 Phase 5: Structured Output 스키마 (리테일 도메인 지식 기반)
import {
  createResponseFormat,
  validateOptimizationResponse,
  VMD_PRINCIPLES,
  PLACEMENT_STRATEGIES,
} from './schemas/retailOptimizationSchema.ts';

// 🆕 Sprint 1: Function Calling 기반 계산 모듈
import {
  OPENROUTER_TOOLS,
  processToolCalls,
  hasToolCalls,
  extractToolCalls,
  formatToolResultsForAI,
  shouldEnableToolUse,
  logToolUsage,
  TOOL_USE_CONFIG,
  type ToolCall,
  type ToolCallResult,
} from '../_shared/calculations/index.ts';

/**
 * generate-optimization Edge Function
 *
 * 3D 디지털트윈 레이아웃 최적화 결과 생성
 *
 * Features:
 * - 현재 매장 레이아웃 분석
 * - 슬롯 호환성 기반 상품 배치 최적화
 * - 가구 위치 최적화 (이동 가능 가구만)
 * - AI 기반 또는 룰 기반 추천 생성
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Vector3D {
  x: number;
  y: number;
  z: number;
}

interface GenerateOptimizationRequest {
  store_id: string;
  optimization_type: 'furniture' | 'product' | 'both' | 'staffing';
  parameters?: {
    zone_ids?: string[];
    product_ids?: string[];
    furniture_ids?: string[];
    prioritize_revenue?: boolean;
    prioritize_visibility?: boolean;
    prioritize_accessibility?: boolean;
    max_changes?: number;
    // 🆕 P0 FIX: Intensity 설정 연동 파라미터
    max_product_changes?: number;
    max_furniture_changes?: number;
    intensity?: 'low' | 'medium' | 'high';
    goal?: 'revenue' | 'conversion' | 'traffic' | 'balanced';
    // 🆕 P1 FIX: 환경 컨텍스트 및 진단 이슈
    environment_context?: {
      weather?: string;
      temperature?: number;
      humidity?: number;
      holiday_type?: string;
      time_of_day?: string;
      impact?: any;
    };
    diagnostic_issues?: {
      priority_issues?: any[];
      scenario_context?: any;
      environment_context?: any;
      simulation_kpis?: any;
    };
    // 🆕 Staffing 최적화 파라미터
    staffing_goal?: 'customer_service' | 'sales' | 'efficiency';
    staff_count?: number;
    // 🆕 B안: 통합 최적화 파라미터
    include_staff_optimization?: boolean;
    allow_furniture_adjustment?: boolean;
    max_adjustment_distance?: number;
  };
}

interface FurnitureChange {
  furniture_id: string;
  furniture_type: string;
  // 결과 생성 과정에서 라벨이 포함될 수 있음(옵션)
  furniture_label?: string;
  movable: boolean;
  current: {
    zone_id: string;
    position: Vector3D;
    rotation: Vector3D;
  };
  suggested: {
    zone_id: string;
    position: Vector3D;
    rotation: Vector3D;
  };
  reason: string;
  priority: 'high' | 'medium' | 'low';
  expected_impact: number;
}

interface ProductChange {
  product_id: string;
  sku: string;
  // 결과 생성 과정에서 제품명이 포함될 수 있음(옵션)
  product_name?: string;
  current: {
    zone_id: string;
    furniture_id: string;
    slot_id: string;
    position: Vector3D;
  };
  suggested: {
    zone_id: string;
    furniture_id: string;
    slot_id: string;
    position: Vector3D;
  };
  reason: string;
  priority: 'high' | 'medium' | 'low';
  expected_revenue_impact: number;
  expected_visibility_impact: number;
}

// 🆕 Staffing 최적화 결과 타입
interface StaffPosition {
  staffId: string;
  staffCode: string;
  staffName: string;
  role: string;
  currentPosition: Vector3D;
  suggestedPosition: Vector3D;
  coverageGain: number;
  reason: string;
}

interface ZoneCoverage {
  zoneId: string;
  zoneName: string;
  currentCoverage: number;
  suggestedCoverage: number;
  requiredStaff: number;
  currentStaff: number;
}

interface StaffingMetrics {
  totalCoverage: number;
  avgResponseTime: number;
  coverageGain: number;
  customerServiceRateIncrease: number;
}

interface StaffingResult {
  staffPositions: StaffPosition[];
  zoneCoverage: ZoneCoverage[];
  metrics: StaffingMetrics;
  insights: string[];
  confidence: number;
}

interface AILayoutOptimizationResult {
  optimization_id: string;
  store_id: string;
  created_at: string;
  optimization_type: 'furniture' | 'product' | 'both' | 'staffing';
  furniture_changes: FurnitureChange[];
  product_changes: ProductChange[];
  // 🆕 Staffing 결과 (staffing 타입일 때만 포함)
  staffing_result?: StaffingResult;
  // 🆕 B안: 통합 최적화 결과
  staff_suggestions?: StaffSuggestions;
  furniture_adjustments?: FurnitureAdjustments;
  summary: {
    total_furniture_changes: number;
    total_product_changes: number;
    expected_revenue_improvement: number;
    expected_traffic_improvement: number;
    expected_conversion_improvement: number;
    // 🆕 Staffing 요약 (staffing 타입일 때)
    staffing_summary?: {
      total_staff_changes: number;
      coverage_improvement: number;
      service_rate_improvement: number;
    };
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // 🆕 실행 시간 측정 시작
  const executionTimer = createExecutionTimer();
  executionTimer.start();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authHeader = req.headers.get('Authorization');
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY');

    // Service Role 키로 Supabase 클라이언트 생성 (RLS 우회)
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: authHeader ? { Authorization: authHeader } : {} },
    });

    // 인증 확인 (선택적 - anon key도 허용)
    let userId: string | null = null;
    if (authHeader) {
      const { data: { user } } = await supabase.auth.getUser();
      userId = user?.id || null;
    }

    // 인증 없이도 진행 가능 (anon key 지원)
    console.log(`[generate-optimization] User: ${userId || 'anonymous'}`);

    const body: GenerateOptimizationRequest = await req.json();
    const { store_id, optimization_type, parameters = {} } = body;

    console.log(`[generate-optimization] Type: ${optimization_type}, Store: ${store_id}`);

    // 🆕 Phase 4.2: 학습된 모델 파라미터 로드
    let modelParameters: ModelParameters;
    try {
      modelParameters = await loadStoredParameters(supabase, store_id);
      console.log(`[generate-optimization] Loaded learned parameters for store: ${store_id}`);
    } catch (paramError) {
      console.warn(`[generate-optimization] Failed to load parameters, using defaults:`, paramError);
      modelParameters = { ...DEFAULT_MODEL_PARAMETERS };
    }

    // 1. 현재 레이아웃 데이터 로드
    const layoutData = await loadLayoutData(supabase, store_id, userId);

    // 2. 성과 데이터 로드
    const performanceData = await loadPerformanceData(supabase, store_id);

    // 3. 슬롯 데이터 로드
    const slotsData = await loadSlotsData(supabase, store_id);

    // 4. 🆕 환경 데이터 로드 (Phase 0.1)
    const environmentData = await loadEnvironmentDataBundle(supabase, store_id);
    console.log(`[generate-optimization] Environment: weather=${environmentData.dataQuality.hasWeatherData}, events=${environmentData.events.length}`);

    // 5. 🆕 고객 동선 분석 (Phase 0.2)
    const flowAnalysis = await analyzeCustomerFlow(supabase, store_id, 30);
    console.log(`[generate-optimization] Flow: zones=${flowAnalysis.summary.totalZones}, transitions=${flowAnalysis.summary.totalTransitions}, health=${flowAnalysis.summary.flowHealthScore}`);

    // 6. 🆕 상품 연관성 분석 (Phase 0.3)
    const associationData = await analyzeProductAssociations(supabase, store_id, 90);
    console.log(`[generate-optimization] Associations: rules=${associationData.summary.totalRulesFound}, strong=${associationData.summary.strongRulesCount}, quality=${associationData.summary.dataQuality}`);

    // 7. 🆕 VMD 분석 (Phase 3)
    const vmdContext = buildVMDContext(
      layoutData.zones,
      layoutData.furniture,
      layoutData.products,
      slotsData,
      flowAnalysis,
      associationData,
      performanceData.productPerformance
    );
    const vmdAnalysis = analyzeVMD(vmdContext);
    console.log(`[generate-optimization] VMD: score=${vmdAnalysis.score.overall}, grade=${vmdAnalysis.score.grade}, violations=${vmdAnalysis.violations.length}`);

    // 8. 최적화 생성
    let result: AILayoutOptimizationResult;

    // 🆕 진단 이슈 추출 (시뮬레이션에서 전달받은 경우)
    const diagnosticIssues = (parameters as any)?.diagnostic_issues || null;
    if (diagnosticIssues?.priority_issues?.length > 0) {
      console.log(`[generate-optimization] 🚨 Received ${diagnosticIssues.priority_issues.length} diagnostic issues from simulation`);
    }

    // 🆕 Staffing 최적화 분기 처리 (staffing 또는 both 타입)
    let staffingResult: StaffingResult | undefined;

    if (optimization_type === 'staffing' || optimization_type === 'both') {
      console.log(`[generate-optimization] 🧑‍💼 Staffing optimization requested (type: ${optimization_type})`);
      staffingResult = await performStaffingOptimization(
        supabase,
        lovableApiKey || '',
        store_id,
        layoutData,
        performanceData,
        parameters
      );
    }

    if (optimization_type === 'staffing') {
      // staffing 전용: staffing 결과만 반환
      result = {
        optimization_id: '',
        store_id: '',
        created_at: '',
        optimization_type: 'staffing',
        furniture_changes: [],
        product_changes: [],
        staffing_result: staffingResult,
        summary: {
          total_furniture_changes: 0,
          total_product_changes: 0,
          expected_revenue_improvement: staffingResult!.metrics.customerServiceRateIncrease / 100,
          expected_traffic_improvement: 0,
          expected_conversion_improvement: staffingResult!.metrics.coverageGain / 100,
          staffing_summary: {
            total_staff_changes: staffingResult!.staffPositions.length,
            coverage_improvement: staffingResult!.metrics.coverageGain,
            service_rate_improvement: staffingResult!.metrics.customerServiceRateIncrease,
          },
        },
      };
    } else if (lovableApiKey) {
      // both, furniture, product 타입: AI 최적화 수행
      result = await generateAIOptimization(
        lovableApiKey,
        layoutData,
        performanceData,
        slotsData,
        optimization_type,
        parameters,
        environmentData,  // 🆕 환경 데이터 추가
        flowAnalysis,     // 🆕 동선 분석 추가 (Phase 0.2)
        associationData,  // 🆕 연관성 분석 추가 (Phase 0.3)
        vmdAnalysis,      // 🆕 VMD 분석 추가 (Phase 3)
        diagnosticIssues  // 🆕 시뮬레이션 진단 이슈 추가
      );

      // 🆕 both 타입일 때 staffing 결과 병합
      if (optimization_type === 'both' && staffingResult) {
        console.log(`[generate-optimization] 🔀 Merging staffing result into 'both' optimization`);
        result.staffing_result = staffingResult;
        result.summary.staffing_summary = {
          total_staff_changes: staffingResult.staffPositions.length,
          coverage_improvement: staffingResult.metrics.coverageGain,
          service_rate_improvement: staffingResult.metrics.customerServiceRateIncrease,
        };
      }
    } else {
      // AI 키 없을 경우 룰 기반 최적화
      result = generateRuleBasedOptimization(
        layoutData,
        performanceData,
        slotsData,
        optimization_type,
        parameters,
        environmentData,  // 🆕 환경 데이터 추가
        flowAnalysis,     // 🆕 동선 분석 추가 (Phase 0.2)
        associationData   // 🆕 연관성 분석 추가 (Phase 0.3)
      );
    }

    // 5. 결과에 메타데이터 추가
    result.optimization_id = crypto.randomUUID();
    result.store_id = store_id;
    result.created_at = new Date().toISOString();
    result.optimization_type = optimization_type;

    // 🆕 B안: 직원 데이터 로드 (레이아웃 최적화 시 직원 제안용)
    let staffData: any[] = [];
    if (parameters?.include_staff_optimization && optimization_type !== 'staffing') {
      try {
        const { data: staffRows } = await supabase
          .from('staff')
          .select('id, staff_code, staff_name, role, avatar_position, assigned_zone_id')
          .eq('store_id', store_id)
          .eq('is_active', true);
        staffData = staffRows || [];
        console.log(`[generate-optimization] 🆕 B안: Loaded ${staffData.length} staff for integrated optimization`);
      } catch (err) {
        console.warn('[generate-optimization] B안: Staff data load failed:', err);
      }
    }

    // 🆕 B안: 레이아웃 최적화 결과에 직원 제안 추가
    if (parameters?.include_staff_optimization && optimization_type !== 'staffing') {
      result = enhanceLayoutResultWithStaff(
        result,
        staffData,
        layoutData.zones,
        true
      );
      console.log(`[generate-optimization] 🆕 B안: Added ${result.staff_suggestions?.items?.length || 0} staff suggestions`);
    }

    // 🆕 B안: 인력배치 최적화 결과에 가구 미세 조정 추가
    if (parameters?.allow_furniture_adjustment && staffingResult) {
      const enhancedStaffingResult = enhanceStaffingResultWithFurniture(
        staffingResult,
        layoutData.furniture,
        true,
        parameters?.max_adjustment_distance || 50
      );
      result.staffing_result = enhancedStaffingResult;
      result.furniture_adjustments = enhancedStaffingResult.furniture_adjustments;
      console.log(`[generate-optimization] 🆕 B안: Added ${result.furniture_adjustments?.items?.length || 0} furniture adjustments`);
    }

    // 🆕 Phase 2.1: 매출 예측 적용
    const predictions: RevenuePredictionOutput[] = [];
    const environmentMultipliers = {
      weather: environmentData?.impact.combined.traffic || 1.0,
      event: environmentData?.impact.combined.conversion || 1.0,
      temporal: environmentData?.impact.combined.dwell || 1.0,
    };

    // 상품 ID와 상세 정보 매핑
    const productDetailsMap = new Map<string, any>();
    (layoutData.productDetails || []).forEach((p: any) => {
      productDetailsMap.set(p.id, p);
    });

    // 각 product_change에 대해 예측 수행
    for (const change of result.product_changes) {
      const productInfo = productDetailsMap.get(change.product_id) || {};
      const predictionInput = createPredictionInput(
        change,
        productInfo,
        performanceData.zoneMetrics,
        environmentMultipliers
      );

      if (predictionInput) {
        const prediction = predictRevenue(predictionInput);
        predictions.push(prediction);

        // 변경 사항에 예측 결과 추가
        (change as any).prediction = formatPredictionForResponse(prediction);

        // 예측 기반 priority 업데이트
        if (prediction.recommendation.priority === 'critical' ||
            prediction.recommendation.priority === 'high') {
          change.priority = 'high';
        }
      }
    }

    // 예측 요약 생성
    const predictionSummary = summarizePredictions(predictions);
    console.log(`[generate-optimization] Predictions: ${predictions.length} items, expected revenue change: ${(predictionSummary.totalExpectedRevenueChange * 100).toFixed(1)}%`);

    // 🆕 Phase 2.2: 전환율 예측 적용
    const conversionPredictions: ConversionPredictionOutput[] = [];
    const storeAvgConversion = 0.05; // 기본 매장 평균 전환율

    for (const change of result.product_changes) {
      const productInfo = productDetailsMap.get(change.product_id) || {};
      const conversionInput = createConversionPredictionInput(
        change,
        productInfo,
        performanceData.zoneMetrics,
        flowAnalysis || null,
        storeAvgConversion
      );

      if (conversionInput) {
        const conversionPrediction = predictConversion(conversionInput);
        conversionPredictions.push(conversionPrediction);

        // 변경 사항에 전환율 예측 결과 추가
        (change as any).conversion_prediction = formatConversionPredictionForResponse(conversionPrediction);

        // 전환율이 벤치마크 대비 우수하면 priority 상향
        if (conversionPrediction.benchmarkComparison.vsCategory === 'above' &&
            conversionPrediction.confidence >= 0.7) {
          if (change.priority === 'low') {
            change.priority = 'medium';
          }
        }
      }
    }

    // 전환율 예측 요약 생성
    const conversionPredictionSummary = summarizeConversionPredictions(conversionPredictions);
    console.log(`[generate-optimization] Conversion Predictions: ${conversionPredictions.length} items, avg change: ${(conversionPredictionSummary.avgConversionChange * 100).toFixed(1)}%`);

    // 6. 결과 저장 (userId가 있는 경우에만)
    let saveError: Error | null = null;
    if (userId) {
      const { error } = await supabase
        .from('layout_optimization_results')
        .insert({
          id: result.optimization_id,
          store_id,
          user_id: userId,
          optimization_type,
          furniture_changes: result.furniture_changes,
          product_changes: result.product_changes,
          summary: result.summary,
          parameters,
          status: 'pending',
        })
        .select()
        .single();
      saveError = error;
    }

    if (saveError) {
      console.warn('Failed to save optimization result:', saveError);
    }

    // 🆕 Phase 4.2: 자동 학습 실행 (백그라운드)
    let learningSession: LearningSessionSummary | null = null;
    try {
      // 매장에 충분한 예측 기록이 있는 경우에만 학습 실행
      // 실제 운영에서는 비동기로 실행하거나 별도 워커로 분리 권장
      learningSession = await runAutoLearning(supabase, store_id, {
        minConfidence: 0.5,
        maxAdjustmentsPerType: 3,
        lookbackDays: 30,
      });

      if (learningSession.adjustmentsApplied > 0) {
        console.log(`[generate-optimization] Auto-learning: ${learningSession.adjustmentsApplied} adjustments applied, improvement: ${learningSession.improvementMetrics.improvement_percentage}%`);
      }
    } catch (learningError) {
      console.warn('[generate-optimization] Auto-learning skipped:', learningError);
    }

    // 🆕 AI 응답 로깅 (파인튜닝 데이터 수집)
    const executionTimeMs = executionTimer.getElapsedMs();
    const fullResponse = {
      success: true,
      result,
      data_summary: {
        furniture_analyzed: layoutData.furniture.length,
        products_analyzed: layoutData.products.length,
        slots_analyzed: slotsData.length,
      },
      environment_summary: environmentData ? {
        weather: environmentData.weather ? {
          condition: environmentData.impact.weather.condition,
          temperature: environmentData.weather.temperature,
        } : null,
        events_count: environmentData.events.length,
      } : null,
      flow_analysis_summary: {
        flow_health_score: flowAnalysis.summary.flowHealthScore,
        bottleneck_count: flowAnalysis.summary.bottleneckCount,
        dead_zone_count: flowAnalysis.summary.deadZoneCount,
      },
      prediction_summary: predictionSummary,
      vmd_analysis: vmdAnalysis ? {
        score: vmdAnalysis.score.overall,
        grade: vmdAnalysis.score.grade,
      } : null,
    };

    try {
      // 🆕 파인튜닝용: 사용자 화면에 표시되는 텍스트 응답 추출
      let userFacingTexts: any;

      if (optimization_type === 'staffing' && result.staffing_result) {
        // Staffing 전용 최적화 결과 로깅
        const staffingResult = result.staffing_result;
        userFacingTexts = {
          // 인력 배치 이유들
          staffing_reasons: staffingResult.staffPositions.map((sp: StaffPosition) => ({
            staffName: sp.staffName,
            reason: sp.reason,
            coverageGain: sp.coverageGain,
          })),
          // AI 인사이트
          insights: staffingResult.insights,
          // 요약 메시지
          summary_text: `인력 ${staffingResult.staffPositions.length}명 배치 최적화. ` +
            `커버리지 개선: ${staffingResult.metrics.coverageGain}%, ` +
            `서비스율 향상: ${staffingResult.metrics.customerServiceRateIncrease}%`,
          // 존 커버리지 요약
          zone_coverage_summary: staffingResult.zoneCoverage.slice(0, 3).map((zc: ZoneCoverage) => ({
            zoneName: zc.zoneName,
            improvement: zc.suggestedCoverage - zc.currentCoverage,
          })),
        };
      } else if (optimization_type === 'both' && result.staffing_result) {
        // 🆕 both 타입: staffing + furniture/product 모두 포함
        const staffingResult = result.staffing_result;
        userFacingTexts = {
          // 인력 배치 이유들
          staffing_reasons: staffingResult.staffPositions.map((sp: StaffPosition) => ({
            staffName: sp.staffName,
            reason: sp.reason,
            coverageGain: sp.coverageGain,
          })),
          // AI 인사이트 (staffing)
          staffing_insights: staffingResult.insights,
          // 존 커버리지 요약
          zone_coverage_summary: staffingResult.zoneCoverage.slice(0, 3).map((zc: ZoneCoverage) => ({
            zoneName: zc.zoneName,
            improvement: zc.suggestedCoverage - zc.currentCoverage,
          })),
          // 가구 변경 이유들
          furniture_reasons: result.furniture_changes.map((fc: FurnitureChange) => ({
            furniture_type: fc.furniture_type,
            reason: fc.reason,
            priority: fc.priority,
            expected_impact: fc.expected_impact,
          })),
          // 상품 변경 이유들
          product_reasons: result.product_changes.map((pc: ProductChange) => ({
            sku: pc.sku,
            reason: pc.reason,
            priority: pc.priority,
            expected_revenue_impact: pc.expected_revenue_impact,
            expected_visibility_impact: pc.expected_visibility_impact,
          })),
          // 요약 메시지 (통합)
          summary_text: `[통합 최적화] 인력 ${staffingResult.staffPositions.length}명 배치, ` +
            `가구 ${result.summary.total_furniture_changes}개, 상품 ${result.summary.total_product_changes}개 변경 권장. ` +
            `커버리지 개선: ${staffingResult.metrics.coverageGain}%, ` +
            `예상 매출 증가: ${(result.summary.expected_revenue_improvement * 100).toFixed(1)}%`,
          // VMD 분석 요약 (있는 경우)
          vmd_summary: vmdAnalysis ? {
            score: vmdAnalysis.score.overall,
            grade: vmdAnalysis.score.grade,
            top_violations: vmdAnalysis.violations.slice(0, 3).map((v: any) => v.description),
          } : null,
        };
      } else {
        // 기존 가구/상품 최적화 결과 로깅 (furniture, product 타입)
        userFacingTexts = {
          // 가구 변경 이유들 (사용자에게 표시되는 핵심 메시지)
          furniture_reasons: result.furniture_changes.map((fc: FurnitureChange) => ({
            furniture_type: fc.furniture_type,
            reason: fc.reason,
            priority: fc.priority,
            expected_impact: fc.expected_impact,
          })),
          // 상품 변경 이유들
          product_reasons: result.product_changes.map((pc: ProductChange) => ({
            sku: pc.sku,
            reason: pc.reason,
            priority: pc.priority,
            expected_revenue_impact: pc.expected_revenue_impact,
            expected_visibility_impact: pc.expected_visibility_impact,
          })),
          // 요약 메시지
          summary_text: `가구 ${result.summary.total_furniture_changes}개, 상품 ${result.summary.total_product_changes}개 변경 권장. ` +
            `예상 매출 증가: ${(result.summary.expected_revenue_improvement * 100).toFixed(1)}%, ` +
            `트래픽 증가: ${(result.summary.expected_traffic_improvement * 100).toFixed(1)}%, ` +
            `전환율 증가: ${(result.summary.expected_conversion_improvement * 100).toFixed(1)}%`,
          // VMD 분석 요약 (있는 경우)
          vmd_summary: vmdAnalysis ? {
            score: vmdAnalysis.score.overall,
            grade: vmdAnalysis.score.grade,
            top_violations: vmdAnalysis.violations.slice(0, 3).map((v: any) => v.description),
          } : null,
        };
      }

      await logAIResponse(supabase, {
        storeId: store_id,
        userId: userId || undefined,
        functionName: 'generate-optimization',
        simulationType: optimization_type,
        inputVariables: {
          optimization_type,
          parameters,
          context: {
            furniture_count: layoutData.furniture.length,
            product_count: layoutData.products.length,
            zone_count: layoutData.zones.length,
            slot_count: slotsData.length,
          },
        },
        // 🆕 aiResponse를 user_facing_texts 중심으로 변경 (파인튜닝 최적화)
        aiResponse: {
          user_facing_texts: userFacingTexts,
          // 핵심 지표만 포함 (전체 changes 배열 제외)
          key_metrics: {
            total_furniture_changes: result.summary.total_furniture_changes,
            total_product_changes: result.summary.total_product_changes,
            expected_revenue_improvement: result.summary.expected_revenue_improvement,
            expected_traffic_improvement: result.summary.expected_traffic_improvement,
            expected_conversion_improvement: result.summary.expected_conversion_improvement,
          },
          // Top 5 변경사항만 포함
          top_changes: {
            furniture: result.furniture_changes.slice(0, 5).map((fc: FurnitureChange) => ({
              furniture_type: fc.furniture_type,
              reason: fc.reason,
              priority: fc.priority,
            })),
            product: result.product_changes.slice(0, 5).map((pc: ProductChange) => ({
              sku: pc.sku,
              reason: pc.reason,
              priority: pc.priority,
            })),
          },
        },
        responseSummary: createOptimizationSummary(result),
        contextMetadata: createOptimizationContextMetadata(
          layoutData,
          slotsData,
          flowAnalysis,
          associationData,
          environmentData,
          vmdAnalysis
        ),
        executionTimeMs,
        modelUsed: lovableApiKey ? 'gemini-2.5-flash' : 'rule-based',
      });
      console.log(`[generate-optimization] Response logged successfully (${executionTimeMs}ms)`);
    } catch (logError) {
      // 로깅 실패해도 메인 응답은 정상 반환
      console.warn('[generate-optimization] Failed to log response:', logError);
    }

    // 🆕 3D 시각화 데이터 생성 (아키텍처 통합)
    const visualizationData = generateVisualizationData(
      result,
      flowAnalysis,
      layoutData,
      layoutData.zones
    );
    console.log(`[generate-optimization] Visualization data generated: layout=${visualizationData.layout.furnitureMoves.length}+${visualizationData.layout.productMoves.length}, flow=${visualizationData.flow.zoneFlowArrows.length}, staffing=${visualizationData.staffing.staffMarkers.length}`);

    return new Response(JSON.stringify({
      success: true,
      result,
      // 🆕 3D 시각화 데이터 (useSceneSimulation.ts 호환)
      visualization: visualizationData,
      data_summary: {
        furniture_analyzed: layoutData.furniture.length,
        products_analyzed: layoutData.products.length,
        slots_analyzed: slotsData.length,
      },
      // 🆕 환경 컨텍스트 요약
      environment_summary: {
        weather: environmentData.weather ? {
          condition: environmentData.impact.weather.condition,
          temperature: environmentData.weather.temperature,
          severity: environmentData.impact.weather.severity,
        } : null,
        events: environmentData.events.map(e => ({
          name: e.eventName,
          type: e.eventType,
          impact: e.impactLevel,
        })),
        temporal: {
          dayOfWeek: environmentData.temporal.dayOfWeek,
          isWeekend: environmentData.temporal.isWeekend,
          timeOfDay: environmentData.temporal.timeOfDay,
        },
        impact_multipliers: environmentData.impact.combined,
        data_quality: environmentData.dataQuality,
      },
      // 🆕 동선 분석 요약 (Phase 0.2)
      flow_analysis_summary: {
        total_zones: flowAnalysis.summary.totalZones,
        total_transitions: flowAnalysis.summary.totalTransitions,
        avg_path_length: flowAnalysis.summary.avgPathLength,
        avg_path_duration: flowAnalysis.summary.avgPathDuration,
        overall_conversion_rate: flowAnalysis.summary.overallConversionRate,
        bottleneck_count: flowAnalysis.summary.bottleneckCount,
        dead_zone_count: flowAnalysis.summary.deadZoneCount,
        opportunity_count: flowAnalysis.summary.opportunityCount,
        flow_health_score: flowAnalysis.summary.flowHealthScore,
        key_paths: flowAnalysis.keyPaths.slice(0, 5).map(p => ({
          path: p.zoneNames.join(' → '),
          frequency: p.frequency,
          type: p.pathType,
        })),
        bottlenecks: flowAnalysis.bottlenecks.map(b => ({
          zone: b.zoneName,
          severity: b.severity,
          congestion: b.congestionScore,
        })),
        dead_zones: flowAnalysis.deadZones.map(d => ({
          zone: d.zoneName,
          severity: d.severity,
          visit_rate: d.visitRate,
        })),
        opportunities: flowAnalysis.opportunities.slice(0, 5).map(o => ({
          type: o.type,
          priority: o.priority,
          description: o.description,
        })),
      },
      // 🆕 연관성 분석 요약 (Phase 0.3)
      association_summary: {
        total_transactions: associationData.summary.totalTransactions,
        avg_basket_size: associationData.summary.avgBasketSize,
        strong_rules_count: associationData.summary.strongRulesCount,
        very_strong_rules_count: associationData.summary.veryStrongRulesCount,
        data_quality: associationData.summary.dataQuality,
        top_rules: associationData.associationRules.slice(0, 5).map(r => ({
          rule: `${r.antecedentNames.join(', ')} → ${r.consequentNames.join(', ')}`,
          confidence: `${(r.confidence * 100).toFixed(0)}%`,
          lift: `${r.lift.toFixed(1)}x`,
          strength: r.ruleStrength,
        })),
        category_affinities: associationData.categoryAffinities.slice(0, 5).map(a => ({
          pair: `${a.category1} + ${a.category2}`,
          affinity: `${(a.affinityScore * 100).toFixed(0)}%`,
          proximity: a.recommendedProximity,
        })),
        placement_recommendations: associationData.placementRecommendations.length,
        recommendations: associationData.placementRecommendations.slice(0, 5).map(r => ({
          type: r.type,
          priority: r.priority,
          product: r.primaryProduct.name,
          reason: r.reason,
        })),
      },
      // 🆕 매출 예측 요약 (Phase 2.1)
      prediction_summary: {
        total_expected_revenue_change: predictionSummary.totalExpectedRevenueChange,
        total_daily_revenue_increase: predictionSummary.totalDailyRevenueIncrease,
        high_confidence_changes: predictionSummary.highConfidenceChanges,
        medium_confidence_changes: predictionSummary.mediumConfidenceChanges,
        low_confidence_changes: predictionSummary.lowConfidenceChanges,
        overall_confidence: predictionSummary.overallConfidence,
        top_priority_changes: predictionSummary.topPriorityChanges,
        predictions_applied: predictions.length,
      },
      // 🆕 전환율 예측 요약 (Phase 2.2)
      conversion_prediction_summary: {
        avg_conversion_change: conversionPredictionSummary.avgConversionChange,
        changes_above_benchmark: conversionPredictionSummary.changesAboveBenchmark,
        changes_at_benchmark: conversionPredictionSummary.changesAtBenchmark,
        changes_below_benchmark: conversionPredictionSummary.changesBelowBenchmark,
        high_confidence_count: conversionPredictionSummary.highConfidenceCount,
        avg_confidence: conversionPredictionSummary.avgConfidence,
        predictions_applied: conversionPredictions.length,
      },
      // 🆕 VMD 분석 (Phase 3)
      vmd_analysis: formatVMDAnalysisForResponse(vmdAnalysis),
      // 🆕 자동 학습 세션 (Phase 4.2)
      learning_session: learningSession
        ? formatLearningSessionForResponse(learningSession)
        : null,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[generate-optimization] Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    // 🆕 에러 발생 시에도 로깅 시도
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);
        const body = await req.clone().json().catch(() => ({}));
        await logAIResponse(supabase, {
          storeId: body.store_id || 'unknown',
          functionName: 'generate-optimization',
          simulationType: body.optimization_type || 'unknown',
          inputVariables: body,
          aiResponse: {},
          executionTimeMs: executionTimer.getElapsedMs(),
          hadError: true,
          errorMessage,
        });
      }
    } catch (logError) {
      console.warn('[generate-optimization] Failed to log error:', logError);
    }

    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// ============== Data Loading ==============

async function loadLayoutData(supabase: any, storeId: string, _userId: string | null) {
  // 1. 가구 데이터 로드 (furniture 테이블에서 직접)
  const { data: furnitureData } = await supabase
    .from('furniture')
    .select('id, furniture_code, furniture_name, furniture_type, zone_id, position_x, position_y, position_z, rotation_x, rotation_y, rotation_z, movable')
    .eq('store_id', storeId)
    .eq('is_active', true);

  // 2. 존 데이터 로드
  const { data: zonesData } = await supabase
    .from('zones_dim')
    .select('id, zone_code, zone_name, zone_type, area_sqm')
    .eq('store_id', storeId);

  // 3. 상품 데이터 로드
  const { data: productDetails } = await supabase
    .from('products')
    .select('id, product_name, sku, category, price, display_type, compatible_display_types')
    .eq('store_id', storeId);

  // 4. 제품 배치 데이터 로드 (product_placements 테이블 - 핵심!)
  const { data: placements } = await supabase
    .from('product_placements')
    .select(`
      id,
      product_id,
      slot_id,
      display_type,
      position_offset,
      is_active,
      furniture_slots:slot_id (
        id,
        slot_id,
        furniture_id,
        slot_position,
        compatible_display_types
      )
    `)
    .eq('store_id', storeId)
    .eq('is_active', true);

  // 5. 가구 데이터를 3D 포맷으로 변환
  const furniture = (furnitureData || []).map((f: any) => ({
    id: f.id,
    furniture_code: f.furniture_code,
    furniture_name: f.furniture_name,
    furniture_type: f.furniture_type,
    zone_id: f.zone_id,
    position: { x: f.position_x || 0, y: f.position_y || 0, z: f.position_z || 0 },
    rotation: { x: f.rotation_x || 0, y: f.rotation_y || 0, z: f.rotation_z || 0 },
    movable: f.movable !== false,
  }));

  // 6. 제품 배치를 3D 포맷으로 변환 (product_placements 기반)
  const products = (placements || []).map((p: any) => {
    const productInfo = (productDetails || []).find((pd: any) => pd.id === p.product_id);
    const slot = p.furniture_slots;
    const furnitureItem = furniture.find((f: any) => f.id === slot?.furniture_id);

    // 월드 좌표 계산: furniture.position + slot.slot_position + placement.position_offset
    const slotPos = slot?.slot_position || { x: 0, y: 0, z: 0 };
    const offsetPos = p.position_offset || { x: 0, y: 0, z: 0 };
    const furniturePos = furnitureItem?.position || { x: 0, y: 0, z: 0 };

    return {
      id: p.product_id,
      placement_id: p.id,
      sku: productInfo?.sku || '',
      product_name: productInfo?.product_name || '',
      category: productInfo?.category || '',
      display_type: p.display_type || productInfo?.display_type,
      zone_id: furnitureItem?.zone_id || '',
      furniture_id: slot?.furniture_id || '',
      slot_id: slot?.id || '',
      slot_code: slot?.slot_id || '',
      position: {
        x: furniturePos.x + (slotPos.x || 0) + (offsetPos.x || 0),
        y: furniturePos.y + (slotPos.y || 0) + (offsetPos.y || 0),
        z: furniturePos.z + (slotPos.z || 0) + (offsetPos.z || 0),
      },
    };
  });

  console.log(`[loadLayoutData] Loaded: ${furniture.length} furniture, ${products.length} product placements`);

  return {
    furniture,
    products,
    zones: zonesData || [],
    productDetails: productDetails || [],
    placements: placements || [],
  };
}

async function loadPerformanceData(supabase: any, storeId: string) {
  // 구역별 성과
  const { data: zoneMetrics } = await supabase
    .from('zone_daily_metrics')
    .select('zone_id, visitors, conversions, revenue, avg_dwell_time_seconds')
    .eq('store_id', storeId)
    .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0])
    .order('date', { ascending: false })
    .limit(200);

  // 상품별 성과
  const { data: productPerformance } = await supabase
    .from('product_performance_agg')
    .select('product_id, revenue, units_sold, conversion_rate')
    .eq('store_id', storeId)
    .order('revenue', { ascending: false })
    .limit(100);

  // 구역별 집계
  const zoneAggregated: Record<string, { visitors: number; conversions: number; revenue: number; avgDwell: number; count: number }> = {};
  (zoneMetrics || []).forEach((m: any) => {
    if (!zoneAggregated[m.zone_id]) {
      zoneAggregated[m.zone_id] = { visitors: 0, conversions: 0, revenue: 0, avgDwell: 0, count: 0 };
    }
    zoneAggregated[m.zone_id].visitors += m.visitors || 0;
    zoneAggregated[m.zone_id].conversions += m.conversions || 0;
    zoneAggregated[m.zone_id].revenue += m.revenue || 0;
    zoneAggregated[m.zone_id].avgDwell += m.avg_dwell_time_seconds || 0;
    zoneAggregated[m.zone_id].count += 1;
  });

  // 평균 계산
  Object.keys(zoneAggregated).forEach(zoneId => {
    const z = zoneAggregated[zoneId];
    z.avgDwell = z.count > 0 ? z.avgDwell / z.count : 0;
  });

  return {
    zoneMetrics: zoneAggregated,
    productPerformance: productPerformance || [],
  };
}

async function loadSlotsData(supabase: any, storeId: string) {
  // furniture_slots와 furniture 조인하여 zone_id 포함
  const { data: slots } = await supabase
    .from('furniture_slots')
    .select(`
      *,
      furniture:furniture_id (
        id,
        zone_id,
        furniture_code,
        position_x,
        position_y,
        position_z
      )
    `)
    .eq('store_id', storeId);

  // zone_id를 슬롯 레벨로 평탄화
  return (slots || []).map((s: any) => ({
    ...s,
    zone_id: s.furniture?.zone_id || '',
    furniture_code: s.furniture?.furniture_code || '',
    furniture_position: {
      x: s.furniture?.position_x || 0,
      y: s.furniture?.position_y || 0,
      z: s.furniture?.position_z || 0,
    },
  }));
}

// ============== AI Optimization ==============

/**
 * 🔧 불완전 JSON 복구 함수
 * 토큰 한도로 잘린 JSON을 복구 시도
 */
function repairIncompleteJSON(jsonStr: string): string | null {
  if (!jsonStr || jsonStr.trim().length === 0) {
    return null;
  }

  let repaired = jsonStr.trim();

  // 1. 불완전한 문자열 닫기 (열린 따옴표 찾기)
  const quoteCount = (repaired.match(/"/g) || []).length;
  if (quoteCount % 2 !== 0) {
    // 마지막 열린 따옴표 닫기
    repaired += '"';
  }

  // 2. 열린 괄호 카운트
  const openBraces = (repaired.match(/\{/g) || []).length;
  const closeBraces = (repaired.match(/\}/g) || []).length;
  const openBrackets = (repaired.match(/\[/g) || []).length;
  const closeBrackets = (repaired.match(/\]/g) || []).length;

  // 3. 불완전한 배열/객체 정리
  // 마지막 불완전한 항목 제거 (trailing comma 또는 불완전한 키-값)
  repaired = repaired.replace(/,\s*$/, ''); // trailing comma 제거
  repaired = repaired.replace(/,\s*"[^"]*$/, ''); // 불완전한 키 제거
  repaired = repaired.replace(/:\s*$/, ': null'); // 불완전한 값 null로 대체
  repaired = repaired.replace(/:\s*"[^"]*$/, ': ""'); // 불완전한 문자열 값

  // 4. 닫히지 않은 배열 닫기
  for (let i = 0; i < openBrackets - closeBrackets; i++) {
    repaired += ']';
  }

  // 5. 닫히지 않은 객체 닫기
  for (let i = 0; i < openBraces - closeBraces; i++) {
    repaired += '}';
  }

  return repaired;
}

/**
 * 🔧 부분 데이터 추출 함수
 * JSON 파싱 실패 시 가능한 데이터라도 추출
 */
function extractPartialData(jsonStr: string): any {
  const result: any = {
    furniture_changes: [],
    product_changes: [],
    summary: {
      total_furniture_changes: 0,
      total_product_changes: 0,
      expected_revenue_improvement: 0,
      expected_traffic_improvement: 0,
      expected_conversion_improvement: 0,
      expected_dwell_time_improvement: 0, // 🔧 FIX: 체류시간 필드 추가
      partial_extraction: true, // 부분 추출 플래그
    },
  };

  try {
    // furniture_changes 배열 추출 시도
    const furnitureMatch = jsonStr.match(/"furniture_changes"\s*:\s*\[([\s\S]*?)\]/);
    if (furnitureMatch) {
      try {
        const furnitureStr = '[' + furnitureMatch[1] + ']';
        const repaired = repairIncompleteJSON(furnitureStr);
        if (repaired) {
          result.furniture_changes = JSON.parse(repaired);
        }
      } catch (e) {
        console.warn('[extractPartialData] furniture_changes extraction failed');
      }
    }

    // product_changes 배열 추출 시도
    const productMatch = jsonStr.match(/"product_changes"\s*:\s*\[([\s\S]*?)\]/);
    if (productMatch) {
      try {
        const productStr = '[' + productMatch[1] + ']';
        const repaired = repairIncompleteJSON(productStr);
        if (repaired) {
          result.product_changes = JSON.parse(repaired);
        }
      } catch (e) {
        console.warn('[extractPartialData] product_changes extraction failed');
      }
    }

    // summary 객체 추출 시도
    const summaryMatch = jsonStr.match(/"summary"\s*:\s*\{([\s\S]*?)\}/);
    if (summaryMatch) {
      try {
        const summaryStr = '{' + summaryMatch[1] + '}';
        const repaired = repairIncompleteJSON(summaryStr);
        if (repaired) {
          const parsed = JSON.parse(repaired);
          result.summary = { ...result.summary, ...parsed };
        }
      } catch (e) {
        console.warn('[extractPartialData] summary extraction failed');
      }
    }

    // 카운트 업데이트
    result.summary.total_furniture_changes = result.furniture_changes.length;
    result.summary.total_product_changes = result.product_changes.length;

  } catch (e) {
    console.error('[extractPartialData] Partial extraction failed:', e);
  }

  return result;
}

async function generateAIOptimization(
  apiKey: string,
  layoutData: any,
  performanceData: any,
  slotsData: any[],
  optimizationType: string,
  parameters: any,
  environmentData?: EnvironmentDataBundle,  // 🆕 환경 데이터
  flowAnalysis?: FlowAnalysisResult,        // 🆕 동선 분석 (Phase 0.2)
  associationData?: ProductAssociationResult, // 🆕 연관성 분석 (Phase 0.3)
  vmdAnalysis?: VMDAnalysisResult,           // 🆕 VMD 분석 (Phase 3)
  diagnosticIssues?: any                     // 🆕 시뮬레이션 진단 이슈
): Promise<AILayoutOptimizationResult> {
  // 🆕 진단 이슈 로깅
  if (diagnosticIssues?.priority_issues?.length > 0) {
    console.log(`[generateAIOptimization] 🚨 Diagnostic issues from simulation: ${diagnosticIssues.priority_issues.length} issues to prioritize`);
    console.log(`[generateAIOptimization] Scenario: ${diagnosticIssues.scenario_context?.name || 'none'}`);
  }

  // 🆕 Phase 1.1: Chain-of-Thought 프롬프트 빌더 사용
  const promptContext = createPromptContext(
    layoutData,
    performanceData,
    slotsData,
    optimizationType,
    parameters,
    environmentData || null,
    flowAnalysis || null,
    associationData || null,
    diagnosticIssues || null  // 🆕 진단 이슈 전달
  );

  // 🔧 P0 FIX: intensity 기반 제한 설정
  const intensityLimits = {
    low: { maxFurniture: 5, maxProduct: 15 },
    medium: { maxFurniture: 12, maxProduct: 35 },
    high: { maxFurniture: 25, maxProduct: 60 },
  };
  const currentIntensity = (parameters.intensity as keyof typeof intensityLimits) || 'medium';
  const defaultLimits = intensityLimits[currentIntensity] || intensityLimits.medium;

  const promptConfig = createPromptConfig({
    strategy: 'hybrid',  // 🆕 Phase 1.2: CoT + Few-shot 하이브리드 전략
    chainOfThought: {
      enabled: true,
      steps: [], // 기본 5단계 사용
      requireExplicitReasoning: true,
    },
    fewShot: {
      enabled: true,  // 🆕 Phase 1.2: Few-shot 활성화
      exampleCount: 3,  // 3개 예시 포함
      selectionStrategy: 'similar',  // 현재 상황과 유사한 예시 선택
    },
    constraints: {
      // 🔧 P0 FIX: Frontend intensity 설정 연동
      maxFurnitureChanges: parameters.max_furniture_changes || defaultLimits.maxFurniture,
      maxProductChanges: parameters.max_product_changes || defaultLimits.maxProduct,
      respectMovableFlag: true,
      validateSlotCompatibility: true,
    },
  });

  console.log(`[generateAIOptimization] Constraints: intensity=${currentIntensity}, maxFurniture=${promptConfig.constraints.maxFurnitureChanges}, maxProduct=${promptConfig.constraints.maxProductChanges}`);

  const builtPrompt: BuiltPrompt = buildAdvancedOptimizationPrompt(promptContext, promptConfig);

  // 🆕 Phase 3: VMD 분석 컨텍스트 추가
  let enhancedUserPrompt = builtPrompt.userPrompt;
  if (vmdAnalysis) {
    enhancedUserPrompt += `\n\n${vmdAnalysis.aiPromptContext}`;
  }

  // 🆕 Sprint 2: VMD 룰셋 동적 로드 및 프롬프트 주입 (S2-4)
  let vmdRulesetContext: VMDRulesetContext | null = null;
  try {
    vmdRulesetContext = await buildVMDRulesetContext({
      minConfidence: 0.6,
      maxRules: 8,
    });
    if (vmdRulesetContext.promptText) {
      enhancedUserPrompt += `\n\n${vmdRulesetContext.promptText}`;
      console.log(`[generateAIOptimization] 📚 VMD Ruleset loaded: ${vmdRulesetContext.metadata.totalRules} rules, avg confidence ${(vmdRulesetContext.metadata.avgConfidence * 100).toFixed(0)}%`);
    }
  } catch (rulesetError) {
    console.warn('[generateAIOptimization] VMD Ruleset load failed, continuing without:', rulesetError);
  }

  // 🆕 Sprint 3: Store Persona 로드 및 프롬프트 주입 (S3-4)
  let personaContext: PersonaPromptContext | null = null;
  try {
    const storeIdForPersona = layoutData?.store_id || layoutData?.storeId;
    if (storeIdForPersona) {
      personaContext = await buildPersonaPromptContext(storeIdForPersona);
      if (personaContext.hasPersona && personaContext.promptText) {
        enhancedUserPrompt += `\n\n${personaContext.promptText}`;
        console.log(`[generateAIOptimization] 👤 Store Persona loaded: style=${personaContext.metadata.storeStyle}, demographic=${personaContext.metadata.targetDemographic}, acceptance=${personaContext.metadata.feedbackStats.acceptance_rate}%`);
      }
    }
  } catch (personaError) {
    console.warn('[generateAIOptimization] Store Persona load failed, continuing without:', personaError);
  }

  console.log(`[generateAIOptimization] Prompt built: tokens~${builtPrompt.totalTokenEstimate}, strategy=${builtPrompt.metadata.strategy}`);
  console.log(`[generateAIOptimization] CoT=${builtPrompt.metadata.cotEnabled}, FewShot=${builtPrompt.metadata.fewShotEnabled}(${builtPrompt.metadata.fewShotCount} examples, ${builtPrompt.metadata.fewShotStrategy})`);
  console.log(`[generateAIOptimization] Data included: env=${builtPrompt.metadata.dataIncluded.environment}, flow=${builtPrompt.metadata.dataIncluded.flowAnalysis}, assoc=${builtPrompt.metadata.dataIncluded.associations}, vmd=${!!vmdAnalysis}`);

  // 🆕 Phase 5: Structured Output 포맷 결정
  // NOTE: Gemini API는 복잡한 json_schema를 지원하지 않음 (nesting depth 제한)
  // json_object 타입으로 폴백하여 프롬프트 기반 JSON 생성 유도
  const responseFormat = { type: 'json_object' as const };

  console.log(`[generateAIOptimization] 📋 Response format: json_object (Gemini schema depth limit workaround)`);

  // 🆕 Sprint 1: Tool Use 활성화 여부 결정
  const enableToolUse = shouldEnableToolUse(optimizationType, parameters);
  console.log(`[generateAIOptimization] 🔧 Tool Use: ${enableToolUse ? 'ENABLED' : 'DISABLED'}`);

  try {
    // 메시지 히스토리 (Tool Call 반복을 위해)
    let messages: Array<{ role: string; content?: string | null; tool_calls?: ToolCall[] }> = [
      { role: 'system', content: builtPrompt.systemPrompt },
      { role: 'user', content: enhancedUserPrompt }
    ];

    let data: any;
    let toolCallIterations = 0;
    const maxIterations = TOOL_USE_CONFIG.maxIterations;
    let allToolCallResults: ToolCallResult[] = [];

    // 🆕 Sprint 1: Tool Call 반복 처리 루프
    while (true) {
      const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'google/gemini-2.5-flash',
          messages,
          // 🔧 Gemini는 tool_choice + response_format을 동시에 지원하지 않음
          // Tool Use 진행 중에는 response_format 생략, 최종 응답에만 사용
          ...(enableToolUse && toolCallIterations < maxIterations ? {} : { response_format: responseFormat }),
          max_tokens: 16000,
          // 🆕 Sprint 1: Tool Use 파라미터 추가
          // tool_choice: 'required' - AI가 반드시 Tool을 호출하도록 강제 (첫 호출)
          // response_format을 생략했으므로 'required' 사용 가능
          ...(enableToolUse && toolCallIterations < maxIterations ? {
            tools: OPENROUTER_TOOLS,
            tool_choice: toolCallIterations === 0 ? 'required' : 'auto',
          } : {}),
        }),
      });

      if (!response.ok) {
        throw new Error(`AI API error: ${await response.text()}`);
      }

      data = await response.json();

      // 🆕 Sprint 1: Tool Call 처리
      if (enableToolUse && hasToolCalls(data) && toolCallIterations < maxIterations) {
        toolCallIterations++;
        const toolCalls = extractToolCalls(data);
        const toolResults = processToolCalls(toolCalls);
        allToolCallResults.push(...toolResults);

        // 로깅
        logToolUsage(toolCalls, toolResults, 'generateAIOptimization');
        console.log(`[generateAIOptimization] 🔄 Tool Call iteration ${toolCallIterations}/${maxIterations}`);

        // 메시지 히스토리에 추가
        const assistantMessage = data.choices[0].message;
        messages.push({
          role: 'assistant',
          content: assistantMessage.content,
          tool_calls: assistantMessage.tool_calls,
        });

        // Tool 결과 메시지 추가
        for (const result of toolResults) {
          messages.push({
            role: 'tool',
            content: result.content,
            // @ts-ignore - tool_call_id는 OpenRouter에서 필요
            tool_call_id: result.tool_call_id,
          });
        }

        // 다음 반복으로 계속
        continue;
      }

      // Tool Call이 없거나 최대 반복 도달 시 루프 종료
      break;
    }

    // 🆕 Sprint 1: Tool Use 메타데이터 로깅
    if (toolCallIterations > 0) {
      console.log(`[generateAIOptimization] ✅ Tool Use completed: ${toolCallIterations} iteration(s), ${allToolCallResults.length} total call(s)`);
    }

    const rawContent = data.choices[0].message.content;

    // 🆕 Phase 1.1: <thinking> 블록 추출 및 로깅
    const { thinking, jsonContent } = extractThinkingBlock(rawContent);

    if (thinking) {
      console.log(`[generateAIOptimization] 🧠 AI Reasoning (${thinking.length} chars):`);
      // 추론 내용 요약 로깅 (첫 500자)
      console.log(`[generateAIOptimization] Thinking preview: ${thinking.substring(0, 500)}...`);
    }

    // JSON 파싱 (불완전 JSON 복구 시도 포함)
    let result;
    try {
      result = JSON.parse(jsonContent);
    } catch (parseError) {
      console.warn('[generateAIOptimization] JSON parse error, attempting repair:', parseError);
      console.warn('[generateAIOptimization] Raw content length:', rawContent.length);

      // 🔧 불완전 JSON 복구 시도
      const repairedJson = repairIncompleteJSON(jsonContent);
      if (repairedJson) {
        try {
          result = JSON.parse(repairedJson);
          console.log('[generateAIOptimization] JSON repair successful');
        } catch (repairError) {
          console.error('[generateAIOptimization] JSON repair failed:', repairError);
          // 🔧 부분 데이터 추출 시도
          result = extractPartialData(jsonContent);
          console.log('[generateAIOptimization] Extracted partial data');
        }
      } else {
        // 🔧 부분 데이터 추출 시도
        result = extractPartialData(jsonContent);
        console.log('[generateAIOptimization] Extracted partial data from incomplete response');
      }
    }

    // 🆕 Phase 5: Structured Output 검증
    const validation = validateOptimizationResponse(result, optimizationType);
    if (!validation.valid) {
      console.warn(`[generateAIOptimization] ⚠️ Schema validation warnings: ${validation.errors.join(', ')}`);
    } else {
      console.log(`[generateAIOptimization] ✅ Schema validation passed`);
    }

    // 🆕 Sprint 1 강화: Tool 결과를 최종 JSON에 강제 반영 (후처리)
    const toolResultsMap = parseToolResultsToMap(allToolCallResults);
    const enhancedResult = applyToolResultsToOptimization(result, toolResultsMap);
    if (Object.keys(toolResultsMap).length > 0) {
      console.log(`[generateAIOptimization] 🔧 Applied ${Object.keys(toolResultsMap).length} tool results to final output`);
    }

    // 🆕 Sprint 2: XAI 근거 생성 - VMD 규칙 추출 (S2-5)
    const appliedVMDRules = extractAppliedVMDRules(enhancedResult, vmdRulesetContext);
    if (appliedVMDRules.length > 0) {
      console.log(`[generateAIOptimization] 📜 VMD Rules applied: ${appliedVMDRules.map(r => r.rule_code).join(', ')}`);
    }

    return {
      optimization_id: '',
      store_id: '',
      created_at: '',
      optimization_type: optimizationType as any,
      furniture_changes: enhancedResult.furniture_changes || [],
      product_changes: enhancedResult.product_changes || [],
      summary: result.summary ? {
        ...result.summary,
        // 🔧 FIX: AI 응답에서 체류시간 필드가 누락된 경우 기본값 설정
        expected_dwell_time_improvement: result.summary.expected_dwell_time_improvement ??
          (result.summary.expected_conversion_improvement ? result.summary.expected_conversion_improvement * 0.5 : 0),
        // 🆕 AI 추론 메타데이터 추가
        ai_reasoning_included: !!thinking,
        ai_reasoning_length: thinking?.length || 0,
        prompt_strategy: builtPrompt.metadata.strategy,
        // 🆕 Phase 5: Structured Output 메타데이터
        structured_output_enabled: true,
        schema_validation_passed: validation.valid,
        schema_validation_errors: validation.errors.length > 0 ? validation.errors : undefined,
        // 🆕 Sprint 1: Tool Use 메타데이터
        tool_use_enabled: enableToolUse,
        tool_call_iterations: toolCallIterations,
        total_tool_calls: allToolCallResults.length,
        // 🆕 Sprint 2: VMD 규칙 적용 메타데이터 (S2-5)
        vmd_rules_loaded: vmdRulesetContext?.metadata.totalRules || 0,
        vmd_rules_applied: appliedVMDRules.map(r => ({
          rule_code: r.rule_code,
          rule_name: r.rule_name_ko,
          confidence: r.confidence_level,
        })),
        vmd_rules_applied_count: appliedVMDRules.length,
        // 🆕 Sprint 3: Store Persona 메타데이터 (S3-4)
        store_persona: personaContext ? {
          has_persona: personaContext.hasPersona,
          store_style: personaContext.metadata.storeStyle,
          target_demographic: personaContext.metadata.targetDemographic,
          acceptance_rate: personaContext.metadata.feedbackStats.acceptance_rate,
          adjusted_confidence: personaContext.adjustedConfidence,
          learning_version: personaContext.metadata.learningVersion,
        } : null,
      } : {
        total_furniture_changes: 0,
        total_product_changes: 0,
        expected_revenue_improvement: 0,
        expected_traffic_improvement: 0,
        expected_conversion_improvement: 0,
        expected_dwell_time_improvement: 0, // 🔧 FIX: 체류시간 필드 추가
      },
    };
  } catch (e) {
    console.error('AI optimization failed, falling back to rule-based:', e);
    return generateRuleBasedOptimization(layoutData, performanceData, slotsData, optimizationType, parameters, environmentData, flowAnalysis, associationData);
  }
}

/**
 * @deprecated Phase 1.1에서 buildAdvancedOptimizationPrompt로 대체됨
 * 이 함수는 하위 호환성을 위해 유지되며, 향후 버전에서 제거될 예정
 */
function buildOptimizationPrompt(
  layoutData: any,
  performanceData: any,
  slotsData: any[],
  optimizationType: string,
  parameters: any,
  environmentData?: EnvironmentDataBundle,  // 🆕 환경 데이터
  flowAnalysis?: FlowAnalysisResult,        // 🆕 동선 분석 (Phase 0.2)
  associationData?: ProductAssociationResult // 🆕 연관성 분석 (Phase 0.3)
): string {
  // 🆕 환경 컨텍스트 섹션 생성
  const environmentSection = environmentData ? `
## 🌤️ Environment Context (IMPORTANT - Adjust recommendations accordingly)
${environmentData.impact.summary}

### Impact Multipliers
- Traffic: ${environmentData.impact.combined.traffic}x (${environmentData.impact.combined.traffic > 1 ? '📈 above average' : environmentData.impact.combined.traffic < 0.8 ? '📉 significantly below average' : '➖ average'})
- Dwell Time: ${environmentData.impact.combined.dwell}x (${environmentData.impact.combined.dwell > 1.1 ? '⏱️ customers staying longer' : '➖ normal'})
- Conversion: ${environmentData.impact.combined.conversion}x
- Confidence: ${Math.round(environmentData.impact.confidence * 100)}%

### Active Events
${environmentData.events.length > 0
  ? environmentData.events.map(e => `- ${e.eventName} (${e.eventType}, impact: ${e.impactLevel})`).join('\n')
  : '- No special events today'}

### Weather-Based Recommendations
${environmentData.impact.weather.recommendations.length > 0
  ? environmentData.impact.weather.recommendations.map(r => `- ${r}`).join('\n')
  : '- No weather-specific recommendations'}

### Event-Based Recommendations
${environmentData.impact.event.recommendations.length > 0
  ? environmentData.impact.event.recommendations.map(r => `- ${r}`).join('\n')
  : '- Standard optimization applies'}

` : '';

  // 🆕 동선 분석 섹션 생성 (Phase 0.2)
  const flowAnalysisSection = flowAnalysis ? `
## 🚶 Customer Flow Analysis (CRITICAL - Use this data to optimize layout)
${flowAnalysis.aiPromptContext}

### Flow-Based Optimization Guidelines
${flowAnalysis.summary.flowHealthScore < 50 ? '⚠️ LOW FLOW HEALTH: Prioritize fixing bottlenecks and activating dead zones' :
  flowAnalysis.summary.flowHealthScore < 70 ? '⚡ MODERATE FLOW HEALTH: Focus on opportunity zones' :
  '✅ GOOD FLOW HEALTH: Fine-tune for marginal improvements'}

` : '';

  // 🆕 연관성 분석 섹션 생성 (Phase 0.3)
  const associationSection = associationData ? `
## 🔗 Product Association Analysis (Use for cross-sell and bundle placement)
${associationData.aiPromptContext}

### Association-Based Placement Rules
${associationData.summary.veryStrongRulesCount > 0 ? '🔥 VERY STRONG ASSOCIATIONS FOUND: Prioritize bundle displays for these products' : ''}
${associationData.summary.strongRulesCount > 3 ? '💡 MULTIPLE STRONG ASSOCIATIONS: Apply cross-sell placement actively' : ''}
${associationData.placementRecommendations.length > 0 ? `📍 ${associationData.placementRecommendations.length} placement recommendations available` : ''}

` : '';

  return `You are a retail store layout optimization expert.

## CRITICAL CONSTRAINTS
1. ONLY use exact product IDs and SKUs from the provided data
2. ONLY suggest movable=true furniture for relocation
3. ENSURE slot compatibility (display_type must match slot's compatible_display_types)
4. Consider environment context when prioritizing changes
5. Use customer flow analysis to identify optimal placement zones
6. Apply product association rules for cross-sell and bundle placement
${environmentSection}
${flowAnalysisSection}
${associationSection}
## Current Layout
Furniture: ${JSON.stringify(layoutData.furniture.slice(0, 20), null, 2)}
Products: ${JSON.stringify(layoutData.products.slice(0, 30), null, 2)}
Zones: ${JSON.stringify(layoutData.zones, null, 2)}

## Performance Data
Zone Metrics: ${JSON.stringify(performanceData.zoneMetrics, null, 2)}
Top Products: ${JSON.stringify(performanceData.productPerformance.slice(0, 20), null, 2)}

## Available Slots
${JSON.stringify(slotsData.slice(0, 50), null, 2)}

## Optimization Parameters
Type: ${optimizationType}
${JSON.stringify(parameters, null, 2)}

## Task
Generate layout optimization recommendations considering the environment context and customer flow:
1. Identify underperforming products/furniture
2. Find better positions based on performance data AND flow analysis
3. Ensure slot compatibility for products
4. Only move furniture if marked as movable
5. ${environmentData?.impact.combined.traffic && environmentData.impact.combined.traffic < 0.7
  ? 'LOW TRAFFIC EXPECTED: Focus on high-impact changes, prioritize experience products'
  : environmentData?.impact.combined.traffic && environmentData.impact.combined.traffic > 1.3
    ? 'HIGH TRAFFIC EXPECTED: Optimize flow paths, ensure popular items are accessible'
    : 'Apply standard optimization strategies'}
6. ${flowAnalysis?.bottlenecks && flowAnalysis.bottlenecks.length > 0
  ? `ADDRESS BOTTLENECKS: ${flowAnalysis.bottlenecks.map(b => b.zoneName).join(', ')} - Consider redistributing products from these zones`
  : 'No critical bottlenecks detected'}
7. ${flowAnalysis?.deadZones && flowAnalysis.deadZones.length > 0
  ? `ACTIVATE DEAD ZONES: ${flowAnalysis.deadZones.map(d => d.zoneName).join(', ')} - Place high-interest products to attract traffic`
  : 'No critical dead zones detected'}
8. Use high-traffic paths for premium/promotional product placement
9. ${associationData?.summary.veryStrongRulesCount && associationData.summary.veryStrongRulesCount > 0
  ? `BUNDLE OPPORTUNITIES: ${associationData.summary.veryStrongRulesCount} very strong associations found - Create bundle displays`
  : 'Apply standard cross-sell strategies'}
10. ${associationData?.placementRecommendations && associationData.placementRecommendations.length > 0
  ? `CROSS-SELL PLACEMENT: Apply ${associationData.placementRecommendations.length} association-based placement recommendations`
  : 'No specific association recommendations'}

## Response Format (JSON)
{
  "furniture_changes": [
    {
      "furniture_id": "string",
      "furniture_type": "string",
      "movable": true,
      "current": { "zone_id": "string", "position": { "x": 0, "y": 0, "z": 0 }, "rotation": { "x": 0, "y": 0, "z": 0 } },
      "suggested": { "zone_id": "string", "position": { "x": 0, "y": 0, "z": 0 }, "rotation": { "x": 0, "y": 0, "z": 0 } },
      "reason": "string",
      "priority": "high|medium|low",
      "expected_impact": 0.15
    }
  ],
  "product_changes": [
    {
      "product_id": "string",
      "sku": "string",
      "current": { "zone_id": "string", "furniture_id": "string", "slot_id": "string", "position": { "x": 0, "y": 0, "z": 0 } },
      "suggested": { "zone_id": "string", "furniture_id": "string", "slot_id": "string", "position": { "x": 0, "y": 0, "z": 0 } },
      "reason": "string",
      "priority": "high|medium|low",
      "expected_revenue_impact": 0.1,
      "expected_visibility_impact": 0.2
    }
  ],
  "summary": {
    "total_furniture_changes": 0,
    "total_product_changes": 0,
    "expected_revenue_improvement": 0.12,
    "expected_traffic_improvement": 0.08,
    "expected_conversion_improvement": 0.05
  }
}`;
}

// ============== Rule-based Optimization ==============

function generateRuleBasedOptimization(
  layoutData: any,
  performanceData: any,
  slotsData: any[],
  optimizationType: string,
  parameters: any,
  environmentData?: EnvironmentDataBundle,  // 🆕 환경 데이터
  flowAnalysis?: FlowAnalysisResult,        // 🆕 동선 분석 (Phase 0.2)
  associationData?: ProductAssociationResult // 🆕 연관성 분석 (Phase 0.3)
): AILayoutOptimizationResult {
  const furnitureChanges: FurnitureChange[] = [];
  const productChanges: ProductChange[] = [];

  const maxChanges = parameters.max_changes || 30;

  // 🆕 환경 기반 최적화 조정
  const envImpact = environmentData?.impact.combined;
  const isLowTrafficExpected = envImpact && envImpact.traffic < 0.7;
  const isHighTrafficExpected = envImpact && envImpact.traffic > 1.3;
  const isHighDwellExpected = envImpact && envImpact.dwell > 1.15;

  if (environmentData) {
    console.log(`[RuleBasedOpt] Environment: traffic=${envImpact?.traffic}x, dwell=${envImpact?.dwell}x, conversion=${envImpact?.conversion}x`);
  }

  // 🆕 동선 분석 기반 최적화 조정 (Phase 0.2)
  const bottleneckZoneIds = flowAnalysis?.bottlenecks?.map(b => b.zoneId) || [];
  const deadZoneIds = flowAnalysis?.deadZones?.map(d => d.zoneId) || [];
  const highFlowZoneIds = flowAnalysis?.zoneStats
    ?.filter(z => z.totalVisitors > 0)
    ?.sort((a, b) => b.totalVisitors - a.totalVisitors)
    ?.slice(0, 3)
    ?.map(z => z.zoneId) || [];

  if (flowAnalysis) {
    console.log(`[RuleBasedOpt] Flow: health=${flowAnalysis.summary.flowHealthScore}, bottlenecks=${bottleneckZoneIds.length}, deadZones=${deadZoneIds.length}`);
  }

  // 🆕 연관성 분석 데이터 (Phase 0.3)
  const strongAssociations = associationData?.associationRules?.filter(r =>
    r.ruleStrength === 'very_strong' || r.ruleStrength === 'strong'
  ) || [];
  const bundleRecommendations = associationData?.placementRecommendations?.filter(r =>
    r.type === 'bundle' || r.type === 'cross_sell'
  ) || [];

  if (associationData) {
    console.log(`[RuleBasedOpt] Associations: strongRules=${strongAssociations.length}, bundleRecs=${bundleRecommendations.length}`);
  }

  // 상품 최적화
  if (optimizationType === 'product' || optimizationType === 'both') {
    const productPerf = performanceData.productPerformance || [];
    const products = layoutData.products || [];

    console.log(`[RuleBasedOpt] Products: ${products.length}, Performance data: ${productPerf.length}`);

    // 구역별 트래픽 정렬 (고트래픽 구역 우선)
    const zonesByTraffic = Object.entries(performanceData.zoneMetrics || {})
      .sort((a: any, b: any) => (b[1]?.visitors || 0) - (a[1]?.visitors || 0));

    const highTrafficZones = zonesByTraffic.slice(0, 3).map(([zoneId]) => zoneId);
    const lowTrafficZones = zonesByTraffic.slice(-2).map(([zoneId]) => zoneId);

    // 빈 슬롯 찾기
    const availableSlots = slotsData.filter(s => !s.is_occupied);
    console.log(`[RuleBasedOpt] Available slots: ${availableSlots.length}`);

    // 🆕 모든 슬롯이 점유된 경우: 제품 스왑 로직 사용
    if (availableSlots.length === 0 && products.length > 0) {
      console.log(`[RuleBasedOpt] No empty slots - using SWAP logic`);

      // 고트래픽 구역의 제품 (고성과 가능성)
      const highTrafficProducts = products.filter((p: any) =>
        highTrafficZones.includes(p.zone_id)
      );

      // 저트래픽 구역의 제품 (저성과 가능성)
      const lowTrafficProducts = products.filter((p: any) =>
        lowTrafficZones.includes(p.zone_id)
      );

      console.log(`[RuleBasedOpt] High traffic products: ${highTrafficProducts.length}, Low traffic: ${lowTrafficProducts.length}`);

      // 스왑 제안 생성: 저트래픽 구역의 제품을 고트래픽 구역으로
      const swapCount = Math.min(lowTrafficProducts.length, highTrafficProducts.length, maxChanges);

      for (let i = 0; i < swapCount; i++) {
        const lowProduct = lowTrafficProducts[i];
        const highProduct = highTrafficProducts[i];

        // display_type 호환성 확인
        const lowSlot = slotsData.find((s: any) => s.id === lowProduct.slot_id || s.slot_id === lowProduct.slot_code);
        const highSlot = slotsData.find((s: any) => s.id === highProduct.slot_id || s.slot_id === highProduct.slot_code);

        if (!lowSlot || !highSlot) continue;

        // 호환성 체크 (양방향)
        const lowCompatible = !lowProduct.display_type ||
          highSlot.compatible_display_types?.includes(lowProduct.display_type);
        const highCompatible = !highProduct.display_type ||
          lowSlot.compatible_display_types?.includes(highProduct.display_type);

        if (!lowCompatible || !highCompatible) continue;

        // 저트래픽 → 고트래픽 이동 제안 (메인 제안)
        const highSlotWorldPos = {
          x: (highSlot.furniture_position?.x || 0) + (highSlot.slot_position?.x || 0),
          y: (highSlot.furniture_position?.y || 0) + (highSlot.slot_position?.y || 0),
          z: (highSlot.furniture_position?.z || 0) + (highSlot.slot_position?.z || 0),
        };

        productChanges.push({
          product_id: lowProduct.id,
          sku: lowProduct.sku || '',
          current: {
            zone_id: lowProduct.zone_id || '',
            furniture_id: lowProduct.furniture_id || '',
            slot_id: lowProduct.slot_id || lowProduct.slot_code || '',
            position: lowProduct.position || { x: 0, y: 0, z: 0 },
          },
          suggested: {
            zone_id: highSlot.zone_id || highProduct.zone_id || '',
            furniture_id: highSlot.furniture_id || '',
            slot_id: highSlot.id || '',
            position: highSlotWorldPos,
          },
          reason: `${lowProduct.product_name || lowProduct.sku}을(를) 고트래픽 구역으로 이동 (${highProduct.product_name || highProduct.sku}과(와) 위치 교환)`,
          priority: 'high',
          expected_revenue_impact: 0.15 + Math.random() * 0.1,
          expected_visibility_impact: 0.25 + Math.random() * 0.15,
        });

        // 고트래픽 → 저트래픽 이동 제안 (스왑 파트너)
        const lowSlotWorldPos = {
          x: (lowSlot.furniture_position?.x || 0) + (lowSlot.slot_position?.x || 0),
          y: (lowSlot.furniture_position?.y || 0) + (lowSlot.slot_position?.y || 0),
          z: (lowSlot.furniture_position?.z || 0) + (lowSlot.slot_position?.z || 0),
        };

        productChanges.push({
          product_id: highProduct.id,
          sku: highProduct.sku || '',
          current: {
            zone_id: highProduct.zone_id || '',
            furniture_id: highProduct.furniture_id || '',
            slot_id: highProduct.slot_id || highProduct.slot_code || '',
            position: highProduct.position || { x: 0, y: 0, z: 0 },
          },
          suggested: {
            zone_id: lowSlot.zone_id || lowProduct.zone_id || '',
            furniture_id: lowSlot.furniture_id || '',
            slot_id: lowSlot.id || '',
            position: lowSlotWorldPos,
          },
          reason: `${highProduct.product_name || highProduct.sku}을(를) 저트래픽 구역으로 이동 (위치 교환)`,
          priority: 'low',
          expected_revenue_impact: -0.05,
          expected_visibility_impact: -0.1,
        });
      }

      console.log(`[RuleBasedOpt] Generated ${productChanges.length} swap suggestions`);
    } else {
      // 기존 로직: 빈 슬롯이 있는 경우
      // 재배치 대상 상품 선정 (성과 데이터 기반 또는 전체 배치된 제품)
      let targetProducts: any[] = [];

      if (productPerf.length > 0) {
        // 성과 데이터 있음: 저성과 상품 우선
        const lowPerformers = productPerf
          .filter((p: any) => p.conversion_rate < 0.08 || p.units_sold < 10)
          .map((p: any) => p.product_id);

        targetProducts = products.filter((p: any) => lowPerformers.includes(p.id));
      }

      // 성과 데이터 없거나 저성과 상품 없으면: 저트래픽 구역 상품 선택
      if (targetProducts.length === 0 && products.length > 0) {
        targetProducts = products.filter((p: any) =>
          lowTrafficZones.includes(p.zone_id) || !p.zone_id
        );
      }

      // 여전히 없으면 전체 상품 중 랜덤 선택
      if (targetProducts.length === 0) {
        targetProducts = products.slice(0, Math.min(maxChanges, products.length));
      }

      console.log(`[RuleBasedOpt] Target products for relocation: ${targetProducts.length}`);

      // 제품 재배치 제안 생성
      targetProducts.slice(0, maxChanges).forEach((product: any) => {
        // 고트래픽 구역에서 호환 가능한 빈 슬롯 찾기
        let targetSlot = availableSlots.find(s =>
          highTrafficZones.includes(s.zone_id) &&
          s.zone_id !== product.zone_id && // 다른 구역으로 이동
          (!product.display_type || s.compatible_display_types?.includes(product.display_type))
        );

        // 고트래픽 구역에 없으면 아무 빈 슬롯
        if (!targetSlot) {
          targetSlot = availableSlots.find(s =>
            s.zone_id !== product.zone_id &&
            (!product.display_type || s.compatible_display_types?.includes(product.display_type))
          );
        }

        if (targetSlot) {
          // 슬롯 위치 계산
          const slotWorldPos = {
            x: (targetSlot.furniture_position?.x || 0) + (targetSlot.slot_position?.x || 0),
            y: (targetSlot.furniture_position?.y || 0) + (targetSlot.slot_position?.y || 0),
            z: (targetSlot.furniture_position?.z || 0) + (targetSlot.slot_position?.z || 0),
          };

          productChanges.push({
            product_id: product.id,
            sku: product.sku || '',
            current: {
              zone_id: product.zone_id || '',
              furniture_id: product.furniture_id || '',
              slot_id: product.slot_id || product.slot_code || '',
              position: product.position || { x: 0, y: 0, z: 0 },
            },
            suggested: {
              zone_id: targetSlot.zone_id || '',
              furniture_id: targetSlot.furniture_id || '',
              slot_id: targetSlot.id || '', // furniture_slots.id (UUID)
              position: slotWorldPos,
            },
            reason: `${product.product_name || product.sku}을(를) ${targetSlot.furniture_code || '고트래픽 구역'}으로 이동하여 노출도 향상`,
            priority: Math.random() > 0.5 ? 'high' : 'medium',
            expected_revenue_impact: 0.1 + Math.random() * 0.15,
            expected_visibility_impact: 0.2 + Math.random() * 0.2,
          });

          // 슬롯을 점유된 것으로 표시 (중복 방지)
          targetSlot.is_occupied = true;
        }
      });
    }
  }

  // 가구 최적화
  if (optimizationType === 'furniture' || optimizationType === 'both') {
    const furniture = layoutData.furniture || [];
    const movableFurniture = furniture.filter((f: any) => f.movable !== false);

    // 저트래픽 구역의 가구 식별
    const zonesByTraffic = Object.entries(performanceData.zoneMetrics || {})
      .sort((a: any, b: any) => a[1].visitors - b[1].visitors);

    const lowTrafficZones = zonesByTraffic.slice(0, 2).map(([zoneId]) => zoneId);

    movableFurniture
      .filter((f: any) => lowTrafficZones.includes(f.zone_id))
      .slice(0, Math.floor(maxChanges / 4))
      .forEach((f: any) => {
        // 고트래픽 구역으로 제안
        const targetZone = zonesByTraffic[zonesByTraffic.length - 1];
        if (!targetZone) return;

        // 🆕 VMD 원칙 선택 (동선 분석 기반)
        const isBottleneckZone = bottleneckZoneIds.includes(f.zone_id);
        const isDeadZone = deadZoneIds.includes(f.zone_id);
        const vmdPrinciple = isBottleneckZone
          ? 'bottleneck_resolution'
          : isDeadZone
            ? 'dead_zone_activation'
            : 'traffic_flow_optimization';

        furnitureChanges.push({
          furniture_id: f.id,
          furniture_type: f.furniture_type || 'unknown',
          movable: true,
          current: {
            zone_id: f.zone_id || '',
            position: f.position || { x: 0, y: 0, z: 0 },
            rotation: f.rotation || { x: 0, y: 0, z: 0 },
          },
          suggested: {
            zone_id: targetZone[0],
            position: {
              x: (f.position?.x || 0) + 2,
              y: f.position?.y || 0,
              z: (f.position?.z || 0) + 1,
            },
            rotation: f.rotation || { x: 0, y: 0, z: 0 },
          },
          vmd_principle: vmdPrinciple,  // 🆕 VMD 원칙 추가
          reason: `${vmdPrinciple} 원칙 적용: 저트래픽 구역에서 고트래픽 구역으로 이동하여 동선 최적화`,
          priority: 'medium',
          expected_impact: 0.1 + Math.random() * 0.05,
        } as any);
      });
  }

  // 요약 계산
  // 🆕 furniture-only 타입일 때도 revenue improvement 계산
  const baseRevenueImprovement = productChanges.length > 0
    ? productChanges.reduce((sum, p) => sum + p.expected_revenue_impact, 0) / productChanges.length
    : furnitureChanges.length > 0
      ? furnitureChanges.reduce((sum, f) => sum + f.expected_impact * 0.8, 0) / furnitureChanges.length  // 가구 이동도 매출에 간접 영향
      : 0;
  const baseTrafficImprovement = furnitureChanges.reduce((sum, f) => sum + f.expected_impact, 0) / Math.max(furnitureChanges.length, 1);
  // 🆕 furniture-only 타입일 때도 conversion improvement 계산
  const baseConversionImprovement = productChanges.length > 0
    ? 0.05 + Math.random() * 0.03
    : furnitureChanges.length > 0
      ? 0.03 + Math.random() * 0.02  // 가구 이동도 전환율에 간접 영향
      : 0;

  // 🆕 환경 영향도 반영
  const trafficMultiplier = envImpact?.traffic || 1.0;
  const conversionMultiplier = envImpact?.conversion || 1.0;

  // 🆕 AI 인사이트 생성 (룰 기반)
  const aiInsights: string[] = [];

  // 가구 변경 관련 인사이트
  if (furnitureChanges.length > 0) {
    const vmdPrinciples = furnitureChanges.map((fc: any) => fc.vmd_principle).filter(Boolean);
    const uniqueVmd = [...new Set(vmdPrinciples)];
    if (uniqueVmd.length > 0) {
      aiInsights.push(`VMD 원칙 적용: ${uniqueVmd.join(', ')} 원칙을 활용한 가구 ${furnitureChanges.length}개 재배치로 동선 최적화`);
    }
    if (bottleneckZoneIds.length > 0) {
      aiInsights.push(`병목 해소: ${bottleneckZoneIds.length}개 병목 구역의 혼잡도 감소를 위한 가구 재배치 권장`);
    }
    if (deadZoneIds.length > 0) {
      aiInsights.push(`데드존 활성화: ${deadZoneIds.length}개 저트래픽 구역의 방문율 향상을 위한 전략적 가구 배치`);
    }
  }

  // 상품 변경 관련 인사이트
  if (productChanges.length > 0) {
    aiInsights.push(`상품 배치 최적화: ${productChanges.length}개 상품의 고트래픽 구역 이동으로 노출도 ${Math.round(baseRevenueImprovement * 100)}% 향상 예상`);
    if (strongAssociations.length > 0) {
      aiInsights.push(`연관 규칙 활용: ${strongAssociations.length}개의 강한 상품 연관성을 기반으로 크로스셀 배치 최적화`);
    }
  }

  // 환경 관련 인사이트
  if (environmentData && envImpact) {
    if (envImpact.traffic < 0.8) {
      aiInsights.push(`환경 적응: 저트래픽 예상 환경에서 고객 체류시간 증가를 위한 배치 전략 적용`);
    } else if (envImpact.traffic > 1.2) {
      aiInsights.push(`환경 적응: 고트래픽 예상 환경에서 효율적인 동선 확보를 위한 배치 전략 적용`);
    }
  }

  // 최소 3개 인사이트 보장
  if (aiInsights.length < 3) {
    if (flowAnalysis && flowAnalysis.summary.flowHealthScore < 70) {
      aiInsights.push(`동선 개선 필요: 현재 동선 건강도 ${flowAnalysis.summary.flowHealthScore}점으로 개선 여지 있음`);
    }
    if (aiInsights.length < 3) {
      aiInsights.push(`룰 기반 최적화: 트래픽 패턴과 성과 데이터 분석을 통한 배치 권장사항 제공`);
    }
  }

  // 🔧 FIX: 체류시간 개선 예상치 계산 (환경 영향도 반영)
  // 가구 재배치 = 동선 최적화 = 체류시간 증가
  const baseDwellTimeImprovement = furnitureChanges.length > 0
    ? 0.03 + furnitureChanges.length * 0.01  // 가구 1개당 +1% 체류시간
    : productChanges.length > 0
      ? 0.02 + productChanges.length * 0.005  // 제품 재배치도 체류시간에 영향
      : 0;
  const dwellMultiplier = envImpact?.dwell || 1.0;

  const summary = {
    total_furniture_changes: furnitureChanges.length,
    total_product_changes: productChanges.length,
    expected_revenue_improvement: Math.round(baseRevenueImprovement * trafficMultiplier * conversionMultiplier * 100) / 100,
    expected_traffic_improvement: Math.round(baseTrafficImprovement * trafficMultiplier * 100) / 100,
    expected_conversion_improvement: Math.round(baseConversionImprovement * conversionMultiplier * 100) / 100,
    // 🔧 FIX: 체류시간 개선 예상치 추가 (프론트엔드에서 사용)
    expected_dwell_time_improvement: Math.round(baseDwellTimeImprovement * dwellMultiplier * 100) / 100,
    // 🆕 AI 인사이트 추가 (룰 기반)
    ai_insights: aiInsights,
    // 🆕 Structured Output 메타데이터 (룰 기반임을 표시)
    structured_output_enabled: false,
    schema_validation_passed: true,  // 룰 기반은 항상 스키마 준수
    // 🆕 환경 컨텍스트 정보 추가
    environment_context: environmentData ? {
      weather: environmentData.impact.weather.condition,
      events: environmentData.events.map(e => e.eventName),
      multipliers: envImpact,
      confidence: environmentData.impact.confidence,
    } : null,
    // 🆕 동선 분석 컨텍스트 정보 추가 (Phase 0.2)
    flow_context: flowAnalysis ? {
      health_score: flowAnalysis.summary.flowHealthScore,
      bottleneck_zones: bottleneckZoneIds,
      dead_zones: deadZoneIds,
      high_flow_zones: highFlowZoneIds,
      total_transitions: flowAnalysis.summary.totalTransitions,
      conversion_rate: flowAnalysis.summary.overallConversionRate,
    } : null,
    // 🆕 연관성 분석 컨텍스트 정보 추가 (Phase 0.3)
    association_context: associationData ? {
      total_transactions: associationData.summary.totalTransactions,
      avg_basket_size: associationData.summary.avgBasketSize,
      strong_rules_count: strongAssociations.length,
      bundle_recommendations: bundleRecommendations.length,
      data_quality: associationData.summary.dataQuality,
      top_category_pair: associationData.summary.topCategoryPair,
    } : null,
  };

  return {
    optimization_id: '',
    store_id: '',
    created_at: '',
    optimization_type: optimizationType as any,
    furniture_changes: furnitureChanges,
    product_changes: productChanges,
    summary,
  };
}

// ============================================================================
// 🆕 Staffing 최적화 함수 (advanced-ai-inference에서 통합)
// ============================================================================

/**
 * AI 기반 인력 배치 최적화
 *
 * @param supabase - Supabase 클라이언트
 * @param apiKey - AI API 키
 * @param storeId - 매장 ID
 * @param layoutData - 레이아웃 데이터
 * @param performanceData - 성과 데이터
 * @param parameters - 최적화 파라미터
 */
async function performStaffingOptimization(
  supabase: SupabaseClient,
  apiKey: string,
  storeId: string,
  layoutData: any,
  performanceData: any,
  parameters: any
): Promise<StaffingResult> {
  const goal = parameters?.staffing_goal || 'customer_service';

  // 1. 실제 직원 데이터 조회
  let realStaffData: any[] = [];
  try {
    const { data: staffRows, error: staffError } = await supabase
      .from('staff')
      .select('id, staff_code, staff_name, role, department, is_active, avatar_position, assigned_zone_id')
      .eq('store_id', storeId)
      .eq('is_active', true)
      .limit(20);

    if (!staffError && staffRows && staffRows.length > 0) {
      realStaffData = staffRows;
      console.log(`[performStaffingOptimization] Loaded ${realStaffData.length} staff members from DB`);
    } else {
      console.warn('[performStaffingOptimization] No staff data found, using AI-generated placeholders');
    }
  } catch (err) {
    console.error('[performStaffingOptimization] Error loading staff data:', err);
  }

  const staffCount = realStaffData.length > 0 ? realStaffData.length : (parameters?.staff_count || 3);

  // 2. 매장 정보 추출
  const storeInfo = layoutData?.storeInfo || {};
  const zones = layoutData?.zones || [];
  const storeWidth = storeInfo.width || 17;
  const storeDepth = storeInfo.depth || 16;

// 3. 직원 정보 섹션 생성 (🔧 FIX: 현재 위치 포함)
  const staffInfoSection = realStaffData.length > 0
    ? `ACTUAL STAFF MEMBERS WITH CURRENT POSITIONS:
${realStaffData.map((s: any, idx: number) => {
  const pos = s.avatar_position;
  const posStr = pos ? `at (${pos.x?.toFixed(1) || 0}, ${pos.z?.toFixed(1) || 0})` : 'unknown position';
  return `- ${s.staff_code || `STAFF-${idx+1}`}: ${s.staff_name} (${s.role || 'sales'}) - ${posStr}`;
}).join('\n')}`
    : `- Available Staff Count: ${staffCount}`;
  
  // 4. AI 프롬프트 생성 (🆕 assignment_strategy 필드 추가)
  const prompt = `You are an expert retail operations AI specializing in staff placement optimization.

TASK: Analyze the store layout and customer patterns to suggest optimal staff positions that maximize ${goal === 'customer_service' ? 'customer service quality and response time' : goal === 'sales' ? 'sales conversion and upselling opportunities' : 'operational efficiency'}.

STORE INFORMATION:
- Store: ${storeInfo.name || 'Retail Store'}
- Dimensions: ${storeWidth}m x ${storeDepth}m
- Business Type: ${storeInfo.businessType || 'Retail'}

STAFF PARAMETERS:
${staffInfoSection}
- Optimization Goal: ${goal}

${zones.length > 0 ? `ZONES:
${zones.map((z: any) => `- ${z.zone_name || z.zoneName}: ${z.width || 3}m x ${z.depth || 3}m at (${z.center_x || z.x || 0}, ${z.center_z || z.z || 0})`).join('\n')}` : ''}

${performanceData.zoneMetrics ? `ZONE PERFORMANCE METRICS:
${Object.entries(performanceData.zoneMetrics).slice(0, 8).map(([zoneId, data]: [string, any]) =>
  `- ${data.zoneName || zoneId}: ${data.visitors || 0} visitors, ${data.avgDwellTime || 30}s dwell time, ${((data.conversionRate || 0.05) * 100).toFixed(1)}% conversion`
).join('\n')}` : ''}

## 🧑‍💼 STAFFING STRATEGY CODEBOOK (MUST USE)

Each staff member MUST be assigned one of these strategies in the "assignment_strategy" field:

- **peak_coverage**: 피크타임 커버리지 - 혼잡 시간대 대응
- **bottleneck_support**: 병목 지원 - 체류시간이 길고 혼잡한 구역 배치
- **high_value_zone_focus**: 고가치 존 집중 - 전환율/매출이 높은 구역에 집중
- **cross_zone_flexibility**: 교차 존 유연배치 - 여러 존 커버리지 최적화
- **customer_service_boost**: 고객 서비스 강화 - 고객 응대 품질 향상
- **queue_management**: 대기줄 관리 - 결제/피팅룸 대기 관리
- **fitting_room_priority**: 피팅룸 우선 배치 - 피팅룸 서비스 강화
- **entrance_greeting**: 입구 환영 서비스 - 입구에서 고객 응대

## 🏷️ STAFF ROLES (MUST USE)

Each staff member MUST be assigned one of these roles:
- manager, sales, cashier, security, greeter, fitting_room_attendant, stock, visual_merchandiser

${realStaffData.length > 0 ? `IMPORTANT: Use the exact staff IDs and names from ACTUAL STAFF MEMBERS above. Do NOT generate fake names.` : ''}

Return a JSON object with this exact structure:
{
  "staffPositions": [
    {
      "staffId": "string",
      "staffCode": "string",
      "staffName": "string",
      "role": "sales|manager|cashier|security|greeter|fitting_room_attendant|stock|visual_merchandiser",
      "currentPosition": {"x": number, "y": 0.5, "z": number},
      "suggestedPosition": {"x": number, "y": 0.5, "z": number},
      "current_zone": "zone_id or zone_name",
      "suggested_zone": "zone_id or zone_name",
      "assignment_strategy": "peak_coverage|bottleneck_support|high_value_zone_focus|cross_zone_flexibility|customer_service_boost|queue_management|fitting_room_priority|entrance_greeting",
      "coverageGain": number (percentage improvement, 5-30%),
      "reason": "string explaining the placement strategy in Korean"
    }
  ],
  "zoneCoverage": [
    {
      "zoneId": "string",
      "zoneName": "string",
      "currentCoverage": number (0-100),
      "suggestedCoverage": number (0-100),
      "requiredStaff": number,
      "currentStaff": number
    }
  ],
  "metrics": {
    "totalCoverage": number (0-100),
    "avgResponseTime": number (seconds),
    "coverageGain": number (percentage, 5-30%),
    "customerServiceRateIncrease": number (percentage, 5-25%)
  },
  "insights": ["string array of 3-5 actionable insights in Korean - REQUIRED"],
  "confidence": number (0-1)
}

⚠️ CRITICAL REQUIREMENTS:
1. EVERY staff member MUST have an "assignment_strategy" from the STAFFING STRATEGY CODEBOOK
2. EVERY staff member MUST have a "role" from the STAFF ROLES list
3. The "insights" array MUST contain 3-5 meaningful, actionable insights in Korean
4. Each insight should reference the assignment_strategy being applied`;

  // 5. AI 호출 또는 룰 기반 생성
  if (apiKey) {
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
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('[performStaffingOptimization] API error:', error);
        throw new Error(`AI API error: ${error}`);
      }

      const result = await response.json();
      const aiContent = result.choices[0]?.message?.content || '{}';

      // JSON 파싱
      let aiResponse: any;
      try {
        // 마크다운 코드 블록 제거
        let cleaned = aiContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const firstBrace = cleaned.indexOf('{');
        const lastBrace = cleaned.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
          cleaned = cleaned.substring(firstBrace, lastBrace + 1);
        }
        aiResponse = JSON.parse(cleaned);
      } catch (parseError) {
        console.error('[performStaffingOptimization] JSON parse error:', parseError);
        aiResponse = {};
      }

      // AI 응답 처리
      let staffPositions = aiResponse.staffPositions || [];
      const halfWidth = storeWidth / 2;
      const halfDepth = storeDepth / 2;

      // AI 응답이 없거나 부족한 경우 기본 배치 생성
      if (staffPositions.length === 0) {
        const staffSource = realStaffData.length > 0 ? realStaffData : Array.from({ length: staffCount }, (_, i) => ({
          id: `staff-${i}`,
          staff_code: `STAFF-${i + 1}`,
          staff_name: `직원 ${i + 1}`,
          role: 'sales',
        }));

        staffPositions = staffSource.map((staff: any, idx: number) => ({
          staffId: staff.id || `staff-${idx}`,
          staffCode: staff.staff_code || `STAFF-${idx + 1}`,
          staffName: staff.staff_name || `직원 ${idx + 1}`,
          role: staff.role || 'sales',
          currentPosition: {
            x: -halfWidth / 2 + (idx * halfWidth / staffCount),
            y: 0.5,
            z: 0,
          },
          suggestedPosition: {
            x: -halfWidth / 3 + (idx * halfWidth * 0.7 / staffCount),
            y: 0.5,
            z: (idx % 2 === 0 ? -1 : 1) * halfDepth / 4,
          },
          coverageGain: 10 + idx * 5,
          reason: '고객 밀집 구역 커버리지 확대를 위한 배치',
        }));
      } else if (realStaffData.length > 0) {
        // AI 응답이 있는 경우, 실제 직원 데이터와 매핑
        staffPositions = staffPositions.map((pos: any, idx: number) => {
          const realStaff = realStaffData[idx] || realStaffData[0];
          return {
            ...pos,
            staffId: realStaff?.id || pos.staffId,
            staffCode: realStaff?.staff_code || pos.staffCode || `STAFF-${idx + 1}`,
            staffName: realStaff?.staff_name || pos.staffName,
            role: realStaff?.role || pos.role || 'sales',
          };
        });
      }

      // Zone coverage 처리
      let zoneCoverage = aiResponse.zoneCoverage || [];
      if (zoneCoverage.length === 0 && zones.length > 0) {
        zoneCoverage = zones.slice(0, 5).map((zone: any, idx: number) => ({
          zoneId: zone.id || `zone-${idx}`,
          zoneName: zone.zone_name || zone.zoneName || `구역 ${idx + 1}`,
          currentCoverage: 60 + Math.floor(Math.random() * 20),
          suggestedCoverage: 85 + Math.floor(Math.random() * 10),
          requiredStaff: Math.ceil((idx + 1) / 2),
          currentStaff: Math.floor(staffCount / (idx + 1)),
        }));
      }

      return {
        staffPositions,
        zoneCoverage,
        metrics: aiResponse.metrics || {
          totalCoverage: 75,
          avgResponseTime: 35,
          coverageGain: 15,
          customerServiceRateIncrease: 12,
        },
        insights: aiResponse.insights || ['인력 배치 최적화 분석이 완료되었습니다.'],
        confidence: aiResponse.confidence || 0.8,
      };
    } catch (error) {
      console.error('[performStaffingOptimization] Error:', error);
      // 에러 시 룰 기반 결과 반환
    }
  }

  // 6. 룰 기반 기본 결과 생성 (AI 키 없거나 에러 시)
  const halfWidth = storeWidth / 2;
  const halfDepth = storeDepth / 2;

  const staffSource = realStaffData.length > 0 ? realStaffData : Array.from({ length: staffCount }, (_, i) => ({
    id: `staff-${i}`,
    staff_code: `STAFF-${i + 1}`,
    staff_name: `직원 ${i + 1}`,
    role: 'sales',
  }));

  const staffPositions: StaffPosition[] = staffSource.map((staff: any, idx: number) => ({
    staffId: staff.id || `staff-${idx}`,
    staffCode: staff.staff_code || `STAFF-${idx + 1}`,
    staffName: staff.staff_name || `직원 ${idx + 1}`,
    role: staff.role || 'sales',
    currentPosition: {
      x: -halfWidth / 2 + (idx * halfWidth / staffCount),
      y: 0.5,
      z: 0,
    },
    suggestedPosition: {
      x: -halfWidth / 3 + (idx * halfWidth * 0.7 / staffCount),
      y: 0.5,
      z: (idx % 2 === 0 ? -1 : 1) * halfDepth / 4,
    },
    coverageGain: 10 + idx * 5,
    reason: '고객 밀집 구역 커버리지 확대를 위한 배치 (룰 기반)',
  }));

  const zoneCoverage: ZoneCoverage[] = zones.slice(0, 5).map((zone: any, idx: number) => ({
    zoneId: zone.id || `zone-${idx}`,
    zoneName: zone.zone_name || zone.zoneName || `구역 ${idx + 1}`,
    currentCoverage: 60 + Math.floor(Math.random() * 20),
    suggestedCoverage: 80 + Math.floor(Math.random() * 15),
    requiredStaff: Math.ceil((idx + 1) / 2),
    currentStaff: Math.floor(staffCount / Math.max(1, idx + 1)),
  }));

  return {
    staffPositions,
    zoneCoverage,
    metrics: {
      totalCoverage: 70,
      avgResponseTime: 40,
      coverageGain: 12,
      customerServiceRateIncrease: 10,
    },
    insights: [
      '입구 근처에 환영 담당 직원 배치를 권장합니다.',
      '피팅룸 구역에 전담 직원 배치로 서비스 품질을 높일 수 있습니다.',
      '피크 시간대에 계산대 인력을 추가 배치하세요.',
    ],
    confidence: 0.7,
  };
}

// ============================================================================
// 🆕 Sprint 1 강화: Tool 결과 후처리 함수
// ============================================================================

/**
 * Tool 결과 타입 정의
 */
interface ParsedToolResult {
  type: 'traffic_flow' | 'roi';
  zone_id?: string;
  product_id?: string;
  data: any;
}

/**
 * Tool 호출 결과를 Map으로 파싱
 * - zone_id 또는 product_id를 키로 사용
 */
function parseToolResultsToMap(
  toolResults: ToolCallResult[]
): Record<string, ParsedToolResult> {
  const resultMap: Record<string, ParsedToolResult> = {};

  for (const result of toolResults) {
    try {
      const data = JSON.parse(result.content);

      // 에러 결과는 스킵
      if (data.error) continue;

      // traffic_flow 결과
      if (data.zone_id && data.expected_visitors !== undefined) {
        resultMap[`traffic_${data.zone_id}`] = {
          type: 'traffic_flow',
          zone_id: data.zone_id,
          data,
        };
      }

      // roi 결과 (product_id가 있는 경우)
      if (data.roi_percent !== undefined) {
        // ROI 결과는 호출 순서대로 저장 (인덱스 기반)
        const key = `roi_${Object.keys(resultMap).filter(k => k.startsWith('roi_')).length}`;
        resultMap[key] = {
          type: 'roi',
          data,
        };
      }
    } catch {
      // 파싱 실패 시 스킵
      continue;
    }
  }

  return resultMap;
}

/**
 * Tool 결과를 최적화 결과에 강제 적용
 * - AI가 생성한 수치를 계산 함수 결과로 덮어씀
 */
function applyToolResultsToOptimization(
  result: any,
  toolResultsMap: Record<string, ParsedToolResult>
): any {
  // Tool 결과가 없으면 원본 반환
  if (Object.keys(toolResultsMap).length === 0) {
    return result;
  }

  const enhancedResult = { ...result };

  // 1. Traffic Flow 결과를 furniture_changes에 적용
  const trafficResults = Object.values(toolResultsMap).filter(r => r.type === 'traffic_flow');
  if (trafficResults.length > 0 && enhancedResult.furniture_changes) {
    enhancedResult.furniture_changes = enhancedResult.furniture_changes.map((change: any) => {
      const trafficData = trafficResults.find(t => t.zone_id === change.suggested?.zone_id);
      if (trafficData) {
        return {
          ...change,
          // 계산된 트래픽 데이터 추가
          calculated_traffic: {
            expected_visitors: trafficData.data.expected_visitors,
            flow_rate: trafficData.data.flow_rate,
            congestion_risk: trafficData.data.congestion_risk,
            bottleneck_probability: trafficData.data.bottleneck_probability,
            confidence: trafficData.data.confidence,
          },
          // expected_impact를 계산 결과로 덮어쓰기
          expected_impact: trafficData.data.expected_visitors > 0
            ? Math.min(0.5, trafficData.data.expected_visitors / 1000)  // 정규화
            : change.expected_impact,
        };
      }
      return change;
    });
  }

  // 2. ROI 결과를 product_changes에 적용
  const roiResults = Object.values(toolResultsMap).filter(r => r.type === 'roi');
  if (roiResults.length > 0 && enhancedResult.product_changes) {
    enhancedResult.product_changes = enhancedResult.product_changes.map((change: any, index: number) => {
      // 인덱스 기반 매칭 (순서대로)
      const roiData = roiResults[index]?.data;
      if (roiData) {
        return {
          ...change,
          // 계산된 ROI 데이터 추가
          calculated_roi: {
            expected_impressions: roiData.expected_impressions,
            expected_conversions: roiData.expected_conversions,
            expected_revenue: roiData.expected_revenue,
            expected_profit: roiData.expected_profit,
            roi_percent: roiData.roi_percent,
            confidence: roiData.confidence,
            recommendation: roiData.recommendation,
          },
          // AI가 생성한 수치를 계산 결과로 덮어쓰기
          expected_revenue_impact: roiData.roi_percent / 100,  // ROI%를 0-1 범위로 변환
          expected_visibility_impact: roiData.expected_impressions > 0
            ? Math.min(1, roiData.expected_conversions / roiData.expected_impressions * 10)  // 전환율 기반
            : change.expected_visibility_impact,
        };
      }
      return change;
    });
  }

  // 3. Summary에 계산 기반 집계 추가
  if (enhancedResult.summary) {
    const totalRoiResults = roiResults.map(r => r.data);
    if (totalRoiResults.length > 0) {
      const avgRoi = totalRoiResults.reduce((sum, r) => sum + (r.roi_percent || 0), 0) / totalRoiResults.length;
      const totalExpectedProfit = totalRoiResults.reduce((sum, r) => sum + (r.expected_profit || 0), 0);

      enhancedResult.summary = {
        ...enhancedResult.summary,
        // 계산 기반 수치 추가
        calculated_avg_roi_percent: Math.round(avgRoi * 10) / 10,
        calculated_total_daily_profit: totalExpectedProfit,
        calculation_source: 'function_calling',
        calculation_confidence: totalRoiResults.reduce((sum, r) => sum + (r.confidence || 0), 0) / totalRoiResults.length,
      };
    }
  }

  console.log(`[applyToolResultsToOptimization] Enhanced ${enhancedResult.furniture_changes?.length || 0} furniture, ${enhancedResult.product_changes?.length || 0} product changes`);

  return enhancedResult;
}

// ============================================================================
// 🆕 Sprint 2: XAI 근거 생성 - VMD 규칙 추출 함수 (S2-5)
// ============================================================================

/**
 * AI 응답에서 적용된 VMD 규칙 추출
 * - AI가 vmd_rule_applied 필드에 명시한 규칙 코드 수집
 * - 변경 항목의 reason/vmd_principle에서 규칙 참조 탐지
 */
function extractAppliedVMDRules(
  result: any,
  rulesetContext: VMDRulesetContext | null
): VMDRule[] {
  if (!rulesetContext || rulesetContext.rules.length === 0) {
    return [];
  }

  const appliedRuleCodes = new Set<string>();

  // 1. 명시적 vmd_rule_applied 필드에서 추출
  const changes = [
    ...(result.furniture_changes || []),
    ...(result.product_changes || []),
  ];

  for (const change of changes) {
    // vmd_rule_applied 배열
    if (Array.isArray(change.vmd_rule_applied)) {
      change.vmd_rule_applied.forEach((code: string) => appliedRuleCodes.add(code));
    }
    // 단일 값
    else if (typeof change.vmd_rule_applied === 'string') {
      appliedRuleCodes.add(change.vmd_rule_applied);
    }

    // vmd_principle 필드에서 규칙 코드 탐지
    if (change.vmd_principle) {
      const matches = change.vmd_principle.match(/VMD-\d{3}/g);
      if (matches) {
        matches.forEach((code: string) => appliedRuleCodes.add(code));
      }
    }

    // reason 필드에서 규칙 코드 탐지
    if (change.reason) {
      const matches = change.reason.match(/VMD-\d{3}/g);
      if (matches) {
        matches.forEach((code: string) => appliedRuleCodes.add(code));
      }
    }
  }

  // 2. summary의 insights에서도 탐지
  if (result.summary?.insights) {
    const insightsText = Array.isArray(result.summary.insights)
      ? result.summary.insights.join(' ')
      : String(result.summary.insights);

    const matches = insightsText.match(/VMD-\d{3}/g);
    if (matches) {
      matches.forEach((code: string) => appliedRuleCodes.add(code));
    }
  }

  // 3. 수집된 규칙 코드로 실제 규칙 객체 조회
  const appliedRules = rulesetContext.rules.filter(
    rule => appliedRuleCodes.has(rule.rule_code)
  );

  // 4. 규칙 코드가 명시되지 않았지만 키워드 매칭으로 추론
  if (appliedRules.length === 0) {
    // 간단한 키워드 매칭으로 추론
    const allText = JSON.stringify(result).toLowerCase();

    for (const rule of rulesetContext.rules) {
      const keywords = extractKeywords(rule.rule_name_ko, rule.description_ko);
      const matched = keywords.some(kw => allText.includes(kw.toLowerCase()));
      if (matched && appliedRules.length < 3) {
        appliedRules.push(rule);
      }
    }
  }

  return appliedRules;
}

/**
 * 규칙 이름/설명에서 키워드 추출
 */
function extractKeywords(name: string, description: string): string[] {
  const keywords: string[] = [];

  // 한국어 핵심 단어
  const koreanKeywords = [
    '통로', '눈높이', '골든존', '입구', '계산대',
    '연관', '교차', '시야', '데드존', '충동구매',
  ];

  const combined = `${name} ${description}`;
  for (const kw of koreanKeywords) {
    if (combined.includes(kw)) {
      keywords.push(kw);
    }
  }

  return keywords;
}

// ============================================================================
// 🆕 3D 시각화 데이터 생성 함수 (아키텍처 통합)
// ============================================================================

interface VisualizationData {
  layout: {
    furnitureMoves: Array<{
      furnitureId: string;
      furnitureCode?: string;
      furnitureName?: string;
      from: Vector3D;
      to: Vector3D;
      reason: string;
      priority: string;
    }>;
    productMoves: Array<{
      productId: string;
      productSku?: string;
      productName?: string;
      from: { zoneId?: string; furnitureId?: string; slotId?: string; position?: Vector3D };
      to: { zoneId?: string; furnitureId?: string; slotId?: string; position?: Vector3D };
      reason: string;
      priority: string;
    }>;
  };
  flow: {
    zoneFlowArrows: Array<{
      from: { x: number; z: number };
      to: { x: number; z: number };
      intensity: number;
      label?: string;
    }>;
    bottlenecks: Array<{
      zoneId: string;
      zoneName: string;
      position: Vector3D;
      severity: number;
      suggestion: string;
    }>;
    deadZones: Array<{
      zoneId: string;
      zoneName: string;
      position: Vector3D;
      severity: number;
      reason: string;
    }>;
    paths: Array<{
      pathId: string;
      zoneNames: string[];
      frequency: number;
      pathType: string;
    }>;
  };
  staffing: {
    staffMarkers: Array<{
      staffId: string;
      staffName: string;
      role: string;
      currentPosition: Vector3D;
      suggestedPosition: Vector3D;
    }>;
    coverageZones: Array<{
      zoneId: string;
      zoneName: string;
      currentCoverage: number;
      suggestedCoverage: number;
      center: Vector3D;
      radius: number;
    }>;
    movementPaths: Array<{
      staffId: string;
      from: Vector3D;
      to: Vector3D;
    }>;
  };
}

function severityToNumber(severity: unknown): number {
  if (typeof severity === 'number') return severity;
  switch (severity) {
    case 'low':
      return 1;
    case 'medium':
      return 2;
    case 'high':
      return 3;
    case 'critical':
      return 4;
    default:
      return 0;
  }
}

/**
 * 최적화 결과와 분석 데이터로부터 3D 시각화 데이터 생성
 */
function generateVisualizationData(
  result: AILayoutOptimizationResult,
  flowAnalysis: FlowAnalysisResult | null,
  layoutData: any,
  zones: any[]
): VisualizationData {
  // 1. Layout 시각화 데이터
  const furnitureMoves = (result.furniture_changes || []).map((fc: FurnitureChange) => {
    // 현재 위치 찾기
    const currentFurniture = layoutData?.furniture?.find((f: any) =>
      f.id === fc.furniture_id || f.furniture_code === fc.furniture_type
    );

    return {
      furnitureId: fc.furniture_id,
      furnitureCode: fc.furniture_type,
      furnitureName: fc.furniture_label ?? fc.furniture_type,
      from: currentFurniture ? {
        x: currentFurniture.position_x || 0,
        y: currentFurniture.position_y || 0,
        z: currentFurniture.position_z || 0,
      } : { x: 0, y: 0, z: 0 },
      to: fc.suggested?.position || { x: 0, y: 0, z: 0 },
      reason: fc.reason,
      priority: fc.priority,
    };
  });

  const productMoves = (result.product_changes || []).map((pc: ProductChange) => ({
    productId: pc.product_id,
    productSku: pc.sku,
    productName: pc.product_name ?? pc.sku,
    from: {
      zoneId: pc.current?.zone_id,
      furnitureId: pc.current?.furniture_id,
      slotId: pc.current?.slot_id,
      position: pc.current?.position,
    },
    to: {
      zoneId: pc.suggested?.zone_id,
      furnitureId: pc.suggested?.furniture_id,
      slotId: pc.suggested?.slot_id,
      position: pc.suggested?.position,
    },
    reason: pc.reason,
    priority: pc.priority,
  }));

  // 2. Flow 시각화 데이터
  const zonePositionMap = new Map<string, Vector3D>();
  zones.forEach((zone: any) => {
    zonePositionMap.set(zone.zone_name || zone.id, {
      x: zone.center_x || zone.position_x || 0,
      y: 0.1,
      z: zone.center_z || zone.position_z || 0,
    });
  });

  // keyPaths에서 flow arrows 생성
  const zoneFlowArrows = flowAnalysis?.keyPaths?.slice(0, 10).map((path, idx) => {
    const fromZone = path.zoneNames[0];
    const toZone = path.zoneNames[path.zoneNames.length - 1];
    const fromPos = zonePositionMap.get(fromZone) || { x: -5 + idx, y: 0, z: -5 };
    const toPos = zonePositionMap.get(toZone) || { x: 5 - idx, y: 0, z: 5 };

    return {
      from: { x: fromPos.x, z: fromPos.z },
      to: { x: toPos.x, z: toPos.z },
      intensity: Math.min(1, path.frequency / 100),
      label: path.zoneNames.join(' → '),
    };
  }) || [];

  const bottlenecks = flowAnalysis?.bottlenecks?.map((bn) => {
    const pos = zonePositionMap.get(bn.zoneName) || { x: 0, y: 0, z: 0 };
    return {
      zoneId: bn.zoneId,
      zoneName: bn.zoneName,
      position: pos,
      severity: severityToNumber(bn.severity),
      suggestion: bn.recommendation || '혼잡도 개선이 필요합니다.',
    };
  }) || [];

  const deadZones = flowAnalysis?.deadZones?.map((dz) => {
    const pos = zonePositionMap.get(dz.zoneName) || { x: 0, y: 0, z: 0 };
    return {
      zoneId: dz.zoneId,
      zoneName: dz.zoneName,
      position: pos,
      severity: severityToNumber(dz.severity),
      reason: dz.recommendation || '동선 유입 개선이 필요합니다.',
    };
  }) || [];

  const paths = flowAnalysis?.keyPaths?.slice(0, 5).map((p, idx) => ({
    pathId: `path-${idx}`,
    zoneNames: p.zoneNames,
    frequency: p.frequency,
    pathType: p.pathType,
  })) || [];

  // 3. Staffing 시각화 데이터
  const staffingResult = result.staffing_result;

  const staffMarkers = staffingResult?.staffPositions?.map((sp: StaffPosition) => ({
    staffId: sp.staffId,
    staffName: sp.staffName,
    role: sp.role,
    currentPosition: sp.currentPosition,
    suggestedPosition: sp.suggestedPosition,
  })) || [];

  const coverageZones = staffingResult?.zoneCoverage?.map((zc: ZoneCoverage) => {
    const pos = zonePositionMap.get(zc.zoneName) || { x: 0, y: 0, z: 0 };
    return {
      zoneId: zc.zoneId,
      zoneName: zc.zoneName,
      currentCoverage: zc.currentCoverage,
      suggestedCoverage: zc.suggestedCoverage,
      center: pos,
      radius: 3,
    };
  }) || [];

  const movementPaths = staffingResult?.staffPositions?.map((sp: StaffPosition) => ({
    staffId: sp.staffId,
    from: sp.currentPosition,
    to: sp.suggestedPosition,
  })) || [];

  return {
    layout: {
      furnitureMoves,
      productMoves,
    },
    flow: {
      zoneFlowArrows,
      bottlenecks,
      deadZones,
      paths,
    },
    staffing: {
      staffMarkers,
      coverageZones,
      movementPaths,
    },
  };
}
