/**
 * 시뮬레이션 시나리오 공통 타입
 */

import { ZoneChange, FurnitureMove, LayoutFeatures } from './layout.types';

export type ScenarioType = 
  | 'layout' 
  | 'pricing' 
  | 'inventory' 
  | 'demand' 
  | 'recommendation' 
  | 'staffing' 
  | 'promotion';

export type ScenarioStatus = 'draft' | 'running' | 'completed' | 'archived';

export interface KpiSnapshot {
  // 전환율 관련
  conversionRate?: number;
  totalVisits?: number;
  totalPurchases?: number;
  
  // 매출 관련
  totalRevenue?: number;
  averageTransactionValue?: number;
  salesPerSqm?: number;
  
  // 비용 관련
  opex?: number;
  laborCost?: number;
  inventoryCost?: number;
  
  // 수익성
  grossMargin?: number;
  netProfit?: number;
  
  // 재고 관련
  stockoutRate?: number;
  inventoryTurnover?: number;
  
  // 기타
  customerSatisfaction?: number;
  timestamp?: string;
}

export interface KpiDelta {
  metric: keyof KpiSnapshot;
  baseline: number;
  predicted: number;
  delta: number;
  deltaPercent: number;
  unit?: string;
}

// 레이아웃 시뮬레이션 파라미터
export interface LayoutParams {
  changedZones?: ZoneChange[];
  movedFurniture?: FurnitureMove[];
  layoutFeatures?: Partial<LayoutFeatures>;
}

// 가격 최적화 파라미터
export interface PricingParams {
  productIds?: string[];
  categoryIds?: string[];
  priceChangePercent?: number;
  minPrice?: number;
  maxPrice?: number;
  targetMargin?: number;
  discountStrategy?: 'fixed' | 'percentage' | 'dynamic';
  effectivePeriod?: {
    from: string;
    to: string;
  };
}

// 재고 시뮬레이션 파라미터
export interface InventoryParams {
  productIds?: string[];
  targetServiceLevel?: number;
  leadTimeDays?: number;
  orderFrequencyDays?: number;
  minOrderQuantity?: number;
  safetyStockMultiplier?: number;
}

// 수요 예측 파라미터
export interface DemandParams {
  forecastHorizonDays?: number;
  includeWeather?: boolean;
  includeEvents?: boolean;
  includeEconomicIndicators?: boolean;
  weatherScenario?: 'optimistic' | 'pessimistic' | 'realistic';
  promotionPlanned?: boolean;
}

// 추천 전략 파라미터
export interface RecommendationParams {
  algorithm?: 'collaborative_filtering' | 'content_based' | 'hybrid';
  boostNewProducts?: boolean;
  boostHighMargin?: boolean;
  trendWeight?: number;
  diversityWeight?: number;
  maxRecommendations?: number;
}

// 스태핑 파라미터
export interface StaffingParams {
  scheduledHours?: number;
  peakHourCoverage?: number;
  skillMix?: Record<string, number>;
  laborCostPerHour?: number;
}

// 프로모션 파라미터
export interface PromotionParams {
  promotionType?: 'bogo' | 'discount' | 'bundle' | 'loyalty';
  targetSegment?: string;
  duration?: number;
  expectedUplift?: number;
}

export type ScenarioParams = 
  | LayoutParams 
  | PricingParams 
  | InventoryParams 
  | DemandParams 
  | RecommendationParams
  | StaffingParams
  | PromotionParams;

export interface Scenario {
  id: string;
  userId: string;
  storeId?: string;
  scenarioType: ScenarioType;
  name: string;
  description?: string;
  params: ScenarioParams;
  baselineKpi?: KpiSnapshot;
  predictedKpi?: KpiSnapshot;
  confidenceScore?: number;
  aiInsights?: string;
  status: ScenarioStatus;
  createdAt: string;
  updatedAt: string;
}

export interface ScenarioComparison {
  id: string;
  userId: string;
  name: string;
  scenarioIds: string[];
  comparisonType: string;
  createdAt: string;
  updatedAt: string;
}
