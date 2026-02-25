/**
 * 3D 오버레이 공통 타입 정의
 * Digital Twin 3D 시각화를 위한 데이터 구조
 */

export interface PathPoint {
  x: number;
  y: number;
  z: number;
  timestamp?: number;
}

// Re-export HeatPoint from iot.types to avoid duplication
export type { HeatPoint } from './iot.types';

export interface ProductInfo {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  stock: number;
  demand: number;
  status: 'normal' | 'low' | 'critical';
  price?: number;
}

// Re-export avatar types
export type { 
  CustomerAvatar, 
  CustomerAvatarOverlayProps, 
  CustomerStatus, 
  AvatarColors 
} from './avatar.types';

// Re-export IoT types
export type {
  SensorType,
  SensorPosition,
  TrackingData,
  StoreSpaceMetadata,
  StoreZone,
  CustomerPresenceState
} from './iot.types';
