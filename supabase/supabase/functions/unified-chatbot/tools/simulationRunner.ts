/**
 * Simulation Runner — Function Calling Tool Implementation
 *
 * AI가 run_simulation 도구를 호출했을 때 실행되는 핸들러.
 * 프론트엔드의 시뮬레이션 엔진을 트리거하기 위한 파라미터를 생성합니다.
 */

interface SimulationRequest {
  scenario: string;
  customerCount?: number;
  duration?: number;
  storeId?: string;
}

interface SimulationResult {
  action: 'start_simulation';
  params: {
    scenario: string;
    customerCount: number;
    duration: number;
    storeId?: string;
    presetConfig?: Record<string, unknown>;
  };
  uiActions: Array<{
    type: string;
    payload: Record<string, unknown>;
  }>;
  message: string;
}

// 시나리오별 프리셋 설정
const SCENARIO_PRESETS: Record<string, Record<string, unknown>> = {
  current: {
    name: '현재 상태',
    speed: 1,
    heatmapEnabled: true,
  },
  optimized: {
    name: '최적화 레이아웃',
    speed: 1,
    heatmapEnabled: true,
    optimizationApplied: true,
  },
  rush_hour: {
    name: '러시아워',
    speed: 2,
    heatmapEnabled: true,
    customerMultiplier: 2.5,
  },
  weekend: {
    name: '주말',
    speed: 1,
    heatmapEnabled: true,
    customerMultiplier: 1.8,
  },
  promotion: {
    name: '프로모션',
    speed: 1,
    heatmapEnabled: true,
    customerMultiplier: 3.0,
    focusZones: ['entrance', 'display', 'checkout'],
  },
  custom: {
    name: '커스텀',
    speed: 1,
    heatmapEnabled: true,
  },
};

/**
 * 시뮬레이션 실행 파라미터 생성
 * 실제 시뮬레이션은 프론트엔드에서 수행됨 — 이 함수는 파라미터와 UI 액션만 생성
 */
export function runSimulation(params: SimulationRequest): SimulationResult {
  const {
    scenario = 'current',
    customerCount = 50,
    duration = 60,
    storeId,
  } = params;

  const preset = SCENARIO_PRESETS[scenario] || SCENARIO_PRESETS.current;
  const scenarioName = (preset.name as string) || scenario;

  return {
    action: 'start_simulation',
    params: {
      scenario,
      customerCount: Math.min(200, Math.max(10, customerCount)),
      duration: Math.min(480, Math.max(10, duration)),
      storeId,
      presetConfig: preset,
    },
    uiActions: [
      {
        type: 'navigate',
        payload: { path: '/os/studio', tab: 'simulation' },
      },
      {
        type: 'startSimulation',
        payload: {
          scenario,
          customerCount,
          duration,
          preset,
        },
      },
    ],
    message: `"${scenarioName}" 시나리오로 시뮬레이션을 준비했습니다. 고객 ${customerCount}명, ${duration}분 동안 실행합니다. 스튜디오 페이지에서 시뮬레이션을 확인하세요.`,
  };
}
