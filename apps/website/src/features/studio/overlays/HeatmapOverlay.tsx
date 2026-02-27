/**
 * HeatmapOverlay.tsx
 *
 * 히트맵 오버레이 - 방문자 밀집도 시각화
 * - storeBounds를 사용하여 매장 범위 내에만 렌더링
 * - Quadtree를 사용한 공간 인덱싱으로 성능 최적화
 */

import { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';
import type { HeatPoint, HeatmapOverlayProps } from '../types';

// ============================================================================
// Quadtree 구현 (공간 인덱싱으로 O(n×m) → O(n×log m) 최적화)
// ============================================================================
interface QuadBounds {
  x: number;      // 중심 x
  z: number;      // 중심 z
  halfW: number;  // 너비의 절반
  halfH: number;  // 높이의 절반
}

interface QuadPoint {
  x: number;
  z: number;
  data: HeatPoint;
}

class Quadtree {
  private bounds: QuadBounds;
  private capacity: number;
  private points: QuadPoint[] = [];
  private divided = false;
  private northeast?: Quadtree;
  private northwest?: Quadtree;
  private southeast?: Quadtree;
  private southwest?: Quadtree;

  constructor(bounds: QuadBounds, capacity = 4) {
    this.bounds = bounds;
    this.capacity = capacity;
  }

  // 점이 영역 안에 있는지 확인
  private contains(point: QuadPoint): boolean {
    const { x, z, halfW, halfH } = this.bounds;
    return (
      point.x >= x - halfW &&
      point.x < x + halfW &&
      point.z >= z - halfH &&
      point.z < z + halfH
    );
  }

  // 영역이 범위와 겹치는지 확인
  private intersects(range: QuadBounds): boolean {
    const { x, z, halfW, halfH } = this.bounds;
    return !(
      range.x - range.halfW > x + halfW ||
      range.x + range.halfW < x - halfW ||
      range.z - range.halfH > z + halfH ||
      range.z + range.halfH < z - halfH
    );
  }

  // 4등분
  private subdivide(): void {
    const { x, z, halfW, halfH } = this.bounds;
    const qW = halfW / 2;
    const qH = halfH / 2;

    this.northeast = new Quadtree({ x: x + qW, z: z - qH, halfW: qW, halfH: qH }, this.capacity);
    this.northwest = new Quadtree({ x: x - qW, z: z - qH, halfW: qW, halfH: qH }, this.capacity);
    this.southeast = new Quadtree({ x: x + qW, z: z + qH, halfW: qW, halfH: qH }, this.capacity);
    this.southwest = new Quadtree({ x: x - qW, z: z + qH, halfW: qW, halfH: qH }, this.capacity);
    this.divided = true;
  }

  // 점 삽입
  insert(point: QuadPoint): boolean {
    if (!this.contains(point)) return false;

    if (this.points.length < this.capacity) {
      this.points.push(point);
      return true;
    }

    if (!this.divided) {
      this.subdivide();
    }

    return (
      this.northeast!.insert(point) ||
      this.northwest!.insert(point) ||
      this.southeast!.insert(point) ||
      this.southwest!.insert(point)
    );
  }

  // 범위 내 점 검색
  query(range: QuadBounds, found: QuadPoint[] = []): QuadPoint[] {
    if (!this.intersects(range)) return found;

    for (const p of this.points) {
      if (
        p.x >= range.x - range.halfW &&
        p.x < range.x + range.halfW &&
        p.z >= range.z - range.halfH &&
        p.z < range.z + range.halfH
      ) {
        found.push(p);
      }
    }

    if (this.divided) {
      this.northeast!.query(range, found);
      this.northwest!.query(range, found);
      this.southeast!.query(range, found);
      this.southwest!.query(range, found);
    }

    return found;
  }
}

// ============================================================================
// 기본 설정
// ============================================================================

// 기본 매장 경계 (storeBounds가 없을 때 사용)
const DEFAULT_BOUNDS = {
  width: 16.5,
  depth: 16.5,
  minX: -8.7,
  maxX: 8.7,
  minZ: -8.3,
  maxZ: 8.3,
  centerX: 0,
  centerZ: 0,
};

// ============================================================================
// HeatmapOverlay 컴포넌트
// ============================================================================
export function HeatmapOverlay({
  heatPoints,
  maxIntensity = 1,
  colorScale = 'plasma',  // 🆕 기본값을 plasma로 변경 (보라/청록 계열)
  opacity = 0.6,
  heightScale = 2,
  onPointClick,
  storeBounds,  // 🆕 매장 경계
}: HeatmapOverlayProps) {
  const [selectedPoint, setSelectedPoint] = useState<HeatPoint | null>(null);

  // 안전 체크: heatPoints가 없거나 비어있으면 렌더링하지 않음
  if (!heatPoints || !Array.isArray(heatPoints) || heatPoints.length === 0) {
    return null;
  }

  // 매장 경계 사용 (props가 없으면 기본값)
  const bounds = storeBounds || DEFAULT_BOUNDS;

  const { geometry, colors } = useMemo(() => {
    // 🆕 매장 크기에 맞게 그리드 생성
    const gridWidth = bounds.width;
    const gridDepth = bounds.depth;
    const segments = 32; // 그리드 세분화
    
    const geo = new THREE.PlaneGeometry(gridWidth, gridDepth, segments, segments);
    const positions = geo.attributes.position.array as Float32Array;
    const colorArray = new Float32Array(positions.length);

    // 🔧 FIX: 유효한 히트 포인트만 필터링 (NaN 방지)
    const validHeatPoints = (heatPoints || []).filter(point =>
      point &&
      typeof point.x === 'number' &&
      typeof point.z === 'number' &&
      typeof point.intensity === 'number' &&
      Number.isFinite(point.x) &&
      Number.isFinite(point.z) &&
      Number.isFinite(point.intensity)
    );

    // 🚀 Quadtree 생성 및 히트포인트 삽입 (성능 최적화)
    const influenceRadius = Math.max(bounds.width, bounds.depth) * 0.15;
    const quadtree = new Quadtree({
      x: bounds.centerX,
      z: bounds.centerZ,
      halfW: bounds.width / 2 + influenceRadius,
      halfH: bounds.depth / 2 + influenceRadius,
    });

    validHeatPoints.forEach((point) => {
      quadtree.insert({ x: point.x, z: point.z, data: point });
    });

    // Create height map and color based on heat intensity
    for (let i = 0; i < positions.length; i += 3) {
      // 🆕 로컬 좌표를 월드 좌표로 변환
      const localX = positions[i];
      const localZ = positions[i + 1];
      const worldX = localX + bounds.centerX;
      const worldZ = localZ + bounds.centerZ;

      // 🚀 Quadtree로 근처 히트포인트만 검색 (O(log n))
      const nearbyPoints = quadtree.query({
        x: worldX,
        z: worldZ,
        halfW: influenceRadius,
        halfH: influenceRadius,
      });

      // Find closest heat point and calculate intensity
      let totalIntensity = 0;
      nearbyPoints.forEach((qp) => {
        const point = qp.data;
        const distance = Math.sqrt(Math.pow(worldX - point.x, 2) + Math.pow(worldZ - point.z, 2));
        const influence = Math.max(0, 1 - distance / influenceRadius) * point.intensity;
        totalIntensity = Math.max(totalIntensity, influence);
      });

      // Normalize intensity
      const normalizedIntensity = Math.min(totalIntensity / maxIntensity, 1);

      // Set height based on intensity
      positions[i + 2] = normalizedIntensity * heightScale;

      // Set color based on intensity
      const color = getHeatColor(normalizedIntensity, colorScale);
      colorArray[i] = color.r;
      colorArray[i + 1] = color.g;
      colorArray[i + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geo.computeVertexNormals();

    return { geometry: geo, colors: colorArray };
  }, [heatPoints, maxIntensity, heightScale, colorScale, bounds]);

  const handlePointClick = (point: HeatPoint) => {
    setSelectedPoint(point);
    onPointClick?.(point);
  };

  return (
    <group>
      {/* 히트맵 메시 - 🆕 매장 중심에 배치 */}
      <mesh
        geometry={geometry}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[bounds.centerX, 0.1, bounds.centerZ]}
        onClick={(e) => {
          e.stopPropagation();
          const p = e.point;
          // Find closest heat point
          let closest = heatPoints[0];
          let minDist = Infinity;
          heatPoints.forEach((hp) => {
            const dist = Math.sqrt(Math.pow(p.x - hp.x, 2) + Math.pow(p.z - hp.z, 2));
            if (dist < minDist) {
              minDist = dist;
              closest = hp;
            }
          });
          if (closest) handlePointClick(closest);
        }}
      >
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 히트 포인트 마커 */}
      {heatPoints.map((point, idx) => {
        const color = getHeatColor(point.intensity / maxIntensity, colorScale);
        return (
          <mesh
            key={idx}
            position={[point.x, (point.intensity / maxIntensity) * heightScale + 0.2, point.z]}
            onClick={(e) => {
              e.stopPropagation();
              handlePointClick(point);
            }}
          >
            <sphereGeometry args={[0.2, 16, 16]} />
            <meshStandardMaterial
              color={color.hex}
              emissive={color.hex}
              emissiveIntensity={selectedPoint === point ? 0.8 : 0.3}
              transparent
              opacity={0.8}
            />
          </mesh>
        );
      })}

      {/* 선택된 포인트 정보 */}
      {selectedPoint && (
        <Html
          position={[
            selectedPoint.x,
            (selectedPoint.intensity / maxIntensity) * heightScale + 1.5,
            selectedPoint.z,
          ]}
          center
        >
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">히트맵 포인트</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPoint(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">위치:</span>
                <span className="font-mono">
                  ({selectedPoint.x.toFixed(1)}, {selectedPoint.z.toFixed(1)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">밀집도:</span>
                <span
                  className="font-semibold"
                  style={{ color: getHeatColor(selectedPoint.intensity / maxIntensity, colorScale).hex }}
                >
                  {((selectedPoint.intensity / maxIntensity) * 100).toFixed(0)}%
                </span>
              </div>
              {selectedPoint.label && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">라벨:</span>
                  <span>{selectedPoint.label}</span>
                </div>
              )}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 히트 색상 계산 - 고도화된 색상 스킴
// ============================================================================
type ColorScale = 'thermal' | 'viridis' | 'plasma' | 'cool';

// 색상 스킴 정의 (정확한 그라데이션 스톱)
const COLOR_SCHEMES = {
  thermal: [
    { stop: 0.0, r: 0, g: 0, b: 128 },      // 진한 파랑
    { stop: 0.25, r: 0, g: 128, b: 255 },   // 밝은 파랑
    { stop: 0.5, r: 0, g: 255, b: 128 },    // 청록
    { stop: 0.75, r: 255, g: 255, b: 0 },   // 노랑
    { stop: 1.0, r: 255, g: 0, b: 0 },      // 빨강
  ],
  viridis: [
    { stop: 0.0, r: 68, g: 1, b: 84 },      // 진한 보라
    { stop: 0.25, r: 59, g: 82, b: 139 },   // 파랑보라
    { stop: 0.5, r: 33, g: 145, b: 140 },   // 청록
    { stop: 0.75, r: 94, g: 201, b: 98 },   // 연두
    { stop: 1.0, r: 253, g: 231, b: 37 },   // 노랑
  ],
  plasma: [
    { stop: 0.0, r: 13, g: 8, b: 135 },     // 진한 파랑
    { stop: 0.25, r: 126, g: 3, b: 168 },   // 보라
    { stop: 0.5, r: 204, g: 71, b: 120 },   // 분홍보라
    { stop: 0.75, r: 248, g: 149, b: 64 },  // 주황
    { stop: 1.0, r: 240, g: 249, b: 33 },   // 노랑
  ],
  cool: [
    { stop: 0.0, r: 100, g: 150, b: 255 },  // 연한 파랑
    { stop: 0.5, r: 150, g: 100, b: 255 },  // 보라
    { stop: 1.0, r: 255, g: 100, b: 150 },  // 분홍
  ],
};

function getHeatColor(
  intensity: number,
  scale: ColorScale = 'plasma'
): { r: number; g: number; b: number; hex: string } {
  const stops = COLOR_SCHEMES[scale];
  const clampedIntensity = Math.max(0, Math.min(1, intensity));

  // 적절한 색상 구간 찾기
  let lowerStop = stops[0];
  let upperStop = stops[stops.length - 1];

  for (let i = 0; i < stops.length - 1; i++) {
    if (clampedIntensity >= stops[i].stop && clampedIntensity <= stops[i + 1].stop) {
      lowerStop = stops[i];
      upperStop = stops[i + 1];
      break;
    }
  }

  // 선형 보간
  const range = upperStop.stop - lowerStop.stop;
  const t = range > 0 ? (clampedIntensity - lowerStop.stop) / range : 0;

  const r = Math.round(lowerStop.r + (upperStop.r - lowerStop.r) * t) / 255;
  const g = Math.round(lowerStop.g + (upperStop.g - lowerStop.g) * t) / 255;
  const b = Math.round(lowerStop.b + (upperStop.b - lowerStop.b) * t) / 255;

  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  const hex = '#' + toHex(r) + toHex(g) + toHex(b);

  return { r, g, b, hex };
}

export default HeatmapOverlay;
