import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSimulationStore } from '@/stores/simulationStore';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { toast } from 'sonner';

/**
 * 시뮬레이션 AI 분석 결과 타입
 */
export interface SimulationAIResult {
  success: boolean;
  inference_type: string;
  store_id: string;
  result: {
    insights: string[];
    recommendations: Array<{
      title: string;
      description: string;
      priority: 'critical' | 'high' | 'medium' | 'low';
      category: string;
      expected_impact?: string;
      action_items?: string[];
    }>;
    metrics: Record<string, any>;
    confidence: number;
  };
  data_summary?: {
    entities_analyzed: number;
    relations_analyzed: number;
    concepts_computed: number;
  };
}

/**
 * 시뮬레이션 결과를 AI로 분석하는 훅
 *
 * 시뮬레이션 완료 후 결과 데이터를 retail-ai-inference Edge Function에
 * 전달하여 심층 AI 분석을 수행합니다.
 */
export function useSimulationAI() {
  const queryClient = useQueryClient();
  const { selectedStore } = useSelectedStore();
  const { results, zoneMetrics, config } = useSimulationStore();

  return useMutation({
    mutationFn: async (): Promise<SimulationAIResult> => {
      if (!results) {
        throw new Error('시뮬레이션 결과가 없습니다');
      }

      if (!selectedStore?.id) {
        throw new Error('매장을 선택해주세요');
      }

      // 시뮬레이션 모드에 따른 추론 타입 결정
      const inferenceType = mapModeToInferenceType(config.mode);

      const { data, error } = await supabase.functions.invoke('retail-ai-inference', {
        body: {
          inference_type: inferenceType,
          store_id: selectedStore.id,
          parameters: {
            simulation_results: results,
            zone_metrics: zoneMetrics,
            simulation_mode: config.mode,
            simulation_duration: config.duration,
          },
        },
      });

      if (error) throw error;
      return data as SimulationAIResult;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['ai-inference-results'] });

      const recommendationCount = data.result?.recommendations?.length || 0;
      toast.success(`AI 분석 완료: ${recommendationCount}개 추천 생성`);
    },
    onError: (error) => {
      console.error('AI analysis failed:', error);
      toast.error(`AI 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    },
  });
}

/**
 * 시뮬레이션 모드를 AI 추론 타입으로 매핑
 */
function mapModeToInferenceType(mode: string): string {
  const mapping: Record<string, string> = {
    layout: 'layout_optimization',
    customer_flow: 'traffic_flow',
    heatmap: 'zone_analysis',
    demand: 'demand_forecast',
    inventory: 'inventory_optimization',
    staff: 'zone_analysis',
    promotion: 'cross_sell',
  };

  return mapping[mode] || 'zone_analysis';
}

/**
 * 시뮬레이션 시나리오 비교 분석 훅
 *
 * 여러 시뮬레이션 결과를 비교 분석하여
 * 최적의 레이아웃/전략을 추천합니다.
 */
export function useSimulationComparison() {
  const { selectedStore } = useSelectedStore();

  return useMutation({
    mutationFn: async (scenarios: Array<{
      name: string;
      results: any;
      zoneMetrics: any[];
    }>) => {
      if (!selectedStore?.id) {
        throw new Error('매장을 선택해주세요');
      }

      if (scenarios.length < 2) {
        throw new Error('비교하려면 최소 2개의 시나리오가 필요합니다');
      }

      const { data, error } = await supabase.functions.invoke('retail-ai-inference', {
        body: {
          inference_type: 'layout_optimization',
          store_id: selectedStore.id,
          parameters: {
            comparison_mode: true,
            scenarios: scenarios.map(s => ({
              name: s.name,
              metrics: s.results.metrics,
              zone_metrics: s.zoneMetrics,
            })),
          },
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('시나리오 비교 분석이 완료되었습니다');
    },
    onError: (error) => {
      toast.error(`비교 분석 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    },
  });
}

/**
 * 실시간 시뮬레이션 인사이트 생성 훅
 *
 * 시뮬레이션 진행 중 실시간으로 간단한 인사이트를 생성합니다.
 * (서버 호출 없이 클라이언트 측에서 처리)
 */
export function useRealtimeInsights() {
  const { zoneMetrics, customers, config } = useSimulationStore();

  const generateInsights = (): string[] => {
    const insights: string[] = [];

    // 병목 구역 감지
    const bottleneckZones = zoneMetrics.filter(z => z.heatmapIntensity > 0.8);
    if (bottleneckZones.length > 0) {
      insights.push(
        `⚠️ ${bottleneckZones.map(z => z.zoneName).join(', ')} 구역에서 혼잡이 감지되었습니다.`
      );
    }

    // 저전환율 구역
    const lowConversionZones = zoneMetrics.filter(z => z.conversionRate < 0.1 && z.visitorCount > 5);
    if (lowConversionZones.length > 0) {
      insights.push(
        `📊 ${lowConversionZones.map(z => z.zoneName).join(', ')} 구역의 전환율이 낮습니다.`
      );
    }

    // 고객 행동 분석
    const browsingCount = customers.filter(c => c.behavior === 'browsing').length;
    const walkingCount = customers.filter(c => c.behavior === 'walking').length;
    const totalActive = browsingCount + walkingCount;

    if (totalActive > 0 && browsingCount / totalActive > 0.7) {
      insights.push('👀 고객들이 오래 머무르며 탐색하고 있습니다. 구매 유도 프로모션을 고려하세요.');
    }

    // 평균 체류 시간
    const avgDwell = zoneMetrics.length > 0
      ? zoneMetrics.reduce((s, z) => s + z.avgDwellTime, 0) / zoneMetrics.length
      : 0;

    if (avgDwell > 120) {
      insights.push('⏱️ 평균 체류 시간이 높습니다. 고객 경험이 양호합니다.');
    } else if (avgDwell < 30 && zoneMetrics.length > 0) {
      insights.push('⚡ 체류 시간이 짧습니다. 매력적인 디스플레이나 체험 공간을 추가하세요.');
    }

    return insights;
  };

  return {
    insights: generateInsights(),
  };
}

export default useSimulationAI;
