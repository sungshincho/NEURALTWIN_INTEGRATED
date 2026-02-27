/**
 * CustomerAvatarOverlay.tsx
 *
 * 고객 아바타 오버레이 - 실시간 고객 위치 시각화
 * - GLB 모델 로딩 지원 (avatar_url)
 * - 폴백: InstancedMesh로 100+ 아바타 효율적 렌더링
 */

import { useRef, useMemo, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import type { CustomerAvatarOverlayProps, CustomerAvatar, CustomerStatus } from '../types';

// ============================================================================
// 기본 색상
// ============================================================================
const DEFAULT_COLORS: Record<CustomerStatus, string> = {
  browsing: '#3b82f6', // blue
  purchasing: '#22c55e', // green
  leaving: '#6b7280', // gray
  idle: '#a855f7', // purple
};

// ============================================================================
// GLB 아바타 모델 컴포넌트
// ============================================================================
interface GLBAvatarProps {
  customer: CustomerAvatar;
  scale: number;
  color: string;
}

function GLBAvatar({ customer, scale, color }: GLBAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);

  // GLB 모델 로드
  const { scene } = useGLTF(customer.avatar_url!);

  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        // 상태별 색상 힌트 적용 (emissive)
        if (child.material instanceof THREE.MeshStandardMaterial) {
          const mat = child.material.clone();
          mat.emissive = new THREE.Color(color);
          mat.emissiveIntensity = 0.15;
          child.material = mat;
        }
      }
    });
    return cloned;
  }, [scene, color]);

  // 애니메이션 (걷기 효과)
  useFrame((state) => {
    if (!groupRef.current) return;

    // 걷기 바운스 효과
    const bobSpeed = customer.status === 'browsing' ? 4 : 2;
    const bobAmount = customer.status === 'browsing' ? 0.03 : 0.01;
    groupRef.current.position.y =
      customer.position[1] + Math.sin(state.clock.elapsedTime * bobSpeed) * bobAmount;

    // 속도 기반 회전
    if (customer.velocity && (customer.velocity[0] !== 0 || customer.velocity[2] !== 0)) {
      const angle = Math.atan2(customer.velocity[0], customer.velocity[2]);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        angle,
        0.1
      );
    }
  });

  return (
    <group
      ref={groupRef}
      position={[customer.position[0], customer.position[1], customer.position[2]]}
      scale={[scale, scale, scale]}
    >
      <primitive object={clonedScene} />

      {/* 바닥 인디케이터 링 */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.4 / scale, 0.5 / scale, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} />
      </mesh>
    </group>
  );
}

// ============================================================================
// GLB 아바타 에러 바운더리 폴백
// ============================================================================
interface AvatarWithFallbackProps {
  customer: CustomerAvatar;
  scale: number;
  color: string;
}

function AvatarWithFallback({ customer, scale, color }: AvatarWithFallbackProps) {
  if (!customer.avatar_url) {
    return null; // Instanced mesh에서 처리
  }

  return (
    <Suspense fallback={null}>
      <GLBAvatar customer={customer} scale={scale} color={color} />
    </Suspense>
  );
}

// ============================================================================
// CustomerAvatarOverlay 컴포넌트
// ============================================================================
export function CustomerAvatarOverlay({
  customers,
  showTrails = false,
  trailLength = 10,
  scale = 1,
  colors = DEFAULT_COLORS,
}: CustomerAvatarOverlayProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // GLB 모델 있는 고객과 없는 고객 분리
  const { withModel, withoutModel } = useMemo(() => {
    const withModel: CustomerAvatar[] = [];
    const withoutModel: CustomerAvatar[] = [];

    customers.forEach((customer) => {
      if (customer.avatar_url) {
        withModel.push(customer);
      } else {
        withoutModel.push(customer);
      }
    });

    return { withModel, withoutModel };
  }, [customers]);

  // GLB 모델 프리로딩 (유니크 URL만)
  const uniqueUrls = useMemo(() => {
    const urls = new Set<string>();
    withModel.forEach(c => {
      if (c.avatar_url) urls.add(c.avatar_url);
    });
    return Array.from(urls);
  }, [withModel]);

  // 프리로드
  useEffect(() => {
    uniqueUrls.forEach(url => {
      useGLTF.preload(url);
    });
  }, [uniqueUrls]);

  // Instanced mesh 업데이트 (GLB 모델 없는 고객용)
  useFrame((state) => {
    if (!meshRef.current || withoutModel.length === 0) return;

    withoutModel.forEach((customer, instanceIndex) => {
      // 걷기 애니메이션
      const bobSpeed = customer.status === 'browsing' ? 4 : 2;
      const bobAmount = customer.status === 'browsing' ? 0.05 : 0.02;

      dummy.position.set(
        customer.position[0],
        customer.position[1] + 0.5 * scale + Math.sin(state.clock.elapsedTime * bobSpeed + instanceIndex) * bobAmount,
        customer.position[2]
      );
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(instanceIndex, dummy.matrix);

      // 색상 설정
      const color = new THREE.Color(colors[customer.status] || colors.browsing);
      meshRef.current!.setColorAt(instanceIndex, color);
    });

    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  const maxInstances = Math.max(withoutModel.length, 100);

  return (
    <group>
      {/* GLB 모델 있는 고객들 - 개별 렌더링 */}
      {withModel.map((customer) => (
        <AvatarWithFallback
          key={customer.id}
          customer={customer}
          scale={scale}
          color={colors[customer.status] || colors.browsing}
        />
      ))}

      {/* GLB 모델 없는 고객들 - Instanced Mesh */}
      {withoutModel.length > 0 && (
        <instancedMesh
          ref={meshRef}
          args={[undefined, undefined, maxInstances]}
          frustumCulled={false}
        >
          <capsuleGeometry args={[0.2, 0.6, 8, 16]} />
          <meshStandardMaterial
            vertexColors
            transparent
            opacity={0.9}
            roughness={0.5}
            metalness={0.1}
          />
        </instancedMesh>
      )}

      {/* 트레일 (옵션) */}
      {showTrails &&
        customers.map((customer) => (
          <CustomerTrail
            key={customer.id}
            customer={customer}
            length={trailLength}
            color={colors[customer.status]}
          />
        ))}
    </group>
  );
}

// ============================================================================
// CustomerTrail 컴포넌트
// ============================================================================
interface CustomerTrailProps {
  customer: CustomerAvatar;
  length: number;
  color: string;
}

function CustomerTrail({ customer, length, color }: CustomerTrailProps) {
  const trailRef = useRef<THREE.Vector3[]>([]);

  useFrame(() => {
    const currentPos = new THREE.Vector3(...customer.position);

    // 트레일 업데이트
    trailRef.current.unshift(currentPos);
    if (trailRef.current.length > length) {
      trailRef.current.pop();
    }
  });

  if (trailRef.current.length < 2) return null;

  return (
    <line>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={trailRef.current.length}
          array={new Float32Array(trailRef.current.flatMap((p) => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <lineBasicMaterial color={color} transparent opacity={0.5} linewidth={2} />
    </line>
  );
}

export default CustomerAvatarOverlay;
