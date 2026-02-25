/**
 * Digital Twin Studio Feature Exports
 *
 * 리팩토링된 디지털트윈 스튜디오 모듈
 */

// 메인 페이지
export { default as DigitalTwinStudioPage } from './DigitalTwinStudioPage';

// 코어 컴포넌트
export * from './core';

// 모델 컴포넌트
export * from './models';

// 오버레이 컴포넌트
export * from './overlays';

// UI 패널
export * from './panels';

// UI 컴포넌트
export * from './components';

// 커스텀 훅 (types 제외)
export {
  useLayoutSimulation,
  useSceneSimulation,
  useScenePersistence,
  useStudioMode,
  useOverlayVisibility,
  useCongestionSimulation,
  useFlowSimulation,
  useStaffingSimulation,
} from './hooks';

// 유틸리티
export * from './utils';

// 타입 (별도 export)
export type {
  StudioMode,
  Vector3,
  Vector3Tuple,
  Model3D,
  ModelType,
  SceneRecipe,
  TransformMode,
  LayerNode,
  ModelLayer,
} from './types';
