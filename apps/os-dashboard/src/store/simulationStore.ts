import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// ============== Type Definitions ==============

export type SimulationMode =
  | 'idle'
  | 'layout'
  | 'customer_flow'
  | 'heatmap'
  | 'demand'
  | 'inventory'
  | 'staff'
  | 'promotion'
  | 'realtime'; // 실시간 시뮬레이션 모드 추가

export type SimulationStatus = 'stopped' | 'running' | 'paused' | 'completed';

// 고객 에이전트 상태 타입
export type CustomerState = 'entering' | 'browsing' | 'engaged' | 'fitting' | 'purchasing' | 'exiting';

export interface SimulationConfig {
  mode: SimulationMode;
  duration: number;      // seconds
  speed: number;         // multiplier
  parameters: Record<string, any>;
  // 실시간 시뮬레이션 설정
  maxCustomers: number;
  spawnRate: number;
  avgDwellTime: number;
  purchaseProbability: number;
  showAgentPaths: boolean;
}

export interface EntityState {
  id: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  metadata: Record<string, any>;
  isSelected: boolean;
  isHighlighted: boolean;
}

// 확장된 CustomerAgent 타입
export interface CustomerAgent {
  id: string;
  position: [number, number, number];
  targetPosition: [number, number, number];
  targetZone: string | null;
  currentZone: string | null;
  visitedZones: string[];
  behavior: 'browsing' | 'walking' | 'purchasing' | 'exiting';
  state: CustomerState;
  speed: number;
  enteredAt: number;
  dwellTime: number;
  purchaseProbability: number;
  color: string;
  path: [number, number, number][];
  avatar_url?: string; // GLB 모델 URL (customers 테이블에서 로드)
}

// 실시간 KPI 타입
export interface SimulationKPI {
  currentCustomers: number;
  totalVisitors: number;
  totalRevenue: number;
  avgDwellTime: number;
  conversionRate: number;
  conversions: number;
  zoneOccupancy: Record<string, number>;
  zoneDwellTime: Record<string, number>;
}

// 상태별 색상 상수
export const STATE_COLORS: Record<CustomerState, string> = {
  entering: '#60A5FA',
  browsing: '#34D399',
  engaged: '#FBBF24',
  fitting: '#A78BFA',
  purchasing: '#F87171',
  exiting: '#9CA3AF',
};

// 상태별 라벨 상수
export const STATE_LABELS: Record<CustomerState, string> = {
  entering: '입장',
  browsing: '탐색',
  engaged: '관심',
  fitting: '피팅',
  purchasing: '구매',
  exiting: '퇴장',
};

export interface ZoneMetric {
  zoneId: string;
  zoneName: string;
  visitorCount: number;
  avgDwellTime: number;
  conversionRate: number;
  revenue: number;
  heatmapIntensity: number;
}

export interface SimulationResult {
  timestamp: number;
  metrics: {
    totalVisitors: number;
    totalRevenue: number;
    avgConversion: number;
    avgDwellTime: number;
    peakHour: number;
    bottleneckZones: string[];
  };
  zoneMetrics: ZoneMetric[];
  recommendations: string[];
}

// 기본 KPI 값
const defaultKPI: SimulationKPI = {
  currentCustomers: 0,
  totalVisitors: 0,
  totalRevenue: 0,
  avgDwellTime: 0,
  conversionRate: 0,
  conversions: 0,
  zoneOccupancy: {},
  zoneDwellTime: {},
};

// ============== Store State Interface ==============

interface SimulationState {
  // 기본 상태
  status: SimulationStatus;
  config: SimulationConfig;
  currentTime: number;
  entities: Record<string, EntityState>;
  selectedEntityId: string | null;
  customers: CustomerAgent[];
  zoneMetrics: ZoneMetric[];
  results: SimulationResult | null;

  // 실시간 시뮬레이션 상태
  isRunning: boolean;
  isPaused: boolean;
  simulationTime: number;
  realStartTime: number | null;
  kpi: SimulationKPI;

  // 기본 액션
  setConfig: (config: Partial<SimulationConfig>) => void;
  startSimulation: () => void;
  pauseSimulation: () => void;
  stopSimulation: () => void;
  resetSimulation: () => void;
  setEntities: (entities: Record<string, EntityState>) => void;
  updateEntity: (id: string, updates: Partial<EntityState>) => void;
  selectEntity: (id: string | null) => void;
  addCustomer: (customer: CustomerAgent) => void;
  updateCustomer: (id: string, updates: Partial<CustomerAgent>) => void;
  removeCustomer: (id: string) => void;
  updateZoneMetrics: (metrics: ZoneMetric[]) => void;
  tick: (deltaTime: number) => void;
  setResults: (results: SimulationResult) => void;

  // 실시간 시뮬레이션 액션
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
  setSpeed: (speed: number) => void;
  updateConfig: (config: Partial<SimulationConfig>) => void;
  updateKPI: (updates: Partial<SimulationKPI>) => void;
  recordConversion: (revenue: number) => void;
}

// ============== Store Implementation ==============

export const useSimulationStore = create<SimulationState>()(
  subscribeWithSelector((set, get) => ({
    // Initial State
    status: 'stopped',
    config: {
      mode: 'idle',
      duration: 0, // 0 = 무한 실행 (자동 완료 없음)
      speed: 1,
      parameters: {},
      // 실시간 시뮬레이션 기본값
      maxCustomers: 30,
      spawnRate: 0.3,
      avgDwellTime: 300,
      purchaseProbability: 0.164, // 16.4% 전환율
      showAgentPaths: false,
    },
    currentTime: 0,
    entities: {},
    selectedEntityId: null,
    customers: [],
    zoneMetrics: [],
    results: null,

    // 실시간 시뮬레이션 초기 상태
    isRunning: false,
    isPaused: false,
    simulationTime: 0,
    realStartTime: null,
    kpi: { ...defaultKPI },

    // Configuration Actions
    setConfig: (config) =>
      set((state) => ({
        config: { ...state.config, ...config },
      })),

    // Simulation Control Actions (기존 호환)
    startSimulation: () => set({ status: 'running', isRunning: true, isPaused: false }),

    pauseSimulation: () => set({ status: 'paused', isPaused: true }),

    stopSimulation: () => set({ status: 'stopped', currentTime: 0, isRunning: false, isPaused: false }),

    resetSimulation: () =>
      set({
        status: 'stopped',
        currentTime: 0,
        customers: [],
        zoneMetrics: [],
        results: null,
        isRunning: false,
        isPaused: false,
        simulationTime: 0,
        realStartTime: null,
        kpi: { ...defaultKPI },
      }),

    // 실시간 시뮬레이션 액션
    start: () => {
      set({
        isRunning: true,
        isPaused: false,
        status: 'running',
        realStartTime: Date.now(),
        simulationTime: 0,
        currentTime: 0, // currentTime도 함께 리셋
        customers: [],
        kpi: { ...defaultKPI },
      });
    },

    pause: () => set({ isPaused: true, status: 'paused' }),

    resume: () => set({ isPaused: false, status: 'running' }),

    stop: () => set({
      isRunning: false,
      isPaused: false,
      status: 'stopped',
      realStartTime: null,
    }),

    reset: () => set({
      isRunning: false,
      isPaused: false,
      status: 'stopped',
      simulationTime: 0,
      realStartTime: null,
      customers: [],
      kpi: { ...defaultKPI },
    }),

    setSpeed: (speed) => set((state) => ({
      config: { ...state.config, speed },
    })),

    updateConfig: (updates) => set((state) => ({
      config: { ...state.config, ...updates },
    })),

    updateKPI: (updates) => set((state) => ({
      kpi: { ...state.kpi, ...updates },
    })),

    recordConversion: (revenue) => set((state) => {
      const newConversions = state.kpi.conversions + 1;
      const newConversionRate = state.kpi.totalVisitors > 0
        ? (newConversions / state.kpi.totalVisitors) * 100
        : 0;

      return {
        kpi: {
          ...state.kpi,
          totalRevenue: state.kpi.totalRevenue + revenue,
          conversions: newConversions,
          conversionRate: newConversionRate,
        },
      };
    }),

    // Entity Actions
    setEntities: (entities) => set({ entities }),

    updateEntity: (id, updates) =>
      set((state) => ({
        entities: {
          ...state.entities,
          [id]: { ...state.entities[id], ...updates },
        },
      })),

    selectEntity: (id) =>
      set((state) => {
        const entities = { ...state.entities };

        // Deselect previous entity
        if (state.selectedEntityId && entities[state.selectedEntityId]) {
          entities[state.selectedEntityId] = {
            ...entities[state.selectedEntityId],
            isSelected: false,
          };
        }

        // Select new entity
        if (id && entities[id]) {
          entities[id] = {
            ...entities[id],
            isSelected: true,
          };
        }

        return { selectedEntityId: id, entities };
      }),

    // Customer Agent Actions
    addCustomer: (customer) =>
      set((state) => ({
        customers: [...state.customers, customer],
        kpi: {
          ...state.kpi,
          currentCustomers: state.kpi.currentCustomers + 1,
          totalVisitors: state.kpi.totalVisitors + 1,
        },
      })),

    updateCustomer: (id, updates) =>
      set((state) => ({
        customers: state.customers.map((c) =>
          c.id === id ? { ...c, ...updates } : c
        ),
      })),

    removeCustomer: (id) => {
      const state = get();
      const customer = state.customers.find((c) => c.id === id);

      // 평균 체류시간 업데이트
      const dwellTime = customer?.dwellTime || 0;
      const totalDwellTime = state.kpi.avgDwellTime * (state.kpi.totalVisitors - 1) + dwellTime;
      const newAvgDwellTime = state.kpi.totalVisitors > 0
        ? totalDwellTime / state.kpi.totalVisitors
        : 0;

      set({
        customers: state.customers.filter((c) => c.id !== id),
        kpi: {
          ...state.kpi,
          currentCustomers: Math.max(0, state.kpi.currentCustomers - 1),
          avgDwellTime: newAvgDwellTime,
        },
      });
    },

    // Metrics Actions
    updateZoneMetrics: (metrics) => set({ zoneMetrics: metrics }),

    // Time Tick Action
    tick: (deltaTime) => {
      const state = get();
      if (state.status !== 'running' && !state.isRunning) return;
      if (state.isPaused) return;

      // deltaTime이 음수거나 비정상적으로 크면 무시
      if (deltaTime < 0 || deltaTime > 1) return;

      const speedMultiplier = state.config.speed;
      const newTime = Math.max(0, state.currentTime + deltaTime * speedMultiplier);
      const newSimTime = Math.max(0, state.simulationTime + deltaTime * speedMultiplier);

      // duration이 0이면 무한 실행 (완료 조건 없음)
      if (state.config.duration > 0 && newTime >= state.config.duration) {
        set({ status: 'completed', currentTime: state.config.duration, simulationTime: newSimTime });
        return;
      }

      set({ currentTime: newTime, simulationTime: newSimTime });
    },

    // Results Action
    setResults: (results) => set({ results }),
  }))
);

// ============== Selectors ==============

export const selectSimulationProgress = (state: SimulationState) =>
  state.config.duration > 0 ? (state.currentTime / state.config.duration) * 100 : 0;

export const selectActiveCustomerCount = (state: SimulationState) =>
  state.customers.filter((c) => c.behavior !== 'exiting').length;

export const selectZoneById = (zoneId: string) => (state: SimulationState) =>
  state.entities[zoneId];

export const selectZoneMetricById = (zoneId: string) => (state: SimulationState) =>
  state.zoneMetrics.find((m) => m.zoneId === zoneId);

export const selectTotalRevenue = (state: SimulationState) =>
  state.zoneMetrics.reduce((sum, z) => sum + z.revenue, 0);

export const selectAverageConversion = (state: SimulationState) => {
  const metrics = state.zoneMetrics;
  if (metrics.length === 0) return 0;
  return metrics.reduce((sum, z) => sum + z.conversionRate, 0) / metrics.length;
};

export default useSimulationStore;
