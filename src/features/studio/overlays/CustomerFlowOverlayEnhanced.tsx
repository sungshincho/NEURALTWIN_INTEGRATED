/**
 * CustomerFlowOverlayEnhanced.tsx
 *
 * 고객 동선 흐름 오버레이 (개선 버전)
 * - 존 간 평균 이동 패턴을 라인 + 애니메이션으로 표시
 * - 라인 두께/색상 = 이동 빈도
 * - 애니메이션 점 = 이동 방향
 * - useCustomerFlowData 훅 사용
 */

import React, { useRef, useMemo } from 'react';
import * as THREE from 'three';
import { Line, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useCustomerFlowData, FlowPath, ZoneInfo, FlowBottleneck } from '../hooks/useCustomerFlowData';

interface CustomerFlowOverlayEnhancedProps {
  visible: boolean;
  storeId: string;
  showLabels?: boolean;
  showBottlenecks?: boolean;
  showZoneMarkers?: boolean;
  minOpacity?: number;
}

export const CustomerFlowOverlayEnhanced: React.FC<CustomerFlowOverlayEnhancedProps> = ({
  visible,
  storeId,
  showLabels = true,
  showBottlenecks = true,
  showZoneMarkers = true,
  minOpacity = 0.3,
}) => {
  const { data, isLoading, error, status, fetchStatus } = useCustomerFlowData({
    storeId,
    daysRange: 30,
    minTransitionCount: 10,
    enabled: visible && !!storeId,
  });

  // 🔧 FIX: 색상 정규화를 위한 min/max 계산 (필터된 paths 기준)
  const { minCount, maxCount } = useMemo(() => {
    if (!data?.flowPaths || data.flowPaths.length === 0) {
      return { minCount: 0, maxCount: 1 };
    }
    const counts = data.flowPaths.map(p => p.transition_count);
    return {
      minCount: Math.min(...counts),
      maxCount: Math.max(...counts),
    };
  }, [data?.flowPaths]);

  // 디버그: 쿼리 상태 상세 로깅
  console.log('[CustomerFlowOverlayEnhanced] 쿼리 상태:', {
    visible,
    storeId: storeId || '(empty)',
    status,
    fetchStatus,
    isLoading,
    hasData: !!data,
    flowPathsCount: data?.flowPaths?.length ?? 0,
    zonesCount: data?.zones?.length ?? 0,
    errorMsg: error?.message,
  });

  if (!visible) return null;

  if (isLoading || status === 'pending') {
    return (
      <Html center>
        <div className="px-4 py-2 bg-black/80 rounded-lg text-sm text-white">
          동선 데이터 로딩 중... (storeId: {storeId?.slice(0, 8) || 'N/A'})
        </div>
      </Html>
    );
  }

  if (error || !data) {
    console.warn('[CustomerFlowOverlayEnhanced] 데이터 없음:', { error: error?.message, data, storeId });
    return null;
  }

  // flowPaths가 비어있어도 zones가 있으면 마커는 표시
  if (data.flowPaths.length === 0) {
    console.log('[CustomerFlowOverlayEnhanced] flowPaths 비어있음, zones:', data.zones.length);
    // zones만 있으면 존 마커라도 표시
    if (data.zones.length > 0 && showZoneMarkers) {
      return (
        <group name="customer-flow-overlay-enhanced">
          {data.zones.map((zone) => (
            <ZoneMarker
              key={zone.id}
              zone={zone}
              isEntrance={zone.id === data.entranceZone?.id}
              isExit={data.exitZones.some(e => e.id === zone.id)}
              isHotspot={false}
            />
          ))}
        </group>
      );
    }
    return null;
  }

  return (
    <group name="customer-flow-overlay-enhanced">
      {/* 동선 라인들 */}
      {data.flowPaths.map((path) => (
        <FlowPathLine
          key={path.id}
          path={path}
          minCount={minCount}
          maxCount={maxCount}
          showLabel={showLabels}
          minOpacity={minOpacity}
        />
      ))}

      {/* 존 마커 (선택적) */}
      {showZoneMarkers && data.zones.map((zone) => (
        <ZoneMarker
          key={zone.id}
          zone={zone}
          isEntrance={zone.id === data.entranceZone?.id}
          isExit={data.exitZones.some(e => e.id === zone.id)}
          isHotspot={data.hotspotZones.some(h => h.id === zone.id)}
        />
      ))}

      {/* 병목 지점 표시 */}
      {showBottlenecks && data.bottlenecks.map((bottleneck, idx) => (
        <BottleneckMarker key={idx} bottleneck={bottleneck} />
      ))}
    </group>
  );
};

// ===== 개별 동선 라인 =====
interface FlowPathLineProps {
  path: FlowPath;
  minCount: number;  // 🔧 FIX: 최소값 추가
  maxCount: number;
  showLabel: boolean;
  minOpacity: number;
}

const FlowPathLine: React.FC<FlowPathLineProps> = ({
  path,
  minCount,
  maxCount,
  showLabel,
  minOpacity,
}) => {
  const dotRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(Math.random()); // 시작 위치 랜덤

  // 🔧 FIX: min-max 범위 기반 정규화 (0-1)
  // 이전: path.transition_count / maxCount (절대값 기준 → 모두 빨간색 문제)
  // 수정: (count - min) / (max - min) (상대값 기준 → 초록/노랑/빨강 분포)
  const range = maxCount - minCount;
  const normalizedCount = range > 0
    ? (path.transition_count - minCount) / range
    : 0.5;

  // 라인 스타일
  const lineWidth = 1 + normalizedCount * 4; // 1-5px
  const opacity = minOpacity + normalizedCount * (1 - minOpacity);

  // 색상: 빈도에 따라 (초록 → 노랑 → 빨강)
  const color = useMemo(() => {
    if (normalizedCount < 0.33) {
      return '#22c55e'; // 초록 (낮은 빈도)
    } else if (normalizedCount < 0.66) {
      return '#eab308'; // 노랑 (중간 빈도)
    } else {
      return '#ef4444'; // 빨강 (높은 빈도)
    }
  }, [normalizedCount]);

  // 경로 포인트 (베지어 곡선)
  const { points, midPoint } = useMemo(() => {
    const from = new THREE.Vector3(
      path.from_zone.center.x,
      0.15,
      path.from_zone.center.z
    );
    const to = new THREE.Vector3(
      path.to_zone.center.x,
      0.15,
      path.to_zone.center.z
    );

    // 중간점 (위로 살짝 곡선)
    const mid = new THREE.Vector3()
      .addVectors(from, to)
      .multiplyScalar(0.5);
    mid.y = 0.3 + normalizedCount * 0.3; // 빈도가 높을수록 더 높은 곡선

    // 베지어 곡선
    const curve = new THREE.QuadraticBezierCurve3(from, mid, to);
    const curvePoints = curve.getPoints(30);

    return { points: curvePoints, midPoint: mid };
  }, [path, normalizedCount]);

  // 애니메이션: 점이 경로를 따라 이동
  useFrame((_, delta) => {
    if (dotRef.current && points.length > 1) {
      // 속도: 이동 시간에 반비례 (빠른 경로 = 빠른 애니메이션)
      const speed = 60 / Math.max(path.avg_duration_seconds, 30); // 30-180초 → 0.33-2 속도
      progressRef.current = (progressRef.current + delta * speed * 0.5) % 1;

      const idx = Math.floor(progressRef.current * (points.length - 1));
      const nextIdx = Math.min(idx + 1, points.length - 1);
      const t = (progressRef.current * (points.length - 1)) % 1;

      const pos = new THREE.Vector3().lerpVectors(points[idx], points[nextIdx], t);
      dotRef.current.position.copy(pos);
    }
  });

  return (
    <group>
      {/* 경로 라인 */}
      <Line
        points={points}
        color={color}
        lineWidth={lineWidth}
        transparent
        opacity={opacity}
      />

      {/* 이동하는 점 */}
      <mesh ref={dotRef}>
        <sphereGeometry args={[0.1 + normalizedCount * 0.1, 12, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.9} />
      </mesh>

      {/* 방향 화살표 */}
      <FlowArrow
        points={points}
        color={color}
        size={0.15 + normalizedCount * 0.1}
      />

      {/* 라벨 */}
      {showLabel && normalizedCount > 0.3 && (
        <Html position={midPoint.toArray()} center distanceFactor={20}>
          <div className="px-2 py-1 bg-black/90 backdrop-blur-sm rounded-lg text-xs whitespace-nowrap border border-white/20 shadow-lg pointer-events-none">
            <div className="font-medium text-white">
              {path.from_zone.zone_name} → {path.to_zone.zone_name}
            </div>
            <div className="text-white/70 flex items-center gap-2">
              <span>{path.transition_count.toLocaleString()}회</span>
              <span>•</span>
              <span>{path.daily_avg_count}/일</span>
              <span>•</span>
              <span>{Math.round(path.transition_probability * 100)}%</span>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
};

// ===== 방향 화살표 =====
interface FlowArrowProps {
  points: THREE.Vector3[];
  color: string;
  size: number;
}

const FlowArrow: React.FC<FlowArrowProps> = ({ points, color, size }) => {
  const arrowMesh = useMemo(() => {
    if (points.length < 3) return null;

    // 끝에서 약간 앞 위치에 화살표
    const endIdx = points.length - 1;
    const prevIdx = Math.max(0, endIdx - 3);

    const direction = new THREE.Vector3()
      .subVectors(points[endIdx], points[prevIdx])
      .normalize();

    const position = points[endIdx].clone().sub(direction.clone().multiplyScalar(0.3));

    // 화살표 방향 회전
    const quaternion = new THREE.Quaternion();
    const up = new THREE.Vector3(0, 1, 0);
    quaternion.setFromUnitVectors(up, direction);

    return { position, quaternion };
  }, [points]);

  if (!arrowMesh) return null;

  return (
    <mesh position={arrowMesh.position} quaternion={arrowMesh.quaternion}>
      <coneGeometry args={[size, size * 2.5, 8]} />
      <meshBasicMaterial color={color} transparent opacity={0.8} />
    </mesh>
  );
};

// ===== 존 마커 =====
interface ZoneMarkerProps {
  zone: ZoneInfo;
  isEntrance?: boolean;
  isExit?: boolean;
  isHotspot?: boolean;
}

const ZoneMarker: React.FC<ZoneMarkerProps> = ({ zone, isEntrance, isExit, isHotspot }) => {
  const color = isEntrance ? '#3b82f6' : isExit ? '#22c55e' : isHotspot ? '#f59e0b' : '#6366f1';
  const size = isEntrance || isExit ? 1.2 : isHotspot ? 1 : 0.8;

  return (
    <group position={[zone.center.x, 0.05, zone.center.z]}>
      {/* 존 중심 원 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[size * 0.8, size, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* 입구/출구/핫스팟 라벨 */}
      {(isEntrance || isExit || isHotspot) && (
        <Html position={[0, 0.5, 0]} center>
          <div className={`px-2 py-0.5 rounded text-xs text-white ${
            isEntrance ? 'bg-blue-500' : isExit ? 'bg-green-500' : 'bg-amber-500'
          }`}>
            {isEntrance ? '입구' : isExit ? '출구' : '🔥'}
          </div>
        </Html>
      )}
    </group>
  );
};

// ===== 병목 지점 마커 =====
const BottleneckMarker: React.FC<{ bottleneck: FlowBottleneck }> = ({ bottleneck }) => {
  return (
    <group position={[bottleneck.zone.center.x, 0.1, bottleneck.zone.center.z]}>
      {/* 경고 링 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.3, 1.5, 32]} />
        <meshBasicMaterial color="#ef4444" transparent opacity={0.6} side={THREE.DoubleSide} />
      </mesh>

      {/* 라벨 */}
      <Html position={[0, 1, 0]} center>
        <div className="px-2 py-1 bg-red-500/90 text-white rounded text-xs whitespace-nowrap shadow-lg">
          ⚠️ 병목 {bottleneck.bottleneckScore}%
        </div>
      </Html>
    </group>
  );
};

export default CustomerFlowOverlayEnhanced;
