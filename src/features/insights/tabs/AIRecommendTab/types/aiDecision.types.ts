/**
 * AI 의사결정 루프 타입 정의
 *
 * 예측 → 최적화 → 추천 → 실행 → 측정
 */

// ============================================================================
// 예측 (Predict) 타입
// ============================================================================

export interface DemandForecast {
  period: '7d' | '14d' | '30d' | string;
  predictedRevenue: number;
  predictedVisitors: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
  dailyBreakdown?: {
    date: string;
    revenue: number;
    visitors: number;
  }[];
}

export interface SeasonTrend {
  currentSeason: string;
  peakPeriod: {
    start: string;
    end: string;
  };
  expectedImpact: number;
  recommendations: string[];
}

export interface RiskPrediction {
  id: string;
  type: 'stockout' | 'demand_drop' | 'competition' | 'seasonal' | 'conversion_drop' | 'demand_spike' | 'overstock';
  severity: 'critical' | 'high' | 'medium' | 'low';
  productName?: string;
  description: string;
  probability: number;
  mitigationActions: string[];
}

// ============================================================================
// 최적화 (Optimize) 타입
// ============================================================================

export interface OptimizationAction {
  id: string;
  productId: string;
  productName: string;
  currentValue: number;
  recommendedValue: number;
  expectedImpact: number;
  confidence: number;
}

export interface PriceOptimization {
  totalProducts: number;
  optimizableCount: number;
  potentialRevenueIncrease: number;
  potentialRevenueIncreasePercent: number;
  actions: OptimizationAction[];
}

export interface InventoryOptimization {
  totalItems: number;
  orderRecommendations: number;
  stockoutPrevention: number;
  overStockReduction: number;
  actions: OptimizationAction[];
}

// ============================================================================
// 추천 전략 (Recommend) 타입
// ============================================================================

export type StrategyType = 'discount' | 'bundle' | 'targeting' | 'timing' | 'display' | 'event';

export interface StrategyRecommendation {
  id: string;
  rank: 1 | 2 | 3;
  title: string;
  description: string;
  type: StrategyType;
  confidence: number;
  targetAudience: string;
  duration: number; // days
  expectedResults: {
    revenueIncrease: number;
    conversionIncrease: number;
    roi: number;
  };
  status: 'recommended' | 'simulating' | 'configuring' | 'executing' | 'completed';
  prerequisites?: string[];
  detailedConfig?: Record<string, any>;
}

// ============================================================================
// 캠페인 실행 (Execute) 타입
// ============================================================================

export type CampaignStatus = 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';

export interface Campaign {
  id: string;
  strategyId: string;
  name: string;
  description: string;
  type: StrategyType;
  startDate: string;
  endDate: string;
  status: CampaignStatus;
  progress: number; // 0-100
  expectedROI: number;
  currentROI: number;
  metrics: {
    revenue: number;
    conversions: number;
    reach: number;
    engagement?: number;
  };
  dailyMetrics?: {
    date: string;
    revenue: number;
    conversions: number;
  }[];
}

// ============================================================================
// ROI 측정 (Measure) 타입
// ============================================================================

export type ROIStatus = 'exceeded' | 'met' | 'missed' | 'ongoing';

export interface ROIMeasurement {
  id: string;
  campaignId: string;
  campaignName: string;
  type: StrategyType;
  period: {
    start: string;
    end: string;
    days: number;
  };
  expectedROI: number;
  actualROI: number;
  status: ROIStatus;
  baselineRevenue: number;
  actualRevenue: number;
  revenueChange: number;
  revenueChangePercent: number;
  insights: string[];
}

export interface ROISummary {
  totalCampaigns: number;
  completedCampaigns: number;
  averageROI: number;
  totalRevenueImpact: number;
  successRate: number; // campaigns that met or exceeded ROI
  topPerformingType: StrategyType;
  learnings: AILearning[];
}

export interface AILearning {
  id: string;
  insight: string;
  dataPoints: number;
  confidence: number;
  applicableTo: StrategyType[];
}

// ============================================================================
// 진행 중인 전략 (Active Strategies)
// ============================================================================

export interface ActiveStrategy {
  id: string;
  name: string;
  type: StrategyType;
  status: CampaignStatus;
  startDate: string;
  endDate: string;
  daysActive: number;
  expectedROI: number;
  currentROI: number;
  progress: number;
  trend: 'up' | 'down' | 'stable';
}

// ============================================================================
// AI 의사결정 허브 전체 상태
// ============================================================================

export interface AIDecisionHubState {
  // 예측
  demandForecast: DemandForecast | null;
  visitorForecast: DemandForecast | null;
  seasonTrend: SeasonTrend | null;
  riskPredictions: RiskPrediction[];

  // 최적화
  priceOptimization: PriceOptimization | null;
  inventoryOptimization: InventoryOptimization | null;

  // 추천
  strategyRecommendations: StrategyRecommendation[];

  // 실행
  activeCampaigns: Campaign[];

  // 측정
  roiMeasurements: ROIMeasurement[];
  roiSummary: ROISummary | null;

  // 메타
  lastUpdated: string;
  isLoading: boolean;
  error: string | null;
}
