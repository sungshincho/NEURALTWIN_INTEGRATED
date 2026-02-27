/**
 * modelFilenameParser.ts - Re-export from shared-3d (순환 의존성 방지)
 * 실제 구현은 @/features/shared-3d/utils/modelFilenameParser.ts
 */
export {
  parseModelFilename,
  isMovableEntityType,
  isFixedEntityType,
  suggestDefaultPosition,
  extractStoreInfo,
  logParseResult,
} from '@/features/shared-3d/utils/modelFilenameParser';

export type { ParsedModelFilename } from '@/features/shared-3d/utils/modelFilenameParser';
