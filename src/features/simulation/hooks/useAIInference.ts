import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PredictionRequest, PredictionResult } from '../types/prediction.types';
import { ScenarioType } from '../types/scenario.types';
import { toast } from 'sonner';

interface SimulationRecommendation {
  type: 'layout' | 'pricing' | 'demand-inventory' | 'recommendation';
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  suggestedActions: string[];
  expectedImpact: string;
}

export function useAIInference() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const analyzeGoal = async (
    goalText: string,
    storeId: string
  ): Promise<SimulationRecommendation[] | null> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'advanced-ai-inference',
        {
          body: {
            inference_type: 'pattern',
            data: [{ goal: goalText, storeId }],
            parameters: {
              analysis_type: 'business_goal_analysis',
              goal_text: goalText,
            },
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (!data || !data.recommendations) {
        throw new Error('No analysis result returned');
      }

      return data.recommendations as SimulationRecommendation[];
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'AI 분석 실패';
      setError(e as Error);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const infer = async (
    scenarioType: ScenarioType,
    params: Record<string, any>,
    storeId?: string,
    storeContext?: any
  ): Promise<PredictionResult | null> => {
    setLoading(true);
    setError(null);

    try {
      const request: PredictionRequest = {
        scenarioType,
        params,
        storeId,
      };

      const { data, error: functionError } = await supabase.functions.invoke(
        'advanced-ai-inference',
        {
          body: {
            inference_type: 'prediction',
            data: [request],
            parameters: {
              scenario_type: scenarioType,
              store_context: storeContext, // 실제 매장 컨텍스트 전달
              ...params,
            },
          },
        }
      );

      if (functionError) {
        throw functionError;
      }

      if (!data) {
        throw new Error('No prediction result returned');
      }

      toast.success('시뮬레이션 예측 완료');
      return data as PredictionResult;
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : 'AI 추론 실패';
      setError(e as Error);
      toast.error(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { analyzeGoal, infer, loading, error };
}
