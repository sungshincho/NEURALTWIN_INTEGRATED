/**
 * SelectionManager.tsx
 *
 * 3D 오브젝트 선택 관리
 * - 클릭으로 선택
 * - 다중 선택 (Shift+클릭)
 * - 선택 해제 (빈 공간 클릭)
 */

import { useEffect, useCallback } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useScene } from './SceneProvider';

// ============================================================================
// Props
// ============================================================================
interface SelectionManagerProps {
  /** 다중 선택 활성화 */
  enableMultiSelect?: boolean;
  /** 선택 변경 콜백 */
  onSelectionChange?: (selectedIds: string[]) => void;
}

// ============================================================================
// SelectionManager 컴포넌트
// ============================================================================
export function SelectionManager({
  enableMultiSelect = false,
  onSelectionChange,
}: SelectionManagerProps) {
  const { camera, gl, scene } = useThree();
  const { select, selectedId, models } = useScene();

  // 빈 공간 클릭 시 선택 해제
  const handlePointerMissed = useCallback(() => {
    select(null);
    onSelectionChange?.([]);
  }, [select, onSelectionChange]);

  // 키보드 이벤트 (Delete로 삭제, Escape로 선택 해제)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        select(null);
        onSelectionChange?.([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [select, onSelectionChange]);

  // 선택 변경 시 콜백 호출
  useEffect(() => {
    if (selectedId) {
      onSelectionChange?.([selectedId]);
    }
  }, [selectedId, onSelectionChange]);

  // 클릭 이벤트 (캔버스 레벨)
  useEffect(() => {
    const canvas = gl.domElement;

    const handleClick = (e: MouseEvent) => {
      // Raycaster 설정
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const rect = canvas.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // 씬의 모든 오브젝트와 교차 검사
      const intersects = raycaster.intersectObjects(scene.children, true);

      if (intersects.length === 0) {
        // 빈 공간 클릭
        select(null);
        onSelectionChange?.([]);
      }
    };

    canvas.addEventListener('click', handleClick);
    return () => canvas.removeEventListener('click', handleClick);
  }, [gl, camera, scene, select, onSelectionChange]);

  // 시각적 표시 없음 (모델 컴포넌트에서 처리)
  return null;
}

// ============================================================================
// 선택 하이라이트 컴포넌트 (개별 모델에 적용)
// ============================================================================
interface SelectionHighlightProps {
  selected: boolean;
  hovered: boolean;
  children: React.ReactNode;
}

export function SelectionHighlight({ selected, hovered, children }: SelectionHighlightProps) {
  return (
    <group>
      {children}

      {/* 선택 시 아웃라인 */}
      {selected && (
        <mesh>
          <boxGeometry args={[1.05, 1.05, 1.05]} />
          <meshBasicMaterial
            color="#3b82f6"
            transparent
            opacity={0.3}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}

      {/* 호버 시 하이라이트 */}
      {hovered && !selected && (
        <mesh>
          <boxGeometry args={[1.02, 1.02, 1.02]} />
          <meshBasicMaterial
            color="#60a5fa"
            transparent
            opacity={0.15}
            side={THREE.BackSide}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
}

// ============================================================================
// 선택 박스 컴포넌트 (영역 선택용)
// ============================================================================
interface SelectionBoxProps {
  start: THREE.Vector2;
  end: THREE.Vector2;
  active: boolean;
}

export function SelectionBox({ start, end, active }: SelectionBoxProps) {
  if (!active) return null;

  const left = Math.min(start.x, end.x);
  const top = Math.min(start.y, end.y);
  const width = Math.abs(end.x - start.x);
  const height = Math.abs(end.y - start.y);

  return (
    <div
      style={{
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        border: '1px dashed #3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        pointerEvents: 'none',
        zIndex: 1000,
      }}
    />
  );
}

export default SelectionManager;
