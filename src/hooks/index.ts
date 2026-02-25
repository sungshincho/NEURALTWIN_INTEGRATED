// ============================================================================
// Hooks Index - 중앙 집중식 훅 내보내기
// ============================================================================

// ============================================================================
// 인증 및 스토어 선택
// ============================================================================
export { useAuth } from './useAuth';
export { useSelectedStore } from './useSelectedStore';

// ============================================================================
// AI 훅 (통합)
// ============================================================================
export {
  useAI,
  useSimulationAI,
  useGenerateRecommendations,
  useOntologyRecommendation,
  useInferRelations,
  useAnomalyDetection,
  usePatternAnalysis,
  useRetailAIInference,
  useAIInferenceHistory,
  useAIRecommendations,
} from './useAI';

export type {
  UnifiedAIAction,
  RetailAIInferenceType,
  AIInferenceType,
  AIRequest,
  AIRecommendation,
  AIInferenceResult,
} from './useAI';

// Legacy AI hooks (하위 호환성)
export { useUnifiedAI } from './useUnifiedAI';
export type {
  UnifiedAIRequest,
  GeneratedRecommendation,
  OntologyRecommendation,
  DetectedAnomaly,
  GraphPattern,
  InferredRelation,
} from './useUnifiedAI';

export { useAIRecommendations as useLegacyAIRecommendations } from './useAIRecommendations';
export { useOntologyInference } from './useOntologyInference';

// ============================================================================
// 리테일 데이터 훅 (useZoneMetrics, useProductPerformance 등으로 대체됨)
// ============================================================================

// ============================================================================
// 온톨로지 훅
// ============================================================================
export * from './useOntologyData';
export { useOntologySchema } from './useOntologySchema';
export * from './useRetailOntology';

// ============================================================================
// 대시보드 KPI 훅
// ============================================================================
export { useDashboardKPI } from './useDashboardKPI';
export * from './useDashboardKPIAgg';

// ============================================================================
// 고객 분석 훅
// ============================================================================
export { useCustomerJourney } from './useCustomerJourney';
export { useCustomerSegments } from './useCustomerSegments';
export { useCustomerSegmentsAgg } from './useCustomerSegmentsAgg';

// ============================================================================
// 구역/트래픽 훅
// ============================================================================
export * from './useZoneMetrics';
export { useZoneTransition } from './useZoneTransition';
export { useTrafficHeatmap } from './useTrafficHeatmap';
export { useDwellTime } from './useDwellTime';
export { useFootfallAnalysis } from './useFootfallAnalysis';
export { useFunnelAnalysis } from './useFunnelAnalysis';

// ============================================================================
// 상품 훅
// ============================================================================
export * from './useProductPerformance';

// ============================================================================
// 매장 훅
// ============================================================================
export * from './useStoreData';
export { useStoreScene } from './useStoreScene';
export { useRealtimeInventory } from './useRealtimeInventory';

// ============================================================================
// 데이터 관리 훅
// ============================================================================
export { useDataReadiness } from './useDataReadiness';
export { useImportProgress } from './useImportProgress';
export { useUploadSession } from './useUploadSession';
export { useSchemaMetadata } from './useSchemaMetadata';
export { usePOSIntegration } from './usePOSIntegration';
export { useWiFiTracking } from './useWiFiTracking';

// ============================================================================
// 알림 및 목표 훅
// ============================================================================
export { useAlerts } from './useAlerts';
export * from './useGoals';

// ============================================================================
// ROI 및 학습 훅
// ============================================================================
export * from './useROITracking';
export * from './useLearningFeedback';

// ============================================================================
// 온보딩 훅
// ============================================================================
export * from './useOnboarding';

// ============================================================================
// 유틸리티 훅
// ============================================================================
export { useClearCache } from './useClearCache';
export { useToast, toast } from './use-toast';
export { useCountUp, useFormattedCountUp } from './useCountUp';

// ============================================================================
// 시뮬레이션 훅
// ============================================================================
export { useSimulationEngine } from './useSimulationEngine';

// ============================================================================
// 리테일 AI 훅 (실제 AI - Gemini 2.5 Flash)
// ============================================================================
export {
  useRetailAI,
  useDemandForecast,
  useRiskPrediction,
  useOptimizationSuggestions,
  useSeasonTrend,
} from './useRetailAI';

export type {
  InferenceType,
  RetailAIParams,
  AIRecommendationItem,
  AIInferenceResult as RetailAIInferenceResultType,
  RetailAIResponse,
  DemandForecastResult,
  RiskPredictionResult,
} from './useRetailAI';
