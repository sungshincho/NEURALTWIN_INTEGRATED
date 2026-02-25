/**
 * ModelLoader.tsx
 *
 * 3D 모델 로딩 컴포넌트
 * - GLTF/GLB 모델 로드
 * - 선택/호버 상태 표시
 * - 에러 처리
 */

import { useRef, useMemo, useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { Vector3Tuple } from '../types';
import {
  isBakedModel,
  prepareClonedSceneForBaked,
} from '@/features/simulation/utils/bakedMaterialUtils';

// ============================================================================
// 전역 텍스처 캐시 (메모리 누수 방지 및 성능 최적화)
// ============================================================================
const textureCache = new Map<string, THREE.Texture>();

function loadTextureWithCache(
  url: string,
  onLoad: (texture: THREE.Texture) => void,
  onError?: (err: unknown) => void
): void {
  // 캐시에 있으면 재사용
  if (textureCache.has(url)) {
    const cached = textureCache.get(url)!;
    onLoad(cached);
    return;
  }

  // 새로 로드
  const loader = new THREE.TextureLoader();
  loader.load(
    url,
    (texture) => {
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      textureCache.set(url, texture);
      onLoad(texture);
    },
    undefined,
    onError
  );
}

// 캐시 클리어 함수 (필요시 외부에서 호출)
export function clearTextureCache(): void {
  textureCache.forEach((texture) => texture.dispose());
  textureCache.clear();
}

// ============================================================================
// Props
// ============================================================================
interface ModelLoaderProps {
  url: string;
  modelId?: string;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
  selected?: boolean;
  hovered?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
  castShadow?: boolean;
  receiveShadow?: boolean;
  /** 🆕 낮/밤 모드 (true = 낮, false = 밤) - 텍스처 교체용 */
  isDayMode?: boolean;
  /** 🆕 낮 텍스처 URL */
  dayTextureUrl?: string | null;
  /** 🆕 밤 텍스처 URL */
  nightTextureUrl?: string | null;
}

// ============================================================================
// ModelLoader 컴포넌트
// ============================================================================
export function ModelLoader({
  url,
  modelId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  selected = false,
  hovered = false,
  onClick,
  onPointerOver,
  onPointerOut,
  castShadow = true,
  receiveShadow = true,
  isDayMode = true,
  dayTextureUrl,
  nightTextureUrl,
}: ModelLoaderProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [hasError, setHasError] = useState(false);

  // 유효한 URL인지 확인
  const isValidUrl = useMemo(() => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      // 상대 경로도 허용
      return url.startsWith('/') || url.startsWith('./');
    }
  }, [url]);

  if (!isValidUrl || hasError) {
    return (
      <FallbackModel
        modelId={modelId}
        position={position}
        rotation={rotation}
        scale={scale}
        selected={selected}
        hovered={hovered}
        onClick={onClick}
        onPointerOver={onPointerOver}
        onPointerOut={onPointerOut}
      />
    );
  }

  return (
    <GLTFModel
      url={url}
      modelId={modelId}
      position={position}
      rotation={rotation}
      scale={scale}
      selected={selected}
      hovered={hovered}
      onClick={onClick}
      onPointerOver={onPointerOver}
      onPointerOut={onPointerOut}
      castShadow={castShadow}
      receiveShadow={receiveShadow}
      onError={() => setHasError(true)}
      isDayMode={isDayMode}
      dayTextureUrl={dayTextureUrl}
      nightTextureUrl={nightTextureUrl}
    />
  );
}

// ============================================================================
// GLTF 모델 로더
// ============================================================================
interface GLTFModelProps extends ModelLoaderProps {
  onError?: () => void;
  isDayMode?: boolean;
  dayTextureUrl?: string | null;
  nightTextureUrl?: string | null;
}

function GLTFModel({
  url,
  modelId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  selected = false,
  hovered = false,
  onClick,
  onPointerOver,
  onPointerOut,
  castShadow = true,
  receiveShadow = true,
  onError,
  isDayMode = true,
  dayTextureUrl,
  nightTextureUrl,
}: GLTFModelProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [boundingBox, setBoundingBox] = useState<{ width: number; height: number; depth: number; centerY: number } | null>(null);

  // 🆕 텍스처 로딩 (낮/밤)
  const [dayTexture, setDayTexture] = useState<THREE.Texture | null>(null);
  const [nightTexture, setNightTexture] = useState<THREE.Texture | null>(null);

  // 🆕 텍스처 로드 (캐시 시스템 사용)
  useEffect(() => {
    if (dayTextureUrl) {
      loadTextureWithCache(
        dayTextureUrl,
        (texture) => {
          setDayTexture(texture);
          console.log('[GLTFModel] Day texture loaded (cached):', dayTextureUrl);
        },
        (err) => console.warn('[GLTFModel] Failed to load day texture:', err)
      );
    }

    if (nightTextureUrl) {
      loadTextureWithCache(
        nightTextureUrl,
        (texture) => {
          setNightTexture(texture);
          console.log('[GLTFModel] Night texture loaded (cached):', nightTextureUrl);
        },
        (err) => console.warn('[GLTFModel] Failed to load night texture:', err)
      );
    }

    // 캐시된 텍스처는 dispose하지 않음 (전역 캐시에서 관리)
  }, [dayTextureUrl, nightTextureUrl]);

  // GLTF 로드
  const { scene } = useGLTF(url, true, true, (error) => {
    console.error('GLTF load error:', error);
    onError?.();
  });

  const shouldUseBaked = useMemo(() => isBakedModel(url), [url]);

  // 씬 클론 (여러 인스턴스 사용 가능)
  const clonedScene = useMemo(() => {
    const cloned = scene.clone(true);

    // Baked 모델 처리
    if (shouldUseBaked) {
      prepareClonedSceneForBaked(cloned, {
        convertToBasic: true,
        disableShadows: true,
      });
    }

    // 그림자 설정
    cloned.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = castShadow;
        child.receiveShadow = receiveShadow;
      }
    });

    return cloned;
  }, [scene, castShadow, receiveShadow, shouldUseBaked]);

  // 🆕 텍스처 교체 (isDayMode 변경 시)
  useEffect(() => {
    const activeTexture = isDayMode ? dayTexture : nightTexture;

    // 텍스처가 있을 때만 교체
    if (!activeTexture) return;

    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial | THREE.MeshBasicMaterial;
        if (material && material.map !== undefined) {
          // 기존 텍스처가 있는 메시만 교체
          material.map = activeTexture;
          material.needsUpdate = true;
          console.log('[GLTFModel] Texture swapped to:', isDayMode ? 'day' : 'night');
        }
      }
    });
  }, [isDayMode, dayTexture, nightTexture, clonedScene]);

  // 실제 렌더링 후 BoundingBox 계산 (씬 클론 변경 시 1회만 실행)
  useEffect(() => {
    if (!clonedScene) return;

    // 다음 프레임에서 실행하여 씬이 렌더링된 후 계산
    const frameId = requestAnimationFrame(() => {
      if (!groupRef.current) return;

      // 스케일, 로테이션 적용 전 원본 크기 계산을 위해 임시로 리셋
      const originalScale = groupRef.current.scale.clone();
      const originalRotation = groupRef.current.rotation.clone();

      groupRef.current.scale.set(1, 1, 1);
      groupRef.current.rotation.set(0, 0, 0);
      groupRef.current.updateMatrixWorld(true);

      const box = new THREE.Box3().setFromObject(groupRef.current);
      const size = new THREE.Vector3();
      box.getSize(size);
      const center = new THREE.Vector3();
      box.getCenter(center);

      // 스케일, 로테이션 복원
      groupRef.current.scale.copy(originalScale);
      groupRef.current.rotation.copy(originalRotation);
      groupRef.current.updateMatrixWorld(true);

      // position을 빼서 로컬 좌표로 변환
      const localCenterY = center.y - (position[1] || 0);

      setBoundingBox({
        width: size.x,
        height: size.y,
        depth: size.z,
        centerY: localCenterY,
      });
    });

    return () => cancelAnimationFrame(frameId);
  }, [clonedScene, position]);

  return (
    <group
      ref={groupRef}
      position={position}
      rotation={rotation}
      scale={scale}
      userData={{ modelId }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver?.();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onPointerOut?.();
      }}
    >
      <primitive object={clonedScene} />

      {/* 선택 표시 */}
      {selected && boundingBox && (
        <SelectionOutline 
          width={boundingBox.width} 
          height={boundingBox.height} 
          depth={boundingBox.depth}
          centerY={boundingBox.centerY}
        />
      )}
    </group>
  );
}

// ============================================================================
// 폴백 모델 (에러 시 표시)
// ============================================================================
interface FallbackModelProps {
  modelId?: string;
  position?: Vector3Tuple;
  rotation?: Vector3Tuple;
  scale?: Vector3Tuple;
  selected?: boolean;
  hovered?: boolean;
  onClick?: () => void;
  onPointerOver?: () => void;
  onPointerOut?: () => void;
}

function FallbackModel({
  modelId,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  selected = false,
  hovered = false,
  onClick,
  onPointerOver,
  onPointerOut,
}: FallbackModelProps) {
  return (
    <group
      position={position}
      rotation={rotation}
      scale={scale}
      userData={{ modelId }}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        onPointerOver?.();
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        onPointerOut?.();
      }}
    >
      <mesh castShadow receiveShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial
          color={hovered ? '#6b7280' : '#4b5563'}
          wireframe={!selected}
          transparent
          opacity={0.7}
        />
      </mesh>

      {/* 에러 표시 */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>

      {selected && <SelectionOutline />}
    </group>
  );
}

// ============================================================================
// 선택 아웃라인
// ============================================================================
interface SelectionOutlineProps {
  width?: number;
  height?: number;
  depth?: number;
  centerY?: number;
}

function SelectionOutline({ width = 1, height = 1, depth = 1, centerY = 0.5 }: SelectionOutlineProps) {
  const outlineRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    if (outlineRef.current) {
      // 펄스 애니메이션
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 3) * 0.02;
      outlineRef.current.scale.set(pulse, pulse, pulse);
    }
  });

  // 약간의 여백 추가 (10%)
  const w = width * 1.1;
  const h = height * 1.1;
  const d = depth * 1.1;

  return (
    <mesh ref={outlineRef} position={[0, centerY, 0]}>
      <boxGeometry args={[w, h, d]} />
      <meshBasicMaterial
        color="#3b82f6"
        transparent
        opacity={0.15}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

// ============================================================================
// 모델 프리로드 유틸리티
// ============================================================================
export function preloadModel(url: string) {
  useGLTF.preload(url);
}

export function clearModelCache(url: string) {
  useGLTF.clear(url);
}

export default ModelLoader;
