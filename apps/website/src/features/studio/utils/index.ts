/**
 * utils/index.ts
 *
 * 유틸리티 함수 익스포트
 * 기존 simulation/utils에서 필요한 것들 re-export
 */

// 기존 유틸리티 re-export (shared-3d 경유 — 순환 의존성 방지)
export { loadUserModels } from '@/features/shared-3d/utils/modelLayerLoader';
export {
  realToModel,
  modelToReal,
  trilaterate,
  KalmanFilter,
  getZoneId,
} from '@/features/shared-3d/utils/coordinateMapper';
export {
  upload3DModel,
  delete3DModel,
} from '@/features/shared-3d/utils/modelStorageManager';
export {
  parseModelFilename,
  isMovableEntityType,
  suggestDefaultPosition,
} from '@/features/shared-3d/utils/modelFilenameParser';
export { generateSceneRecipe } from '@/features/shared-3d/utils/sceneRecipeGenerator';

// To-be 씬 생성 유틸리티
export {
  generateLayoutOptimizedScene,
  generateFlowOptimizedScene,
  generateStaffingOptimizedScene,
  generateCombinedOptimizedScene,
  calculateSceneDiff,
  mergeToBeIntoAsIs,
} from './ToBeSceneGenerator';

export type {
  SceneChange,
  SceneComparison,
} from './ToBeSceneGenerator';

// 최적화 결과 유효성 검증
export { validateOptimizationResult } from './optimizationValidator';
