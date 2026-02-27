/**
 * StoreModel.tsx
 *
 * 매장 공간 모델 렌더링
 */

import { useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { SpaceAsset, Vector3 } from '../types';

// ============================================================================
// Props
// ============================================================================
interface StoreModelProps {
  asset: SpaceAsset;
  onClick?: () => void;
  selected?: boolean;
  hovered?: boolean;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

// ============================================================================
// StoreModel 컴포넌트
// ============================================================================
export function StoreModel({
  asset,
  onClick,
  selected = false,
  hovered = false,
  onPointerOver,
  onPointerOut,
}: StoreModelProps) {
  const groupRef = useRef<THREE.Group>(null);

  // URL이 없으면 렌더링하지 않음
  if (!asset.model_url) {
    return <StorePlaceholder asset={asset} />;
  }

  return (
    <StoreGLTF
      asset={asset}
      onClick={onClick}
      selected={selected}
      hovered={hovered}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
    />
  );
}

// ============================================================================
// GLTF 로더
// ============================================================================
interface StoreGLTFProps extends StoreModelProps {}

function StoreGLTF({
  asset,
  onClick,
  selected,
  hovered,
  onPointerOver,
  onPointerOut,
}: StoreGLTFProps) {
  const { scene } = useGLTF(asset.model_url);

  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    return cloned;
  }, [scene]);

  const position: [number, number, number] = [
    asset.position.x,
    asset.position.y,
    asset.position.z,
  ];

  const rotation: [number, number, number] = [
    asset.rotation.x,
    asset.rotation.y,
    asset.rotation.z,
  ];

  const scale: [number, number, number] = [
    asset.scale.x,
    asset.scale.y,
    asset.scale.z,
  ];

  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver?.();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onPointerOut?.();
      }}
    >
      <primitive object={clonedScene} />
    </group>
  );
}

// ============================================================================
// 플레이스홀더 (모델 없을 때)
// ============================================================================
interface StorePlaceholderProps {
  asset: SpaceAsset;
}

function StorePlaceholder({ asset }: StorePlaceholderProps) {
  const dimensions = asset.dimensions || { width: 20, height: 0.1, depth: 20 };

  return (
    <group position={[asset.position.x, asset.position.y, asset.position.z]}>
      {/* 바닥 */}
      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[dimensions.width, dimensions.depth]} />
        <meshStandardMaterial color="#e5e7eb" side={THREE.DoubleSide} />
      </mesh>

      {/* 그리드 */}
      <gridHelper
        args={[dimensions.width, Math.floor(dimensions.width / 2), '#d1d5db', '#e5e7eb']}
        position={[0, 0.01, 0]}
      />
    </group>
  );
}

export default StoreModel;
