/**
 * ProductModel.tsx
 *
 * 상품 모델 렌더링
 */

import { useRef, useMemo } from 'react';
import { useGLTF, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { ProductAsset } from '../types';

// ============================================================================
// Props
// ============================================================================
interface ProductModelProps {
  asset: ProductAsset;
  onClick?: () => void;
  selected?: boolean;
  hovered?: boolean;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  showLabel?: boolean;
}

// ============================================================================
// ProductModel 컴포넌트
// ============================================================================
export function ProductModel({
  asset,
  onClick,
  selected = false,
  hovered = false,
  onPointerOver,
  onPointerOut,
  showLabel = false,
}: ProductModelProps) {
  if (!asset.model_url) {
    return (
      <ProductPlaceholder
        asset={asset}
        onClick={onClick}
        selected={selected}
        hovered={hovered}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
        showLabel={showLabel}
      />
    );
  }

  return (
    <ProductGLTF
      asset={asset}
      onClick={onClick}
      selected={selected}
      hovered={hovered}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      showLabel={showLabel}
    />
  );
}

// ============================================================================
// GLTF 로더
// ============================================================================
function ProductGLTF({
  asset,
  onClick,
  selected,
  hovered,
  onPointerOver,
  onPointerOut,
  showLabel,
}: ProductModelProps) {
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

      {/* 라벨 */}
      {(showLabel || hovered) && (
        <Html position={[0, 1, 0]} center>
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {asset.sku}
          </div>
        </Html>
      )}

      {/* 선택 표시 */}
      {selected && <ProductSelectionIndicator />}
    </group>
  );
}

// ============================================================================
// 플레이스홀더
// ============================================================================
function ProductPlaceholder({
  asset,
  onClick,
  selected,
  hovered,
  onPointerOver,
  onPointerOut,
  showLabel,
}: ProductModelProps) {
  const dimensions = asset.dimensions || { width: 0.3, height: 0.3, depth: 0.3 };

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
          color={hovered ? '#fbbf24' : '#f59e0b'}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* 라벨 */}
      {(showLabel || hovered) && (
        <Html position={[0, dimensions.height / 2 + 0.2, 0]} center>
          <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {asset.sku}
          </div>
        </Html>
      )}

      {selected && <ProductSelectionIndicator size={Math.max(dimensions.width, dimensions.height, dimensions.depth) * 1.2} />}
    </group>
  );
}

// ============================================================================
// 선택 표시자
// ============================================================================
function ProductSelectionIndicator({ size = 0.4 }: { size?: number }) {
  return (
    <mesh>
      <sphereGeometry args={[size, 16, 16]} />
      <meshBasicMaterial
        color="#f59e0b"
        transparent
        opacity={0.2}
        side={THREE.BackSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ============================================================================
// ProductPlacement - 여러 상품 렌더링
// ============================================================================
interface ProductPlacementProps {
  products: ProductAsset[];
  onClick?: (id: string) => void;
  selectedId?: string;
  hoveredId?: string;
  onHover?: (id: string | null) => void;
  showLabels?: boolean;
}

export function ProductPlacement({
  products,
  onClick,
  selectedId,
  hoveredId,
  onHover,
  showLabels = false,
}: ProductPlacementProps) {
  return (
    <group>
      {products.map((product) => (
        <ProductModel
          key={product.id}
          asset={product}
          onClick={() => onClick?.(product.id)}
          selected={product.id === selectedId}
          hovered={product.id === hoveredId}
          onPointerOver={() => onHover?.(product.id)}
          onPointerOut={() => onHover?.(null)}
          showLabel={showLabels}
        />
      ))}
    </group>
  );
}

export default ProductModel;
