/**
 * 실시간 IoT 트래킹 데이터 기반 고객 아바타 오버레이
 * - GLB 모델 로딩 지원 (avatar_url)
 * - 폴백: InstancedMesh 기반 캡슐 형태 렌더링
 */

import { useRef, useMemo, useEffect, Suspense } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { Html, useGLTF } from '@react-three/drei';
import { Wifi, Users } from 'lucide-react';
import { useRealtimeTracking } from '../../hooks/useRealtimeTracking';
import type { CustomerAvatar } from '../../types/overlay.types';

interface RealtimeCustomerOverlayProps {
  storeId: string;
  maxInstances?: number;
  showDebugInfo?: boolean;
}

const AVATAR_COLORS = {
  browsing: '#1B6BFF',
  purchasing: '#10B981',
  leaving: '#6B7280'
};

// ============================================================================
// GLB 아바타 모델 컴포넌트
// ============================================================================
interface GLBAvatarProps {
  avatar: CustomerAvatar;
  color: string;
}

function GLBAvatar({ avatar, color }: GLBAvatarProps) {
  const groupRef = useRef<THREE.Group>(null);

  // GLB 모델 로드
  const { scene } = useGLTF(avatar.avatar_url!);

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
    const bobSpeed = avatar.status === 'browsing' ? 4 : 2;
    const bobAmount = avatar.status === 'browsing' ? 0.03 : 0.01;
    groupRef.current.position.y =
      avatar.position.y + Math.sin(state.clock.elapsedTime * bobSpeed) * bobAmount;

    // 속도 기반 회전
    if (avatar.velocity && (avatar.velocity.x !== 0 || avatar.velocity.z !== 0)) {
      const angle = Math.atan2(avatar.velocity.x, avatar.velocity.z);
      groupRef.current.rotation.y = THREE.MathUtils.lerp(
        groupRef.current.rotation.y,
        angle,
        0.1
      );
    }
  });

  const scale = 0.9 + Math.random() * 0.2;

  return (
    <group
      ref={groupRef}
      position={[avatar.position.x, avatar.position.y, avatar.position.z]}
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
// GLB 아바타 래퍼 (Suspense 포함)
// ============================================================================
function AvatarWithFallback({ avatar, color }: GLBAvatarProps) {
  if (!avatar.avatar_url) {
    return null; // Instanced mesh에서 처리
  }

  return (
    <Suspense fallback={null}>
      <GLBAvatar avatar={avatar} color={color} />
    </Suspense>
  );
}

/**
 * IoT 센서 데이터를 실시간으로 받아 고객 아바타를 렌더링
 * Supabase Realtime Presence를 사용하여 다른 클라이언트와 동기화
 */
export function RealtimeCustomerOverlay({
  storeId,
  maxInstances = 200,
  showDebugInfo = true
}: RealtimeCustomerOverlayProps) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const tempObject = useMemo(() => new THREE.Object3D(), []);
  const tempColor = useMemo(() => new THREE.Color(), []);

  // Realtime 트래킹 데이터 수신
  const { avatars, isConnected, sensorCount, lastUpdate } = useRealtimeTracking({
    storeId,
    enabled: true
  });

  // GLB 모델 있는 고객과 없는 고객 분리
  const { withModel, withoutModel } = useMemo(() => {
    const withModel: CustomerAvatar[] = [];
    const withoutModel: CustomerAvatar[] = [];

    avatars.forEach((avatar) => {
      if (avatar.avatar_url) {
        withModel.push(avatar);
      } else {
        withoutModel.push(avatar);
      }
    });

    return { withModel, withoutModel };
  }, [avatars]);

  // GLB 모델 프리로딩 (유니크 URL만)
  const uniqueUrls = useMemo(() => {
    const urls = new Set<string>();
    withModel.forEach(a => {
      if (a.avatar_url) urls.add(a.avatar_url);
    });
    return Array.from(urls);
  }, [withModel]);

  // 프리로드
  useEffect(() => {
    uniqueUrls.forEach(url => {
      useGLTF.preload(url);
    });
  }, [uniqueUrls]);

  const geometry = useMemo(() => new THREE.CapsuleGeometry(0.3, 1.2, 4, 8), []);

  const material = useMemo(() => new THREE.MeshStandardMaterial({
    color: AVATAR_COLORS.browsing,
    emissive: AVATAR_COLORS.browsing,
    emissiveIntensity: 0.3,
    metalness: 0.3,
    roughness: 0.7
  }), []);

  // GLB 모델 없는 아바타 위치 및 색상 업데이트
  useEffect(() => {
    if (!meshRef.current || withoutModel.length === 0) return;

    const mesh = meshRef.current;
    const count = Math.min(withoutModel.length, maxInstances);

    withoutModel.slice(0, count).forEach((avatar, i) => {
      // 위치 설정
      tempObject.position.set(
        avatar.position.x,
        avatar.position.y + 0.6,
        avatar.position.z
      );

      // 속도 기반 회전
      if (avatar.velocity) {
        const angle = Math.atan2(avatar.velocity.x, avatar.velocity.z);
        tempObject.rotation.y = angle;
      }

      const scale = 0.9 + Math.random() * 0.2;
      tempObject.scale.set(scale, scale, scale);

      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);

      // 상태별 색상
      const color = AVATAR_COLORS[avatar.status];
      tempColor.set(color);
      mesh.setColorAt(i, tempColor);
    });

    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) {
      mesh.instanceColor.needsUpdate = true;
    }
  }, [withoutModel, maxInstances, tempObject, tempColor]);

  // 부드러운 애니메이션 (속도 기반 이동) - GLB 없는 아바타만
  useFrame((state, delta) => {
    if (!meshRef.current || withoutModel.length === 0) return;

    const mesh = meshRef.current;
    const count = Math.min(withoutModel.length, maxInstances);

    withoutModel.slice(0, count).forEach((avatar, i) => {
      mesh.getMatrixAt(i, tempObject.matrix);
      tempObject.matrix.decompose(
        tempObject.position,
        tempObject.quaternion,
        tempObject.scale
      );

      // 속도 기반 이동
      if (avatar.velocity) {
        tempObject.position.x += avatar.velocity.x * delta;
        tempObject.position.z += avatar.velocity.z * delta;
      }

      // 걷기 애니메이션
      const bobSpeed = avatar.status === 'browsing' ? 4 : 2;
      const bobAmount = avatar.status === 'browsing' ? 0.05 : 0.02;
      tempObject.position.y =
        avatar.position.y + 0.6 +
        Math.sin(state.clock.elapsedTime * bobSpeed + i) * bobAmount;

      tempObject.updateMatrix();
      mesh.setMatrixAt(i, tempObject.matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group>
      {/* GLB 모델 있는 고객들 - 개별 렌더링 */}
      {withModel.map((avatar) => (
        <AvatarWithFallback
          key={avatar.id}
          avatar={avatar}
          color={AVATAR_COLORS[avatar.status]}
        />
      ))}

      {/* GLB 모델 없는 고객들 - Instanced Mesh */}
      {withoutModel.length > 0 && (
        <instancedMesh
          ref={meshRef}
          args={[geometry, material, maxInstances]}
          frustumCulled
        />
      )}

      {/* 바닥 인디케이터 - GLB 없는 고객용 */}
      {withoutModel.slice(0, Math.min(withoutModel.length, maxInstances)).map((avatar) => (
        <group key={avatar.id} position={[avatar.position.x, 0.01, avatar.position.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.4, 0.5, 16]} />
            <meshBasicMaterial
              color={AVATAR_COLORS[avatar.status]}
              transparent
              opacity={0.3}
            />
          </mesh>
        </group>
      ))}

      {/* 디버그 정보 표시 */}
      {showDebugInfo && (
        <Html position={[0, 10, 0]} center>
          <div className="bg-background/90 backdrop-blur-sm border border-border rounded-lg p-4 shadow-lg">
            <div className="flex items-center gap-2 mb-2">
              <Wifi className={`w-4 h-4 ${isConnected ? 'text-green-500' : 'text-red-500'}`} />
              <span className="text-sm font-semibold">
                {isConnected ? '실시간 연결됨' : '연결 끊김'}
              </span>
            </div>
            <div className="space-y-1 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Users className="w-3 h-3" />
                <span>현재 고객: {avatars.length}명 (GLB: {withModel.length})</span>
              </div>
              <div>센서: {sensorCount}개</div>
              <div>
                마지막 업데이트: {lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : '-'}
              </div>
            </div>
          </div>
        </Html>
      )}

      {/* 조명 */}
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
    </group>
  );
}
