/**
 * model.types.ts
 *
 * 3D 모델 관련 타입 정의
 */

import { Vector3, Vector3Tuple, ModelType } from './scene.types';

// 모델 레이어 (레이어 매니저용)
export interface ModelLayer {
  id: string;
  name: string;
  type: ModelType;
  model_url: string;
  position?: Vector3;
  rotation?: Vector3;
  scale?: Vector3;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  metadata?: Record<string, any>;
  visible?: boolean;
  locked?: boolean;
}

// 레이어 노드 (트리 구조용)
export interface LayerNode {
  id: string;
  name: string;
  type: 'folder' | 'model' | 'instance';
  visible: boolean;
  locked: boolean;
  children?: LayerNode[];
  modelId?: string;
}

// 모델 업로드 결과
export interface ModelUploadResult {
  success: boolean;
  url?: string;
  error?: string;
  filename?: string;
  size?: number;
}

// 모델 메타데이터
export interface ModelMetadata {
  entityId?: string;
  entityType?: string;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  source?: 'storage' | 'instance' | 'upload';
  createdAt?: string;
  updatedAt?: string;
}

// 자동 매핑 결과
export interface AutoMapResult {
  entityType: string;
  confidence: number;
  suggestedPosition?: Vector3;
  suggestedScale?: Vector3;
  suggestedDimensions?: {
    width: number;
    height: number;
    depth: number;
  };
}

// 모델 로딩 상태
export interface ModelLoadingState {
  isLoading: boolean;
  progress: number;
  error?: string;
}

// 변환 모드
export type TransformMode = 'translate' | 'rotate' | 'scale';

// 변환 공간
export type TransformSpace = 'world' | 'local';

// 변환 컨트롤 설정
export interface TransformControlsConfig {
  mode: TransformMode;
  space: TransformSpace;
  size: number;
  showX: boolean;
  showY: boolean;
  showZ: boolean;
}

// 선택 상태
export interface SelectionState {
  selectedId: string | null;
  selectedType: ModelType | null;
  isMultiSelect: boolean;
  selectedIds: string[];
}

// 모델 변환 이벤트
export interface ModelTransformEvent {
  modelId: string;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
}

// 엔티티 타입 정의 (온톨로지)
export interface EntityTypeDefinition {
  id: string;
  name: string;
  label: string;
  category?: string;
  defaultDimensions?: {
    width: number;
    height: number;
    depth: number;
  };
}
