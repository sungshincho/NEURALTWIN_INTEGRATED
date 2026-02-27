/**
 * StaffingOverlay.tsx
 *
 * 인력 배치 최적화 3D 오버레이
 * - 직원 위치 마커
 * - 커버리지 영역 시각화
 * - 이동 경로 표시
 * - 서비스 레벨 히트맵
 */

import { useMemo, useState, useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Line, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { StaffingSimulationResult, StaffPosition, ZoneCoverage } from '../hooks/useStaffingSimulation';

// ============================================================================
// 타입 정의
// ============================================================================

interface StaffingOverlayProps {
  result: StaffingSimulationResult | null;
  showStaffMarkers?: boolean;
  showCoverageZones?: boolean;
  showMovementPaths?: boolean;
  showServiceHeatmap?: boolean;
  showCurrentPositions?: boolean;
  showSuggestedPositions?: boolean;
  animateMovement?: boolean;
  selectedStaffId?: string | null;
  onStaffClick?: (staffId: string) => void;
  onZoneClick?: (zoneId: string) => void;
}

// ============================================================================
// 컴포넌트
// ============================================================================

export function StaffingOverlay({
  result,
  showStaffMarkers = true,
  showCoverageZones = true,
  showMovementPaths = true,
  showServiceHeatmap = true,
  showCurrentPositions = true,
  showSuggestedPositions = true,
  animateMovement = true,
  selectedStaffId,
  onStaffClick,
  onZoneClick,
}: StaffingOverlayProps) {
  const [hoveredStaff, setHoveredStaff] = useState<string | null>(null);
  const [hoveredZone, setHoveredZone] = useState<string | null>(null);

  // 🔧 FIX: result가 없거나 staffPositions가 비어있으면 렌더링 안 함 (임의 데이터 방지)
  if (!result || !result.visualization) return null;
  
  // 🔧 FIX: staffPositions가 0개면 렌더링 안 함
  const hasValidStaffData = result.staffPositions && result.staffPositions.length > 0;
  if (!hasValidStaffData) {
    console.log('[StaffingOverlay] No valid staff data, skipping render');
    return null;
  }

  const { visualization, staffPositions, zoneCoverage, metrics } = result;

  // 안전 체크: visualization이 없으면 일부 요소 렌더링 스킵
  const hasVisualization = visualization && typeof visualization === 'object';
  const hasHeatmap = hasVisualization && Array.isArray(visualization.heatmap) && visualization.heatmap.length > 0;
  const hasCoverageZones = hasVisualization && Array.isArray(visualization.coverageZones);
  const hasMovementPaths = hasVisualization && Array.isArray(visualization.movementPaths);
  const hasStaffMarkers = hasVisualization && Array.isArray(visualization.staffMarkers);

  return (
    <group name="staffing-overlay">
      {/* 서비스 레벨 히트맵 */}
      {showServiceHeatmap && hasHeatmap && (
        <ServiceHeatmap data={visualization.heatmap} />
      )}

      {/* 커버리지 영역 */}
      {showCoverageZones && hasCoverageZones && visualization.coverageZones.map((zone, idx) => (
        <CoverageZone
          key={`coverage-${idx}`}
          zone={zone}
          showCurrent={showCurrentPositions}
          showSuggested={showSuggestedPositions}
        />
      ))}

      {/* 이동 경로 */}
      {showMovementPaths && hasMovementPaths && visualization.movementPaths.map((path) => (
        <MovementPath
          key={path.staffId}
          path={path}
          isSelected={selectedStaffId === path.staffId}
          animate={animateMovement}
        />
      ))}

      {/* 직원 마커 */}
      {showStaffMarkers && hasStaffMarkers && visualization.staffMarkers.map((marker) => (
        <StaffMarker
          key={marker.id}
          marker={marker}
          position={staffPositions.find(s => s.staffId === marker.id)}
          showCurrent={showCurrentPositions}
          showSuggested={showSuggestedPositions}
          isSelected={selectedStaffId === marker.id}
          isHovered={hoveredStaff === marker.id}
          onClick={() => onStaffClick?.(marker.id)}
          onHover={(hovered) => setHoveredStaff(hovered ? marker.id : null)}
        />
      ))}

      {/* 존별 커버리지 표시 */}
      {zoneCoverage.map((zone) => (
        <ZoneCoverageIndicator
          key={zone.zoneId}
          zone={zone}
          isHovered={hoveredZone === zone.zoneId}
          onClick={() => onZoneClick?.(zone.zoneId)}
          onHover={(hovered) => setHoveredZone(hovered ? zone.zoneId : null)}
        />
      ))}

      {/* 메트릭 표시 패널 */}
      <MetricsPanel metrics={metrics} />
    </group>
  );
}

// ============================================================================
// 서비스 레벨 히트맵 컴포넌트
// ============================================================================

interface ServiceHeatmapProps {
  data: Array<{ x: number; z: number; serviceLevel: number }>;
}

function ServiceHeatmap({ data }: ServiceHeatmapProps) {
  const geometry = useMemo(() => {
    const gridSize = 14;
    const geo = new THREE.PlaneGeometry(gridSize, gridSize, 24, 24);
    const positions = geo.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);

    // 🔧 FIX: 유효한 데이터만 필터링 (NaN 방지)
    const validData = (data || []).filter(point => 
      point &&
      typeof point.x === 'number' && 
      typeof point.z === 'number' && 
      typeof point.serviceLevel === 'number' &&
      Number.isFinite(point.x) && 
      Number.isFinite(point.z) &&
      Number.isFinite(point.serviceLevel)
    );

    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];

      let serviceLevel = 0;
      validData.forEach((point) => {
        const dist = Math.sqrt(Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2));
        if (dist < 2.5) {
          serviceLevel = Math.max(serviceLevel, point.serviceLevel * (1 - dist / 2.5));
        }
      });

      positions[i + 2] = serviceLevel * 0.3;

      // 색상: 빨강 (낮음) -> 노랑 (중간) -> 녹색 (높음)
      const color = getServiceLevelColor(serviceLevel);
      colors[i] = color.r;
      colors[i + 1] = color.g;
      colors[i + 2] = color.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    return geo;
  }, [data]);

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.01, 0]}
    >
      <meshStandardMaterial
        vertexColors
        transparent
        opacity={0.4}
        side={THREE.DoubleSide}
        emissive="#ffffff"
        emissiveIntensity={0.05}
      />
    </mesh>
  );
}

function getServiceLevelColor(level: number): { r: number; g: number; b: number } {
  if (level < 0.3) {
    const t = level / 0.3;
    return { r: 1, g: t * 0.5, b: 0 };
  } else if (level < 0.6) {
    const t = (level - 0.3) / 0.3;
    return { r: 1 - t * 0.5, g: 0.5 + t * 0.5, b: 0 };
  } else {
    const t = (level - 0.6) / 0.4;
    return { r: 0.5 - t * 0.3, g: 1, b: t * 0.3 };
  }
}

// ============================================================================
// 커버리지 영역 컴포넌트
// ============================================================================

interface CoverageZoneProps {
  zone: {
    position: { x: number; y: number; z: number };
    radius: number;
    coverage: number;
    type: 'current' | 'optimized';
  };
  showCurrent: boolean;
  showSuggested: boolean;
}

function CoverageZone({ zone, showCurrent, showSuggested }: CoverageZoneProps) {
  const meshRef = useRef<THREE.Mesh>(null);

  const shouldShow = (zone.type === 'current' && showCurrent) ||
                     (zone.type === 'optimized' && showSuggested);

  // 🔧 FIX: position이 유효한지 체크 (NaN 방지)
  const hasValidPosition = zone.position &&
    typeof zone.position.x === 'number' &&
    typeof zone.position.z === 'number' &&
    Number.isFinite(zone.position.x) &&
    Number.isFinite(zone.position.z);

  if (!shouldShow || !hasValidPosition) return null;

  const color = zone.type === 'current' ? '#60a5fa' : '#22c55e';
  const opacity = zone.type === 'current' ? 0.15 : 0.25;

  // 펄스 애니메이션 (최적화 위치만)
  useFrame(({ clock }) => {
    if (meshRef.current && zone.type === 'optimized') {
      const scale = 1 + Math.sin(clock.elapsedTime * 2) * 0.1;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={[zone.position.x, 0.02, zone.position.z]}>
      {/* 커버리지 원 */}
      <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[zone.radius, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={opacity}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 테두리 링 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[zone.radius - 0.05, zone.radius, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.5}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// 이동 경로 컴포넌트
// ============================================================================

interface MovementPathProps {
  path: {
    staffId: string;
    from: { x: number; y: number; z: number };
    to: { x: number; y: number; z: number };
  };
  isSelected: boolean;
  animate: boolean;
}

function MovementPath({ path, isSelected, animate }: MovementPathProps) {
  const markerRef = useRef<THREE.Mesh>(null);
  const progressRef = useRef(0);

  // 이동 애니메이션
  useFrame((_, delta) => {
    if (!animate || !markerRef.current) return;

    progressRef.current += delta * 0.5;
    if (progressRef.current > 1) progressRef.current = 0;

    const t = progressRef.current;
    markerRef.current.position.set(
      path.from.x + (path.to.x - path.from.x) * t,
      0.6 + Math.sin(t * Math.PI) * 0.3,
      path.from.z + (path.to.z - path.from.z) * t
    );
  });

  const from = [path.from.x, 0.3, path.from.z] as [number, number, number];
  const to = [path.to.x, 0.3, path.to.z] as [number, number, number];
  const midPoint: [number, number, number] = [
    (from[0] + to[0]) / 2,
    1,
    (from[2] + to[2]) / 2,
  ];

  return (
    <group>
      {/* 곡선 경로 */}
      <Line
        points={[from, midPoint, to]}
        color={isSelected ? '#ffffff' : '#f59e0b'}
        lineWidth={isSelected ? 3 : 2}
        dashed
        dashScale={3}
        dashSize={0.3}
        gapSize={0.15}
      />

      {/* 이동 마커 */}
      {animate && (
        <mesh ref={markerRef}>
          <sphereGeometry args={[0.1, 12, 12]} />
          <meshStandardMaterial
            color="#f59e0b"
            emissive="#f59e0b"
            emissiveIntensity={0.5}
          />
        </mesh>
      )}

      {/* 화살표 머리 */}
      <mesh
        position={to}
        rotation={[
          0,
          Math.atan2(to[0] - from[0], to[2] - from[2]),
          0,
        ]}
      >
        <coneGeometry args={[0.15, 0.3, 8]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

// ============================================================================
// 직원 마커 컴포넌트
// ============================================================================

interface StaffMarkerProps {
  marker: {
    id: string;
    name: string;
    currentPosition: { x: number; y: number; z: number };
    suggestedPosition: { x: number; y: number; z: number };
    color: string;
    coverageRadius: number;
    /** GLB 아바타 모델 URL */
    avatar_url?: string;
  };
  position?: StaffPosition;
  showCurrent: boolean;
  showSuggested: boolean;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

// ============================================================================
// GLB 스태프 아바타 컴포넌트
// ============================================================================
interface GLBStaffAvatarProps {
  url: string;
  position: [number, number, number];
  color: string;
  isHighlighted: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function GLBStaffAvatar({ url, position, color, isHighlighted, onClick, onHover }: GLBStaffAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);
  const { scene } = useGLTF(url);

  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // 색상 힌트 적용
        if (child.material instanceof THREE.MeshStandardMaterial) {
          const mat = child.material.clone();
          mat.emissive = new THREE.Color(color);
          mat.emissiveIntensity = isHighlighted ? 0.4 : 0.15;
          child.material = mat;
        }
      }
    });
    return cloned;
  }, [scene, color, isHighlighted]);

  // 호버 애니메이션
  useFrame(({ clock }) => {
    if (groupRef.current && isHighlighted) {
      const bounce = Math.sin(clock.elapsedTime * 4) * 0.05;
      groupRef.current.position.y = position[1] + bounce;
    }
  });

  return (
    <group
      ref={groupRef}
      position={position}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(false); }}
    >
      <primitive object={clonedScene} />

      {/* 바닥 인디케이터 링 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.35, 0.45, 16]} />
        <meshBasicMaterial color={color} transparent opacity={isHighlighted ? 0.6 : 0.3} />
      </mesh>
    </group>
  );
}

function StaffAvatarWithFallback({ url, ...props }: GLBStaffAvatarProps) {
  if (!url) return null;

  return (
    <Suspense fallback={null}>
      <GLBStaffAvatar url={url} {...props} />
    </Suspense>
  );
}

function StaffMarker({
  marker,
  position,
  showCurrent,
  showSuggested,
  isSelected,
  isHovered,
  onClick,
  onHover,
}: StaffMarkerProps) {
  const currentRef = useRef<THREE.Mesh>(null);
  const suggestedRef = useRef<THREE.Mesh>(null);

  // 호버 애니메이션
  useFrame(({ clock }) => {
    if (suggestedRef.current && (isHovered || isSelected)) {
      const bounce = Math.sin(clock.elapsedTime * 4) * 0.1;
      suggestedRef.current.position.y = 0.6 + bounce;
    }
  });

  return (
    <group>
      {/* 현재 위치 마커 */}
      {showCurrent && (
        <group position={[marker.currentPosition.x, 0, marker.currentPosition.z]}>
          {/* GLB 모델이 있으면 GLB, 없으면 캡슐 */}
          {marker.avatar_url ? (
            <StaffAvatarWithFallback
              url={marker.avatar_url}
              position={[0, 0, 0]}
              color="#94a3b8"
              isHighlighted={false}
              onClick={onClick}
              onHover={onHover}
            />
          ) : (
            <mesh
              ref={currentRef}
              position={[0, 0.5, 0]}
              onClick={onClick}
              onPointerOver={() => onHover(true)}
              onPointerOut={() => onHover(false)}
            >
              <capsuleGeometry args={[0.2, 0.4, 4, 8]} />
              <meshStandardMaterial
                color="#94a3b8"
                emissive="#94a3b8"
                emissiveIntensity={0.2}
                transparent
                opacity={0.6}
              />
            </mesh>
          )}

          {/* 현재 위치 라벨 */}
          <Text
            position={[0, 1.2, 0]}
            fontSize={0.25}
            color="#94a3b8"
            anchorX="center"
          >
            현재
          </Text>
        </group>
      )}

      {/* 제안 위치 마커 */}
      {showSuggested && (
        <group position={[marker.suggestedPosition.x, 0, marker.suggestedPosition.z]}>
          {/* GLB 모델이 있으면 GLB, 없으면 캡슐 */}
          {marker.avatar_url ? (
            <StaffAvatarWithFallback
              url={marker.avatar_url}
              position={[0, 0, 0]}
              color={marker.color}
              isHighlighted={isHovered || isSelected}
              onClick={onClick}
              onHover={onHover}
            />
          ) : (
            <mesh
              ref={suggestedRef}
              position={[0, 0.6, 0]}
              onClick={onClick}
              onPointerOver={() => onHover(true)}
              onPointerOut={() => onHover(false)}
            >
              <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
              <meshStandardMaterial
                color={marker.color}
                emissive={marker.color}
                emissiveIntensity={isHovered || isSelected ? 0.6 : 0.3}
              />
            </mesh>
          )}

          {/* 직원 이름 */}
          <Text
            position={[0, 1.5, 0]}
            fontSize={0.3}
            color={marker.color}
            anchorX="center"
            fontWeight="bold"
          >
            {marker.name}
          </Text>

          {/* 커버리지 이득 */}
          {position && (
            <Text
              position={[0, 1.2, 0]}
              fontSize={0.2}
              color="#22c55e"
              anchorX="center"
            >
              +{(position.coverageGain ?? 0).toFixed(0)}%
            </Text>
          )}
        </group>
      )}

      {/* 상세 정보 패널 */}
      {isSelected && position && (
        <Html
          position={[marker.suggestedPosition.x, 2.5, marker.suggestedPosition.z]}
          center
        >
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
            <h4 className="font-semibold text-sm mb-2" style={{ color: marker.color }}>
              {marker.name}
            </h4>
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">현재 구역:</span>
                <span>{position.currentZone || '미지정'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">추천 구역:</span>
                <span className="text-green-500">{position.suggestedZone || '미지정'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">커버리지 증가:</span>
                <span className="text-green-500 font-medium">+{(position.coverageGain ?? 0).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">효율 점수:</span>
                <span>{(position.efficiencyScore ?? 0).toFixed(0)}/100</span>
              </div>
              {position.responsibilityZones && position.responsibilityZones.length > 0 && (
                <div className="pt-1 border-t border-border">
                  <span className="text-muted-foreground text-[10px]">담당 구역:</span>
                  <div className="text-[10px] mt-0.5">
                    {position.responsibilityZones.join(', ')}
                  </div>
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
// 존별 커버리지 표시 컴포넌트
// ============================================================================

interface ZoneCoverageIndicatorProps {
  zone: ZoneCoverage;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function ZoneCoverageIndicator({
  zone,
  isHovered,
  onClick,
  onHover,
}: ZoneCoverageIndicatorProps) {
  // 존 위치 매핑
  const zonePositions: Record<string, [number, number, number]> = {
    entrance: [-4, 0, 0],
    'zone-a': [0, 0, 3],
    'zone-b': [0, 0, -3],
    'zone-c': [4, 0, 0],
    checkout: [4, 0, 3],
  };

  const position = zonePositions[zone.zoneId] || [0, 0, 0];

  const priorityColor = zone.priority === 'high' ? '#ef4444' :
                        zone.priority === 'medium' ? '#f59e0b' : '#22c55e';

  // 안전한 값 처리
  const currentCoverage = zone.currentCoverage ?? 0;
  const optimizedCoverage = zone.optimizedCoverage ?? 0;
  const avgResponseTime = zone.avgResponseTime ?? 0;
  const coverageImprovement = optimizedCoverage - currentCoverage;

  return (
    <group position={position}>
      {/* 우선순위 표시 (바닥) */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.01, 0]}
        onClick={onClick}
        onPointerOver={() => onHover(true)}
        onPointerOut={() => onHover(false)}
      >
        <ringGeometry args={[1.5, 1.8, 32]} />
        <meshBasicMaterial
          color={priorityColor}
          transparent
          opacity={isHovered ? 0.5 : 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 호버 정보 */}
      {isHovered && (
        <Html position={[0, 1, 0]} center>
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-2 shadow-lg min-w-[130px]">
            <h4 className="font-semibold text-xs mb-1">{zone.zoneName}</h4>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">현재 커버리지:</span>
                <span>{currentCoverage.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">최적화 후:</span>
                <span className="text-green-500">{optimizedCoverage.toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">개선:</span>
                <span className="text-green-500">+{coverageImprovement.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">응답시간:</span>
                <span>{avgResponseTime.toFixed(0)}초</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">담당직원:</span>
                <span>{zone.assignedStaff?.length || 0}명</span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 메트릭 패널 컴포넌트
// ============================================================================

interface MetricsPanelProps {
  metrics: StaffingSimulationResult['metrics'];
}

function MetricsPanel({ metrics }: MetricsPanelProps) {
  // 안전한 기본값 적용
  const safeMetrics = {
    currentCoverage: metrics?.currentCoverage ?? 0,
    optimizedCoverage: metrics?.optimizedCoverage ?? 0,
    customerServiceRateIncrease: metrics?.customerServiceRateIncrease ?? 0,
    avgResponseTimeReduction: metrics?.avgResponseTimeReduction ?? 0,
    efficiencyScore: metrics?.efficiencyScore ?? 0,
  };

  return (
    <Html position={[-5, 3, 5]} center>
      <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[160px]">
        <h4 className="font-semibold text-xs mb-2">인력 배치 효과</h4>
        <div className="space-y-1.5 text-[10px]">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">커버리지:</span>
            <div className="text-right">
              <span className="text-muted-foreground">{safeMetrics.currentCoverage}%</span>
              <span className="mx-1">→</span>
              <span className="text-green-500 font-medium">{safeMetrics.optimizedCoverage.toFixed(0)}%</span>
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">응대율 증가:</span>
            <span className="text-green-500">+{safeMetrics.customerServiceRateIncrease}%</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">응답시간 단축:</span>
            <span className="text-green-500">-{safeMetrics.avgResponseTimeReduction}%</span>
          </div>
          <div className="flex justify-between pt-1 border-t border-border">
            <span className="text-muted-foreground">효율 점수:</span>
            <span className="font-medium">{safeMetrics.efficiencyScore.toFixed(0)}/100</span>
          </div>
        </div>
      </div>
    </Html>
  );
}

export default StaffingOverlay;
