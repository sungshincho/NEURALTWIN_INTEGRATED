/**
 * 시뮬레이션/최적화/스튜디오 제어 처리
 *
 * neuraltwin-assistant는 명령서만 발행:
 *   1. 스튜디오 페이지로 네비게이션
 *   2. UIAction 반환 → 프론트엔드가 CustomEvent로 수신하여 실행
 *
 * 실제 실행은 프론트엔드가 기존 로직(EF 호출, 스토어 업데이트 등)을 그대로 사용
 */

import { ClassificationResult } from '../intent/classifier.ts';
import { UIAction } from './navigationActions.ts';

export interface ExecutionActionResult {
  actions: UIAction[];
  message: string;
  suggestions: string[];
}

// ============================================
// 프리셋 시나리오 ID 매핑 (프론트엔드 PresetScenarioId 기준)
// ============================================
const SCENARIO_ID_MAP: Record<string, string> = {
  // AI 분류기가 추출하는 ID → 프론트엔드 PresetScenarioId
  christmas: 'christmas',
  black_friday: 'blackFriday',
  blackfriday: 'blackFriday',
  rainy_weekday: 'rainyWeekday',
  rainy: 'rainyWeekday',
  new_arrival: 'newArrival',
  newarrival: 'newArrival',
  normal_weekend: 'normalWeekend',
  weekend: 'normalWeekend',
  cold_wave: 'coldWave',
  coldwave: 'coldWave',
  year_end: 'yearEndParty',
  yearend: 'yearEndParty',
  year_end_party: 'yearEndParty',
};

const SCENARIO_NAMES: Record<string, string> = {
  christmas: '크리스마스 시즌',
  blackFriday: '블랙프라이데이',
  rainyWeekday: '비 오는 평일',
  newArrival: '신상품 출시',
  normalWeekend: '일반 주말',
  coldWave: '한파 경보',
  yearEndParty: '연말 파티 시즌',
};

/**
 * 시나리오 ID를 프론트엔드 PresetScenarioId로 변환
 */
function resolvePresetId(rawScenario: string | null): string | null {
  if (!rawScenario) return null;
  const key = rawScenario.toLowerCase().replace(/[\s-]+/g, '_');
  return SCENARIO_ID_MAP[key] || SCENARIO_ID_MAP[rawScenario] || null;
}

// ============================================
// 스튜디오 네비게이션 헬퍼
// ============================================
function ensureStudioNavigation(
  actions: UIAction[],
  currentPage: string,
  tab: string
): void {
  if (!currentPage.includes('/studio')) {
    actions.push({
      type: 'navigate',
      target: `/studio?tab=${tab}`,
    });
  }
}

// ============================================
// 기존 핸들러 (개선)
// ============================================

/**
 * run_simulation 인텐트 처리
 * → 스튜디오 이동 + (프리셋 있으면 적용) + 시뮬레이션 실행
 */
export function handleRunSimulation(
  classification: ClassificationResult,
  context?: { page?: { current?: string } }
): ExecutionActionResult {
  const rawScenario = classification.entities.scenario || null;
  const presetId = resolvePresetId(rawScenario);
  const simulationType = classification.entities.simulationType || 'traffic_flow';

  const actions: UIAction[] = [];
  const currentPage = context?.page?.current || '';

  // 1. 스튜디오 이동
  ensureStudioNavigation(actions, currentPage, 'ai-simulation');

  // 2. 프리셋 시나리오 적용 (있으면)
  if (presetId) {
    actions.push({
      type: 'apply_preset',
      preset: presetId,
    } as UIAction);
  }

  // 3. 시뮬레이션 실행
  actions.push({
    type: 'run_simulation',
    params: {
      simulation_type: simulationType,
      scenario: presetId,
    },
  } as UIAction);

  // 응답 메시지
  let message = '시뮬레이션을 실행합니다.';
  if (presetId) {
    const scenarioName = SCENARIO_NAMES[presetId] || presetId;
    message = `"${scenarioName}" 시나리오를 적용하고 시뮬레이션을 실행합니다.`;
  }

  if (!currentPage.includes('/studio')) {
    message += '\n\n디지털트윈 스튜디오의 AI 시뮬레이션 탭으로 이동합니다.';
  }

  return {
    actions,
    message,
    suggestions: ['최적화 해줘', 'AI 리포트 보여줘', '히트맵 켜줘'],
  };
}

/**
 * run_optimization 인텐트 처리
 * → 스튜디오 이동 + 최적화 실행
 */
export function handleRunOptimization(
  classification: ClassificationResult,
  context?: { page?: { current?: string } }
): ExecutionActionResult {
  const optimizationType = classification.entities.optimizationType || 'layout';

  const actions: UIAction[] = [];
  const currentPage = context?.page?.current || '';

  // 1. 스튜디오 이동
  ensureStudioNavigation(actions, currentPage, 'ai-optimization');

  // 2. 최적화 실행
  actions.push({
    type: 'run_optimization',
    params: {
      optimization_type: optimizationType,
    },
  } as UIAction);

  const typeNames: Record<string, string> = {
    layout: '가구 배치',
    merchandising: '상품 진열',
    flow: '동선',
    staffing: '직원 배치',
    both: '통합',
  };
  const typeName = typeNames[optimizationType] || optimizationType;

  let message = `${typeName} 최적화를 실행합니다.`;
  if (!currentPage.includes('/studio')) {
    message += '\n\n디지털트윈 스튜디오의 AI 최적화 탭으로 이동합니다.';
  }

  return {
    actions,
    message,
    suggestions: ['시뮬레이션 돌려줘', '결과 비교 보여줘', 'AI 리포트 보여줘'],
  };
}

// ============================================
// 신규 핸들러: 오버레이 토글
// ============================================

const OVERLAY_NAMES: Record<string, string> = {
  heatmap: '히트맵',
  flow: '동선',
  avatar: '고객',
  zone: '존',
  staff: '직원',
};

export function handleToggleOverlay(
  classification: ClassificationResult,
  context?: { page?: { current?: string } }
): ExecutionActionResult {
  const overlay = classification.entities.overlay;
  const visible = classification.entities.visible; // true, false, or undefined (toggle)

  if (!overlay) {
    return {
      actions: [],
      message: '어떤 시각화를 토글할까요? 히트맵, 동선, 고객, 존, 직원 중에서 선택해주세요.',
      suggestions: ['히트맵 켜줘', '동선 보여줘', '고객 아바타 켜줘'],
    };
  }

  const actions: UIAction[] = [];
  const currentPage = context?.page?.current || '';

  ensureStudioNavigation(actions, currentPage, 'layer');

  actions.push({
    type: 'toggle_overlay',
    overlay,
    visible,
  } as UIAction);

  const overlayName = OVERLAY_NAMES[overlay] || overlay;
  const stateText = visible === true ? '표시' : visible === false ? '숨김' : '토글';
  const message = `${overlayName} 시각화를 ${stateText}합니다.`;

  return {
    actions,
    message,
    suggestions: getOverlaySuggestions(overlay),
  };
}

function getOverlaySuggestions(currentOverlay: string): string[] {
  const others = Object.entries(OVERLAY_NAMES)
    .filter(([key]) => key !== currentOverlay)
    .slice(0, 2)
    .map(([_, name]) => `${name} 켜줘`);
  return [...others, '시뮬레이션 돌려줘'];
}

// ============================================
// 신규 핸들러: 시뮬레이션 컨트롤
// ============================================

export function handleSimulationControl(
  classification: ClassificationResult,
  context?: { page?: { current?: string } }
): ExecutionActionResult {
  const command = classification.entities.simCommand || 'play';
  const speed = classification.entities.simSpeed;

  const actions: UIAction[] = [];
  const currentPage = context?.page?.current || '';

  ensureStudioNavigation(actions, currentPage, 'ai-simulation');

  const actionPayload: any = {
    type: 'simulation_control',
    command,
  };
  if (command === 'set_speed' && speed !== undefined) {
    actionPayload.speed = speed;
  }
  actions.push(actionPayload as UIAction);

  const commandNames: Record<string, string> = {
    play: '재생',
    pause: '일시정지',
    stop: '정지',
    reset: '초기화',
    set_speed: `속도 ${speed}x로 변경`,
  };

  return {
    actions,
    message: `시뮬레이션을 ${commandNames[command] || command}합니다.`,
    suggestions: ['시뮬레이션 정지', '속도 2배로', '히트맵 켜줘'],
  };
}

// ============================================
// 신규 핸들러: 프리셋 시나리오 적용 (실행 없이 세팅만)
// ============================================

export function handleApplyPreset(
  classification: ClassificationResult,
  context?: { page?: { current?: string } }
): ExecutionActionResult {
  const rawScenario = classification.entities.scenario || classification.entities.preset;
  const presetId = resolvePresetId(rawScenario);

  if (!presetId) {
    return {
      actions: [],
      message: '어떤 시나리오를 적용할까요? 크리스마스 시즌, 블랙프라이데이, 비 오는 평일, 신상품 출시, 일반 주말, 한파 경보, 연말 파티 중에서 선택해주세요.',
      suggestions: ['크리스마스 시나리오 적용', '블랙프라이데이 세팅', '비 오는 평일 시나리오'],
    };
  }

  const actions: UIAction[] = [];
  const currentPage = context?.page?.current || '';

  ensureStudioNavigation(actions, currentPage, 'ai-simulation');

  actions.push({
    type: 'apply_preset',
    preset: presetId,
  } as UIAction);

  const scenarioName = SCENARIO_NAMES[presetId] || presetId;

  return {
    actions,
    message: `"${scenarioName}" 시나리오 프리셋을 적용했습니다. 시뮬레이션을 실행하려면 말씀해주세요.`,
    suggestions: ['시뮬레이션 실행해줘', '다른 시나리오 적용', '환경 설정 변경'],
  };
}

// ============================================
// 신규 핸들러: 시뮬레이션 파라미터 설정
// ============================================

export function handleSetSimulationParams(
  classification: ClassificationResult,
  context?: { page?: { current?: string } }
): ExecutionActionResult {
  const simType = classification.entities.simType; // 'realtime' | 'prediction'
  const customerCount = classification.entities.customerCount;
  const duration = classification.entities.duration;

  const actions: UIAction[] = [];
  const currentPage = context?.page?.current || '';

  ensureStudioNavigation(actions, currentPage, 'ai-simulation');

  const params: any = {};
  if (simType) params.simulation_type = simType;
  if (customerCount) params.customer_count = customerCount;
  if (duration) params.duration = duration;

  actions.push({
    type: 'set_simulation_params',
    params,
  } as UIAction);

  const parts: string[] = [];
  if (simType) parts.push(`모드: ${simType === 'realtime' ? '실시간' : 'AI 예측'}`);
  if (customerCount) parts.push(`고객 수: ${customerCount}명`);
  if (duration) parts.push(`시간: ${duration}분`);

  return {
    actions,
    message: `시뮬레이션 설정을 변경합니다. ${parts.join(', ')}`,
    suggestions: ['시뮬레이션 실행해줘', '프리셋 시나리오 적용', '환경 설정 변경'],
  };
}

// ============================================
// 신규 핸들러: 최적화 설정
// ============================================

export function handleSetOptimizationConfig(
  classification: ClassificationResult,
  context?: { page?: { current?: string } }
): ExecutionActionResult {
  const goal = classification.entities.optGoal;
  const types = classification.entities.optTypes;
  const intensity = classification.entities.optIntensity;

  const actions: UIAction[] = [];
  const currentPage = context?.page?.current || '';

  ensureStudioNavigation(actions, currentPage, 'ai-optimization');

  const config: any = {};
  if (goal) config.goal = goal;
  if (types) config.types = types;
  if (intensity) config.intensity = intensity;

  actions.push({
    type: 'set_optimization_config',
    config,
  } as UIAction);

  const goalNames: Record<string, string> = {
    revenue: '매출 극대화',
    dwell_time: '체류 시간 증가',
    traffic: '유동인구 증가',
    conversion: '전환율 향상',
  };

  const parts: string[] = [];
  if (goal) parts.push(`목표: ${goalNames[goal] || goal}`);
  if (types?.length) parts.push(`유형: ${types.join(', ')}`);
  if (intensity) parts.push(`강도: ${intensity}`);

  return {
    actions,
    message: `최적화 설정을 변경합니다. ${parts.join(', ')}`,
    suggestions: ['최적화 실행해줘', '시뮬레이션 돌려줘', '현재 설정 확인'],
  };
}

// ============================================
// 신규 핸들러: 뷰 모드 전환
// ============================================

export function handleSetViewMode(
  classification: ClassificationResult,
  context?: { page?: { current?: string } }
): ExecutionActionResult {
  const mode = classification.entities.viewMode || 'as-is';

  const actions: UIAction[] = [];
  const currentPage = context?.page?.current || '';

  ensureStudioNavigation(actions, currentPage, 'ai-optimization');

  actions.push({
    type: 'set_view_mode',
    mode,
  } as UIAction);

  const modeNames: Record<string, string> = {
    'as-is': '현재 상태 (As-Is)',
    'compare': '비교 (Compare)',
    'to-be': '최적화 결과 (To-Be)',
  };

  return {
    actions,
    message: `뷰 모드를 ${modeNames[mode] || mode}(으)로 전환합니다.`,
    suggestions: ['최적화 실행해줘', 'AI 리포트 보여줘', '씬 저장해줘'],
  };
}

// ============================================
// 신규 핸들러: 패널 토글 (AI 리포트 / 씬 저장)
// ============================================

export function handleTogglePanel(
  classification: ClassificationResult,
  context?: { page?: { current?: string } }
): ExecutionActionResult {
  const panel = classification.entities.panel;
  const visible = classification.entities.visible;

  if (!panel) {
    return {
      actions: [],
      message: '어떤 패널을 열까요? AI 리포트 또는 씬 저장 중에서 선택해주세요.',
      suggestions: ['AI 리포트 보여줘', '씬 저장 열어줘'],
    };
  }

  const actions: UIAction[] = [];
  const currentPage = context?.page?.current || '';

  ensureStudioNavigation(actions, currentPage, 'layer');

  actions.push({
    type: 'toggle_panel',
    panel,
    visible,
  } as UIAction);

  const panelNames: Record<string, string> = {
    resultReport: 'AI 리포트',
    sceneSave: '씬 저장',
  };

  const panelName = panelNames[panel] || panel;
  const stateText = visible === true ? '열기' : visible === false ? '닫기' : '토글';

  return {
    actions,
    message: `${panelName} 패널을 ${stateText}합니다.`,
    suggestions: panel === 'resultReport'
      ? ['씬 저장 열어줘', '최적화 해줘', '시뮬레이션 돌려줘']
      : ['AI 리포트 보여줘', '시뮬레이션 돌려줘', '최적화 해줘'],
  };
}

// ============================================
// 신규 핸들러: 씬 저장
// ============================================

export function handleSaveScene(
  classification: ClassificationResult,
  context?: { page?: { current?: string } }
): ExecutionActionResult {
  const sceneName = classification.entities.sceneName;

  const actions: UIAction[] = [];
  const currentPage = context?.page?.current || '';

  ensureStudioNavigation(actions, currentPage, 'layer');

  actions.push({
    type: 'save_scene',
    name: sceneName || undefined,
  } as UIAction);

  const message = sceneName
    ? `"${sceneName}" 이름으로 현재 씬을 저장합니다.`
    : '현재 씬을 저장합니다.';

  return {
    actions,
    message,
    suggestions: ['시뮬레이션 돌려줘', '최적화 해줘', 'AI 리포트 보여줘'],
  };
}

// ============================================
// 신규 핸들러: 환경 설정 변경
// ============================================

export function handleSetEnvironment(
  classification: ClassificationResult,
  context?: { page?: { current?: string } }
): ExecutionActionResult {
  const weather = classification.entities.weather;
  const timeOfDay = classification.entities.timeOfDay;
  const holidayType = classification.entities.holidayType;

  const actions: UIAction[] = [];
  const currentPage = context?.page?.current || '';

  ensureStudioNavigation(actions, currentPage, 'ai-simulation');

  actions.push({
    type: 'set_environment',
    weather,
    timeOfDay,
    holidayType,
  } as UIAction);

  const weatherNames: Record<string, string> = {
    clear: '맑음', rain: '비', snow: '눈', clouds: '흐림', heavy_snow: '폭설',
  };
  const timeNames: Record<string, string> = {
    morning: '오전', afternoon: '오후', evening: '저녁', night: '밤', peak: '피크타임',
  };
  const holidayNames: Record<string, string> = {
    none: '일반', weekend: '주말', holiday: '공휴일',
    christmas: '크리스마스', black_friday: '블랙프라이데이',
  };

  const parts: string[] = [];
  if (weather) parts.push(`날씨: ${weatherNames[weather] || weather}`);
  if (timeOfDay) parts.push(`시간대: ${timeNames[timeOfDay] || timeOfDay}`);
  if (holidayType) parts.push(`휴일: ${holidayNames[holidayType] || holidayType}`);

  return {
    actions,
    message: `환경 설정을 변경합니다. ${parts.join(', ')}`,
    suggestions: ['시뮬레이션 실행해줘', '프리셋 시나리오 적용', '히트맵 켜줘'],
  };
}

// ============================================
// 통합 디스패처
// ============================================

export function dispatchStudioAction(
  classification: ClassificationResult,
  context?: { page?: { current?: string } }
): ExecutionActionResult {
  switch (classification.intent) {
    case 'run_simulation':
      return handleRunSimulation(classification, context);
    case 'run_optimization':
      return handleRunOptimization(classification, context);
    case 'toggle_overlay':
      return handleToggleOverlay(classification, context);
    case 'simulation_control':
      return handleSimulationControl(classification, context);
    case 'apply_preset':
      return handleApplyPreset(classification, context);
    case 'set_simulation_params':
      return handleSetSimulationParams(classification, context);
    case 'set_optimization_config':
      return handleSetOptimizationConfig(classification, context);
    case 'set_view_mode':
      return handleSetViewMode(classification, context);
    case 'toggle_panel':
      return handleTogglePanel(classification, context);
    case 'save_scene':
      return handleSaveScene(classification, context);
    case 'set_environment':
      return handleSetEnvironment(classification, context);
    default:
      return { actions: [], message: '', suggestions: [] };
  }
}
