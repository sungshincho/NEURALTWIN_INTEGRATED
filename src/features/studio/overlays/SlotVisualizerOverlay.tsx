/**
 * SlotVisualizerOverlay.tsx
 *
 * 가구 슬롯 시각화 3D 오버레이
 * - 가구별 슬롯 위치 시각화
 * - display_type 호환성 표시 (호환/비호환)
 * - 슬롯 점유 상태 표시
 * - 슬롯 선택 및 상호작용
 */

import { useMemo, useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { FurnitureSlot, ProductDisplayType, Vector3D } from '@/types/scene3d';
import type { Model3D } from '../types';

// ============================================================================
// 타입 정의
// ============================================================================

interface SlotVisualizerOverlayProps {
  /** 가구 슬롯 목록 */
  slots: FurnitureSlot[];
  /** 가구 모델 목록 (위치 참조용) */
  furnitureModels: Model3D[];
  /** 선택된 상품의 display_type (호환성 표시용) */
  selectedProductDisplayType?: ProductDisplayType;
  /** 슬롯 클릭 핸들러 */
  onSlotClick?: (slot: FurnitureSlot) => void;
  /** 슬롯 호버 핸들러 */
  onSlotHover?: (slot: FurnitureSlot | null) => void;
  /** 호환 가능한 슬롯만 표시 */
  showOnlyCompatible?: boolean;
  /** 빈 슬롯만 표시 */
  showOnlyEmpty?: boolean;
  /** 슬롯 크기 스케일 */
  slotScale?: number;
  /** 라벨 표시 여부 */
  showLabels?: boolean;
}

// 슬롯 상태별 색상
const SLOT_COLORS = {
  empty: '#22c55e',        // 녹색 - 빈 슬롯
  occupied: '#ef4444',     // 빨강 - 점유된 슬롯
  compatible: '#3b82f6',   // 파랑 - 호환 가능
  incompatible: '#6b7280', // 회색 - 호환 불가
  selected: '#f59e0b',     // 주황 - 선택됨
  hovered: '#8b5cf6',      // 보라 - 호버
};

// 슬롯 타입별 기본 크기
const SLOT_TYPE_SIZES: Record<string, { width: number; height: number; depth: number }> = {
  hanger: { width: 0.08, height: 0.02, depth: 0.04 },
  shelf: { width: 0.3, height: 0.02, depth: 0.25 },
  table: { width: 0.3, height: 0.02, depth: 0.25 },
  rack: { width: 0.3, height: 0.02, depth: 0.3 },
  hook: { width: 0.05, height: 0.05, depth: 0.05 },
  drawer: { width: 0.25, height: 0.05, depth: 0.3 },
};

// ============================================================================
// 유틸리티 함수
// ============================================================================

/**
 * 슬롯의 월드 좌표 계산
 */
function calculateSlotWorldPosition(
  furniturePosition: [number, number, number],
  furnitureRotation: [number, number, number],
  slotRelativePosition: Vector3D
): [number, number, number] {
  const radY = furnitureRotation[1]; // 이미 라디안 단위라고 가정

  // Y축 회전 적용
  const rotatedX =
    slotRelativePosition.x * Math.cos(radY) - slotRelativePosition.z * Math.sin(radY);
  const rotatedZ =
    slotRelativePosition.x * Math.sin(radY) + slotRelativePosition.z * Math.cos(radY);

  return [
    furniturePosition[0] + rotatedX,
    furniturePosition[1] + slotRelativePosition.y,
    furniturePosition[2] + rotatedZ,
  ];
}

/**
 * display_type 호환성 체크
 */
function isCompatible(
  productDisplayType: ProductDisplayType | undefined,
  slotCompatibleTypes: ProductDisplayType[] | undefined
): boolean {
  if (!productDisplayType || !slotCompatibleTypes || slotCompatibleTypes.length === 0) {
    return true;
  }
  return slotCompatibleTypes.includes(productDisplayType);
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function SlotVisualizerOverlay({
  slots,
  furnitureModels,
  selectedProductDisplayType,
  onSlotClick,
  onSlotHover,
  showOnlyCompatible = false,
  showOnlyEmpty = false,
  slotScale = 1,
  showLabels = false,
}: SlotVisualizerOverlayProps) {
  const [hoveredSlotId, setHoveredSlotId] = useState<string | null>(null);
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);

  // 가구 ID → 모델 맵 생성
  const furnitureMap = useMemo(() => {
    const map = new Map<string, Model3D>();
    for (const model of furnitureModels) {
      map.set(model.id, model);
    }
    return map;
  }, [furnitureModels]);

  // 필터링된 슬롯 목록
  const filteredSlots = useMemo(() => {
    return slots.filter((slot) => {
      // 해당 가구가 있는지 확인
      if (!furnitureMap.has(slot.furniture_id)) return false;

      // 빈 슬롯만 표시 옵션
      if (showOnlyEmpty && slot.is_occupied) return false;

      // 호환 가능한 슬롯만 표시 옵션
      if (showOnlyCompatible && selectedProductDisplayType) {
        if (!isCompatible(selectedProductDisplayType, slot.compatible_display_types)) {
          return false;
        }
      }

      return true;
    });
  }, [slots, furnitureMap, showOnlyEmpty, showOnlyCompatible, selectedProductDisplayType]);

  const handleSlotClick = (slot: FurnitureSlot) => {
    setSelectedSlotId(slot.id);
    onSlotClick?.(slot);
  };

  const handleSlotHover = (slot: FurnitureSlot | null) => {
    setHoveredSlotId(slot?.id || null);
    onSlotHover?.(slot);
  };

  return (
    <group name="slot-visualizer-overlay">
      {filteredSlots.map((slot) => {
        const furniture = furnitureMap.get(slot.furniture_id);
        if (!furniture) return null;

        const worldPosition = calculateSlotWorldPosition(
          furniture.position,
          furniture.rotation,
          slot.slot_position
        );

        const isHovered = hoveredSlotId === slot.id;
        const isSelected = selectedSlotId === slot.id;
        const compatible = isCompatible(
          selectedProductDisplayType,
          slot.compatible_display_types
        );

        return (
          <SlotMarker
            key={slot.id}
            slot={slot}
            position={worldPosition}
            rotation={furniture.rotation}
            isHovered={isHovered}
            isSelected={isSelected}
            isCompatible={compatible}
            hasSelectedProduct={!!selectedProductDisplayType}
            scale={slotScale}
            showLabel={showLabels || isHovered || isSelected}
            onClick={() => handleSlotClick(slot)}
            onPointerOver={() => handleSlotHover(slot)}
            onPointerOut={() => handleSlotHover(null)}
          />
        );
      })}

      {/* 범례 */}
      <SlotLegend position={[-6, 3, -6]} />
    </group>
  );
}

// ============================================================================
// 슬롯 마커 컴포넌트
// ============================================================================

interface SlotMarkerProps {
  slot: FurnitureSlot;
  position: [number, number, number];
  rotation: [number, number, number];
  isHovered: boolean;
  isSelected: boolean;
  isCompatible: boolean;
  hasSelectedProduct: boolean;
  scale: number;
  showLabel: boolean;
  onClick: () => void;
  onPointerOver: () => void;
  onPointerOut: () => void;
}

function SlotMarker({
  slot,
  position,
  rotation,
  isHovered,
  isSelected,
  isCompatible,
  hasSelectedProduct,
  scale,
  showLabel,
  onClick,
  onPointerOver,
  onPointerOut,
}: SlotMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 색상 결정
  const color = useMemo(() => {
    if (isSelected) return SLOT_COLORS.selected;
    if (isHovered) return SLOT_COLORS.hovered;
    if (hasSelectedProduct) {
      return isCompatible ? SLOT_COLORS.compatible : SLOT_COLORS.incompatible;
    }
    return slot.is_occupied ? SLOT_COLORS.occupied : SLOT_COLORS.empty;
  }, [isSelected, isHovered, hasSelectedProduct, isCompatible, slot.is_occupied]);

  // 슬롯 크기
  const size = useMemo(() => {
    const baseSize = SLOT_TYPE_SIZES[slot.slot_type || 'shelf'];
    return {
      width: (slot.max_product_width || baseSize.width) * scale,
      height: baseSize.height * scale,
      depth: (slot.max_product_depth || baseSize.depth) * scale,
    };
  }, [slot, scale]);

  // 펄스 애니메이션
  useFrame(({ clock }) => {
    if (meshRef.current && (isHovered || isSelected)) {
      const pulse = Math.sin(clock.elapsedTime * 4) * 0.2 + 1;
      meshRef.current.scale.setScalar(pulse);
    } else if (meshRef.current) {
      meshRef.current.scale.setScalar(1);
    }
  });

  return (
    <group position={position}>
      {/* 슬롯 평면 */}
      <mesh
        ref={meshRef}
        rotation={[-Math.PI / 2, rotation[1], 0]}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      >
        <planeGeometry args={[size.width, size.depth]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={isHovered || isSelected ? 0.8 : 0.5}
          side={THREE.DoubleSide}
          emissive={color}
          emissiveIntensity={isHovered || isSelected ? 0.5 : 0.2}
        />
      </mesh>

      {/* 슬롯 테두리 */}
      <mesh rotation={[-Math.PI / 2, rotation[1], 0]} position={[0, 0.001, 0]}>
        <ringGeometry args={[size.width * 0.45, size.width * 0.5, 4]} />
        <meshBasicMaterial color={color} transparent opacity={0.8} />
      </mesh>

      {/* 슬롯 라벨 */}
      {showLabel && (
        <Html position={[0, 0.2, 0]} center>
          <div className="px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap">
            <div className="font-semibold">{slot.slot_id}</div>
            <div className="text-[10px] text-gray-300">
              {slot.slot_type} | {slot.compatible_display_types?.join(', ') || 'any'}
            </div>
            {slot.is_occupied && (
              <div className="text-[10px] text-red-300">점유됨</div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 범례 컴포넌트
// ============================================================================

interface SlotLegendProps {
  position: [number, number, number];
}

function SlotLegend({ position }: SlotLegendProps) {
  const items = [
    { color: SLOT_COLORS.empty, label: '빈 슬롯' },
    { color: SLOT_COLORS.occupied, label: '점유됨' },
    { color: SLOT_COLORS.compatible, label: '호환 가능' },
    { color: SLOT_COLORS.incompatible, label: '호환 불가' },
    { color: SLOT_COLORS.selected, label: '선택됨' },
  ];

  return (
    <group position={position}>
      <Text
        position={[0, 0.6, 0]}
        fontSize={0.2}
        color="#ffffff"
        anchorX="left"
      >
        슬롯 범례
      </Text>
      {items.map((item, index) => (
        <group key={item.label} position={[0, -index * 0.25, 0]}>
          <mesh position={[0.1, 0, 0]}>
            <sphereGeometry args={[0.06, 8, 8]} />
            <meshStandardMaterial color={item.color} emissive={item.color} emissiveIntensity={0.3} />
          </mesh>
          <Text
            position={[0.25, 0, 0]}
            fontSize={0.12}
            color="#ffffff"
            anchorX="left"
          >
            {item.label}
          </Text>
        </group>
      ))}
    </group>
  );
}

// ============================================================================
// 슬롯 호환성 프리뷰 컴포넌트 (드래그 중 표시)
// ============================================================================

interface SlotCompatibilityPreviewProps {
  slots: FurnitureSlot[];
  furnitureModels: Model3D[];
  productDisplayType: ProductDisplayType;
  productDimensions: { width: number; height: number; depth: number };
}

export function SlotCompatibilityPreview({
  slots,
  furnitureModels,
  productDisplayType,
  productDimensions,
}: SlotCompatibilityPreviewProps) {
  const furnitureMap = useMemo(() => {
    const map = new Map<string, Model3D>();
    for (const model of furnitureModels) {
      map.set(model.id, model);
    }
    return map;
  }, [furnitureModels]);

  // 호환 가능한 슬롯만 필터링
  const compatibleSlots = useMemo(() => {
    return slots.filter((slot) => {
      if (!furnitureMap.has(slot.furniture_id)) return false;
      if (slot.is_occupied) return false;

      // display_type 호환성 체크
      if (!isCompatible(productDisplayType, slot.compatible_display_types)) {
        return false;
      }

      // 크기 체크
      if (slot.max_product_width && productDimensions.width > slot.max_product_width) {
        return false;
      }
      if (slot.max_product_height && productDimensions.height > slot.max_product_height) {
        return false;
      }
      if (slot.max_product_depth && productDimensions.depth > slot.max_product_depth) {
        return false;
      }

      return true;
    });
  }, [slots, furnitureMap, productDisplayType, productDimensions]);

  return (
    <group name="slot-compatibility-preview">
      {compatibleSlots.map((slot) => {
        const furniture = furnitureMap.get(slot.furniture_id);
        if (!furniture) return null;

        const worldPosition = calculateSlotWorldPosition(
          furniture.position,
          furniture.rotation,
          slot.slot_position
        );

        return (
          <CompatibleSlotGlow
            key={slot.id}
            position={worldPosition}
            size={slot.max_product_width || 0.3}
          />
        );
      })}
    </group>
  );
}

function CompatibleSlotGlow({
  position,
  size,
}: {
  position: [number, number, number];
  size: number;
}) {
  const meshRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    if (meshRef.current) {
      const pulse = Math.sin(clock.elapsedTime * 3) * 0.3 + 0.7;
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      material.opacity = pulse * 0.6;
    }
  });

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <circleGeometry args={[size * 0.6, 16]} />
      <meshStandardMaterial
        color="#22c55e"
        transparent
        opacity={0.6}
        emissive="#22c55e"
        emissiveIntensity={0.5}
      />
    </mesh>
  );
}

export default SlotVisualizerOverlay;
