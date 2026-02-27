/**
 * ZoneBoundaryOverlay.tsx
 *
 * 존 경계 오버레이 - 매장 구역 시각화
 */

import { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';
import type { ZoneBoundaryOverlayProps, ZoneBoundary } from '../types';

// ============================================================================
// ZoneBoundaryOverlay 컴포넌트
// ============================================================================
export function ZoneBoundaryOverlay({
  zones,
  selectedZoneId,
  showLabels = true,
  onZoneSelect,
}: ZoneBoundaryOverlayProps) {
  return (
    <group>
      {zones.map((zone) => (
        <ZoneShape
          key={zone.id}
          zone={zone}
          selected={zone.id === selectedZoneId}
          showLabel={showLabels}
          onClick={() => onZoneSelect?.(zone.id)}
        />
      ))}
    </group>
  );
}

// ============================================================================
// ZoneShape 컴포넌트
// ============================================================================
interface ZoneShapeProps {
  zone: ZoneBoundary;
  selected: boolean;
  showLabel: boolean;
  onClick?: () => void;
}

function ZoneShape({ zone, selected, showLabel, onClick }: ZoneShapeProps) {
  const color = zone.color || (selected ? '#3b82f6' : '#6b7280');
  const height = zone.height || 0.1;

  // 존 중심 계산
  const center = useMemo(() => {
    const sum = zone.points.reduce(
      (acc, p) => ({ x: acc.x + p[0], z: acc.z + p[2] }),
      { x: 0, z: 0 }
    );
    return {
      x: sum.x / zone.points.length,
      z: sum.z / zone.points.length,
    };
  }, [zone.points]);

  // 경계선 포인트
  const linePoints = useMemo(() => {
    const points = zone.points.map((p) => new THREE.Vector3(p[0], height, p[2]));
    // 닫힌 폴리곤
    if (points.length > 0) {
      points.push(points[0].clone());
    }
    return points;
  }, [zone.points, height]);

  // 바닥 형상
  const floorShape = useMemo(() => {
    if (zone.points.length < 3) return null;

    const shape = new THREE.Shape();
    shape.moveTo(zone.points[0][0], zone.points[0][2]);
    for (let i = 1; i < zone.points.length; i++) {
      shape.lineTo(zone.points[i][0], zone.points[i][2]);
    }
    shape.closePath();

    return shape;
  }, [zone.points]);

  return (
    <group onClick={onClick}>
      {/* 바닥 영역 */}
      {floorShape && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <shapeGeometry args={[floorShape]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={selected ? 0.3 : 0.15}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}

      {/* 경계선 */}
      {linePoints.length > 1 && (
        <Line
          points={linePoints}
          color={color}
          lineWidth={selected ? 3 : 2}
          transparent
          opacity={selected ? 1 : 0.7}
        />
      )}

      {/* 라벨 */}
      {showLabel && (
        <Html position={[center.x, height + 0.5, center.z]} center>
          <div
            className={`
              px-2 py-1 rounded text-xs font-medium whitespace-nowrap
              ${selected
                ? 'bg-primary text-primary-foreground'
                : 'bg-black/70 text-white/80'
              }
            `}
          >
            {zone.name}
          </div>
        </Html>
      )}

      {/* 선택 표시 */}
      {selected && (
        <mesh position={[center.x, height + 0.1, center.z]}>
          <sphereGeometry args={[0.15, 16, 16]} />
          <meshBasicMaterial color={color} />
        </mesh>
      )}
    </group>
  );
}

export default ZoneBoundaryOverlay;
