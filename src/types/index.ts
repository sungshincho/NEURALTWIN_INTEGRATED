/**
 * 프로젝트 전체에서 사용되는 공통 타입 정의
 * 모든 타입을 중앙에서 관리하여 중복을 방지합니다
 */

// Scene 3D 타입
export * from './scene3d';

// Analysis 타입
export * from './analysis.types';

// AI 타입
export * from './ai.types';

// Digital Twin types (re-export from simulation)
export type {
  CustomerAvatar,
  CustomerAvatarOverlayProps,
  CustomerStatus,
  AvatarColors
} from '@/features/simulation/types/avatar.types';

export type {
  SensorType,
  SensorPosition,
  TrackingData,
  StoreSpaceMetadata,
  StoreZone,
  HeatPoint,
  CustomerPresenceState
} from '@/features/simulation/types/iot.types';

export type {
  PathPoint,
  ProductInfo
} from '@/features/simulation/types/overlay.types';
