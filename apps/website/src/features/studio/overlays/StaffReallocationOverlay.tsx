/**
 * StaffReallocationOverlay.tsx
 *
 * 인력 재배치 3D 오버레이
 * - 현재 위치 (As-Is) → 최적화 위치 (To-Be) 이동 경로 표시
 * - 직원 정보 라벨
 * - 우선순위별 색상
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { StaffReallocation } from '../types/staffOptimization.types';
import { ROLE_ICONS, ROLE_LABELS } from '../types/staffOptimization.types';

interface StaffReallocationOverlayProps {
  visible: boolean;
  reallocations: StaffReallocation[];
}

export const StaffReallocationOverlay: React.FC<StaffReallocationOverlayProps> = ({
  visible,
  reallocations,
}) => {
  if (!visible || !reallocations.length) return null;

  return (
    <group name="staff-reallocation-overlay">
      {reallocations.map((realloc, idx) => (
        <StaffMoveIndicator key={idx} reallocation={realloc} index={idx} />
      ))}
    </group>
  );
};

// ===== 개별 직원 이동 표시 =====
interface StaffMoveIndicatorProps {
  reallocation: StaffReallocation;
  index: number;
}

const StaffMoveIndicator: React.FC<StaffMoveIndicatorProps> = ({
  reallocation: r,
  index,
}) => {
  const dotRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(index * 0.3); // 시작 위치 오프셋

  const from = useMemo(
    () => new THREE.Vector3(r.from_position.x, 0.5, r.from_position.z),
    [r.from_position]
  );
  const to = useMemo(
    () => new THREE.Vector3(r.to_position.x, 0.5, r.to_position.z),
    [r.to_position]
  );

  // 곡선 경로
  const { points, mid } = useMemo(() => {
    const midPoint = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
    midPoint.y = 1.5 + index * 0.3; // 겹침 방지

    const curve = new THREE.QuadraticBezierCurve3(from, midPoint, to);
    return { points: curve.getPoints(30), mid: midPoint };
  }, [from, to, index]);

  // 우선순위별 색상
  const colors = {
    high: '#ef4444',
    medium: '#eab308',
    low: '#3b82f6',
  };
  const color = colors[r.priority];

  // 애니메이션
  useFrame((_, delta) => {
    if (dotRef.current && points.length > 0) {
      progressRef.current = (progressRef.current + delta * 0.3) % 1;

      const idx = Math.floor(progressRef.current * (points.length - 1));
      const nextIdx = Math.min(idx + 1, points.length - 1);
      const t = (progressRef.current * (points.length - 1)) % 1;

      const pos = new THREE.Vector3().lerpVectors(points[idx], points[nextIdx], t);
      dotRef.current.position.copy(pos);
    }
  });

  return (
    <group>
      {/* 이동 경로 라인 */}
      <Line
        points={points}
        color={color}
        lineWidth={3}
        dashed
        dashSize={0.2}
        dashScale={1}
      />

      {/* 이동하는 점 */}
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshBasicMaterial color={color} />
      </mesh>

      {/* 현재 위치 (As-Is) */}
      <group position={from}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.6, 16]} />
          <meshBasicMaterial
            color="#ef4444"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
        <Html position={[0, 0.8, 0]} center>
          <div className="px-2 py-1 bg-red-500 text-white text-xs rounded whitespace-nowrap shadow-lg">
            As-Is
          </div>
        </Html>
      </group>

      {/* 최적화 위치 (To-Be) */}
      <group position={to}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.4, 0.6, 16]} />
          <meshBasicMaterial
            color="#22c55e"
            transparent
            opacity={0.6}
            side={THREE.DoubleSide}
          />
        </mesh>
        <Html position={[0, 0.8, 0]} center>
          <div className="px-2 py-1 bg-green-500 text-white text-xs rounded whitespace-nowrap shadow-lg">
            To-Be
          </div>
        </Html>
      </group>

      {/* 직원 정보 라벨 */}
      <Html position={[mid.x, mid.y + 0.3, mid.z]} center>
        <div className="px-2 py-1.5 bg-background/95 border rounded-lg text-xs whitespace-nowrap shadow-lg">
          <div className="flex items-center gap-1 font-medium">
            <span>{ROLE_ICONS[r.role] || '👤'}</span>
            <span>{r.staff_name}</span>
          </div>
          <div className="text-muted-foreground text-[10px] mt-0.5">
            {r.from_zone_name} → {r.to_zone_name}
          </div>
        </div>
      </Html>
    </group>
  );
};

export default StaffReallocationOverlay;
