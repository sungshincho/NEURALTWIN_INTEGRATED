/**
 * NEURALTWIN Store Visualizer - Module Exports
 */

// 메인 컴포넌트
export { default as StoreVisualizer } from './StoreVisualizer';

// 오버레이 컴포넌트
export { default as KPIBar } from './KPIBar';
export { default as StageProgress } from './StageProgress';
export { default as CompareVisualizer } from './CompareVisualizer';

// 타입 내보내기
export type {
  VizState,
  VizAnnotation,
  VizKPI,
  VizDirective,
  DynamicZone,
  CustomerStage,
  StoreParams,   // PHASE H
  ZoneScale      // PHASE H
} from './vizDirectiveTypes';

// 유틸리티 함수
export {
  createDefaultVizDirective,
  mergeVizDirective,
  isValidVizDirective,
  parseVizDirectiveFromResponse
} from './vizDirectiveTypes';

// 매장 데이터
export {
  STORE,
  CAMERA_PRESETS,
  FURNITURE_DATA,
  FLOW_CURVE_POINTS,
  COLORS,
  ZONE_LABELS_KO,
  getZoneConfig,
  getZoneColorHex,
  getAllZoneIds
} from './storeData';

export type {
  ZoneConfig,
  FurnitureConfig,
  CameraPreset,
  StoreConfig
} from './storeData';

// 씬 빌더 유틸리티 (PHASE H)
export {
  createDefaultSceneConfig,
  applyParamsToConfig
} from './sceneBuilder';

export type { SceneConfig } from './sceneBuilder';

// 씬 Diff 엔진 (A-4)
export { computeZoneDiff, describeDiff, type ZoneDiff } from './sceneDiff';
