/**
 * ScenarioPresets.ts
 *
 * 데모 시나리오 3종 프리셋 데이터
 * - Fashion: 강남 플래그십 스토어 (고객 동선 최적화)
 * - Beauty: 올리브영 성수점 (존별 체류 분석)
 * - Department: 현대백화점 판교점 (층별 트래픽)
 *
 * 모든 수치는 리얼리즘을 위해 자연스러운 분산값을 포함합니다.
 */

import type { DemoScenario } from '@/store/useDemoStore';

// ============================================================================
// 타입 정의
// ============================================================================

export interface DemoZone {
  id: string;
  name: string;
  nameEn: string;
  avgDwell: string; // "MM:SS" format
  trafficShare: number; // 0-100 (%)
  color: string; // hex color for 3D heatmap
}

export interface DemoKPI {
  visitors: number;
  visitorsChange: number; // % vs previous day
  avgDwell: string; // "M:SS" format
  dwellChange: number; // %
  conversionRate: number; // %
  conversionChange: number; // %p
  revenue: string; // formatted KRW string
  revenueChange: number; // %
  goalProgress: {
    visitors: number; // 0-100
    dwell: number;
    conversion: number;
  };
  sparkline: number[]; // 7 days normalized
}

export interface DemoAIInsight {
  id: string;
  title: string;
  message: string;
  type: 'anomaly' | 'suggestion' | 'digest';
  severity?: 'info' | 'warning' | 'critical';
  timestamp: number;
}

export interface DemoChartData {
  hourlyTraffic: number[]; // 24 values (hour 0-23)
  weeklyTrend: number[]; // 7 values (Mon-Sun)
  zoneDwell: Record<string, string>; // zone id -> "M:SS"
}

export interface TourHighlight {
  step: number;
  targetSelector: string;
  title: string;
  description: string;
  autoAdvanceSec: number;
}

export interface ScenarioPreset {
  id: DemoScenario;
  storeName: string;
  storeType: string;
  storeTypeKo: string;
  icon: string; // lucide icon name
  area: string;
  floors: number;
  tagline: string; // 시나리오 선택 화면 한줄 설명
  zones: DemoZone[];
  kpis: DemoKPI;
  aiInsights: DemoAIInsight[];
  chartData: DemoChartData;
  tourHighlights: TourHighlight[];
}

// ============================================================================
// 투어 단계 정의 (공통)
// ============================================================================

const COMMON_TOUR_STEPS: TourHighlight[] = [
  {
    step: 1,
    targetSelector: '[data-tour="sidebar"]',
    title: '사이드바 내비게이션',
    description:
      '좌측 사이드바에서 각 기능에 접근할 수 있어요.\n홈, 실시간 현황, 분석, 3D 스튜디오, AI, ROI 추적 등\n매장 운영에 필요한 모든 도구가 여기 있습니다.',
    autoAdvanceSec: 8,
  },
  {
    step: 2,
    targetSelector: '[data-tour="metric-cards"]',
    title: '핵심 지표 카드',
    description:
      '방문객, 체류시간, 전환율 등 매장의 핵심 KPI를\n한눈에 확인하세요. 전일 대비 변화율과 목표 달성률,\n7일 트렌드까지 바로 볼 수 있어요.\n카드를 클릭하면 상세 분석으로 이동합니다.',
    autoAdvanceSec: 8,
  },
  {
    step: 3,
    targetSelector: '[data-tour="ai-insight"]',
    title: 'AI 인사이트',
    description:
      'NeuralMind AI가 이상 징후를 감지하면\n여기에 실시간 알림이 나타나요.\n\'왜 이런 일이 생겼는지\'부터 \'어떻게 해야 하는지\'까지\n4단계로 분석 결과를 제공합니다.',
    autoAdvanceSec: 10,
  },
  {
    step: 4,
    targetSelector: '[data-tour="digital-twin"]',
    title: '3D 디지털 트윈 스튜디오',
    description:
      '매장을 3D로 재현한 디지털 트윈입니다.\n고객 동선을 시각화하고, 히트맵을 오버레이하고,\n레이아웃 변경을 시뮬레이션할 수 있어요.\n실제 매장을 바꾸기 전에 여기서 먼저 테스트하세요.',
    autoAdvanceSec: 10,
  },
  {
    step: 5,
    targetSelector: '[data-tour="time-travel"]',
    title: 'Time Travel -- 과거 데이터 재생',
    description:
      '타임라인을 드래그해서 과거의 매장 상황을\n3D로 재생할 수 있어요. 진열 변경 전후 비교,\n피크 시간대 분석 등 시간 기반 분석이 가능합니다.\n재생 속도는 최대 8배속까지 지원해요.',
    autoAdvanceSec: 10,
  },
  {
    step: 6,
    targetSelector: '[data-tour="reports"]',
    title: '자동 리포트 생성',
    description:
      'AI가 매장 데이터를 분석해 PDF 리포트를\n자동으로 생성합니다. 일간/주간/월간 리포트를\n이메일로 받아보거나 즉시 다운로드할 수 있어요.\n본사 보고용 데이터도 한 번에 정리됩니다.',
    autoAdvanceSec: 8,
  },
  {
    step: 7,
    targetSelector: '', // full-screen CTA
    title: '체험을 완료했어요!',
    description:
      '지금 보신 모든 기능을\n실제 매장 데이터로 사용해 보세요.\n\nStarter 플랜: 월 49,000원부터\n14일 무료 체험 포함',
    autoAdvanceSec: 0, // no auto-advance on final step
  },
];

// ============================================================================
// Fashion 시나리오
// ============================================================================

const fashionPreset: ScenarioPreset = {
  id: 'fashion',
  storeName: '강남 플래그십 스토어',
  storeType: 'Fashion',
  storeTypeKo: '패션',
  icon: 'ShoppingBag',
  area: '180평 (594m\u00B2)',
  floors: 1,
  tagline: '고객 동선 최적화',

  zones: [
    { id: 'entrance', name: '입구', nameEn: 'Entrance', avgDwell: '0:45', trafficShare: 100, color: '#00D4FF' },
    { id: 'display', name: '디스플레이', nameEn: 'Display', avgDwell: '2:30', trafficShare: 72, color: '#22C55E' },
    { id: 'fitting', name: '피팅룸', nameEn: 'Fitting Room', avgDwell: '5:20', trafficShare: 35, color: '#F59E0B' },
    { id: 'checkout', name: '계산대', nameEn: 'Checkout', avgDwell: '1:15', trafficShare: 28, color: '#EF4444' },
    { id: 'vip', name: 'VIP라운지', nameEn: 'VIP Lounge', avgDwell: '8:40', trafficShare: 8, color: '#A855F7' },
  ],

  kpis: {
    visitors: 12847,
    visitorsChange: 8.3,
    avgDwell: '4:12',
    dwellChange: 12,
    conversionRate: 3.8,
    conversionChange: -0.2,
    revenue: '420만',
    revenueChange: 6.1,
    goalProgress: { visitors: 78, dwell: 85, conversion: 92 },
    sparkline: [72, 68, 85, 91, 88, 95, 100],
  },

  aiInsights: [
    {
      id: 'fashion-ai-1',
      title: 'B존 체류시간 하락 감지',
      message:
        '오후 2~4시 B존(디스플레이 구역) 체류시간이 전주 대비 -22% 하락했습니다. 신상품 진열 변경 후 고객 동선이 바뀐 것으로 분석됩니다. 입구에서 B존으로 유도하는 POP 사이니지 추가를 권장합니다.',
      type: 'anomaly',
      severity: 'warning',
      timestamp: Date.now() - 3 * 60 * 1000, // 3분 전
    },
    {
      id: 'fashion-ai-2',
      title: '피크 시간대 인력 배치 제안',
      message:
        '13:00-15:00 피크 시간에 피팅룸 대기 시간이 평균 8분으로 증가했습니다. 해당 시간대에 피팅룸 안내 인력을 1명 추가 배치하면 전환율이 0.5%p 향상될 것으로 예측됩니다.',
      type: 'suggestion',
      severity: 'info',
      timestamp: Date.now() - 15 * 60 * 1000,
    },
    {
      id: 'fashion-ai-3',
      title: '오늘의 매장 요약',
      message:
        '현재까지 12,847명 방문, 전일 대비 +8.3%. 오후 피크 타임 방문 집중도가 높아 계산대 혼잡이 예상됩니다. VIP라운지 이용률은 전월 대비 15% 증가했습니다.',
      type: 'digest',
      severity: 'info',
      timestamp: Date.now() - 60 * 60 * 1000,
    },
  ],

  chartData: {
    hourlyTraffic: [
      0, 0, 0, 0, 0, 0, 0, 120, 340, 520, 680, 780,
      920, 1050, 980, 840, 720, 890, 1020, 950, 680, 420, 180, 60,
    ],
    weeklyTrend: [10200, 9800, 11500, 12100, 11800, 14200, 12847],
    zoneDwell: {
      entrance: '0:45',
      display: '2:30',
      fitting: '5:20',
      checkout: '1:15',
      vip: '8:40',
    },
  },

  tourHighlights: COMMON_TOUR_STEPS,
};

// ============================================================================
// Beauty 시나리오
// ============================================================================

const beautyPreset: ScenarioPreset = {
  id: 'beauty',
  storeName: '올리브영 성수점',
  storeType: 'Beauty',
  storeTypeKo: '뷰티',
  icon: 'Sparkles',
  area: '120평 (396m\u00B2)',
  floors: 1,
  tagline: '존별 체류 분석',

  zones: [
    { id: 'skincare', name: '스킨케어', nameEn: 'Skincare', avgDwell: '2:10', trafficShare: 65, color: '#3B82F6' },
    { id: 'makeup', name: '메이크업', nameEn: 'Makeup', avgDwell: '1:45', trafficShare: 55, color: '#EC4899' },
    { id: 'fragrance', name: '향수', nameEn: 'Fragrance', avgDwell: '3:20', trafficShare: 30, color: '#A855F7' },
    { id: 'tester', name: '테스터존', nameEn: 'Tester Zone', avgDwell: '6:32', trafficShare: 42, color: '#F59E0B' },
    { id: 'checkout', name: '계산대', nameEn: 'Checkout', avgDwell: '0:55', trafficShare: 38, color: '#EF4444' },
  ],

  kpis: {
    visitors: 8420,
    visitorsChange: 3.1,
    avgDwell: '3:45',
    dwellChange: -5,
    conversionRate: 5.2,
    conversionChange: 0.4,
    revenue: '280만',
    revenueChange: 4.7,
    goalProgress: { visitors: 78, dwell: 85, conversion: 92 },
    sparkline: [80, 75, 82, 78, 90, 85, 84],
  },

  aiInsights: [
    {
      id: 'beauty-ai-1',
      title: '테스터존 전환율 6배 차이 발견',
      message:
        '테스터존 체류시간이 평균 6분 32초로 전체 매장 대비 가장 높습니다. 테스터존 방문 고객의 구매 전환율은 12.8%로, 미방문 고객(2.1%) 대비 6배 높습니다. 테스터존 접근성을 높이는 레이아웃 변경을 추천합니다.',
      type: 'anomaly',
      severity: 'info',
      timestamp: Date.now() - 5 * 60 * 1000,
    },
    {
      id: 'beauty-ai-2',
      title: '스킨케어 존 동선 개선 필요',
      message:
        '입구에서 스킨케어 존까지의 평균 이동 시간이 45초로, 최적 경로(20초) 대비 2배 이상 소요됩니다. 진열대 배치 변경으로 접근성을 개선할 수 있습니다.',
      type: 'suggestion',
      severity: 'info',
      timestamp: Date.now() - 30 * 60 * 1000,
    },
    {
      id: 'beauty-ai-3',
      title: '점심 시간대 트래픽 분석',
      message:
        '12:00-14:00 방문객이 전체의 28%를 차지합니다. 해당 시간대 메이크업 존 혼잡도가 높아 고객 이탈이 발생하고 있습니다. 시간대별 프로모션으로 트래픽 분산을 권장합니다.',
      type: 'digest',
      severity: 'warning',
      timestamp: Date.now() - 2 * 60 * 60 * 1000,
    },
  ],

  chartData: {
    hourlyTraffic: [
      0, 0, 0, 0, 0, 0, 0, 80, 250, 380, 520, 680,
      740, 620, 580, 520, 640, 780, 720, 580, 380, 220, 100, 30,
    ],
    weeklyTrend: [6800, 6500, 7200, 7800, 7500, 9100, 8420],
    zoneDwell: {
      skincare: '2:10',
      makeup: '1:45',
      fragrance: '3:20',
      tester: '6:32',
      checkout: '0:55',
    },
  },

  tourHighlights: COMMON_TOUR_STEPS,
};

// ============================================================================
// Department 시나리오
// ============================================================================

const departmentPreset: ScenarioPreset = {
  id: 'department',
  storeName: '현대백화점 판교점',
  storeType: 'Department',
  storeTypeKo: '백화점',
  icon: 'Building2',
  area: '2,400평 (7,920m\u00B2)',
  floors: 5,
  tagline: '층별 트래픽 분석',

  zones: [
    { id: 'b1_food', name: 'B1 식품관', nameEn: 'B1 Food Court', avgDwell: '12:20', trafficShare: 35, color: '#22C55E' },
    { id: 'f1_cosmetics', name: '1F 화장품/잡화', nameEn: '1F Cosmetics', avgDwell: '6:45', trafficShare: 28, color: '#3B82F6' },
    { id: 'f2_women', name: '2F 여성패션', nameEn: '2F Women Fashion', avgDwell: '8:30', trafficShare: 20, color: '#EC4899' },
    { id: 'f3_men', name: '3F 남성패션', nameEn: '3F Men Fashion', avgDwell: '5:10', trafficShare: 8, color: '#F59E0B' },
    { id: 'f4_living', name: '4F 리빙', nameEn: '4F Living', avgDwell: '7:40', trafficShare: 9, color: '#A855F7' },
  ],

  kpis: {
    visitors: 24510,
    visitorsChange: -2.1,
    avgDwell: '8:45',
    dwellChange: 3,
    conversionRate: 6.1,
    conversionChange: 0.1,
    revenue: '1,870만',
    revenueChange: 1.2,
    goalProgress: { visitors: 78, dwell: 85, conversion: 92 },
    sparkline: [95, 88, 92, 100, 97, 85, 90],
  },

  aiInsights: [
    {
      id: 'dept-ai-1',
      title: '3F 남성패션 방문 저조',
      message:
        '3F 남성패션 층 방문객이 전체의 8%로 가장 낮습니다. 에스컬레이터 동선 분석 결과, 2F에서 3F로의 이동률이 23%에 불과합니다. 2F-3F 연결 구역에 시즌 프로모션 안내판 설치를 권장합니다.',
      type: 'anomaly',
      severity: 'warning',
      timestamp: Date.now() - 10 * 60 * 1000,
    },
    {
      id: 'dept-ai-2',
      title: 'B1 식품관 체류시간 최고',
      message:
        'B1 식품관의 평균 체류시간이 12분 20초로 전 층 중 가장 높습니다. 특히 시식 코너 주변 체류가 집중되어 있어, 시식 코너와 연계된 크로스셀링 전략을 추천합니다.',
      type: 'suggestion',
      severity: 'info',
      timestamp: Date.now() - 45 * 60 * 1000,
    },
    {
      id: 'dept-ai-3',
      title: '주말 트래픽 예측',
      message:
        '이번 주말 예상 방문객은 28,500명(+16%)입니다. 1F 화장품 매장과 B1 식품관의 혼잡도가 높아질 것으로 예측됩니다. 주차장 안내 인력 추가 배치를 권장합니다.',
      type: 'digest',
      severity: 'info',
      timestamp: Date.now() - 3 * 60 * 60 * 1000,
    },
  ],

  chartData: {
    hourlyTraffic: [
      0, 0, 0, 0, 0, 0, 0, 0, 180, 520, 880, 1200,
      1450, 1380, 1200, 1520, 1680, 1450, 1100, 720, 380, 150, 40, 0,
    ],
    weeklyTrend: [18500, 17200, 20100, 22400, 21800, 28500, 24510],
    zoneDwell: {
      b1_food: '12:20',
      f1_cosmetics: '6:45',
      f2_women: '8:30',
      f3_men: '5:10',
      f4_living: '7:40',
    },
  },

  tourHighlights: COMMON_TOUR_STEPS,
};

// ============================================================================
// 프리셋 맵
// ============================================================================

export const SCENARIO_PRESETS: Record<DemoScenario, ScenarioPreset> = {
  fashion: fashionPreset,
  beauty: beautyPreset,
  department: departmentPreset,
};

/** 시나리오 선택 화면용 카드 데이터 */
export const SCENARIO_CARDS = [
  {
    id: 'fashion' as DemoScenario,
    typeKo: '패션',
    storeName: '강남 플래그십 스토어',
    tagline: '고객 동선 최적화',
    icon: 'ShoppingBag',
  },
  {
    id: 'beauty' as DemoScenario,
    typeKo: '뷰티',
    storeName: '올리브영 성수점',
    tagline: '존별 체류 분석',
    icon: 'Sparkles',
  },
  {
    id: 'department' as DemoScenario,
    typeKo: '백화점',
    storeName: '현대백화점 판교점',
    tagline: '층별 트래픽 분석',
    icon: 'Building2',
  },
];

/** 시나리오 프리셋 반환 헬퍼 */
export function getScenarioPreset(scenario: DemoScenario): ScenarioPreset {
  return SCENARIO_PRESETS[scenario];
}

export default SCENARIO_PRESETS;
