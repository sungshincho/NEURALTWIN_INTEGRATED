/**
 * CustomerFlowOverlay.tsx
 *
 * 고객 동선 오버레이 - 이동 패턴 시각화
 */

import { useMemo } from 'react';
import * as THREE from 'three';
import type { CustomerFlowOverlayProps, FlowVector } from '../types';

// ============================================================================
// CustomerFlowOverlay 컴포넌트
// ============================================================================
export function CustomerFlowOverlay({
  flows,
  arrowScale = 1,
  color = '#00ffff',
  animated = true,
}: CustomerFlowOverlayProps) {
  // 화살표 생성
  const arrows = useMemo(() => {
    return flows.map((flow, idx) => {
      const start = new THREE.Vector3(...flow.start);
      const end = new THREE.Vector3(...flow.end);
      const direction = new THREE.Vector3().subVectors(end, start).normalize();
      const length = start.distanceTo(end);
      const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

      return {
        id: idx,
        start,
        end,
        direction,
        length,
        midpoint,
        magnitude: flow.magnitude,
        count: flow.count,
      };
    });
  }, [flows]);

  return (
    <group>
      {arrows.map((arrow) => (
        <FlowArrow
          key={arrow.id}
          start={arrow.start}
          end={arrow.end}
          magnitude={arrow.magnitude}
          color={color}
          arrowScale={arrowScale}
          count={arrow.count}
        />
      ))}
    </group>
  );
}

// ============================================================================
// FlowArrow 컴포넌트
// ============================================================================
interface FlowArrowProps {
  start: THREE.Vector3;
  end: THREE.Vector3;
  magnitude: number;
  color: string;
  arrowScale: number;
  count?: number;
}

function FlowArrow({ start, end, magnitude, color, arrowScale, count }: FlowArrowProps) {
  const direction = useMemo(() => {
    return new THREE.Vector3().subVectors(end, start).normalize();
  }, [start, end]);

  const midpoint = useMemo(() => {
    return new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
  }, [start, end]);

  const rotation = useMemo(() => {
    const euler = new THREE.Euler();
    euler.setFromQuaternion(
      new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction)
    );
    return euler;
  }, [direction]);

  const lineWidth = Math.max(1, magnitude * 3);
  const opacity = Math.min(0.9, 0.3 + magnitude * 0.6);

  return (
    <group>
      {/* 라인 */}
      <line>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([start.x, start.y, start.z, end.x, end.y, end.z])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} linewidth={lineWidth} transparent opacity={opacity} />
      </line>

      {/* 화살표 머리 */}
      <mesh position={midpoint} rotation={rotation}>
        <coneGeometry args={[0.15 * arrowScale, 0.4 * arrowScale, 8]} />
        <meshBasicMaterial color={color} transparent opacity={opacity} />
      </mesh>

      {/* 카운트 표시 */}
      {count && count > 1 && (
        <mesh position={[midpoint.x, midpoint.y + 0.3, midpoint.z]}>
          <sphereGeometry args={[0.15, 8, 8]} />
          <meshBasicMaterial color={color} transparent opacity={0.6} />
        </mesh>
      )}
    </group>
  );
}

export default CustomerFlowOverlay;
