// src/features/studio/components/CustomerAgents.tsx

/**
 * 고객 에이전트 3D 컴포넌트
 *
 * - 3D 공간에 고객 에이전트 렌더링
 * - GLB 아바타 모델 지원 (avatar_url)
 * - 상태에 따른 색상 표시
 * - 선택적 경로 시각화
 *
 * 성능 최적화:
 * - React.memo로 개별 고객 리렌더링 방지
 * - Geometry 공유로 GPU 메모리 절약
 * - 경로 점 수 제한으로 Line 버텍스 최적화
 */

import React, { useRef, useMemo, Suspense } from 'react';
import * as THREE from 'three';
import { Line, Html, useGLTF } from '@react-three/drei';
import { useSimulationStore, STATE_COLORS } from '@/stores/simulationStore';
import type { CustomerAgent as CustomerAgentType } from '@/stores/simulationStore';

// ============================================================================
// 공유 Geometry 인스턴스 (성능 최적화 C)
// ============================================================================
const SHARED_GEOMETRIES = {
  capsule: new THREE.CapsuleGeometry(0.12, 0.35, 8, 16),
  sphere: new THREE.SphereGeometry(0.1, 16, 16),
  ring: new THREE.RingGeometry(0.06, 0.1, 16),
  circle: new THREE.CircleGeometry(0.2, 16),
};

// 경로 최대 점 수 (성능 최적화 D)
const MAX_PATH_POINTS = 20;

// ============================================================================
// Props 인터페이스
// ============================================================================
interface CustomerAgentsProps {
  showPaths?: boolean;
  showLabels?: boolean;
}

interface CustomerAgentProps {
  customer: CustomerAgentType;
  showPath: boolean;
  showLabel: boolean;
}

interface GLBAvatarProps {
  url: string;
  color: string;
  position: [number, number, number];
}

interface FallbackAvatarProps {
  color: string;
}

// ============================================================================
// GLB 아바타 컴포넌트
// ============================================================================
function GLBAvatar({ url, color, position }: GLBAvatarProps) {
  const { scene } = useGLTF(url);

  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // 상태 색상으로 emissive 적용
        if (child.material instanceof THREE.MeshStandardMaterial) {
          const mat = child.material.clone();
          mat.emissive = new THREE.Color(color);
          mat.emissiveIntensity = 0.2;
          child.material = mat;
        }
      }
    });
    return cloned;
  }, [scene, color]);

  return (
    <primitive
      object={clonedScene}
      position={position}
      scale={[1, 1, 1]}
    />
  );
}

// ============================================================================
// 폴백 캡슐 아바타 (Geometry 공유 적용)
// ============================================================================
const FallbackAvatar = React.memo(function FallbackAvatar({ color }: FallbackAvatarProps) {
  // Material만 색상별로 생성 (Geometry는 공유)
  const bodyMaterial = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.3,
      roughness: 0.7,
    }), [color]);

  const headMaterial = useMemo(() =>
    new THREE.MeshStandardMaterial({
      color,
      emissive: color,
      emissiveIntensity: 0.2,
    }), [color]);

  return (
    <>
      {/* 고객 몸체 - 캡슐 형태 (공유 Geometry 사용) */}
      <mesh
        castShadow
        position={[0, 0.3, 0]}
        geometry={SHARED_GEOMETRIES.capsule}
        material={bodyMaterial}
      />

      {/* 머리 (공유 Geometry 사용) */}
      <mesh
        castShadow
        position={[0, 0.65, 0]}
        geometry={SHARED_GEOMETRIES.sphere}
        material={headMaterial}
      />
    </>
  );
});

// ============================================================================
// GLB 로드 에러 시 폴백으로 전환하는 래퍼
// ============================================================================
function AvatarWithFallback({ url, color }: { url: string; color: string }) {
  try {
    return (
      <Suspense fallback={<FallbackAvatar color={color} />}>
        <GLBAvatar url={url} color={color} position={[0, 0, 0]} />
      </Suspense>
    );
  } catch {
    return <FallbackAvatar color={color} />;
  }
}

// ============================================================================
// 개별 고객 컴포넌트 (React.memo 적용)
// ============================================================================
const CustomerAgent = React.memo(function CustomerAgent({
  customer,
  showPath,
  showLabel,
}: CustomerAgentProps) {
  // 상태에 따른 색상
  const stateColor = STATE_COLORS[customer.state] || customer.color;

  // Material 메모이제이션 (색상별)
  const ringMaterial = useMemo(() =>
    new THREE.MeshBasicMaterial({
      color: stateColor,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    }), [stateColor]);

  const circleMaterial = useMemo(() =>
    new THREE.MeshBasicMaterial({
      color: stateColor,
      transparent: true,
      opacity: 0.3,
    }), [stateColor]);

  // 경로 간소화 (최대 20개 점으로 제한)
  const simplifiedPath = useMemo(() => {
    if (!customer.path || customer.path.length <= MAX_PATH_POINTS) {
      return customer.path;
    }
    const step = Math.ceil(customer.path.length / MAX_PATH_POINTS);
    return customer.path.filter((_, i) => i % step === 0 || i === customer.path!.length - 1);
  }, [customer.path]);

  return (
    <group position={customer.position}>
      {/* GLB 모델이 있으면 GLB, 없으면 캡슐 폴백 */}
      {customer.avatar_url ? (
        <AvatarWithFallback url={customer.avatar_url} color={stateColor} />
      ) : (
        <FallbackAvatar color={stateColor} />
      )}

      {/* 상태 표시 링 (공유 Geometry 사용) */}
      <mesh
        position={[0, 0.9, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={SHARED_GEOMETRIES.ring}
        material={ringMaterial}
      />

      {/* 바닥 그림자/표시 (공유 Geometry 사용) */}
      <mesh
        position={[0, 0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        geometry={SHARED_GEOMETRIES.circle}
        material={circleMaterial}
      />

      {/* 경로 표시 (간소화된 경로) */}
      {showPath && simplifiedPath && simplifiedPath.length > 1 && (
        <Line
          points={simplifiedPath}
          color={stateColor}
          lineWidth={1}
          transparent
          opacity={0.3}
        />
      )}

      {/* 라벨 표시 (옵션) */}
      {showLabel && (
        <Html position={[0, 1.1, 0]} center>
          <div
            style={{
              background: 'rgba(0,0,0,0.7)',
              color: 'white',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '10px',
              whiteSpace: 'nowrap',
            }}
          >
            {customer.state}
          </div>
        </Html>
      )}
    </group>
  );
}, (prevProps, nextProps) => {
  // 위치, 상태, 표시 옵션이 같으면 리렌더링 스킵
  const prevPos = prevProps.customer.position;
  const nextPos = nextProps.customer.position;

  return (
    prevPos[0] === nextPos[0] &&
    prevPos[1] === nextPos[1] &&
    prevPos[2] === nextPos[2] &&
    prevProps.customer.state === nextProps.customer.state &&
    prevProps.customer.color === nextProps.customer.color &&
    prevProps.showPath === nextProps.showPath &&
    prevProps.showLabel === nextProps.showLabel
  );
});

// ============================================================================
// CustomerAgents 메인 컴포넌트
// ============================================================================
export const CustomerAgents = React.memo(function CustomerAgents({
  showPaths = false,
  showLabels = false,
}: CustomerAgentsProps) {
  const customers = useSimulationStore((state) => state.customers);
  const config = useSimulationStore((state) => state.config);
  const groupRef = useRef<THREE.Group>(null);

  // 경로 표시 여부 결합
  const shouldShowPaths = showPaths || config.showAgentPaths;

  // 고객이 없으면 렌더링하지 않음
  if (!customers || customers.length === 0) {
    return null;
  }

  return (
    <group ref={groupRef} name="customer-agents">
      {customers.map((customer) => (
        <CustomerAgent
          key={customer.id}
          customer={customer}
          showPath={shouldShowPaths}
          showLabel={showLabels}
        />
      ))}
    </group>
  );
});

export default CustomerAgents;
