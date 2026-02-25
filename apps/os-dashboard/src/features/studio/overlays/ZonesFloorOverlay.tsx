/**
 * ZonesFloorOverlay.tsx
 *
 * zones_dim 테이블 기반 구역 바닥 오버레이
 * - DB에서 로드한 zones_dim 데이터를 3D로 시각화
 * - 구역별 색상, 라벨, 테두리 표시
 */

import { useMemo } from 'react';
import { Html, Line } from '@react-three/drei';
import * as THREE from 'three';

// ============================================================================
// 타입 정의
// ============================================================================

export interface ZoneDimData {
  id: string;
  zone_code?: string;
  zone_name: string;
  zone_type: string;
  position_x: number;
  position_y?: number;
  position_z: number;
  size_width: number;
  size_depth: number;
  size_height?: number;
  coordinates?: {
    x?: number;
    y?: number;
    z?: number;
    width?: number;
    depth?: number;
  } | null;
}

interface ZonesFloorOverlayProps {
  zones: ZoneDimData[];
  visible?: boolean;
  showLabels?: boolean;
  opacity?: number;
  selectedZoneId?: string;
  onZoneClick?: (zoneId: string) => void;
}

// ============================================================================
// 구역 타입별 색상 정의
// ============================================================================

const ZONE_COLORS: Record<string, string> = {
  // 주요 영역
  entrance: '#3B82F6',    // 파랑 - 입구
  entry: '#3B82F6',       // 파랑 - 입구
  exit: '#6366F1',        // 인디고 - 출구
  main: '#6B7280',        // 회색 - 메인홀
  display: '#10B981',     // 초록 - 전시존
  fitting: '#8B5CF6',     // 보라 - 피팅룸
  checkout: '#F59E0B',    // 주황 - 계산대
  cashier: '#F59E0B',     // 주황 - 계산대
  lounge: '#EC4899',      // 핑크 - 휴식공간
  rest: '#EC4899',        // 핑크 - 휴식공간
  storage: '#78716C',     // 석회색 - 창고
  staff: '#0EA5E9',       // 스카이블루 - 직원 공간
  promotion: '#EF4444',   // 빨강 - 프로모션 존
  // 기본값
  default: '#9CA3AF',     // 중간 회색
};

// ============================================================================
// 개별 존 컴포넌트
// ============================================================================

interface ZoneFloorProps {
  zone: ZoneDimData;
  showLabel?: boolean;
  opacity?: number;
  isSelected?: boolean;
  onClick?: () => void;
}

function ZoneFloor({
  zone,
  showLabel = true,
  opacity = 0.3,
  isSelected = false,
  onClick,
}: ZoneFloorProps) {
  // 위치 및 크기 추출
  const x = zone.position_x ?? zone.coordinates?.x ?? 0;
  const z = zone.position_z ?? zone.coordinates?.z ?? 0;
  const width = zone.size_width ?? zone.coordinates?.width ?? 3;
  const depth = zone.size_depth ?? zone.coordinates?.depth ?? 3;

  // 색상 결정
  const zoneType = (zone.zone_type || '').toLowerCase();
  const zoneName = (zone.zone_name || '').toLowerCase();

  // zone_type 우선, 없으면 zone_name에서 추론
  let color = ZONE_COLORS[zoneType] || ZONE_COLORS.default;

  if (color === ZONE_COLORS.default) {
    // 이름 기반 색상 추론
    if (zoneName.includes('입구') || zoneName.includes('entrance')) {
      color = ZONE_COLORS.entrance;
    } else if (zoneName.includes('메인') || zoneName.includes('main')) {
      color = ZONE_COLORS.main;
    } else if (zoneName.includes('계산') || zoneName.includes('checkout')) {
      color = ZONE_COLORS.checkout;
    } else if (zoneName.includes('피팅') || zoneName.includes('fitting')) {
      color = ZONE_COLORS.fitting;
    } else if (zoneName.includes('휴식') || zoneName.includes('lounge')) {
      color = ZONE_COLORS.lounge;
    } else if (zoneName.includes('프로모션') || zoneName.includes('promotion')) {
      color = ZONE_COLORS.promotion;
    }
  }

  // 테두리 포인트 계산
  const borderPoints = useMemo(() => {
    const halfW = width / 2;
    const halfD = depth / 2;
    const y = 0.02; // 살짝 띄움

    return [
      new THREE.Vector3(x - halfW, y, z - halfD),
      new THREE.Vector3(x + halfW, y, z - halfD),
      new THREE.Vector3(x + halfW, y, z + halfD),
      new THREE.Vector3(x - halfW, y, z + halfD),
      new THREE.Vector3(x - halfW, y, z - halfD), // 닫힘
    ];
  }, [x, z, width, depth]);

  const finalOpacity = isSelected ? opacity * 1.5 : opacity;

  return (
    <group onClick={onClick}>
      {/* 바닥 평면 */}
      <mesh
        position={[x, 0.01, z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={finalOpacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 테두리 라인 */}
      <Line
        points={borderPoints}
        color={color}
        lineWidth={isSelected ? 3 : 2}
        transparent
        opacity={isSelected ? 1 : 0.8}
      />

      {/* 라벨 */}
      {showLabel && (
        <Html
          position={[x, 0.5, z]}
          center
          style={{ pointerEvents: 'none' }}
        >
          <div
            className={`
              px-2 py-1 rounded text-xs whitespace-nowrap
              ${isSelected
                ? 'bg-white text-gray-900 font-medium shadow-lg'
                : 'bg-gray-900/80 text-white'
              }
            `}
          >
            {zone.zone_name}
          </div>
        </Html>
      )}

      {/* 선택 시 코너 마커 */}
      {isSelected && (
        <>
          {[
            [x - width / 2, z - depth / 2],
            [x + width / 2, z - depth / 2],
            [x + width / 2, z + depth / 2],
            [x - width / 2, z + depth / 2],
          ].map(([cx, cz], idx) => (
            <mesh key={idx} position={[cx, 0.05, cz]}>
              <sphereGeometry args={[0.1, 8, 8]} />
              <meshBasicMaterial color={color} />
            </mesh>
          ))}
        </>
      )}
    </group>
  );
}

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function ZonesFloorOverlay({
  zones,
  visible = true,
  showLabels = true,
  opacity = 0.3,
  selectedZoneId,
  onZoneClick,
}: ZonesFloorOverlayProps) {
  if (!visible || !zones || zones.length === 0) {
    return null;
  }

  return (
    <group name="zones-floor-overlay">
      {zones.map((zone) => (
        <ZoneFloor
          key={zone.id}
          zone={zone}
          showLabel={showLabels}
          opacity={opacity}
          isSelected={zone.id === selectedZoneId}
          onClick={() => onZoneClick?.(zone.id)}
        />
      ))}
    </group>
  );
}

export default ZonesFloorOverlay;
