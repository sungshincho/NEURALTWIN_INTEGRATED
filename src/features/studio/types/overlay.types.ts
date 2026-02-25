/**
 * overlay.types.ts
 *
 * 3D 오버레이 관련 타입 정의
 */

import { Vector3Tuple } from './scene.types';

// 오버레이 타입
export type OverlayType =
  | 'heatmap'
  | 'flow'
  | 'path'
  | 'avatar'
  | 'zone'
  | 'dwell'
  | 'product'
  | 'realtime'
  | 'wifi'
  | 'layout'
  | 'staff'
  | 'layoutOptimization'
  | 'flowOptimization'
  | 'congestion'
  | 'staffing';

// 오버레이 설정
export interface OverlayConfig {
  id: OverlayType;
  name: string;
  enabled: boolean;
  opacity?: number;
  color?: string;
}

// 히트맵 포인트
export interface HeatPoint {
  x: number;
  y: number;
  z: number;
  intensity: number;
  label?: string;
}

// 히트맵 오버레이 Props
export interface HeatmapOverlayProps {
  heatPoints: HeatPoint[];
  maxIntensity?: number;
  colorScale?: 'thermal' | 'viridis' | 'plasma' | 'cool';  // 🆕 plasma 추가
  opacity?: number;
  heightScale?: number;
  onPointClick?: (point: HeatPoint) => void;
  /** 🆕 매장 경계 - 히트맵 범위 제한용 */
  storeBounds?: {
    width: number;
    depth: number;
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    centerX: number;
    centerZ: number;
  };
}

// 경로 포인트
export interface PathPoint {
  x: number;
  y: number;
  z: number;
  timestamp?: number;
  label?: string;
}

// 고객 경로 오버레이 Props
export interface CustomerPathOverlayProps {
  paths: PathPoint[][];
  selectedPathIndex?: number;
  color?: string;
  lineWidth?: number;
  animated?: boolean;
  animationSpeed?: number;
  onPathSelect?: (index: number) => void;
}

// 고객 상태
export type CustomerStatus = 'browsing' | 'purchasing' | 'leaving' | 'idle';

// 고객 아바타
export interface CustomerAvatar {
  id: string;
  position: Vector3Tuple;
  velocity?: Vector3Tuple;
  status: CustomerStatus;
  segmentId?: string;
  dwellTime?: number;
  /** 3D 아바타 모델 URL (GLB) */
  avatar_url?: string;
  /** 아바타 타입 (vip, regular, new 등) */
  avatar_type?: string;
}

// 고객 아바타 오버레이 Props
export interface CustomerAvatarOverlayProps {
  customers: CustomerAvatar[];
  showTrails?: boolean;
  trailLength?: number;
  scale?: number;
  colors?: {
    browsing?: string;
    purchasing?: string;
    leaving?: string;
    idle?: string;
  };
}

// 존 경계
export interface ZoneBoundary {
  id: string;
  name: string;
  points: Vector3Tuple[];
  color?: string;
  height?: number;
}

// 존 경계 오버레이 Props
export interface ZoneBoundaryOverlayProps {
  zones: ZoneBoundary[];
  selectedZoneId?: string;
  showLabels?: boolean;
  onZoneSelect?: (zoneId: string) => void;
}

// 존 전환
export interface ZoneTransition {
  fromZone: string;
  toZone: string;
  count: number;
  avgTime?: number;
}

// 존 전환 오버레이 Props
export interface ZoneTransitionOverlayProps {
  transitions: ZoneTransition[];
  zones: ZoneBoundary[];
  lineWidth?: number;
  showCounts?: boolean;
}

// 체류 시간 포인트
export interface DwellPoint {
  x: number;
  y: number;
  z: number;
  duration: number; // seconds
  label?: string;
}

// 체류 시간 오버레이 Props
export interface DwellTimeOverlayProps {
  dwellPoints: DwellPoint[];
  maxDuration?: number;
  colorScale?: string[];
}

// 상품 정보
export interface ProductInfo {
  id: string;
  name: string;
  position: Vector3Tuple;
  sku?: string;
  price?: number;
  stock?: number;
  demand?: number;
}

// 상품 정보 오버레이 Props
export interface ProductInfoOverlayProps {
  products: ProductInfo[];
  showPrices?: boolean;
  showStock?: boolean;
  showDemand?: boolean;
  onProductClick?: (productId: string) => void;
}

// 동선 흐름
export interface FlowVector {
  start: Vector3Tuple;
  end: Vector3Tuple;
  magnitude: number;
  count?: number;
}

// 동선 오버레이 Props
export interface CustomerFlowOverlayProps {
  flows: FlowVector[];
  arrowScale?: number;
  color?: string;
  animated?: boolean;
}

// 실시간 추적 데이터
export interface RealtimeTrackingData {
  customerId: string;
  position: Vector3Tuple;
  timestamp: number;
  accuracy?: number;
  sensorType?: 'wifi' | 'bluetooth' | 'camera' | 'beacon';
}

// 실시간 오버레이 Props
export interface RealtimeOverlayProps {
  enabled: boolean;
  storeId: string;
  showAccuracy?: boolean;
  updateInterval?: number;
}

// WiFi 센서 위치
export interface SensorPosition {
  id: string;
  type: 'wifi' | 'bluetooth' | 'camera' | 'beacon' | 'rfid';
  position: Vector3Tuple;
  range?: number;
  active?: boolean;
}

// WiFi 추적 오버레이 Props
export interface WiFiTrackingOverlayProps {
  sensors: SensorPosition[];
  trackingData: RealtimeTrackingData[];
  showCoverage?: boolean;
  showSignalStrength?: boolean;
}

// 레이아웃 변경
export interface LayoutChange {
  entityId: string;
  entityType: string;
  before: {
    position: Vector3Tuple;
    rotation?: Vector3Tuple;
  };
  after: {
    position: Vector3Tuple;
    rotation?: Vector3Tuple;
  };
  changeType: 'move' | 'add' | 'remove' | 'rotate';
}

// 레이아웃 변경 오버레이 Props
export interface LayoutChangeOverlayProps {
  changes: LayoutChange[];
  showBefore?: boolean;
  showAfter?: boolean;
  highlightColor?: string;
}
