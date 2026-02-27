/**
 * modelStorageManager.ts - Re-export from shared-3d (순환 의존성 방지)
 * 실제 구현은 @/features/shared-3d/utils/modelStorageManager.ts
 */
export {
  upload3DModel,
  delete3DModel,
  parseModelFileName,
} from '@/features/shared-3d/utils/modelStorageManager';
