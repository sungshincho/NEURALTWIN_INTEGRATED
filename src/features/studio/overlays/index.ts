/**
 * overlays/index.ts
 *
 * 오버레이 컴포넌트 익스포트
 */

// 기본 오버레이 컴포넌트
export { HeatmapOverlay } from './HeatmapOverlay';
export { CustomerFlowOverlay } from './CustomerFlowOverlay';
export { ZoneBoundaryOverlay } from './ZoneBoundaryOverlay';
export { CustomerAvatarOverlay } from './CustomerAvatarOverlay';

// AI 시뮬레이션 오버레이 컴포넌트
export { LayoutOptimizationOverlay } from './LayoutOptimizationOverlay';
export { FlowOptimizationOverlay } from './FlowOptimizationOverlay';
export { CongestionOverlay } from './CongestionOverlay';
export { StaffingOverlay } from './StaffingOverlay';

// 실제 DB 스태프 아바타 오버레이
export { StaffAvatarsOverlay } from './StaffAvatarsOverlay';

// 슬롯 시각화 오버레이
export { SlotVisualizerOverlay, SlotCompatibilityPreview } from './SlotVisualizerOverlay';

// zones_dim 기반 구역 오버레이
export { ZonesFloorOverlay } from './ZonesFloorOverlay';

// 개선된 고객 동선/시뮬레이션 오버레이 (zone_transitions 기반)
export { CustomerFlowOverlayEnhanced } from './CustomerFlowOverlayEnhanced';
export { CustomerAvatarsOverlay } from './CustomerAvatarsOverlay';

// 인력 재배치 오버레이 (As-Is → To-Be 이동 경로 시각화)
export { StaffReallocationOverlay } from './StaffReallocationOverlay';

// 환경 효과 오버레이 (날씨, 조명, 파티클)
export { EnvironmentEffectsOverlay, WeatherStatusBadge } from './EnvironmentEffectsOverlay';

// 기존 컴포넌트 re-export (호환성)
// 점진적 마이그레이션을 위해 기존 경로도 유지
export { HeatmapOverlay as HeatmapOverlay3D } from './HeatmapOverlay';
