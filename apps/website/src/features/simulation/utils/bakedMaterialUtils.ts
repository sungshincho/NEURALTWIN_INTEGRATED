/**
 * bakedMaterialUtils.ts - Re-export from shared-3d (순환 의존성 방지)
 * 실제 구현은 @/features/shared-3d/utils/bakedMaterialUtils.ts
 */
export {
  isBakedModel,
  convertToBasicMaterial,
  convertSceneToBasicMaterials,
  adjustSceneForBaked,
  prepareClonedSceneForBaked,
  BAKED_MODEL_PATTERNS,
  default,
} from '@/features/shared-3d/utils/bakedMaterialUtils';
