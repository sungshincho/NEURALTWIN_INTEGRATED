/**
 * LayoutOptimizationOverlay.tsx
 *
 * 레이아웃 최적화 3D 오버레이
 * - 가구 이동 경로 시각화
 * - 변경 전/후 히트맵 비교
 * - 존 하이라이트
 * - 🆕 제품 재배치 경로 시각화 (슬롯 기반)
 */

import { useMemo, useState, useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { LayoutSimulationResult } from '../hooks/useLayoutSimulation';
import { useScene } from '../core/SceneProvider';

// ============================================================================
// 타입 정의
// ============================================================================

interface LayoutOptimizationOverlayProps {
  result: LayoutSimulationResult | null;
  showBefore?: boolean;
  showAfter?: boolean;
  showMoves?: boolean;
  showProductMoves?: boolean;
  showZoneHighlights?: boolean;
  animationSpeed?: number;
  onFurnitureClick?: (furnitureId: string) => void;
  onProductClick?: (productId: string) => void;
  /** 매장 경계 (좌표 클램핑용) */
  storeBounds?: {
    width: number;
    depth: number;
  };
  /** 실제 존 위치 데이터 (zones_dim 기반) */
  zonePositions?: Record<string, [number, number, number]>;
  /** 실제 존 크기 데이터 (zones_dim 기반) */
  zoneSizes?: Record<string, { width: number; depth: number }>;
}

// ============================================================================
// 좌표 클램핑 헬퍼
// ============================================================================

const DEFAULT_STORE_BOUNDS = { width: 17.4, depth: 16.6 };

/**
 * 3D 좌표를 매장 경계 내로 클램핑
 */
function clampToStoreBounds(
  x: number,
  z: number,
  bounds: { width: number; depth: number }
): { x: number; z: number } {
  const halfWidth = bounds.width / 2;
  const halfDepth = bounds.depth / 2;
  const padding = 0.5;

  return {
    x: Math.max(-halfWidth + padding, Math.min(halfWidth - padding, x)),
    z: Math.max(-halfDepth + padding, Math.min(halfDepth - padding, z)),
  };
}

// ============================================================================
// 컴포넌트
// ============================================================================

export function LayoutOptimizationOverlay({
  result,
  showBefore = false,
  showAfter = true,
  showMoves = true,
  showProductMoves = true,
  showZoneHighlights = true,
  animationSpeed = 1,
  onFurnitureClick,
  onProductClick,
  storeBounds = DEFAULT_STORE_BOUNDS,
  zonePositions: externalZonePositions,
  zoneSizes: externalZoneSizes,
}: LayoutOptimizationOverlayProps) {
  const [selectedMove, setSelectedMove] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const animationRef = useRef(0);

  // 🆕 씬 데이터 가져오기 (가구 위치 폴백용)
  const { models } = useScene();

  // 🆕 가구/제품 위치 조회 헬퍼 (더 유연한 매칭 지원)
  const findFurniturePosition = useCallback((furnitureId: string | undefined, furnitureLabel: string | undefined) => {
    if (!furnitureId && !furnitureLabel) return null;

    const furnitureModels = models.filter(m => m.type === 'furniture');

    // 1. 정확한 ID 매칭
    let furniture = furnitureModels.find((m) =>
      m.id === furnitureId ||
      (m.metadata as any)?.furniture_id === furnitureId
    );

    // 2. 이름 매칭 (정확한 매칭)
    if (!furniture && furnitureLabel) {
      furniture = furnitureModels.find((m) =>
        m.name === furnitureLabel ||
        (m.metadata as any)?.label === furnitureLabel
      );
    }

    // 3. 이름 부분 매칭 (포함 관계)
    if (!furniture && furnitureLabel) {
      const labelLower = furnitureLabel.toLowerCase();
      furniture = furnitureModels.find((m) => {
        const nameLower = (m.name || '').toLowerCase();
        const metaLabel = ((m.metadata as any)?.label || '').toLowerCase();
        return nameLower.includes(labelLower) || labelLower.includes(nameLower) ||
               metaLabel.includes(labelLower) || labelLower.includes(metaLabel);
      });
    }

    if (furniture?.position) {
      console.log('[findFurniturePosition] Found furniture:', furniture.name, 'for', furnitureId || furnitureLabel);
      return {
        x: furniture.position[0],
        y: furniture.position[1] + 0.8, // 가구 위에 표시
        z: furniture.position[2],
      };
    }

    console.log('[findFurniturePosition] NOT found for:', furnitureId || furnitureLabel);
    return null;
  }, [models]);

  // 🆕 제품의 현재 위치 조회 (childProducts에서 검색)
  const findProductPosition = useCallback((productId: string | undefined, productSku: string | undefined) => {
    if (!productId && !productSku) return null;

    for (const model of models) {
      if (model.type !== 'furniture') continue;

      const childProducts = (model.metadata as any)?.childProducts as any[] | undefined;
      if (!childProducts) continue;

      const product = childProducts.find((cp) =>
        cp.id === productId ||
        cp.metadata?.sku === productSku ||
        cp.name === productSku ||
        (productSku && cp.name?.toLowerCase().includes(productSku.toLowerCase()))
      );

      if (product?.position) {
        // 가구 위치 + 제품 상대 위치
        const furniturePos = model.position || [0, 0, 0];
        console.log('[findProductPosition] Found product:', product.name, 'in furniture:', model.name);
        return {
          x: furniturePos[0] + (product.position[0] || 0),
          y: furniturePos[1] + (product.position[1] || 0) + 0.3,
          z: furniturePos[2] + (product.position[2] || 0),
        };
      }
    }

    console.log('[findProductPosition] NOT found for:', productId || productSku);
    return null;
  }, [models]);

  // 애니메이션 프레임
  useFrame((_, delta) => {
    animationRef.current += delta * animationSpeed;
  });

  if (!result) return null;

  const { visualization, furnitureMoves } = result;
  // productPlacements 추출 (타입 캐스트)
  const rawProductPlacements = (result as any).productPlacements || [];

  // 🐛 디버그: productPlacements 데이터 확인
  console.log('[LayoutOptimizationOverlay] rawProductPlacements:', rawProductPlacements);
  console.log('[LayoutOptimizationOverlay] rawProductPlacements count:', rawProductPlacements.length);
  console.log('[LayoutOptimizationOverlay] models count:', models.length);
  console.log('[LayoutOptimizationOverlay] furniture models:', models.filter(m => m.type === 'furniture').map(m => ({
    id: m.id,
    name: m.name,
    position: m.position,
    furniture_id: (m.metadata as any)?.furniture_id,
  })));

  // 🆕 productPlacements에 씬 기반 폴백 위치 추가
  const productPlacements = useMemo(() => {
    console.log('[LayoutOptimizationOverlay] Processing productPlacements for fallback positions...');

    return rawProductPlacements.map((placement: any, idx: number) => {
      console.log(`[LayoutOptimizationOverlay] Processing placement ${idx}:`, {
        productId: placement.productId,
        productSku: placement.productSku,
        fromFurnitureId: placement.fromFurnitureId,
        fromFurniture: placement.fromFurniture,
        toFurnitureId: placement.toFurnitureId,
        toFurniture: placement.toFurniture,
        hasFromPosition: !!placement.fromPosition,
        hasToPosition: !!placement.toPosition,
      });

      // 이미 위치가 있으면 그대로 사용
      if (placement.fromPosition && placement.toPosition) {
        console.log(`[LayoutOptimizationOverlay] Placement ${idx} already has positions`);
        return placement;
      }

      // fromPosition 폴백 계산 (다양한 필드명 지원)
      let fromPosition = placement.fromPosition || placement.currentPosition;
      if (!fromPosition) {
        // 1. 제품의 현재 위치에서 검색
        fromPosition = findProductPosition(placement.productId, placement.productSku);
        console.log(`[LayoutOptimizationOverlay] Placement ${idx} findProductPosition result:`, fromPosition);

        // 2. fromFurniture 위치 사용 (다양한 필드명 지원)
        if (!fromPosition) {
          const fromFurnitureId = placement.fromFurnitureId || placement.currentFurnitureId || placement.current_furniture_id;
          const fromFurnitureLabel = placement.fromFurniture || placement.currentFurnitureLabel || placement.currentFurnitureName;
          fromPosition = findFurniturePosition(fromFurnitureId, fromFurnitureLabel);
          console.log(`[LayoutOptimizationOverlay] Placement ${idx} findFurniturePosition (from) result:`, fromPosition,
            'searched:', fromFurnitureId || fromFurnitureLabel);
        }
      }

      // toPosition 폴백 계산 (다양한 필드명 지원)
      let toPosition = placement.toPosition || placement.suggestedPosition;
      if (!toPosition) {
        // toFurniture 위치 사용 (다양한 필드명 지원)
        const toFurnitureId = placement.toFurnitureId || placement.suggestedFurnitureId || placement.suggested_furniture_id;
        const toFurnitureLabel = placement.toFurniture || placement.suggestedFurnitureLabel || placement.suggestedFurnitureName;
        toPosition = findFurniturePosition(toFurnitureId, toFurnitureLabel);
        console.log(`[LayoutOptimizationOverlay] Placement ${idx} findFurniturePosition (to) result:`, toPosition,
          'searched:', toFurnitureId || toFurnitureLabel);

        // 같은 위치가 되지 않도록 약간 오프셋 적용
        if (toPosition && fromPosition &&
            Math.abs(toPosition.x - fromPosition.x) < 0.5 &&
            Math.abs(toPosition.z - fromPosition.z) < 0.5) {
          toPosition = {
            ...toPosition,
            x: toPosition.x + 1.5, // 옆으로 이동 표시
          };
        }
      }

      // 🆕 최종 폴백: 위치를 전혀 찾지 못한 경우 기본 위치 사용
      // 가구 이동 인디케이터와 유사한 위치에 배치
      if (!fromPosition && !toPosition) {
        // 인덱스 기반으로 위치 분산
        const baseX = -3 + (idx % 4) * 2;
        const baseZ = -3 + Math.floor(idx / 4) * 2;
        fromPosition = { x: baseX, y: 0.8, z: baseZ };
        toPosition = { x: baseX + 1.5, y: 0.8, z: baseZ + 1 };
        console.log(`[LayoutOptimizationOverlay] Placement ${idx} using DEFAULT positions`);
      } else if (!fromPosition && toPosition) {
        // toPosition만 있는 경우
        fromPosition = { x: toPosition.x - 1.5, y: toPosition.y, z: toPosition.z - 1 };
        console.log(`[LayoutOptimizationOverlay] Placement ${idx} calculated fromPosition from toPosition`);
      } else if (fromPosition && !toPosition) {
        // fromPosition만 있는 경우
        toPosition = { x: fromPosition.x + 1.5, y: fromPosition.y, z: fromPosition.z + 1 };
        console.log(`[LayoutOptimizationOverlay] Placement ${idx} calculated toPosition from fromPosition`);
      }

      const finalResult = {
        ...placement,
        fromPosition,
        toPosition,
      };

      console.log(`[LayoutOptimizationOverlay] Placement ${idx} final result:`, {
        hasFromPosition: !!finalResult.fromPosition,
        hasToPosition: !!finalResult.toPosition,
        fromPosition: finalResult.fromPosition,
        toPosition: finalResult.toPosition,
      });

      return finalResult;
    });
  }, [rawProductPlacements, findProductPosition, findFurniturePosition]);

  return (
    <group name="layout-optimization-overlay">
      {/* 변경 전 히트맵 (비교 모드에서만 표시) */}
      {showBefore && visualization?.beforeHeatmap && visualization.beforeHeatmap.length > 0 && (
        <HeatmapMesh
          points={visualization.beforeHeatmap}
          color="#ef4444"
          opacity={0.3}
          heightScale={1}
          label="변경 전"
          storeBounds={storeBounds}
        />
      )}

      {/* 변경 후 히트맵 - 초록색 바닥 영역 시각화 삭제됨 (사용자 요청)
       * 기존: showAfter && afterHeatmap -> 초록색(#22c55e) 바닥면 표시
       * 제거: AI 최적화 실행 시 바닥에 표시되던 초록색 영역
       */}

      {/* 가구 이동 경로 */}
      {showMoves && furnitureMoves?.map((move, idx) => (
        <FurnitureMoveIndicator
          key={move.furnitureId}
          move={move}
          storeBounds={storeBounds}
          index={idx}
          isSelected={selectedMove === move.furnitureId}
          onClick={() => {
            setSelectedMove(move.furnitureId);
            onFurnitureClick?.(move.furnitureId);
          }}
        />
      ))}

      {/* 제품 재배치 경로 (슬롯 기반) */}
      {showProductMoves && productPlacements.map((placement: any, idx: number) => (
        <ProductMoveIndicator
          key={placement.productId || placement.product_id || `product-${idx}`}
          placement={placement}
          storeBounds={storeBounds}
          index={idx}
          isSelected={selectedProduct === (placement.productId || placement.product_id)}
          onClick={() => {
            const productId = placement.productId || placement.product_id;
            setSelectedProduct(productId);
            onProductClick?.(productId);
          }}
        />
      ))}

      {/* 존 하이라이트 */}
      {showZoneHighlights && visualization?.highlightZones && visualization.highlightZones
        .filter((zone) => zone.zoneId) // zoneId가 있는 것만 렌더링
        .map((zone) => (
        <ZoneHighlight
          key={zone.zoneId}
          zone={zone}
          externalZonePositions={externalZonePositions}
          externalZoneSizes={externalZoneSizes}
        />
      ))}

      {/* 선택된 이동 정보 패널 */}
      {selectedMove && furnitureMoves?.find(m => m.furnitureId === selectedMove) && (
        <MovementInfoPanel
          move={furnitureMoves.find(m => m.furnitureId === selectedMove)!}
          storeBounds={storeBounds}
          onClose={() => setSelectedMove(null)}
        />
      )}
    </group>
  );
}

// ============================================================================
// 히트맵 메시 컴포넌트
// ============================================================================

interface HeatmapMeshProps {
  points: Array<{ x: number; z: number; intensity: number }>;
  color: string;
  opacity: number;
  heightScale: number;
  label: string;
  storeBounds: { width: number; depth: number };
}

function HeatmapMesh({ points, color, opacity, heightScale, label, storeBounds }: HeatmapMeshProps) {
  // 🔧 FIX: 유효한 포인트만 필터링 (NaN 방지)
  const validPoints = useMemo(() => {
    return (points || []).filter(p => 
      p &&
      typeof p.x === 'number' &&
      typeof p.z === 'number' &&
      typeof p.intensity === 'number' &&
      Number.isFinite(p.x) &&
      Number.isFinite(p.z) &&
      Number.isFinite(p.intensity)
    );
  }, [points]);

  // 히트맵 포인트 좌표를 클램핑
  const clampedPoints = useMemo(() => {
    return validPoints.map(p => {
      const clamped = clampToStoreBounds(p.x, p.z, storeBounds);
      return { ...p, x: clamped.x, z: clamped.z };
    });
  }, [validPoints, storeBounds]);

  const geometry = useMemo(() => {
    const gridSize = 12;
    const geo = new THREE.PlaneGeometry(gridSize, gridSize, 20, 20);
    const positions = geo.attributes.position.array as Float32Array;

    // 히트맵 데이터로 높이 설정 (클램핑된 포인트 사용)
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];

      // 가장 가까운 포인트의 강도 찾기
      let intensity = 0;
      clampedPoints.forEach((point) => {
        const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
        if (dist < 2) {
          intensity = Math.max(intensity, point.intensity * (1 - dist / 2));
        }
      });

      positions[i + 2] = intensity * heightScale;
    }

    geo.computeVertexNormals();
    return geo;
  }, [clampedPoints, heightScale]);

  return (
    <group>
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.05, 0]}
      >
        <meshStandardMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          emissive={color}
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 라벨 */}
      <Text
        position={[-5, 2, -5]}
        fontSize={0.4}
        color={color}
        anchorX="left"
      >
        {label}
      </Text>
    </group>
  );
}

// ============================================================================
// 가구 이동 인디케이터 컴포넌트 (고스트 + 곡선 화살표)
// ============================================================================

interface FurnitureMoveIndicatorProps {
  move: {
    furnitureId: string;
    furnitureName?: string;
    fromPosition?: { x: number; y: number; z: number };
    toPosition: { x: number; y: number; z: number };
    suggestedPosition?: { x: number; y: number; z: number };
    rotation?: number;
    reason?: string;
  };
  storeBounds: { width: number; depth: number };
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

/**
 * 두 점 사이의 곡선 경로 포인트 생성 (베지어 곡선)
 */
function generateCurvedPath(
  from: [number, number, number],
  to: [number, number, number],
  segments: number = 20
): [number, number, number][] {
  const points: [number, number, number][] = [];

  // 중간점 높이 계산 (거리에 비례)
  const distance = Math.sqrt(
    Math.pow(to[0] - from[0], 2) + Math.pow(to[2] - from[2], 2)
  );
  const arcHeight = Math.min(distance * 0.3, 2); // 최대 높이 2m

  // 컨트롤 포인트 (중간 위로 올라감)
  const midX = (from[0] + to[0]) / 2;
  const midY = Math.max(from[1], to[1]) + arcHeight;
  const midZ = (from[2] + to[2]) / 2;

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const t2 = t * t;
    const mt = 1 - t;
    const mt2 = mt * mt;

    // 2차 베지어 곡선
    const x = mt2 * from[0] + 2 * mt * t * midX + t2 * to[0];
    const y = mt2 * from[1] + 2 * mt * t * midY + t2 * to[1];
    const z = mt2 * from[2] + 2 * mt * t * midZ + t2 * to[2];

    points.push([x, y, z]);
  }

  return points;
}

function FurnitureMoveIndicator({
  move,
  storeBounds,
  index,
  isSelected,
  onClick,
}: FurnitureMoveIndicatorProps) {
  const ghostRef = useRef<THREE.Mesh>(null);
  const particleRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // fromPosition이 없으면 toPosition을 사용 (suggestedPosition 사용 가능)
  const fromPos = move.fromPosition || move.toPosition;
  const toPos = move.suggestedPosition || move.toPosition;

  // 좌표를 매장 경계 내로 클램핑
  const clampedFrom = clampToStoreBounds(fromPos.x, fromPos.z, storeBounds);
  const clampedTo = clampToStoreBounds(toPos.x, toPos.z, storeBounds);

  const from = [clampedFrom.x, 0.3, clampedFrom.z] as [number, number, number];
  const to = [clampedTo.x, 0.3, clampedTo.z] as [number, number, number];

  // 곡선 경로 포인트 생성
  const curvedPath = useMemo(() => generateCurvedPath(from, to, 30), [from, to]);

  // 고스트 박스 펄스 애니메이션 + 파티클 이동
  useFrame(({ clock }) => {
    // 고스트 박스 펄스
    if (ghostRef.current) {
      const material = ghostRef.current.material as THREE.MeshStandardMaterial;
      const pulse = (Math.sin(clock.elapsedTime * 3 + index) + 1) / 2;
      material.opacity = 0.2 + pulse * 0.15;
    }

    // 파티클 경로 따라 이동
    if (particleRef.current && curvedPath.length > 0) {
      const t = ((clock.elapsedTime * 0.5 + index * 0.3) % 1);
      const pathIndex = Math.floor(t * (curvedPath.length - 1));
      const point = curvedPath[pathIndex];
      particleRef.current.position.set(point[0], point[1], point[2]);
    }
  });

  const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ec4899'];
  const color = colors[index % colors.length];

  return (
    <group>
      {/* ===== 시작점 (As-Is) 마커 ===== */}
      <mesh
        position={from}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.4, 0.4, 0.4]} />
        <meshStandardMaterial
          color="#ef4444"
          emissive="#ef4444"
          emissiveIntensity={hovered ? 0.6 : 0.3}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* As-Is 라벨 */}
      <Html position={[from[0], from[1] + 0.6, from[2]]} center>
        <div className="px-1.5 py-0.5 bg-red-600/90 text-white text-[9px] rounded font-medium">
          As-Is
        </div>
      </Html>

      {/* ===== 도착점 (To-Be) 고스트 박스 ===== */}
      <mesh
        ref={ghostRef}
        position={to}
        rotation={[0, move.rotation || 0, 0]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.2, 1, 0.8]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={0.4}
          transparent
          opacity={0.25}
          wireframe={false}
        />
      </mesh>

      {/* 고스트 박스 테두리 */}
      <mesh position={to} rotation={[0, move.rotation || 0, 0]}>
        <boxGeometry args={[1.2, 1, 0.8]} />
        <meshBasicMaterial
          color="#22c55e"
          wireframe={true}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* To-Be 라벨 */}
      <Html position={[to[0], to[1] + 0.8, to[2]]} center>
        <div className="px-1.5 py-0.5 bg-green-600/90 text-white text-[9px] rounded font-medium">
          To-Be
        </div>
      </Html>

      {/* ===== 곡선 이동 경로 ===== */}
      <Line
        points={curvedPath}
        color={isSelected ? '#ffffff' : color}
        lineWidth={isSelected ? 3 : 2}
        dashed={true}
        dashScale={3}
        dashSize={0.3}
        gapSize={0.15}
      />

      {/* 이동하는 파티클 (작은 구) */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.12, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1}
        />
      </mesh>

      {/* 끝점 화살표 헤드 */}
      <group position={to}>
        <mesh position={[0, 0.6, 0]} rotation={[Math.PI, 0, 0]}>
          <coneGeometry args={[0.15, 0.3, 6]} />
          <meshStandardMaterial
            color="#22c55e"
            emissive="#22c55e"
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>

      {/* ===== 가구 이름 라벨 (호버/선택 시) ===== */}
      {(hovered || isSelected) && (
        <Html
          position={[
            (from[0] + to[0]) / 2,
            Math.max(from[1], to[1]) + 1.5,
            (from[2] + to[2]) / 2,
          ]}
          center
        >
          <div className="px-3 py-1.5 bg-black/90 text-white text-xs rounded-lg shadow-lg border border-white/20">
            <div className="font-medium">{move.furnitureName || 'Furniture'}</div>
            <div className="text-[10px] text-white/60 mt-0.5">
              {Math.sqrt(
                Math.pow(to[0] - from[0], 2) + Math.pow(to[2] - from[2], 2)
              ).toFixed(1)}m 이동
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 존 하이라이트 컴포넌트
// ============================================================================

interface ZoneHighlightProps {
  zone: {
    zoneId: string;
    color: string;
    opacity: number;
    changeType: 'improved' | 'degraded' | 'new' | 'removed' | 'suggested';
  };
  /** 실제 존 위치 데이터 (zones_dim 기반) */
  externalZonePositions?: Record<string, [number, number, number]>;
  /** 실제 존 크기 데이터 (zones_dim 기반) */
  externalZoneSizes?: Record<string, { width: number; depth: number }>;
}

function ZoneHighlight({ zone, externalZonePositions, externalZoneSizes }: ZoneHighlightProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 깜빡임 애니메이션
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      const pulse = (Math.sin(clock.elapsedTime * 3) + 1) / 2;
      material.opacity = zone.opacity * (0.7 + pulse * 0.3);
    }
  });

  // 기본 폴백 위치 (외부 데이터 없을 경우)
  const fallbackPositions: Record<string, [number, number, number]> = {
    entrance: [2.5, 0.02, -7.5],
    'zone-a': [0, 0.02, 2],
    'zone-b': [0, 0.02, -2],
    'zone-c': [4, 0.02, 0],
    main: [0, 0.02, 0],
    메인홀: [0, 0.02, 0],
    입구: [2.5, 0.02, -7.5],
    의류존: [-5, 0.02, 3],
    액세서리존: [5, 0.02, 3],
    피팅룸: [-5, 0.02, -5],
    계산대: [4.5, 0.02, 5.5],
  };

  // zoneId가 없으면 렌더링하지 않음
  if (!zone.zoneId) {
    return null;
  }

  // 실제 존 위치 사용 (우선순위: externalZonePositions > fallbackPositions)
  const zonePositions = externalZonePositions || fallbackPositions;
  const zoneIdLower = zone.zoneId.toLowerCase();
  const position = zonePositions[zone.zoneId] || zonePositions[zoneIdLower] || [0, 0.02, 0];

  // 기본 폴백 크기
  const fallbackSizes: Record<string, { width: number; depth: number }> = {
    entrance: { width: 3, depth: 1 },
    main: { width: 10, depth: 8 },
    메인홀: { width: 10, depth: 8 },
    입구: { width: 3, depth: 1 },
    의류존: { width: 6, depth: 6 },
    액세서리존: { width: 6, depth: 6 },
    피팅룸: { width: 4, depth: 4 },
    계산대: { width: 3, depth: 3 },
  };

  // 실제 존 크기 사용 (우선순위: externalZoneSizes > fallbackSizes)
  const zoneSizes = externalZoneSizes || fallbackSizes;
  const size = zoneSizes[zone.zoneId] || zoneSizes[zoneIdLower] || { width: 3, depth: 3 };

  return (
    <mesh ref={meshRef} position={position} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[size.width, size.depth]} />
      <meshStandardMaterial
        color={zone.color}
        transparent
        opacity={zone.opacity}
        side={THREE.DoubleSide}
        emissive={zone.color}
        emissiveIntensity={0.3}
      />
    </mesh>
  );
}

// ============================================================================
// 이동 정보 패널 컴포넌트
// ============================================================================

interface MovementInfoPanelProps {
  move: {
    furnitureId: string;
    furnitureName?: string;
    fromPosition?: { x: number; y: number; z: number };
    toPosition: { x: number; y: number; z: number };
    suggestedPosition?: { x: number; y: number; z: number };
  };
  storeBounds: { width: number; depth: number };
  onClose: () => void;
}

function MovementInfoPanel({ move, storeBounds, onClose }: MovementInfoPanelProps) {
  const fromPos = move.fromPosition || move.toPosition;
  const toPos = move.suggestedPosition || move.toPosition;
  const distance = Math.sqrt(
    Math.pow(toPos.x - fromPos.x, 2) +
    Math.pow(toPos.z - fromPos.z, 2)
  );

  // 패널 위치 클램핑
  const clampedTo = clampToStoreBounds(move.toPosition.x, move.toPosition.z, storeBounds);

  return (
    <Html
      position={[
        clampedTo.x,
        2,
        clampedTo.z,
      ]}
      center
    >
      <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-semibold text-sm">{move.furnitureName || 'Furniture'}</h4>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ✕
          </button>
        </div>
        <div className="space-y-1.5 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">이동 전:</span>
            <span className="font-mono">
              ({fromPos.x.toFixed(1)}, {fromPos.z.toFixed(1)})
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">이동 후:</span>
            <span className="font-mono text-green-500">
              ({toPos.x.toFixed(1)}, {toPos.z.toFixed(1)})
            </span>
          </div>
          <div className="flex justify-between pt-1 border-t border-border">
            <span className="text-muted-foreground">이동 거리:</span>
            <span className="font-semibold">{distance.toFixed(1)}m</span>
          </div>
        </div>
      </div>
    </Html>
  );
}

// ============================================================================
// 제품 재배치 인디케이터 컴포넌트 (곡선 화살표)
// ============================================================================

interface ProductMoveIndicatorProps {
  placement: {
    productId?: string;
    product_id?: string;
    productName?: string;
    productSku?: string;
    sku?: string;
    // 🔧 슬롯 바인딩 정보 (Edge Function에서 반환)
    fromFurnitureId?: string;
    fromFurnitureCode?: string;
    fromFurnitureName?: string;
    fromSlotId?: string;
    toFurnitureId?: string;
    toFurnitureCode?: string;
    toFurnitureName?: string;
    toSlotId?: string;
    // 🔧 Edge Function에서 계산된 실제 위치
    fromPosition?: { x: number; y: number; z: number };
    toPosition?: { x: number; y: number; z: number };
    toSlotPosition?: { x: number; y: number; z: number };
    // 기존 필드 (레거시 호환)
    initial_placement?: {
      furniture_id?: string;
      slot_id?: string;
      position?: { x: number; y: number; z: number };
    };
    optimization_result?: {
      suggested_furniture_id?: string;
      suggested_slot_id?: string;
      suggested_position?: { x: number; y: number; z: number };
      optimization_reason?: string;
      expected_impact?: {
        revenue_change_pct?: number;
        visibility_score?: number;
      };
    };
    current?: { position?: { x: number; y: number; z: number } };
    suggested?: { position?: { x: number; y: number; z: number } };
    // 추가 메타데이터
    slotType?: string;
    reason?: string;
    priority?: string;
    expectedImpact?: {
      revenueChangePct?: number;
      visibilityScore?: number;
      // snake_case 버전도 지원 (API 응답 호환성)
      revenue_change_pct?: number;
      visibility_score?: number;
    };
  };
  storeBounds: { width: number; depth: number };
  index: number;
  isSelected: boolean;
  onClick: () => void;
}

function ProductMoveIndicator({
  placement,
  storeBounds,
  index,
  isSelected,
  onClick,
}: ProductMoveIndicatorProps) {
  const particleRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  // 🔧 FIX: 위치 추출 우선순위 변경 (Edge Function 결과 우선)
  // 1. fromPosition (Edge Function에서 계산)
  // 2. current.position (기존 필드)
  // 3. initial_placement.position (기존 필드)
  // 4. 폴백 (절대 사용하지 않도록 로그 출력)
  const fromPos = placement.fromPosition ||
    placement.current?.position ||
    placement.initial_placement?.position;

  // 1. toPosition (Edge Function에서 계산된 실제 월드 좌표)
  // 2. suggested.position (기존 필드)
  // 3. optimization_result.suggested_position (기존 필드)
  const toPos = placement.toPosition ||
    placement.suggested?.position ||
    placement.optimization_result?.suggested_position;

  // 🐛 디버그: placement 전체 데이터 확인
  console.log('[ProductMoveIndicator] Received placement:', placement);
  console.log('[ProductMoveIndicator] Placement keys:', Object.keys(placement || {}));

  // 위치가 없으면 렌더링하지 않음
  if (!fromPos || !toPos) {
    console.warn('[ProductMoveIndicator] Missing position data:', {
      productId: placement.productId || placement.product_id,
      hasFromPosition: !!placement.fromPosition,
      hasToPosition: !!placement.toPosition,
      hasCurrent: !!placement.current?.position,
      hasSuggested: !!placement.suggested?.position,
      placementData: placement,
    });
    return null;
  }

  console.log('[ProductMoveIndicator] Rendering product move:', {
    productId: placement.productId || placement.product_id,
    from: fromPos,
    to: toPos,
  });

  // 좌표 클램핑
  const clampedFrom = clampToStoreBounds(fromPos.x, fromPos.z, storeBounds);
  const clampedTo = clampToStoreBounds(toPos.x, toPos.z, storeBounds);

  // 🔧 FIX: y 좌표를 충분히 높게 설정 (가구 위에 표시되도록)
  const minY = 1.2; // 최소 높이 1.2m
  const from = [clampedFrom.x, Math.max(fromPos.y || 0.8, minY), clampedFrom.z] as [number, number, number];
  const to = [clampedTo.x, Math.max(toPos.y || 0.8, minY), clampedTo.z] as [number, number, number];

  // 곡선 경로 생성 (더 높은 아크)
  const curvedPath = useMemo(() => {
    const points: [number, number, number][] = [];
    const segments = 25;
    const distance = Math.sqrt(
      Math.pow(to[0] - from[0], 2) + Math.pow(to[2] - from[2], 2)
    );
    const arcHeight = Math.min(distance * 0.5, 1.5);

    const midX = (from[0] + to[0]) / 2;
    const midY = Math.max(from[1], to[1]) + arcHeight;
    const midZ = (from[2] + to[2]) / 2;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const t2 = t * t;
      const mt = 1 - t;
      const mt2 = mt * mt;

      const x = mt2 * from[0] + 2 * mt * t * midX + t2 * to[0];
      const y = mt2 * from[1] + 2 * mt * t * midY + t2 * to[1];
      const z = mt2 * from[2] + 2 * mt * t * midZ + t2 * to[2];

      points.push([x, y, z]);
    }
    return points;
  }, [from, to]);

  // 파티클 애니메이션
  useFrame(({ clock }) => {
    if (particleRef.current && curvedPath.length > 0) {
      const t = ((clock.elapsedTime * 0.8 + index * 0.2) % 1);
      const pathIndex = Math.floor(t * (curvedPath.length - 1));
      const point = curvedPath[pathIndex];
      particleRef.current.position.set(point[0], point[1], point[2]);
    }
  });

  const productName = placement.productName || placement.productSku || placement.sku || '상품';
  const productSku = placement.productSku || placement.sku || '';

  // 슬롯 바인딩 정보
  const fromSlotDisplay = placement.fromSlotId || placement.initial_placement?.slot_id || '-';
  const toSlotDisplay = placement.toSlotId || placement.optimization_result?.suggested_slot_id || '-';
  const fromFurnitureDisplay = placement.fromFurnitureCode || placement.fromFurnitureName || '현재 가구';
  const toFurnitureDisplay = placement.toFurnitureCode || placement.toFurnitureName || '추천 가구';

  const impact = placement.expectedImpact || placement.optimization_result?.expected_impact;
  const reason = placement.reason || placement.optimization_result?.optimization_reason;

  // 제품별 다른 색상
  const productColors = ['#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#10b981'];
  const color = productColors[index % productColors.length];

  return (
    <group>
      {/* 시작점 (현재 위치) - 작은 박스 */}
      <mesh
        position={from}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.2, 0.2, 0.2]} />
        <meshStandardMaterial
          color="#f97316"
          emissive="#f97316"
          emissiveIntensity={hovered ? 0.6 : 0.3}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* 도착점 (추천 위치) - 작은 구 */}
      <mesh
        position={to}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.8 : 0.5}
        />
      </mesh>

      {/* 곡선 경로 (점선) */}
      <Line
        points={curvedPath}
        color={isSelected ? '#ffffff' : color}
        lineWidth={isSelected ? 2.5 : 1.5}
        dashed={true}
        dashScale={5}
        dashSize={0.15}
        gapSize={0.1}
      />

      {/* 이동 파티클 */}
      <mesh ref={particleRef}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
        />
      </mesh>

      {/* 도착점 화살표 */}
      <mesh position={[to[0], to[1] + 0.25, to[2]]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.08, 0.15, 6]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.6}
        />
      </mesh>

      {/* 🆕 슬롯 바인딩 라벨 (호버/선택 시) */}
      {(hovered || isSelected) && (
        <Html
          position={[
            (from[0] + to[0]) / 2,
            Math.max(from[1], to[1]) + 1.2,
            (from[2] + to[2]) / 2,
          ]}
          center
        >
          <div className="px-3 py-2 bg-purple-900/95 text-white text-[10px] rounded-lg shadow-lg border border-purple-400/30 min-w-[140px]">
            {/* 제품 정보 */}
            <div className="font-medium text-xs">{productName}</div>
            {productSku && (
              <div className="text-purple-300 text-[9px] font-mono">({productSku})</div>
            )}

            {/* 슬롯 바인딩 변경 */}
            <div className="mt-1.5 pt-1.5 border-t border-purple-500/30">
              <div className="flex items-center gap-1.5 text-[9px]">
                <span className="text-red-300 font-mono">{fromFurnitureDisplay}[{fromSlotDisplay}]</span>
                <span className="text-purple-400">→</span>
                <span className="text-green-300 font-mono">{toFurnitureDisplay}[{toSlotDisplay}]</span>
              </div>
            </div>

            {/* 사유 */}
            {reason && (
              <div className="text-purple-200 text-[9px] mt-1 leading-tight">
                💡 {reason}
              </div>
            )}

            {/* 예상 효과 */}
            {impact && (
              <div className="flex gap-2 mt-1.5 pt-1 border-t border-purple-500/20 text-[9px]">
                {impact.revenue_change_pct !== undefined && (
                  <span className={(impact.revenue_change_pct ?? 0) >= 0 ? 'text-green-400' : 'text-red-400'}>
                    매출 {(impact.revenue_change_pct ?? 0) >= 0 ? '+' : ''}{(impact.revenue_change_pct ?? 0).toFixed(1)}%
                  </span>
                )}
                {impact.visibility_score !== undefined && (
                  <span className="text-yellow-400">
                    노출 {((impact.visibility_score ?? 0) * 100).toFixed(0)}점
                  </span>
                )}
              </div>
            )}
          </div>
        </Html>
      )}
    </group>
  );
}

export default LayoutOptimizationOverlay;
