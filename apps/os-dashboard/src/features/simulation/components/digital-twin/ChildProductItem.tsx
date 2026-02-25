/**
 * ChildProductItem.tsx
 *
 * 가구의 자식으로 렌더링되는 제품 컴포넌트
 * position은 부모 가구 기준 상대 좌표 (slot_position + position_offset)
 */

import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { ProductAsset, ProductDisplayType } from '@/types/scene3d';

// Display type별 색상 정의
const DISPLAY_TYPE_COLORS: Record<ProductDisplayType, string> = {
  hanging: '#8b5cf6',  // 보라 - 걸린 형태
  folded: '#10b981',   // 녹색 - 접힌 형태
  standing: '#3b82f6', // 파랑 - 세운 형태
  boxed: '#f59e0b',    // 주황 - 박스 형태
  stacked: '#ef4444',  // 빨강 - 쌓인 형태
};

interface ChildProductItemProps {
  asset: ProductAsset;
  onClick?: () => void;
  /** 개별 가시성 제어 (기본값: true) */
  visible?: boolean;
}

export function ChildProductItem({ asset, onClick, visible = true }: ChildProductItemProps) {
  // 🔧 FIX: 개별 가시성 제어
  if (!visible) {
    return null;
  }
  const dimensions = asset.dimensions || { width: 0.3, height: 0.4, depth: 0.2 };
  const displayType = asset.display_type || 'standing';
  const color = DISPLAY_TYPE_COLORS[displayType] || DISPLAY_TYPE_COLORS.standing;

  // 상대 좌표 (부모 가구 기준)
  const position: [number, number, number] = [
    asset.position.x,
    asset.position.y,
    asset.position.z,
  ];

  const rotation: [number, number, number] = [
    asset.rotation?.x || 0,
    asset.rotation?.y || 0,
    asset.rotation?.z || 0,
  ];

  // 모델이 없으면 플레이스홀더 렌더링
  if (!asset.model_url) {
    return (
      <ChildProductPlaceholder
        position={position}
        rotation={rotation}
        dimensions={dimensions}
        displayType={displayType}
        color={color}
        onClick={onClick}
      />
    );
  }

  // GLTF 모델 렌더링
  return (
    <ChildProductGLTF
      asset={asset}
      position={position}
      rotation={rotation}
      onClick={onClick}
    />
  );
}

// GLTF 모델 컴포넌트
function ChildProductGLTF({
  asset,
  position,
  rotation,
  onClick,
}: {
  asset: ProductAsset;
  position: [number, number, number];
  rotation: [number, number, number];
  onClick?: () => void;
}) {
  try {
    const { scene } = useGLTF(asset.model_url);

    const clonedScene = useMemo(() => {
      return scene.clone(true);
    }, [scene]);

    return (
      <primitive
        object={clonedScene}
        position={position}
        rotation={rotation}
        scale={[asset.scale?.x || 1, asset.scale?.y || 1, asset.scale?.z || 1]}
        onClick={(e: any) => {
          e.stopPropagation();
          onClick?.();
        }}
      />
    );
  } catch (error) {
    console.warn('Failed to load child product model:', asset.sku, error);
    const dimensions = asset.dimensions || { width: 0.3, height: 0.4, depth: 0.2 };
    const displayType = asset.display_type || 'standing';
    const color = DISPLAY_TYPE_COLORS[displayType] || DISPLAY_TYPE_COLORS.standing;

    return (
      <ChildProductPlaceholder
        position={position}
        rotation={rotation}
        dimensions={dimensions}
        displayType={displayType}
        color={color}
        onClick={onClick}
      />
    );
  }
}

// 플레이스홀더 컴포넌트
function ChildProductPlaceholder({
  position,
  rotation,
  dimensions,
  displayType,
  color,
  onClick,
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  dimensions: { width: number; height: number; depth: number };
  displayType: ProductDisplayType;
  color: string;
  onClick?: () => void;
}) {
  switch (displayType) {
    case 'hanging':
      return (
        <group position={position} rotation={rotation}>
          {/* 옷걸이 고리 */}
          <mesh position={[0, dimensions.height, 0]} castShadow>
            <torusGeometry args={[0.03, 0.01, 8, 16]} />
            <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.2} />
          </mesh>
          {/* 옷 본체 */}
          <mesh
            position={[0, dimensions.height * 0.4, 0]}
            castShadow
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <boxGeometry args={[dimensions.width, dimensions.height * 0.75, dimensions.depth * 0.3]} />
            <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
          </mesh>
        </group>
      );

    case 'folded':
      const foldedHeight = 0.08;
      return (
        <group position={position} rotation={rotation}>
          <mesh
            position={[0, foldedHeight / 2, 0]}
            castShadow
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <boxGeometry args={[dimensions.width, foldedHeight, dimensions.depth]} />
            <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
          </mesh>
        </group>
      );

    case 'boxed':
      return (
        <group position={position} rotation={rotation}>
          <mesh
            position={[0, dimensions.height / 2, 0]}
            castShadow
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
            <meshStandardMaterial color={color} metalness={0.1} roughness={0.9} />
          </mesh>
          {/* 박스 테이프 */}
          <mesh position={[0, dimensions.height + 0.001, 0]}>
            <boxGeometry args={[dimensions.width * 0.3, 0.005, dimensions.depth * 1.01]} />
            <meshStandardMaterial color="#8b4513" />
          </mesh>
        </group>
      );

    case 'stacked':
      const stackCount = 3;
      const itemHeight = dimensions.height / stackCount;
      return (
        <group position={position} rotation={rotation}>
          {Array.from({ length: stackCount }).map((_, i) => (
            <mesh
              key={i}
              position={[0, itemHeight / 2 + i * itemHeight, 0]}
              castShadow
              onClick={(e) => {
                e.stopPropagation();
                onClick?.();
              }}
            >
              <boxGeometry args={[
                dimensions.width * (1 - i * 0.05),
                itemHeight * 0.9,
                dimensions.depth * (1 - i * 0.05)
              ]} />
              <meshStandardMaterial color={color} metalness={0.2} roughness={0.8 - i * 0.1} />
            </mesh>
          ))}
        </group>
      );

    case 'standing':
    default:
      return (
        <group position={position} rotation={rotation}>
          <mesh
            position={[0, dimensions.height / 2, 0]}
            castShadow
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
            <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
          </mesh>
        </group>
      );
  }
}

export default ChildProductItem;
