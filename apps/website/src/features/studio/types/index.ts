/**
 * types/index.ts
 *
 * 스튜디오 타입 모듈 익스포트
 */

// scene.types에서 TransformMode를 먼저 export
export {
  type StudioMode,
  type Vector3,
  type Vector3Tuple,
  type CameraSettings,
  type SceneLayer,
  type SceneState,
  type Model3D,
  type ModelType,
  type SceneRecipe,
  type SpaceAsset,
  type FurnitureAsset,
  type ProductAsset,
  type LightingPreset,
  type LightConfig,
  type SceneEffect,
  type Canvas3DProps,
  type TransformMode,
  type EnvironmentPreset,
  type SavedScene,
  // B안: 새 타입 추가
  type SceneType,
  type StaffPosition,
  type SceneMetadata,
} from './scene.types';

// model.types에서 TransformMode 제외하고 export
export {
  type ModelLayer,
  type LayerNode,
  type ModelUploadResult,
  type ModelMetadata,
  type AutoMapResult,
  type ModelLoadingState,
  type TransformSpace,
  type TransformControlsConfig,
  type SelectionState,
  type ModelTransformEvent,
  type EntityTypeDefinition,
} from './model.types';

export * from './overlay.types';
export * from './simulation.types';
export * from './simulationResults.types';
export * from './optimization.types';
export * from './environment.types';
export * from './simulationEnvironment.types';

// 🆕 슬롯 기반 최적화 타입 재export
export type {
  DisplayType,
  SlotType,
  ProductPlacement,
  SlotCompatibilityInfo,
} from './simulation.types';
