/**
 * sceneRecipeGenerator.ts - Re-export from shared-3d (순환 의존성 방지)
 * 실제 구현은 @/features/shared-3d/utils/sceneRecipeGenerator.ts
 */
export {
  generateSceneRecipe,
  generateSceneRecipeForStore,
  generateOptimizedSceneRecipe,
  applyOptimizedPlacements,
  previewProductAtSlot,
} from '@/features/shared-3d/utils/sceneRecipeGenerator';
