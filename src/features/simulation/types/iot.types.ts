/**
 * IoT 센서 및 트래킹 데이터 타입 정의
 */

// IoT 센서 타입
export type SensorType = 'wifi' | 'bluetooth' | 'camera' | 'beacon' | 'rfid';

// 센서 위치 정보
export interface SensorPosition {
  sensor_id: string;
  sensor_type: SensorType;
  x: number; // 매장 내 실제 X 좌표 (미터)
  y: number; // 높이 (미터)
  z: number; // 매장 내 실제 Z 좌표 (미터)
  coverage_radius?: number; // 센서 감지 반경 (미터)
}

// 실시간 트래킹 데이터
export interface TrackingData {
  customer_id: string;
  timestamp: number;
  sensor_id: string;
  signal_strength?: number; // 신호 강도 (-100 ~ 0 dBm)
  x?: number; // 추정 X 좌표
  z?: number; // 추정 Z 좌표
  accuracy?: number; // 위치 정확도 (미터)
  status?: 'entering' | 'browsing' | 'purchasing' | 'leaving';
}

// 매장 공간 메타데이터
export interface StoreSpaceMetadata {
  store_id: string;
  real_width: number;  // 실제 매장 너비 (미터)
  real_depth: number;  // 실제 매장 깊이 (미터)
  real_height: number; // 실제 매장 높이 (미터)
  model_scale: number; // 3D 모델 스케일 (1 = 1미터)
  origin_offset: {     // 3D 모델 원점 오프셋
    x: number;
    y: number;
    z: number;
  };
  zones?: StoreZone[]; // 매장 구역 정의
}

// 매장 구역 정의
export interface StoreZone {
  id: string;
  zone_id: string;
  name: string;
  zone_name: string;
  zone_type: 'entrance' | 'checkout' | 'display' | 'storage' | 'cafe' | 'fitting_room';
  zone_color?: string;
  center: { x: number; z: number };
  radius: number;
  bounds: {
    min_x: number;
    max_x: number;
    min_z: number;
    max_z: number;
  };
}

// Heat Point for 3D visualization
export interface HeatPoint {
  x: number;           // 3D model coordinates
  z: number;           // 3D model coordinates
  intensity: number;   // 0-1
  zone_id?: string;
  timestamp?: string;
  realCoords?: {
    x: number;
    z: number;
  };
}

// Supabase Realtime Presence 상태
export interface CustomerPresenceState {
  customer_id: string;
  position: { x: number; y: number; z: number };
  velocity?: { x: number; z: number };
  status: 'browsing' | 'purchasing' | 'leaving';
  last_updated: number;
  zone_id?: string;
}
