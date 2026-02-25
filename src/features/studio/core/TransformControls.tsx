/**
 * TransformControls.tsx
 *
 * 3D 오브젝트 변환 컨트롤
 * - 이동 (Translate)
 * - 회전 (Rotate)
 * - 스케일 (Scale)
 */

import { useRef, useEffect, useState } from 'react';
import { TransformControls as DreiTransformControls } from '@react-three/drei';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from './SceneProvider';
import type { TransformMode, Vector3Tuple } from '../types';

// ============================================================================
// Props
// ============================================================================
interface TransformControlsProps {
  /** 변환 모드 */
  mode?: TransformMode;
  /** 공간 (월드/로컬) */
  space?: 'world' | 'local';
  /** 컨트롤 크기 */
  size?: number;
  /** 변환 완료 콜백 */
  onTransformEnd?: (modelId: string, position: Vector3Tuple, rotation: Vector3Tuple, scale: Vector3Tuple) => void;
  /** 드래그 중 OrbitControls 비활성화 */
  disableOrbitOnDrag?: boolean;
}

// ============================================================================
// TransformControls 컴포넌트
// ============================================================================
export function TransformControls({
  mode = 'translate',
  space = 'world',
  size = 1,
  onTransformEnd,
  disableOrbitOnDrag = true,
}: TransformControlsProps) {
  const transformRef = useRef<any>(null);
  const { selectedId, selectedModel, updateModel, models } = useScene();
  const { scene, gl, camera } = useThree();
  const [isDragging, setIsDragging] = useState(false);

  // 선택된 모델의 3D 오브젝트 찾기
  const targetObject = useRef<THREE.Object3D | null>(null);

  useEffect(() => {
    if (!selectedId || !selectedModel) {
      targetObject.current = null;
      return;
    }

    // 씬에서 선택된 모델 찾기
    scene.traverse((object) => {
      if (object.userData?.modelId === selectedId) {
        targetObject.current = object;
      }
    });
  }, [selectedId, selectedModel, scene]);

  // 변환 완료 시 상태 업데이트
  const handleChange = () => {
    if (!transformRef.current || !selectedId || !targetObject.current) return;

    const object = targetObject.current;
    const position: Vector3Tuple = [object.position.x, object.position.y, object.position.z];
    const rotation: Vector3Tuple = [object.rotation.x, object.rotation.y, object.rotation.z];
    const scale: Vector3Tuple = [object.scale.x, object.scale.y, object.scale.z];

    updateModel(selectedId, { position, rotation, scale });
    onTransformEnd?.(selectedId, position, rotation, scale);
  };

  // 드래그 상태 관리 (OrbitControls 비활성화용)
  useEffect(() => {
    if (!transformRef.current) return;

    const controls = transformRef.current;

    const handleDragStart = () => {
      setIsDragging(true);
    };

    const handleDragEnd = () => {
      setIsDragging(false);
      handleChange();
    };

    controls.addEventListener('dragging-changed', (event: any) => {
      if (event.value) {
        handleDragStart();
      } else {
        handleDragEnd();
      }
    });

    return () => {
      controls.removeEventListener('dragging-changed', handleDragStart);
    };
  }, []);

  // OrbitControls 비활성화 (드래그 중)
  // @react-three/drei의 TransformControls는 자동으로 OrbitControls를 비활성화하지만
  // 명시적으로 제어하기 위해 추가 처리
  useEffect(() => {
    if (!disableOrbitOnDrag) return;

    // useThree의 controls는 makeDefault로 설정된 컨트롤을 반환
    // OrbitControls.enabled를 제어하여 드래그 중 충돌 방지
    const orbitControlsElement = gl.domElement.parentElement;
    if (!orbitControlsElement) return;

    // 드래그 중에는 OrbitControls 비활성화
    if (isDragging) {
      document.body.style.cursor = 'grabbing';
    } else {
      document.body.style.cursor = 'auto';
    }
  }, [isDragging, disableOrbitOnDrag, gl]);

  // 선택된 모델이 없으면 렌더링하지 않음
  if (!selectedId || !selectedModel || !targetObject.current) {
    return null;
  }

  return (
    <DreiTransformControls
      ref={transformRef}
      object={targetObject.current}
      mode={mode}
      space={space}
      size={size}
      showX
      showY
      showZ
    />
  );
}

// ============================================================================
// 변환 모드 토글 버튼 (UI용)
// ============================================================================
interface TransformModeButtonProps {
  currentMode: TransformMode;
  onModeChange: (mode: TransformMode) => void;
}

export function TransformModeButton({ currentMode, onModeChange }: TransformModeButtonProps) {
  const modes: { mode: TransformMode; label: string; shortcut: string }[] = [
    { mode: 'translate', label: '이동', shortcut: 'G' },
    { mode: 'rotate', label: '회전', shortcut: 'R' },
    { mode: 'scale', label: '스케일', shortcut: 'S' },
  ];

  // 키보드 단축키
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'g':
          onModeChange('translate');
          break;
        case 'r':
          onModeChange('rotate');
          break;
        case 's':
          onModeChange('scale');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onModeChange]);

  return (
    <div className="flex gap-1 p-1 bg-black/80 backdrop-blur-sm border border-white/10 rounded-lg">
      {modes.map(({ mode, label, shortcut }) => (
        <button
          key={mode}
          onClick={() => onModeChange(mode)}
          className={`
            px-3 py-1.5 text-xs font-medium rounded transition-colors
            ${currentMode === mode
              ? 'bg-primary text-white'
              : 'text-white/60 hover:text-white hover:bg-white/10'
            }
          `}
          title={`${label} (${shortcut})`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

// ============================================================================
// 스냅 설정
// ============================================================================
interface SnapSettings {
  translate: number | null; // null = 스냅 없음
  rotate: number | null; // 라디안
  scale: number | null;
}

export const DEFAULT_SNAP_SETTINGS: SnapSettings = {
  translate: 0.5, // 0.5 단위
  rotate: Math.PI / 12, // 15도
  scale: 0.1, // 0.1 단위
};

export default TransformControls;
