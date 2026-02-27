/**
 * optimization/index.ts
 *
 * 최적화 설정 컴포넌트 모듈 익스포트
 */

export { OptimizationSettingsPanel } from './OptimizationSettingsPanel';
export { ObjectiveSelector } from './ObjectiveSelector';
export { FurnitureSelector } from './FurnitureSelector';
export { ProductSelector } from './ProductSelector';
export { IntensitySlider } from './IntensitySlider';
// B안: 통합 최적화 설정 컴포넌트
export { IntegratedOptimizationSettings } from './IntegratedOptimizationSettings';

// 타입 재export
export type {
  OptimizationSettings,
  OptimizationObjective,
  OptimizationIntensity,
  FurnitureSettings,
  ProductSettings,
  FurnitureItem,
  ProductItem,
  // B안: 통합 설정 타입
  IntegratedOptimizationSettings as IntegratedOptimizationSettingsType,
} from '../../types/optimization.types';

// 상수 재export
export {
  DEFAULT_OPTIMIZATION_SETTINGS,
  DEFAULT_INTEGRATED_SETTINGS,
  INTENSITY_LIMITS,
} from '../../types/optimization.types';
