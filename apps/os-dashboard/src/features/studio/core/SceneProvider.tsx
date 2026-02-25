/**
 * SceneProvider.tsx
 *
 * 3D 씬 상태 관리 Provider (Zustand 기반)
 * - 기존 Context 기반에서 Zustand로 마이그레이션
 * - 하위 호환성을 위해 기존 훅 시그니처 유지
 * - 선택적 구독으로 성능 최적화
 */

import { useEffect, ReactNode } from 'react';
import { useSceneStore } from '../stores/sceneStore';
import type {
  StudioMode,
  SceneState,
  Model3D,
  SceneLayer,
  CameraSettings,
} from '../types';

// 타입 re-export (하위 호환성)
export type { FurnitureMove, SimulationResultsPayload } from '../stores/sceneStore';

// ============================================================================
// Provider 컴포넌트 (초기화만 담당)
// ============================================================================
interface SceneProviderProps {
  mode?: StudioMode;
  children: ReactNode;
  initialModels?: Model3D[];
}

export function SceneProvider({ mode = 'view', children, initialModels = [] }: SceneProviderProps) {
  const initialize = useSceneStore((s) => s.initialize);
  const setModels = useSceneStore((s) => s.setModels);

  // 초기화 (마운트 시)
  useEffect(() => {
    initialize(mode, initialModels);
  }, []);

  // initialModels가 변경되면 상태 동기화 (비동기 로드 지원)
  useEffect(() => {
    if (initialModels.length > 0) {
      setModels(initialModels);
    }
  }, [initialModels, setModels]);

  // Zustand는 Provider 래핑이 필요 없음
  return <>{children}</>;
}

// ============================================================================
// 하위 호환 Hook (기존 코드 지원)
// ============================================================================

/**
 * 전체 씬 상태와 액션에 접근하는 훅
 *
 * @deprecated 성능 최적화를 위해 useSceneStore에서 필요한 값만 선택적으로 구독하세요.
 * 예: const models = useSceneStore((s) => s.models);
 */
export function useScene() {
  // 전체 store 반환 (기존 동작과 동일하게 전체 리렌더링)
  const store = useSceneStore();

  // 기존 인터페이스와 동일하게 state 객체도 제공
  const state: SceneState = {
    mode: store.mode,
    models: store.models,
    layers: store.layers,
    selectedId: store.selectedId,
    hoveredId: store.hoveredId,
    activeOverlays: store.activeOverlays,
    camera: store.camera,
    isDirty: store.isDirty,
  };

  return {
    // 상태
    state,
    dispatch: () => console.warn('[useScene] dispatch is deprecated. Use individual actions instead.'),

    // 모드
    mode: store.mode,
    setMode: store.setMode,

    // 모델 관리
    models: store.models,
    addModel: store.addModel,
    updateModel: store.updateModel,
    removeModel: store.removeModel,
    setModels: store.setModels,

    // 선택
    selectedId: store.selectedId,
    hoveredId: store.hoveredId,
    select: store.select,
    hover: store.hover,
    selectedModel: store.selectedModel,

    // 레이어
    layers: store.layers,
    addLayer: store.addLayer,
    updateLayer: store.updateLayer,
    removeLayer: store.removeLayer,
    toggleLayerVisibility: store.toggleLayerVisibility,

    // 오버레이
    activeOverlays: store.activeOverlays,
    toggleOverlay: store.toggleOverlay,
    setActiveOverlays: store.setActiveOverlays,
    isOverlayActive: store.isOverlayActive,

    // 카메라
    camera: store.camera,
    setCamera: store.setCamera,

    // 씬 관리
    loadScene: store.loadScene,
    resetScene: store.resetScene,
    isDirty: store.isDirty,
    setDirty: store.setDirty,

    // 시뮬레이션
    applySimulationResults: store.applySimulationResults,
    revertSimulationChanges: store.revertSimulationChanges,

    // 제품 가시성
    toggleProductVisibility: store.toggleProductVisibility,
    isProductVisible: store.isProductVisible,

    // 카메라 포커스
    focusOnModel: store.focusOnModel,
  };
}

// ============================================================================
// 최적화된 편의 훅들 (선택적 구독)
// ============================================================================

/**
 * 모드 관련 상태와 액션
 * - mode 변경 시에만 리렌더링
 */
export function useSceneMode() {
  const mode = useSceneStore((s) => s.mode);
  const setMode = useSceneStore((s) => s.setMode);
  return { mode, setMode };
}

/**
 * 선택/호버 관련 상태와 액션
 * - selectedId, hoveredId 변경 시에만 리렌더링
 */
export function useSceneSelection() {
  const selectedId = useSceneStore((s) => s.selectedId);
  const hoveredId = useSceneStore((s) => s.hoveredId);
  const selectedModel = useSceneStore((s) => s.selectedModel);
  const select = useSceneStore((s) => s.select);
  const hover = useSceneStore((s) => s.hover);
  return { selectedId, hoveredId, select, hover, selectedModel };
}

/**
 * 모델 관련 상태와 액션
 * - models 변경 시에만 리렌더링
 */
export function useSceneModels() {
  const models = useSceneStore((s) => s.models);
  const addModel = useSceneStore((s) => s.addModel);
  const updateModel = useSceneStore((s) => s.updateModel);
  const removeModel = useSceneStore((s) => s.removeModel);
  const setModels = useSceneStore((s) => s.setModels);
  return { models, addModel, updateModel, removeModel, setModels };
}

/**
 * 오버레이 관련 상태와 액션
 * - activeOverlays 변경 시에만 리렌더링
 */
export function useSceneOverlays() {
  const activeOverlays = useSceneStore((s) => s.activeOverlays);
  const toggleOverlay = useSceneStore((s) => s.toggleOverlay);
  const setActiveOverlays = useSceneStore((s) => s.setActiveOverlays);
  const isOverlayActive = useSceneStore((s) => s.isOverlayActive);
  return { activeOverlays, toggleOverlay, setActiveOverlays, isOverlayActive };
}

/**
 * 레이어 관련 상태와 액션
 * - layers 변경 시에만 리렌더링
 */
export function useSceneLayers() {
  const layers = useSceneStore((s) => s.layers);
  const addLayer = useSceneStore((s) => s.addLayer);
  const updateLayer = useSceneStore((s) => s.updateLayer);
  const removeLayer = useSceneStore((s) => s.removeLayer);
  const toggleLayerVisibility = useSceneStore((s) => s.toggleLayerVisibility);
  return { layers, addLayer, updateLayer, removeLayer, toggleLayerVisibility };
}

/**
 * 카메라 관련 상태와 액션
 * - camera 변경 시에만 리렌더링
 */
export function useSceneCamera() {
  const camera = useSceneStore((s) => s.camera);
  const setCamera = useSceneStore((s) => s.setCamera);
  const focusOnModel = useSceneStore((s) => s.focusOnModel);
  return { camera, setCamera, focusOnModel };
}

/**
 * 시뮬레이션 관련 액션
 * - 액션만 반환 (상태 구독 없음, 리렌더링 없음)
 */
export function useSceneSimulationActions() {
  const applySimulationResults = useSceneStore((s) => s.applySimulationResults);
  const revertSimulationChanges = useSceneStore((s) => s.revertSimulationChanges);
  return { applySimulationResults, revertSimulationChanges };
}

export default SceneProvider;
