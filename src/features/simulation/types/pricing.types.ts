/**
 * 가격 최적화 시뮬레이션 전용 타입
 */

export interface PricePoint {
  price: number;
  expectedDemand: number;
  expectedRevenue: number;
  expectedMargin: number;
  marketPosition?: 'low' | 'medium' | 'high' | 'premium';
}

export interface ElasticityCurve {
  productId: string;
  productName: string;
  currentPrice: number;
  pricePoints: PricePoint[];
  elasticityCoefficient: number;
  optimalPrice?: number;
  priceFloor: number;
  priceCeiling: number;
}

export interface PriceOptimizationStrategy {
  objective: 'maximize_revenue' | 'maximize_margin' | 'maximize_volume' | 'balanced';
  constraints: {
    minMarginPercent?: number;
    maxPriceIncrease?: number;
    maxPriceDecrease?: number;
    competitorPricing?: Record<string, number>;
  };
  considerInventory?: boolean;
  considerSeasonality?: boolean;
}

export interface DynamicPricingRule {
  ruleType: 'time_based' | 'inventory_based' | 'demand_based' | 'competitor_based';
  condition: {
    trigger: string;
    threshold: number;
  };
  action: {
    priceAdjustment: number;
    adjustmentType: 'fixed' | 'percentage';
    maxAdjustment?: number;
  };
  priority: number;
}

export interface CompetitorPricing {
  competitorId: string;
  competitorName: string;
  productPrices: Record<string, number>;
  marketShare?: number;
  pricePosition: 'leader' | 'follower' | 'premium' | 'discount';
}

export interface PriceSimulationResult {
  productId: string;
  recommendedPrice: number;
  currentPrice: number;
  priceChange: number;
  priceChangePercent: number;
  expectedDemandChange: number;
  expectedRevenueChange: number;
  expectedMarginChange: number;
  confidence: number;
  risks: string[];
  opportunities: string[];
}
