/**
 * bakedMaterialUtils.ts
 *
 * Blender에서 Cycles로 combined bake된 GLB 모델을 위한 유틸리티
 * - MeshBasicMaterial로 변환하여 Three.js 라이팅 영향 제외
 * - Environment Map 영향 제외
 * - Tone Mapping 제외 (원본 색상 유지)
 *
 * 대상 모델: bottom_plate, space_a 등 이미 라이팅이 bake된 모델들
 */

import * as THREE from 'three';

/**
 * Baked 모델인지 판단하는 패턴들
 * 파일명에 이 패턴이 포함되면 baked 처리
 */
export const BAKED_MODEL_PATTERNS = [
  'bottom_plate',
  'space_a',
  'space a',
  '_baked',
  '-baked',
];

/**
 * URL이 baked 모델인지 확인
 */
export function isBakedModel(modelUrl: string): boolean {
  if (!modelUrl) return false;
  const lowerUrl = modelUrl.toLowerCase();
  return BAKED_MODEL_PATTERNS.some(pattern => lowerUrl.includes(pattern.toLowerCase()));
}

/**
 * MeshStandardMaterial/MeshPhysicalMaterial을 MeshBasicMaterial로 변환
 * - 조명 계산 비활성화 (baked 텍스처 사용)
 * - toneMapped = false (post processing 톤 매핑 제외)
 */
export function convertToBasicMaterial(
  originalMaterial: THREE.Material
): THREE.MeshBasicMaterial {
  const basicMaterial = new THREE.MeshBasicMaterial();

  // 원본이 MeshStandardMaterial/MeshPhysicalMaterial인 경우 속성 복사
  if (originalMaterial instanceof THREE.MeshStandardMaterial ||
      originalMaterial instanceof THREE.MeshPhysicalMaterial) {

    // 베이스 컬러/텍스처 복사
    if (originalMaterial.map) {
      basicMaterial.map = originalMaterial.map;
    }
    basicMaterial.color.copy(originalMaterial.color);

    // 투명도 설정
    basicMaterial.transparent = originalMaterial.transparent;
    basicMaterial.opacity = originalMaterial.opacity;
    basicMaterial.alphaMap = originalMaterial.alphaMap;
    basicMaterial.alphaTest = originalMaterial.alphaTest;

    // 양면 렌더링
    basicMaterial.side = originalMaterial.side;

    // 이름 복사
    basicMaterial.name = originalMaterial.name + '_basic';

  } else if (originalMaterial instanceof THREE.MeshBasicMaterial) {
    // 이미 BasicMaterial이면 복제만
    return originalMaterial.clone();
  }

  // Tone Mapping 비활성화 (포스트 프로세싱 영향 최소화)
  basicMaterial.toneMapped = false;

  return basicMaterial;
}

/**
 * Scene 전체의 material을 MeshBasicMaterial로 변환
 * Baked 모델용 - 조명/환경 영향 제외
 */
export function convertSceneToBasicMaterials(scene: THREE.Object3D): void {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      // 단일 material
      if (child.material && !Array.isArray(child.material)) {
        child.material = convertToBasicMaterial(child.material);
      }
      // 다중 material (Multi-material)
      else if (Array.isArray(child.material)) {
        child.material = child.material.map(mat => convertToBasicMaterial(mat));
      }

      // 그림자 비활성화 (baked 모델은 그림자도 baked됨)
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });
}

/**
 * Scene의 특정 설정만 조정 (material 변환 없이)
 * - Environment Map 영향 제거
 * - Tone Mapping 비활성화
 */
export function adjustSceneForBaked(scene: THREE.Object3D): void {
  scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const materials = Array.isArray(child.material)
        ? child.material
        : [child.material];

      materials.forEach((mat) => {
        // Tone Mapping 비활성화
        mat.toneMapped = false;

        // Environment Map 제거 (있다면)
        if ('envMap' in mat) {
          (mat as THREE.MeshStandardMaterial).envMap = null;
          (mat as THREE.MeshStandardMaterial).envMapIntensity = 0;
        }
      });

      // 그림자 비활성화
      child.castShadow = false;
      child.receiveShadow = false;
    }
  });
}

/**
 * 클론된 scene에 baked 처리 적용
 * useGLTF로 로드한 scene을 clone()한 후 이 함수 호출
 */
export function prepareClonedSceneForBaked(
  clonedScene: THREE.Object3D,
  options: {
    convertToBasic?: boolean;  // true: MeshBasicMaterial로 변환 (권장)
    disableShadows?: boolean;  // true: 그림자 비활성화
  } = {}
): THREE.Object3D {
  const {
    convertToBasic = true,
    disableShadows = true
  } = options;

  if (convertToBasic) {
    convertSceneToBasicMaterials(clonedScene);
  } else {
    adjustSceneForBaked(clonedScene);
  }

  if (disableShadows) {
    clonedScene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = false;
        child.receiveShadow = false;
      }
    });
  }

  return clonedScene;
}

export default {
  isBakedModel,
  convertToBasicMaterial,
  convertSceneToBasicMaterials,
  adjustSceneForBaked,
  prepareClonedSceneForBaked,
  BAKED_MODEL_PATTERNS,
};
