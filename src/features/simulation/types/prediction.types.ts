/**
 * AI 예측 결과 타입
 */

import { KpiSnapshot } from './scenario.types';

export interface PredictionRequest {
  scenarioType: string;
  params: Record<string, any>;
  storeId?: string;
  baselineData?: any;
}

export interface PredictionResult {
  scenarioId?: string;
  predictedKpi: KpiSnapshot;
  confidenceScore: number;
  aiInsights: string;
  recommendations?: string[];
  warnings?: string[];
  metadata?: {
    modelVersion?: string;
    processingTime?: number;
    dataQuality?: number;
  };
  // 수요 예측 특화 필드
  demandDrivers?: Array<{
    factor: string;
    impact: 'positive' | 'negative';
    magnitude: number;
    explanation: string;
  }>;
  // 재고 최적화 특화 필드
  optimizationResults?: {
    optimalOrderQuantity: number;
    reorderPoint: number;
    safetyStock: number;
    expectedStockouts: number;
    annualSavings: number;
  };
  // 가격 최적화 특화 필드
  pricingAnalysis?: {
    optimalPrice: number;
    revenueImpact: number;
    volumeImpact: number;
    marginImpact: number;
    competitivePosition: string;
  };
  // 추천 전략 특화 필드
  strategyDetails?: {
    primaryTactic: string;
    targetSegments: string[];
    channels: string[];
    expectedUplift: number;
    recommendationAccuracy: number;
  };
}

export interface SimulationResult {
  id: string;
  scenarioId: string;
  resultType: string;
  resultData: Record<string, any>;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface ABTestResult {
  scenarioA: {
    id: string;
    name: string;
    kpi: KpiSnapshot;
  };
  scenarioB: {
    id: string;
    name: string;
    kpi: KpiSnapshot;
  };
  winner?: 'A' | 'B' | 'tie';
  winnerConfidence?: number;
  comparison: Array<{
    metric: string;
    deltaPercent: number;
    significance: 'high' | 'medium' | 'low';
  }>;
}
