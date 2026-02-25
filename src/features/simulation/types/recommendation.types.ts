/**
 * 추천 전략 시뮬레이션 전용 타입
 */

export interface RecommendationAlgorithmConfig {
  algorithm: 'collaborative_filtering' | 'content_based' | 'hybrid' | 'deep_learning';
  parameters: {
    similarityMetric?: 'cosine' | 'pearson' | 'jaccard';
    neighborhoodSize?: number;
    minSupportCount?: number;
    contentWeights?: Record<string, number>;
    cfWeight?: number;
    cbWeight?: number;
  };
}

export interface RecommendationStrategy {
  strategyName: string;
  algorithm: RecommendationAlgorithmConfig;
  rules: RecommendationRule[];
  slotCount: number;
  slotPositions?: string[];
  personalization: boolean;
  diversityWeight: number;
  noveltyWeight: number;
  popularityWeight: number;
}

export interface RecommendationRule {
  ruleId: string;
  ruleName: string;
  ruleType: 'boost' | 'filter' | 'rank' | 'diversity';
  condition: {
    trigger: string;
    parameters: Record<string, any>;
  };
  action: {
    weight?: number;
    maxItems?: number;
    minScore?: number;
  };
  priority: number;
  enabled: boolean;
}

export interface ProductRecommendation {
  productId: string;
  productName: string;
  score: number;
  reasons: string[];
  tags?: string[];
  trendScore?: number;
  marginScore?: number;
  conversionScore?: number;
}

export interface ABTestStrategy {
  testName: string;
  strategyA: RecommendationStrategy;
  strategyB: RecommendationStrategy;
  trafficSplit: number;
  duration?: number;
}

export interface RecommendationPerformance {
  strategyId: string;
  strategyName: string;
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  cvr: number;
  averageOrderValue: number;
  revenue: number;
  uplift?: {
    ctrUplift: number;
    cvrUplift: number;
    revenueUplift: number;
  };
}

export interface TrendingProduct {
  productId: string;
  productName: string;
  category?: string;
  trendScore: number;
  trendSource: 'internal' | 'social' | 'search' | 'external';
  growthRate: number;
  velocity: number;
  peakPrediction?: {
    date: string;
    expectedDemand: number;
  };
}

export interface PersonalizationSegment {
  segmentId: string;
  segmentName: string;
  description?: string;
  rules: Array<{
    attribute: string;
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than';
    value: any;
  }>;
  recommendationStrategy?: string;
  estimatedSize?: number;
}
