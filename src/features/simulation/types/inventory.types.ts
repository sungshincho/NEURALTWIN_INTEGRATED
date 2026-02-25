/**
 * 재고 시뮬레이션 전용 타입
 */

export interface InventoryPolicy {
  productId: string;
  policyType: 'reorder_point' | 'periodic_review' | 'min_max' | 'just_in_time';
  safetyStock: number;
  reorderPoint?: number;
  orderQuantity: number;
  reviewPeriodDays?: number;
  minStock?: number;
  maxStock?: number;
}

export interface DemandForecast {
  productId: string;
  productName: string;
  category?: string;
  forecastPeriod: {
    from: string;
    to: string;
  };
  dailyForecasts: Array<{
    date: string;
    forecastedDemand: number;
    confidence: number;
    lowerBound: number;
    upperBound: number;
  }>;
  totalForecast: number;
  averageDailyDemand: number;
  demandVariability: number;
  seasonalityFactor?: number;
  trendFactor?: number;
}

export interface StockoutRisk {
  productId: string;
  currentStock: number;
  averageDailyDemand: number;
  daysUntilStockout: number;
  stockoutProbability: number;
  estimatedRevenueLoss: number;
  urgency: 'critical' | 'high' | 'medium' | 'low';
}

export interface OverstockRisk {
  productId: string;
  currentStock: number;
  averageDailyDemand: number;
  daysOfSupply: number;
  excessStock: number;
  tiedUpCapital: number;
  expirationRisk?: number;
  obsolescenceRisk?: number;
}

export interface OrderRecommendation {
  productId: string;
  recommendedOrderQty: number;
  estimatedDeliveryDate: string;
  orderCost: number;
  expectedStockLevel: number;
  serviceLevel: number;
  reasoning: string;
}

export interface IInventoryOptimizationResult {
  productId: string;
  currentPolicy: Partial<InventoryPolicy>;
  recommendedPolicy: InventoryPolicy;
  expectedBenefits: {
    stockoutReduction?: number;
    inventoryCostReduction?: number;
    serviceLevelImprovement?: number;
    capitalReduction?: number;
  };
  implementationComplexity: 'easy' | 'medium' | 'complex';
}

export interface SupplyChainContext {
  leadTimeDays: number;
  leadTimeVariability: number;
  supplierReliability: number;
  orderingCost: number;
  holdingCostPerUnit: number;
  stockoutCostPerUnit?: number;
}
