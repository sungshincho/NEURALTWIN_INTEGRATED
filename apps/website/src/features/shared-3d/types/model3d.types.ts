/**
 * model3d.types.ts
 *
 * Studio/Simulation 공유 3D 모델 타입
 * 순환 의존성 방지를 위해 shared-3d에 배치
 */

// 3D 좌표 튜플
export type Vector3Tuple = [number, number, number];

// 모델 타입
export type ModelType = 'space' | 'furniture' | 'product' | 'custom' | 'other';

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
