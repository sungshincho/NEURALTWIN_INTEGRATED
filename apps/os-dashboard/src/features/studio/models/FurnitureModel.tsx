/**
 * FurnitureModel.tsx
 *
 * 가구 모델 렌더링
 */

import { useRef, useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { FurnitureAsset } from '../types';

// ============================================================================
// Props
// ============================================================================
interface FurnitureModelProps {
  asset: FurnitureAsset;
  onClick?: () => void;
  selected?: boolean;
  hovered?: boolean;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

// ============================================================================
// FurnitureModel 컴포넌트
// ============================================================================
export function FurnitureModel({
  asset,
  onClick,
  selected = false,
  hovered = false,
  onPointerOver,
  onPointerOut,
}: FurnitureModelProps) {
  if (!asset.model_url) {
    return (
      <FurniturePlaceholder
        asset={asset}
        onClick={onClick}
        selected={selected}
        hovered={hovered}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      />
    );
  }

  return (
    <FurnitureGLTF
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
function FurnitureGLTF({
  asset,
  onClick,
  selected,
  hovered,
  onPointerOver,
  onPointerOut,
}: FurnitureModelProps) {
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

  // degrees → radians 변환
  const rotation: [number, number, number] = [
    asset.rotation.x * Math.PI / 180,
    asset.rotation.y * Math.PI / 180,
    asset.rotation.z * Math.PI / 180,
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

      {/* 선택 표시 */}
      {selected && <SelectionIndicator />}

      {/* 호버 표시 */}
      {hovered && !selected && <HoverIndicator />}
    </group>
  );
}

// ============================================================================
// 플레이스홀더
// ============================================================================
function FurniturePlaceholder({
  asset,
  onClick,
  selected,
  hovered,
  onPointerOver,
  onPointerOut,
}: FurnitureModelProps) {
  const dimensions = asset.dimensions || { width: 1, height: 1, depth: 1 };

  // degrees → radians 변환
  const rotation: [number, number, number] = [
    asset.rotation.x * Math.PI / 180,
    asset.rotation.y * Math.PI / 180,
    asset.rotation.z * Math.PI / 180,
  ];

  return (
    <group
      position={[asset.position.x, asset.position.y + dimensions.height / 2, asset.position.z]}
      rotation={rotation}
      scale={[asset.scale.x, asset.scale.y, asset.scale.z]}
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
      <mesh castShadow receiveShadow>
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
        <meshStandardMaterial
          color={hovered ? '#93c5fd' : '#60a5fa'}
          transparent
          opacity={0.8}
        />
      </mesh>

      {selected && <SelectionIndicator size={Math.max(dimensions.width, dimensions.height, dimensions.depth) * 1.1} />}
    </group>
  );
}

// ============================================================================
// 표시자
// ============================================================================
function SelectionIndicator({ size = 1.1 }: { size?: number }) {
  return (
    <mesh>
      <boxGeometry args={[size, size, size]} />
      <meshBasicMaterial
        color="#3b82f6"
        transparent
        opacity={0.2}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

function HoverIndicator({ size = 1.05 }: { size?: number }) {
  return (
    <mesh>
      <boxGeometry args={[size, size, size]} />
      <meshBasicMaterial
        color="#60a5fa"
        transparent
        opacity={0.1}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ============================================================================
// FurnitureLayout - 여러 가구 렌더링
// ============================================================================
interface FurnitureLayoutProps {
  furniture: FurnitureAsset[];
  onClick?: (id: string) => void;
  selectedId?: string;
  hoveredId?: string;
  onHover?: (id: string | null) => void;
}

export function FurnitureLayout({
  furniture,
  onClick,
  selectedId,
  hoveredId,
  onHover,
}: FurnitureLayoutProps) {
  return (
    <group>
      {furniture.map((item) => (
        <FurnitureModel
          key={item.id}
          asset={item}
          onClick={() => onClick?.(item.id)}
          selected={item.id === selectedId}
          hovered={item.id === hoveredId}
          onPointerOver={() => onHover?.(item.id)}
          onPointerOut={() => onHover?.(null)}
        />
      ))}
    </group>
  );
}

export default FurnitureModel;
