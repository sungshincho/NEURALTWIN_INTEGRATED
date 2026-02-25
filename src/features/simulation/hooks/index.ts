// ========================================
// 기존 Hooks (유지)
// ========================================
export { useAIInference } from './useAIInference';
export { useStoreContext } from './useStoreContext';
export { useContextData, useWeatherForecast, useEventCalendar, useEconomicIndicators } from './useContextData';

// Digital Twin hooks
export { useRealtimeTracking } from './useRealtimeTracking';

// ========================================
// Phase 2: 데이터 소스 매핑 (NEW)
// ========================================
export { useDataSourceMapping } from './useDataSourceMapping';
export type { 
  ImportedDataSource as HookImportedDataSource, 
  PresetApiSource as HookPresetApiSource, 
  CustomApiSource as HookCustomApiSource, 
  OntologyMappingStatus as HookOntologyMappingStatus,
  ApiConfig
} from './useDataSourceMapping';

// ========================================
// Phase 3: 온톨로지 강화 AI 추론 (NEW)
// ========================================
export { useEnhancedAIInference } from './useEnhancedAIInference';
export type {
  SimulationScenario as HookSimulationScenario,
  OntologyContext,
  OntologySchema,
  SimulationParams,
  InferenceResult,
} from './useEnhancedAIInference';

// Phase 4 Hooks
export { useSimulationHistory } from './useSimulationHistory';
export type {
  SimulationType,
  SimulationHistoryItem,
  ComparisonResult,
} from './useSimulationHistory';

// ========================================
// Phase 5: 시뮬레이션 엔진 (NEW)
// ========================================
export { useSimulationEngine } from './useSimulationEngine';
export { useLayoutApply } from './useLayoutApply';
export { useSimulationAI, useSimulationComparison, useRealtimeInsights } from './useSimulationAI';
export type { SimulationAIResult } from './useSimulationAI';
