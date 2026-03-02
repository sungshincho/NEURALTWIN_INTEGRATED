/**
 * Demo Mode Components — Barrel Export
 *
 * Sprint 4.4: 데모 모드 + 3 시나리오 프리셋
 */

export { DemoModeProvider } from './DemoModeProvider';
export { DemoBadge } from './DemoBadge';
export { DemoCTABar } from './DemoCTABar';
export { GuidedTour } from './GuidedTour';
export {
  SCENARIO_PRESETS,
  SCENARIO_CARDS,
  getScenarioPreset,
} from './ScenarioPresets';
export type {
  ScenarioPreset,
  DemoZone,
  DemoKPI,
  DemoAIInsight,
  DemoChartData,
  TourHighlight,
} from './ScenarioPresets';
