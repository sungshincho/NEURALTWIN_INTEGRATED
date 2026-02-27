// 메인 페이지
export { default as ROIMeasurementPage } from './ROIMeasurementPage';

// 컴포넌트
export {
  ROISummaryCards,
  CategoryPerformanceTable,
  AppliedStrategyTable,
  StrategyDetailModal,
  ApplyStrategyModal,
  AIInsightsCard,
} from './components';

// 훅
export {
  useROISummary,
  useAppliedStrategies,
  useStrategyDetail,
  useApplyStrategy,
  useUpdateStrategyStatus,
  useCategoryPerformance,
  useCategoryPerformanceGrouped,
} from './hooks';

// 유틸
export {
  MODULE_CONFIG,
  SOURCE_CONFIG,
  STATUS_CONFIG,
  RESULT_CONFIG,
  TREND_ICONS,
  getModuleConfig,
  getModuleIcon,
  getModuleDisplayName,
  getModuleShortName,
  getSourceDisplayName,
} from './utils/moduleConfig';

// 타입
export type {
  SimulationSource,
  SourceModule,
  StrategyStatus,
  StrategyResult,
  AppliedStrategy,
  StrategyDailyMetric,
  ROISummary,
  CategoryPerformance,
  ApplyStrategyInput,
  DateRange,
  StrategyFilters,
  StrategySortOptions,
} from './types/roi.types';
