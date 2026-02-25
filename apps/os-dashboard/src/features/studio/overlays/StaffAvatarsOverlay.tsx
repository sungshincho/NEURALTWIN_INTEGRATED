/**
 * StaffAvatarsOverlay.tsx
 *
 * 실제 DB 스태프 데이터를 사용한 3D 아바타 오버레이
 * - staff 테이블에서 직접 로드한 직원 데이터 사용
 * - GLB 아바타 모델 렌더링
 * - 위치, 역할, 이름 표시
 */

import { useMemo, useState, useRef, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { Html, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { StaffMember } from '../hooks/useStaffData';
import { getStaffColor } from '../hooks/useStaffData';

// ============================================================================
// 타입 정의
// ============================================================================

interface StaffAvatarsOverlayProps {
  staff: StaffMember[];
  showLabels?: boolean;
  showRoles?: boolean;
  selectedStaffId?: string | null;
  onStaffClick?: (staffId: string) => void;
}

// ============================================================================
// 역할 라벨 매핑
// ============================================================================

const ROLE_LABELS: Record<string, string> = {
  manager: '매니저',
  sales: '판매',
  cashier: '계산',
  security: '보안',
  fitting: '피팅',
  greeter: '안내',
  stock: '재고',
};

// ============================================================================
// 메인 컴포넌트
// ============================================================================

export function StaffAvatarsOverlay({
  staff,
  showLabels = true,
  showRoles = true,
  selectedStaffId,
  onStaffClick,
}: StaffAvatarsOverlayProps) {
  const [hoveredStaffId, setHoveredStaffId] = useState<string | null>(null);

  // 디버깅 로그
  console.log('[StaffAvatarsOverlay] Rendering:', {
    staffCount: staff?.length || 0,
    staffMembers: staff?.map(s => ({
      id: s.id,
      name: s.staff_name,
      position: s.avatar_position,
      hasUrl: !!s.avatar_url,
    })),
  });

  if (!staff || staff.length === 0) {
    console.log('[StaffAvatarsOverlay] No staff data, returning null');
    return null;
  }

  return (
    <group name="staff-avatars-overlay">
      {staff.map((member) => (
        <StaffAvatarMarker
          key={member.id}
          member={member}
          showLabels={showLabels}
          showRoles={showRoles}
          isSelected={selectedStaffId === member.id}
          isHovered={hoveredStaffId === member.id}
          onClick={() => onStaffClick?.(member.id)}
          onHover={(hovered) => setHoveredStaffId(hovered ? member.id : null)}
        />
      ))}
    </group>
  );
}

// ============================================================================
// 스태프 아바타 마커 컴포넌트
// ============================================================================

interface StaffAvatarMarkerProps {
  member: StaffMember;
  showLabels: boolean;
  showRoles: boolean;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function StaffAvatarMarker({
  member,
  showLabels,
  showRoles,
  isSelected,
  isHovered,
  onClick,
  onHover,
}: StaffAvatarMarkerProps) {
  const groupRef = useRef<THREE.Group>(null);
  const color = getStaffColor(member.role);

  // Y 좌표는 항상 0.1로 설정 (바닥 위)
  const position: [number, number, number] = [
    member.avatar_position.x,
    0.1, // 바닥 위에 배치
    member.avatar_position.z,
  ];
  
// avatar_rotation 적용 (degrees → radians 변환)
  const degToRad = (deg: number) => (deg || 0) * Math.PI / 180;
const rotation: [number, number, number] = member.avatar_rotation 
  ? [
      degToRad(member.avatar_rotation.x),
      degToRad(member.avatar_rotation.y),
      degToRad(member.avatar_rotation.z),
    ]
  : [0, 0, 0];

  console.log('[StaffAvatarMarker] Rendering:', member.staff_name, 'at', position, 'rotation', rotation);

  // 호버/선택 시 부드러운 바운스 효과
  const baseY = 0.1;
  useFrame(({ clock }) => {
    if (groupRef.current && (isHovered || isSelected)) {
      const bounce = Math.sin(clock.elapsedTime * 4) * 0.05;
      groupRef.current.position.y = baseY + bounce;
    } else if (groupRef.current) {
      groupRef.current.position.y = baseY;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* GLB 모델이 있으면 GLB, 없으면 캡슐 폴백 */}
      {member.avatar_url ? (
        <Suspense fallback={<FallbackAvatar color={color} isHighlighted={isHovered || isSelected} onClick={onClick} onHover={onHover} />}>
          <GLBStaffModel
            url={member.avatar_url}
            color={color}
            isHighlighted={isHovered || isSelected}
            onClick={onClick}
            onHover={onHover}
          />
        </Suspense>
      ) : (
        <FallbackAvatar
          color={color}
          isHighlighted={isHovered || isSelected}
          onClick={onClick}
          onHover={onHover}
        />
      )}

      {/* 바닥 인디케이터 링 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.4, 0.5, 24]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={isHovered || isSelected ? 0.7 : 0.4}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 이름 라벨 */}
      {showLabels && (
        <Text
          position={[0, 2, 0]}
          fontSize={0.25}
          color={color}
          anchorX="center"
          anchorY="bottom"
          fontWeight="bold"
        >
          {member.staff_name}
        </Text>
      )}

      {/* 역할 라벨 */}
      {showRoles && (
        <Text
          position={[0, 1.7, 0]}
          fontSize={0.18}
          color="#ffffff"
          anchorX="center"
          anchorY="bottom"
          fillOpacity={0.7}
        >
          {ROLE_LABELS[member.role] || member.role}
        </Text>
      )}

      {/* 호버 시 상세 정보 패널 */}
      {(isHovered || isSelected) && (
        <Html position={[0, 2.5, 0]} center>
          <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg p-2 shadow-lg min-w-[120px]">
            <div className="font-semibold text-xs text-white mb-1">{member.staff_name}</div>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between gap-4">
                <span className="text-white/50">역할:</span>
                <span className="text-white" style={{ color }}>{ROLE_LABELS[member.role] || member.role}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/50">구역:</span>
                <span className="text-white">{member.zone_name || '미배정'}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-white/50">코드:</span>
                <span className="text-white/70">{member.staff_code}</span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// GLB 모델 컴포넌트
// ============================================================================

interface GLBStaffModelProps {
  url: string;
  color: string;
  isHighlighted: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function GLBStaffModel({ url, color, isHighlighted, onClick, onHover }: GLBStaffModelProps) {
  const { scene } = useGLTF(url);

  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // 하이라이트 효과
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

  return (
    <primitive
      object={clonedScene}
      onClick={(e: any) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e: any) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={(e: any) => { e.stopPropagation(); onHover(false); }}
    />
  );
}

// ============================================================================
// 폴백 아바타 (GLB 없을 때)
// ============================================================================

interface FallbackAvatarProps {
  color: string;
  isHighlighted: boolean;
  onClick: () => void;
  onHover: (hovered: boolean) => void;
}

function FallbackAvatar({ color, isHighlighted, onClick, onHover }: FallbackAvatarProps) {
  return (
    <mesh
      position={[0, 0.6, 0]}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      onPointerOver={(e) => { e.stopPropagation(); onHover(true); }}
      onPointerOut={(e) => { e.stopPropagation(); onHover(false); }}
    >
      <capsuleGeometry args={[0.25, 0.5, 4, 8]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={isHighlighted ? 0.5 : 0.2}
      />
    </mesh>
  );
}

export default StaffAvatarsOverlay;
