/**
 * useRetailAI.ts
 *
 * 리테일 AI 추론 엔진 연동 훅
 * retail-ai-inference Edge Function을 호출하여 실제 AI 예측/분석 수행
 *
 * 지원하는 추론 타입:
 * - demand_forecast: 수요 예측
 * - inventory_optimization: 재고 최적화
 * - layout_optimization: 레이아웃 최적화
 * - zone_analysis: 구역 분석
 * - traffic_flow: 고객 동선 분석
 * - cross_sell: 교차 판매 기회
 * - customer_segmentation: 고객 세분화
 * - anomaly_detection: 이상 탐지
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

// 추론 타입 정의
export type InferenceType =
  | 'layout_optimization'
  | 'zone_analysis'
  | 'traffic_flow'
  | 'demand_forecast'
  | 'inventory_optimization'
  | 'cross_sell'
  | 'customer_segmentation'
  | 'anomaly_detection';

// AI 추론 파라미터
export interface RetailAIParams {
  inference_type: InferenceType;
  store_id: string;
  parameters?: {
    days?: number;
    zone_id?: string;
    product_id?: string;
    forecast_days?: number;
    segment_count?: number;
    [key: string]: any;
  };
}

// AI 추론 결과 - 추천 항목
export interface AIRecommendationItem {
  title: string;
  description: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  expected_impact?: string;
  action_items?: string[];
}

// AI 추론 결과
export interface AIInferenceResult {
  insights: string[];
  recommendations: AIRecommendationItem[];
  metrics: Record<string, any>;
  confidence: number;
}

// Edge Function 응답
export interface RetailAIResponse {
  success: boolean;
  inference_type: InferenceType;
  store_id: string;
  result: AIInferenceResult;
  data_summary: {
    entities_analyzed: number;
    relations_analyzed: number;
    concepts_computed: number;
  };
  error?: string;
}

/**
 * 수요 예측 결과를 DailyPrediction 형태로 변환
 */
export interface DemandForecastResult {
  period: string;
  predictedRevenue: number;
  predictedVisitors: number;
  confidence: number;
  trend: 'up' | 'down' | 'stable';
  percentChange: number;
  insights: string[];
  recommendations: AIRecommendationItem[];
  dailyPredictions?: Array<{
    date: string;
    predicted_revenue: number;
    predicted_visitors: number;
    predicted_conversion: number;
    confidence: number;
    lower_bound_revenue: number;
    upper_bound_revenue: number;
  }>;
}

/**
 * 리스크 예측 결과
 */
export interface RiskPredictionResult {
  id: string;
  type: 'stockout' | 'overstock' | 'demand_spike' | 'conversion_drop';
  severity: 'critical' | 'high' | 'medium' | 'low';
  productName?: string;
  description: string;
  probability: number;
  mitigationActions: string[];
}

/**
 * 리테일 AI 추론 호출 훅
 */
export function useRetailAI(storeId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  /**
   * AI 추론 실행 뮤테이션
   */
  const runInference = useMutation({
    mutationFn: async (params: Omit<RetailAIParams, 'store_id'>) => {
      if (!storeId) throw new Error('Store ID is required');

      const { data, error } = await supabase.functions.invoke<RetailAIResponse>('retail-ai-inference', {
        body: {
          inference_type: params.inference_type,
          store_id: storeId,
          parameters: params.parameters,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'AI inference failed');

      return data;
    },
    onError: (error) => {
      console.error('[useRetailAI] Inference error:', error);
      toast.error('AI 분석 중 오류가 발생했습니다');
    },
  });

  return {
    runInference,
    isRunning: runInference.isPending,
  };
}

/**
 * 수요 예측 전용 훅
 */
export function useDemandForecast(storeId?: string, options?: { days?: number; forecastDays?: number }) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['demand-forecast', storeId, options?.days, options?.forecastDays],
    queryFn: async (): Promise<DemandForecastResult> => {
      if (!storeId) throw new Error('Store ID is required');

      const { data, error } = await supabase.functions.invoke<RetailAIResponse>('retail-ai-inference', {
        body: {
          inference_type: 'demand_forecast',
          store_id: storeId,
          parameters: {
            days: options?.days || 30,
            forecast_days: options?.forecastDays || 7,
          },
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Demand forecast failed');

      const result = data.result;
      const metrics = result.metrics || {};

      // AI 결과를 구조화된 형태로 변환
      return {
        period: `${options?.forecastDays || 7}d`,
        predictedRevenue: metrics.predicted_revenue || metrics.total_predicted_revenue || 0,
        predictedVisitors: metrics.predicted_visitors || metrics.total_predicted_visitors || 0,
        confidence: Math.round((result.confidence || 0.7) * 100),
        trend: determineTrend(metrics.revenue_change_percent || metrics.percent_change || 0),
        percentChange: metrics.revenue_change_percent || metrics.percent_change || 0,
        insights: result.insights || [],
        recommendations: result.recommendations || [],
        dailyPredictions: metrics.daily_predictions || [],
      };
    },
    enabled: !!user && !!storeId,
    staleTime: 10 * 60 * 1000, // 10분 캐시
    retry: 1,
  });
}

/**
 * 리스크 예측 훅 (anomaly_detection + inventory_optimization 결합)
 */
export function useRiskPrediction(storeId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['risk-prediction', storeId],
    queryFn: async (): Promise<RiskPredictionResult[]> => {
      if (!storeId) throw new Error('Store ID is required');

      // 이상 탐지와 재고 최적화 동시 호출
      const [anomalyResult, inventoryResult] = await Promise.all([
        supabase.functions.invoke<RetailAIResponse>('retail-ai-inference', {
          body: {
            inference_type: 'anomaly_detection',
            store_id: storeId,
            parameters: { days: 14 },
          },
        }),
        supabase.functions.invoke<RetailAIResponse>('retail-ai-inference', {
          body: {
            inference_type: 'inventory_optimization',
            store_id: storeId,
            parameters: { days: 30 },
          },
        }),
      ]);

      const risks: RiskPredictionResult[] = [];

      // 이상 탐지 결과 처리
      if (anomalyResult.data?.success) {
        const anomalies = anomalyResult.data.result.recommendations || [];
        anomalies.forEach((rec, idx) => {
          risks.push({
            id: `anomaly-${idx}`,
            type: categorizeRiskType(rec.category),
            severity: rec.priority,
            description: rec.description,
            probability: (anomalyResult.data?.result.confidence || 0.7) * 100,
            mitigationActions: rec.action_items || [],
          });
        });
      }

      // 재고 최적화 결과에서 리스크 추출
      if (inventoryResult.data?.success) {
        const inventory = inventoryResult.data.result.recommendations || [];
        inventory
          .filter(rec => rec.priority === 'critical' || rec.priority === 'high')
          .forEach((rec, idx) => {
            risks.push({
              id: `inventory-${idx}`,
              type: rec.category === 'stockout' ? 'stockout' : 'overstock',
              severity: rec.priority,
              productName: rec.title,
              description: rec.description,
              probability: (inventoryResult.data?.result.confidence || 0.6) * 100,
              mitigationActions: rec.action_items || [],
            });
          });
      }

      return risks;
    },
    enabled: !!user && !!storeId,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

/**
 * 최적화 제안 훅 (price + inventory)
 */
export function useOptimizationSuggestions(storeId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['optimization-suggestions', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID is required');

      const { data, error } = await supabase.functions.invoke<RetailAIResponse>('retail-ai-inference', {
        body: {
          inference_type: 'inventory_optimization',
          store_id: storeId,
          parameters: { days: 30 },
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Optimization failed');

      const result = data.result;
      const metrics = result.metrics || {};

      return {
        priceOptimization: {
          totalProducts: metrics.total_products || 0,
          optimizableCount: metrics.optimizable_count || 0,
          potentialRevenueIncrease: metrics.potential_revenue_increase || 0,
          potentialRevenueIncreasePercent: metrics.potential_increase_percent || 0,
          actions: result.recommendations
            .filter(r => r.category === 'pricing' || r.category === 'marketing')
            .map((r, idx) => ({
              id: `price-${idx}`,
              productId: `prod-${idx}`,
              productName: r.title,
              currentValue: 0,
              recommendedValue: 0,
              expectedImpact: parseImpact(r.expected_impact),
              confidence: Math.round((result.confidence || 0.7) * 100),
            })),
        },
        inventoryOptimization: {
          totalItems: metrics.total_items || metrics.total_products || 0,
          orderRecommendations: metrics.order_recommendations || 0,
          stockoutPrevention: metrics.stockout_prevention || 0,
          overStockReduction: metrics.overstock_reduction || 0,
          actions: result.recommendations
            .filter(r => r.category === 'inventory' || r.category === 'operations')
            .map((r, idx) => ({
              id: `inv-${idx}`,
              productId: `prod-${idx}`,
              productName: r.title,
              currentValue: 0,
              recommendedValue: 0,
              expectedImpact: 0,
              confidence: Math.round((result.confidence || 0.7) * 100),
            })),
        },
        insights: result.insights,
        recommendations: result.recommendations,
        confidence: Math.round((result.confidence || 0.7) * 100),
      };
    },
    enabled: !!user && !!storeId,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
}

/**
 * 시즌 트렌드 분석 훅
 */
export function useSeasonTrend(storeId?: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['season-trend', storeId],
    queryFn: async () => {
      if (!storeId) throw new Error('Store ID is required');

      const { data, error } = await supabase.functions.invoke<RetailAIResponse>('retail-ai-inference', {
        body: {
          inference_type: 'demand_forecast',
          store_id: storeId,
          parameters: { days: 90, forecast_days: 30 },
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Season trend analysis failed');

      const result = data.result;
      const metrics = result.metrics || {};

      // 현재 날짜 기준 시즌 판단
      const now = new Date();
      const month = now.getMonth() + 1;
      let currentSeason = '일반 시즌';
      let peakStart = '';
      let peakEnd = '';

      if (month === 12) {
        currentSeason = '12월 성수기';
        peakStart = '12/20';
        peakEnd = '12/25';
      } else if (month === 1 || month === 2) {
        currentSeason = '새해/설 시즌';
        peakStart = '01/01';
        peakEnd = '02/15';
      } else if (month >= 3 && month <= 5) {
        currentSeason = '봄 시즌';
        peakStart = '03/01';
        peakEnd = '05/05';
      } else if (month >= 6 && month <= 8) {
        currentSeason = '여름 시즌';
        peakStart = '07/15';
        peakEnd = '08/31';
      } else if (month >= 9 && month <= 11) {
        currentSeason = '가을/추석 시즌';
        peakStart = '09/01';
        peakEnd = '10/15';
      }

      return {
        currentSeason: metrics.current_season || currentSeason,
        peakPeriod: {
          start: metrics.peak_start || peakStart,
          end: metrics.peak_end || peakEnd,
        },
        expectedImpact: metrics.seasonal_impact || 15,
        recommendations: result.insights.slice(0, 3) || ['재고 확보', '인력 증원', '프로모션 준비'],
        confidence: Math.round((result.confidence || 0.7) * 100),
      };
    },
    enabled: !!user && !!storeId,
    staleTime: 30 * 60 * 1000, // 30분 캐시
    retry: 1,
  });
}

// 헬퍼 함수들

function determineTrend(percentChange: number): 'up' | 'down' | 'stable' {
  if (percentChange > 3) return 'up';
  if (percentChange < -3) return 'down';
  return 'stable';
}

function categorizeRiskType(category: string): RiskPredictionResult['type'] {
  if (category.includes('stock') || category.includes('inventory')) {
    return category.includes('out') ? 'stockout' : 'overstock';
  }
  if (category.includes('demand') || category.includes('sales')) {
    return 'demand_spike';
  }
  return 'conversion_drop';
}

function parseImpact(impact?: string): number {
  if (!impact) return 0;
  const match = impact.match(/(\d+(?:\.\d+)?)/);
  return match ? parseFloat(match[1]) * 10000 : 0;
}

export default useRetailAI;
