import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import type { SpaceAsset } from '@/types/scene3d';
import {
  isBakedModel,
  prepareClonedSceneForBaked,
} from '../../utils/bakedMaterialUtils';

interface StoreSpaceProps {
  asset: SpaceAsset;
  onClick?: () => void;
}

export function StoreSpace({ asset, onClick }: StoreSpaceProps) {
  // Guard against undefined asset
  if (!asset) {
    return (
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={onClick}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
    );
  }

  // Skip rendering if no valid model URL
  if (!asset.model_url || asset.model_url.includes('/models/default-store.glb')) {
    // Render a simple floor plane as fallback
    return (
      <mesh
        position={[asset.position?.x || 0, asset.position?.y || 0, asset.position?.z || 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={onClick}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
    );
  }

  try {
    const { scene } = useGLTF(asset.model_url);

    // Baked 모델 여부 확인 (명시적 플래그 또는 파일명 패턴)
    const shouldUseBaked = asset.isBaked ?? isBakedModel(asset.model_url);

    // scene을 clone하고 baked 모델이면 material 변환
    const clonedScene = useMemo(() => {
      const cloned = scene.clone();
      if (shouldUseBaked) {
        // MeshBasicMaterial로 변환하여 조명/환경 영향 제외
        prepareClonedSceneForBaked(cloned, {
          convertToBasic: true,
          disableShadows: true,
        });
      }
      return cloned;
    }, [scene, shouldUseBaked]);

    // degrees → radians 변환
    const rotation: [number, number, number] = [
      asset.rotation.x * Math.PI / 180,
      asset.rotation.y * Math.PI / 180,
      asset.rotation.z * Math.PI / 180,
    ];

    return (
      <primitive
        object={clonedScene}
        position={[asset.position.x, asset.position.y, asset.position.z]}
        rotation={rotation}
        scale={[asset.scale.x, asset.scale.y, asset.scale.z]}
        onClick={onClick}
      />
    );
  } catch (error) {
    console.warn('Failed to load store model:', error);
    // Fallback to simple plane
    return (
      <mesh
        position={[asset.position.x, asset.position.y, asset.position.z]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={onClick}
        receiveShadow
      >
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#e0e0e0" />
      </mesh>
    );
  }
}
