/**
 * CongestionOverlay.tsx
 *
 * 혼잡도 3D 오버레이
 * - 시간대별 밀집도 히트맵 애니메이션
 * - 존별 밀도 마커
 * - 군중 시뮬레이션 시각화
 */

import { useMemo, useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import type { CongestionSimulationResult, HourlyCongestion, ZoneCongestion } from '../hooks/useCongestionSimulation';

// ============================================================================
// 타입 정의
// ============================================================================

interface CongestionOverlayProps {
  result: CongestionSimulationResult | null;
  showHeatmap?: boolean;
  showZoneMarkers?: boolean;
  showCrowdAnimation?: boolean;
  animateTimeProgress?: boolean;
  currentHour?: string;
  onZoneClick?: (zoneId: string) => void;
  onTimeChange?: (hour: string) => void;
}

// ============================================================================
// 컴포넌트
// ============================================================================

export function CongestionOverlay({
  result,
  showHeatmap = true,
  showZoneMarkers = true,
  showCrowdAnimation = true,
  animateTimeProgress = false,
  currentHour,
  onZoneClick,
  onTimeChange,
}: CongestionOverlayProps) {
  const [activeHour, setActiveHour] = useState<string>('14:00');
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);
  const timeProgressRef = useRef(0);

  // 시간 애니메이션
  useEffect(() => {
    if (currentHour) {
      setActiveHour(currentHour);
    }
  }, [currentHour]);

  useFrame((_, delta) => {
    if (!animateTimeProgress || !result) return;

    timeProgressRef.current += delta * 0.1;
    if (timeProgressRef.current > 1) timeProgressRef.current = 0;

    const hourIdx = Math.floor(timeProgressRef.current * result.hourlyData.length);
    const hour = result.hourlyData[hourIdx]?.hour;
    if (hour && hour !== activeHour) {
      setActiveHour(hour);
      onTimeChange?.(hour);
    }
  });

  if (!result) return null;

  const { visualization, hourlyData, zoneData, summary } = result;

  // 안전 체크: visualization 및 데이터 배열 확인
  const hasVisualization = visualization && typeof visualization === 'object';
  const hasTimeSeriesHeatmaps = hasVisualization && Array.isArray(visualization.timeSeriesHeatmaps);
  const hasHourlyData = Array.isArray(hourlyData);
  const hasZoneData = Array.isArray(zoneData);
  const hasSummary = summary && typeof summary === 'object';

  // 현재 시간대 히트맵 데이터
  const currentHeatmap = hasTimeSeriesHeatmaps ? visualization.timeSeriesHeatmaps.find(h => h.hour === activeHour) : null;
  const currentHourData = hasHourlyData ? hourlyData.find(h => h.hour === activeHour) : null;

  return (
    <group name="congestion-overlay">
      {/* 시간대 히트맵 */}
      {showHeatmap && currentHeatmap && (
        <CongestionHeatmap
          data={currentHeatmap.heatmap}
          congestionLevel={currentHourData?.congestion || 50}
        />
      )}

      {/* 존별 밀도 마커 */}
      {showZoneMarkers && hasZoneData && zoneData.map((zone) => (
        <ZoneDensityMarker
          key={zone.zoneId}
          zone={zone}
          isHovered={hoveredZone === zone.zoneId}
          onClick={() => onZoneClick?.(zone.zoneId)}
          onHover={(hovered) => setHoveredZone(hovered ? zone.zoneId : null)}
        />
      ))}

      {/* 군중 애니메이션 */}
      {showCrowdAnimation && currentHourData && hasSummary && (
        <CrowdAnimation
          density={currentHourData.congestion / 100}
          maxCustomers={summary.maxCapacity || 100}
        />
      )}

      {/* 시간 표시 UI */}
      {hasHourlyData && hasSummary && (
        <TimeIndicator
          currentHour={activeHour}
          hourlyData={hourlyData}
          peakTime={summary.peakTime || '14:00'}
        />
      )}

      {/* 전체 혼잡도 지표 */}
      {hasSummary && (
        <CongestionIndicator
          congestion={currentHourData?.congestion || 0}
          riskLevel={summary.riskLevel || 'low'}
        />
      )}
    </group>
  );
}

// ============================================================================
// 혼잡도 히트맵 컴포넌트
// ============================================================================

interface CongestionHeatmapProps {
  data: Array<{ x: number; z: number; density: number }>;
  congestionLevel: number;
}

function CongestionHeatmap({ data, congestionLevel }: CongestionHeatmapProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const geometry = useMemo(() => {
    const gridSize = 12;
    const geo = new THREE.PlaneGeometry(gridSize, gridSize, 20, 20);
    const positions = geo.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);

    // 🔧 FIX: 유효한 데이터만 필터링 (NaN 방지)
    const validData = (data || []).filter(point => 
      point &&
      typeof point.x === 'number' && 
      typeof point.z === 'number' && 
      typeof point.density === 'number' &&
      Number.isFinite(point.x) && 
      Number.isFinite(point.z) &&
      Number.isFinite(point.density)
    );

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];

      let density = 0;
      validData.forEach((point) => {
        const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
        if (dist < 2) {
          density = Math.max(density, point.density * (1 - dist / 2));
        }
      });

      positions[i + 2] = density * 0.8;

      // 색상: 녹색 -> 노란색 -> 빨간색
      const color = getCongestionColor(density);
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [data]);

  // 혼잡도에 따른 펄스 애니메이션
  useFrame(({ clock }) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      const pulse = (Math.sin(clock.elapsedTime * 2) + 1) / 2;
      material.emissiveIntensity = 0.1 + (congestionLevel / 100) * pulse * 0.3;
    }
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.02, 0]}
    >
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.6}
        side={THREE.DoubleSide}
        emissive="#ffffff"
        emissiveIntensity={0.1}
      />
    </mesh>
  );
}

function getCongestionColor(density: number): { r: number; g: number; b: number } {
  if (density < 0.4) {
    const t = density / 0.4;
    return { r: t, g: 0.8, b: 0.2 - t * 0.2 };
  } else if (density < 0.7) {
    const t = (density - 0.4) / 0.3;
    return { r: 1, g: 0.8 - t * 0.5, b: 0 };
  } else {
    const t = (density - 0.7) / 0.3;
    return { r: 1, g: 0.3 - t * 0.3, b: 0 };
  }
}

// ============================================================================
// 존별 밀도 마커 컴포넌트
// ============================================================================

interface ZoneDensityMarkerProps {
  zone: ZoneCongestion;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function ZoneDensityMarker({
  zone,
  isHovered,
  onClick,
  onHover,
}: ZoneDensityMarkerProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  // 존 위치 매핑
  const zonePositions: Record<string, [number, number, number]> = {
    entrance: [-4, 0, 0],
    'zone-a': [0, 0, 3],
    'zone-b': [0, 0, -3],
    'zone-c': [4, 0, 0],
    checkout: [4, 0, 3],
  };

  const position = zonePositions[zone.zoneId] || [0, 0, 0];

  // 리스크 색상
  const color = zone.riskLevel === 'high' ? '#ef4444' :
                zone.riskLevel === 'medium' ? '#f59e0b' : '#22c55e';

  // 펄스 애니메이션
  useFrame(({ clock }) => {
    if (meshRef.current && zone.riskLevel === 'high') {
      const scale = 1 + Math.sin(clock.elapsedTime * 4) * 0.15;
      meshRef.current.scale.setScalar(scale);
    }
  });

  const height = 0.5 + (zone.congestion / 100) * 2;

  return (
    <group position={position}>
      {/* 밀도 기둥 */}
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        onClick={onClick}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
      >
        <cylinderGeometry args={[0.5, 0.5, height, 16]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isHovered ? 0.6 : 0.3}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* 바닥 링 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.6, 1.2, 32]} />
        <meshBasicMaterial
          color={color}
          side={THREE.DoubleSide}
          transparent
          opacity={0.3}
        />
      </mesh>

      {/* 존 이름 */}
      <Text
        position={[0, height + 0.5, 0]}
        fontSize={0.3}
        color={color}
        anchorX="center"
        anchorY="bottom"
      >
        {zone.zoneName}
      </Text>

      {/* 혼잡도 수치 */}
      <Text
        position={[0, height + 0.2, 0]}
        fontSize={0.4}
        color="#ffffff"
        anchorX="center"
        anchorY="bottom"
        fontWeight="bold"
      >
        {zone.congestion}%
      </Text>

      {/* 호버 정보 패널 */}
      {isHovered && (
        <Html position={[0, height + 1.5, 0]} center>
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg min-w-[140px]">
            <h4 className="font-semibold text-xs mb-1">{zone.zoneName}</h4>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">혼잡도:</span>
                <span style={{ color }}>{zone.congestion}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">수용인원:</span>
                <span>{zone.currentOccupancy}/{zone.capacity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">피크시간:</span>
                <span>{zone.peakTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">평균체류:</span>
                <span>{Math.floor(zone.avgDwellTime / 60)}분</span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 군중 애니메이션 컴포넌트
// ============================================================================

interface CrowdAnimationProps {
  density: number;
  maxCustomers: number;
}

function CrowdAnimation({ density, maxCustomers }: CrowdAnimationProps) {
  const groupRef = useRef<THREE.Group>(null);
  const customerCount = Math.floor(density * maxCustomers);

  // 고객 위치 생성
  const customers = useMemo(() => {
    return Array.from({ length: Math.min(customerCount, 30) }, (_, i) => ({
      id: i,
      position: [
        (Math.random() - 0.5) * 10,
        0.3,
        (Math.random() - 0.5) * 10,
      ] as [number, number, number],
      speed: 0.5 + Math.random() * 0.5,
      direction: Math.random() * Math.PI * 2,
    }));
  }, [customerCount]);

  // 고객 이동 애니메이션
  useFrame((_, delta) => {
    if (!groupRef.current) return;

    groupRef.current.children.forEach((child, idx) => {
      if (child instanceof THREE.Mesh && customers[idx]) {
        const customer = customers[idx];
        child.position.x += Math.cos(customer.direction) * customer.speed * delta;
        child.position.z += Math.sin(customer.direction) * customer.speed * delta;

        // 경계 체크
        if (Math.abs(child.position.x) > 5) {
          customers[idx].direction = Math.PI - customer.direction;
        }
        if (Math.abs(child.position.z) > 5) {
          customers[idx].direction = -customer.direction;
        }
      }
    });
  });

  return (
    <group ref={groupRef}>
      {customers.map((customer) => (
        <mesh key={customer.id} position={customer.position}>
          <capsuleGeometry args={[0.15, 0.3, 4, 8]} />
          <meshStandardMaterial
            color="#60a5fa"
            emissive="#60a5fa"
            emissiveIntensity={0.2}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================================
// 시간 표시 컴포넌트
// ============================================================================

interface TimeIndicatorProps {
  currentHour: string;
  hourlyData: HourlyCongestion[];
  peakTime: string;
}

function TimeIndicator({ currentHour, hourlyData, peakTime }: TimeIndicatorProps) {
  const isPeakHour = currentHour === peakTime.split(' ')[0] || currentHour === peakTime;

  return (
    <Html position={[-5, 3, 5]} center>
      <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground">현재 시간</div>
          <div className={`text-lg font-bold ${isPeakHour ? 'text-red-500' : 'text-foreground'}`}>
            {currentHour}
          </div>
          {isPeakHour && (
            <div className="text-[10px] text-red-500 font-medium">피크 타임</div>
          )}
        </div>

        {/* 타임라인 미니 차트 */}
        <div className="flex gap-0.5 mt-2">
          {hourlyData.slice(0, 12).map((h, idx) => (
            <div
              key={idx}
              className={`w-2 transition-all ${h.hour === currentHour ? 'ring-1 ring-white' : ''}`}
              style={{
                height: `${h.congestion / 3}px`,
                backgroundColor: h.congestion >= 80 ? '#ef4444' :
                                 h.congestion >= 60 ? '#f59e0b' : '#22c55e',
                opacity: h.hour === currentHour ? 1 : 0.5,
              }}
              title={`${h.hour}: ${h.congestion}%`}
            />
          ))}
        </div>
      </div>
    </Html>
  );
}

// ============================================================================
// 혼잡도 지표 컴포넌트
// ============================================================================

interface CongestionIndicatorProps {
  congestion: number;
  riskLevel: 'high' | 'medium' | 'low';
}

function CongestionIndicator({ congestion, riskLevel }: CongestionIndicatorProps) {
  const color = riskLevel === 'high' ? '#ef4444' :
                riskLevel === 'medium' ? '#f59e0b' : '#22c55e';

  const riskLabel = riskLevel === 'high' ? '높음' :
                    riskLevel === 'medium' ? '보통' : '낮음';

  return (
    <Html position={[5, 3, 5]} center>
      <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg">
        <div className="text-center">
          <div className="text-[10px] text-muted-foreground">현재 혼잡도</div>
          <div
            className="text-2xl font-bold"
            style={{ color }}
          >
            {congestion}%
          </div>
          <div
            className="text-[10px] font-medium px-2 py-0.5 rounded"
            style={{
              backgroundColor: `${color}20`,
              color,
            }}
          >
            위험도: {riskLabel}
          </div>
        </div>
      </div>
    </Html>
  );
}

export default CongestionOverlay;
