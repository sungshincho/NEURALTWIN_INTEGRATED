/**
 * scene.types.ts
 *
 * 3D 씬 관련 타입 정의
 */

import { ReactNode } from 'react';

// 스튜디오 모드
export type StudioMode = 'edit' | 'view' | 'simulate';

// 3D 좌표
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

// 3D 좌표 튜플
export type Vector3Tuple = [number, number, number];

// 씬 카메라 설정
export interface CameraSettings {
  position: Vector3;
  target: Vector3;
  fov: number;
}

// 씬 레이어
export interface SceneLayer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  children: string[]; // model ids
  type: 'folder' | 'layer';
}

// 씬 상태
export interface SceneState {
  mode: StudioMode;
  models: Model3D[];
  layers: SceneLayer[];
  selectedId: string | null;
  hoveredId: string | null;
  activeOverlays: string[];
  camera: CameraSettings;
  isDirty: boolean;
}

// 3D 모델
export interface Model3D {
  id: string;
  name: string;
  url: string;
  position: Vector3Tuple;
  rotation: Vector3Tuple;
  scale: Vector3Tuple;
  visible: boolean;
  type: ModelType;
  metadata?: Record<string, any>;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
}

// 모델 타입
export type ModelType = 'space' | 'furniture' | 'product' | 'custom' | 'other';

// 씬 레시피 (저장/불러오기용)
export interface SceneRecipe {
  space: SpaceAsset;
  furniture: FurnitureAsset[];
  products: ProductAsset[];
  lighting: LightingPreset;
  effects?: SceneEffect[];
  camera: CameraSettings;
}

// 공간 에셋
export interface SpaceAsset {
  id: string;
  model_url: string;
  type: 'space';
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  metadata?: Record<string, any>;
}

// 가구 에셋
export interface FurnitureAsset {
  id: string;
  model_url: string;
  type: 'furniture';
  furniture_type: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  movable: boolean;
  metadata?: Record<string, any>;
}

// 상품 에셋
export interface ProductAsset {
  id: string;
  model_url: string;
  type: 'product';
  product_id?: string;
  sku: string;
  position: Vector3;
  rotation: Vector3;
  scale: Vector3;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  movable: boolean;
  metadata?: Record<string, any>;
}

// 조명 프리셋
export interface LightingPreset {
  name: string;
  description: string;
  lights: LightConfig[];
}

// 조명 설정
export interface LightConfig {
  type: 'ambient' | 'directional' | 'point' | 'spot';
  color: string;
  intensity: number;
  position?: Vector3;
  target?: Vector3;
  castShadow?: boolean;
}

// 씬 효과
export interface SceneEffect {
  type: 'heatmap' | 'flow' | 'path' | 'zone';
  enabled: boolean;
  data?: any;
}

// Canvas3D Props
export interface Canvas3DProps {
  mode?: StudioMode;
  transformMode?: TransformMode;
  enableControls?: boolean;
  enableSelection?: boolean;
  enableTransform?: boolean;
  showGrid?: boolean;
  className?: string;
  children?: ReactNode;
  onAssetClick?: (assetId: string, assetType: string) => void;
}

// TransformMode (model.types.ts에서 재export됨)
export type TransformMode = 'translate' | 'rotate' | 'scale';

// 환경 프리셋
export type EnvironmentPreset =
  | 'apartment'
  | 'city'
  | 'dawn'
  | 'forest'
  | 'lobby'
  | 'night'
  | 'park'
  | 'studio'
  | 'sunset'
  | 'warehouse';

// ============================================================================
// B안: 씬 메타데이터 및 직원 위치 타입
// ============================================================================

// 씬 타입
export type SceneType = 'manual' | 'ai_optimized' | 'staffing_optimized' | '3d_layout';

// 직원 위치 정보 (씬 저장용)
export interface StaffPosition {
  staff_id: string;
  staff_name: string;
  role: 'sales' | 'manager' | 'cashier' | 'support' | 'fitting_room' | 'stock' | string;
  position: Vector3;
  rotation?: Vector3;
  assigned_zone_id?: string;
  avatar_url?: string;
}

// 씬 메타데이터
export interface SceneMetadata {
  /** 최적화 유형 */
  optimization_type?: 'layout' | 'staff' | 'both';
  /** 예상 효과 */
  expected_impact?: {
    revenue_change?: number;
    efficiency_change?: number;
    coverage_change?: number;
  };
  /** 원본 씬 ID (최적화 결과로 생성된 경우) */
  created_from?: string;
  /** 적용된 최적화 결과 ID */
  optimization_result_id?: string;
  /** 적용 일시 */
  applied_at?: string;
  /** 적용 방식 */
  applied_changes?: 'furniture' | 'product' | 'staff' | 'all';
}

// 씬 저장 데이터 (B안 확장)
export interface SavedScene {
  id: string;
  name: string;
  recipe_data: SceneRecipe;
  thumbnail?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;

  /** B안: 직원 위치 (별도 컬럼으로 저장) */
  staff_positions?: StaffPosition[];
  /** B안: 씬 타입 */
  scene_type?: SceneType;
  /** B안: 메타데이터 */
  metadata?: SceneMetadata;
}
