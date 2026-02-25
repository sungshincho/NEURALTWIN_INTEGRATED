/**
 * core/index.ts
 *
 * 코어 모듈 익스포트
 */

// Canvas3D
export { Canvas3D, StandaloneCanvas3D } from './Canvas3D';
export type { default as Canvas3DDefault } from './Canvas3D';

// SceneProvider & Hooks
export {
  SceneProvider,
  useScene,
  useSceneMode,
  useSceneSelection,
  useSceneModels,
  useSceneOverlays,
  useSceneLayers,
  useSceneCamera,
  useSceneSimulationActions,
} from './SceneProvider';

// SceneProvider 타입 re-export
export type { FurnitureMove, SimulationResultsPayload } from './SceneProvider';

// Zustand Store (직접 선택적 구독용)
export { useSceneStore } from '../stores/sceneStore';

// SceneEnvironment
export { SceneEnvironment, SCENE_CONFIG, LIGHTING_PRESETS } from './SceneEnvironment';

// ModelLoader
export { ModelLoader, preloadModel, clearModelCache } from './ModelLoader';

// SelectionManager
export { SelectionManager, SelectionHighlight, SelectionBox } from './SelectionManager';

// TransformControls
export {
  TransformControls,
  TransformModeButton,
  DEFAULT_SNAP_SETTINGS,
} from './TransformControls';

// PostProcessing
export { PostProcessing, POSTPROCESS_CONFIG, POSTPROCESS_PRESETS } from './PostProcessing';
