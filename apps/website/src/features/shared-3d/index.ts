/**
 * shared-3d/index.ts
 *
 * Studio와 Simulation 간 공유되는 3D 유틸리티/컴포넌트 배럴 export
 * 순환 의존성 방지를 위해 양쪽에서 직접 참조하지 않고 이 모듈을 경유
 */

// Types
export type { Model3D, ModelType, Vector3Tuple } from './types/model3d.types';

// Utils
export {
  isBakedModel,
  prepareClonedSceneForBaked,
  convertToBasicMaterial,
  convertSceneToBasicMaterials,
  adjustSceneForBaked,
  BAKED_MODEL_PATTERNS,
} from './utils/bakedMaterialUtils';

export {
  generateSceneRecipe,
  generateSceneRecipeForStore,
  generateOptimizedSceneRecipe,
  applyOptimizedPlacements,
  previewProductAtSlot,
} from './utils/sceneRecipeGenerator';

export { loadUserModels } from './utils/modelLayerLoader';

export {
  realToModel,
  modelToReal,
  trilaterate,
  KalmanFilter,
  getZoneId,
  getZoneBoundsInModel,
} from './utils/coordinateMapper';

export {
  upload3DModel,
  delete3DModel,
  parseModelFileName,
} from './utils/modelStorageManager';

export {
  parseModelFilename,
  isMovableEntityType,
  isFixedEntityType,
  suggestDefaultPosition,
  extractStoreInfo,
  logParseResult,
} from './utils/modelFilenameParser';

export type { ParsedModelFilename } from './utils/modelFilenameParser';

// Components
export { ChildProductItem } from './components/ChildProductItem';

// Overlays
export { SlotVisualizerOverlay, SlotCompatibilityPreview } from './overlays/SlotVisualizerOverlay';
