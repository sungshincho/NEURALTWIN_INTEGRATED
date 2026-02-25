import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface AIRecommendation {
  id: string;
  recommendation_type: string;
  priority: string;
  title: string;
  description: string;
  action_category?: string;
  expected_impact?: any;
  data_source?: string;
  evidence?: any;
  status: string;
  is_displayed: boolean;
  displayed_at?: string;
  created_at: string;
}

// 우선순위 정렬을 위한 매핑 (high > medium > low)
const PRIORITY_ORDER: Record<string, number> = {
  high: 3,
  medium: 2,
  low: 1,
};

export function useAIRecommendations(storeId?: string) {
  const { user, orgId } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['ai-recommendations', storeId],
    queryFn: async () => {
      if (!user || !storeId || !orgId) return [];

      const { data, error } = await supabase
        .from('ai_recommendations')
        .select('*')
        .eq('user_id', user.id)
        .eq('org_id', orgId)
        .eq('store_id', storeId)
        .eq('is_displayed', true)
        .order('created_at', { ascending: false })
        .limit(10); // 더 많이 가져와서 클라이언트에서 정렬

      if (error) throw error;

      // 클라이언트 측 우선순위 정렬 (high > medium > low)
      const sorted = (data || []).sort((a, b) => {
        const priorityDiff = (PRIORITY_ORDER[b.priority] || 0) - (PRIORITY_ORDER[a.priority] || 0);
        if (priorityDiff !== 0) return priorityDiff;
        // 같은 우선순위면 생성일 기준 최신순
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      return sorted.slice(0, 3) as AIRecommendation[];
    },
    enabled: !!user && !!storeId,
  });

  const dismissRecommendation = useMutation({
    mutationFn: async (recommendationId: string) => {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({
          status: 'dismissed',
          is_displayed: false,
          dismissed_at: new Date().toISOString(),
        })
        .eq('id', recommendationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
      toast.success('추천이 숨겨졌습니다');
    },
    onError: (error) => {
      console.error('Error dismissing recommendation:', error);
      toast.error('추천 숨기기에 실패했습니다');
    },
  });

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('ai_recommendations')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
      toast.success('상태가 업데이트되었습니다');
    },
  });

  const generateRecommendations = useMutation({
    mutationFn: async (storeId: string) => {
      const { data, error } = await supabase.functions.invoke('unified-ai', {
        body: { action: 'generate_recommendations', store_id: storeId },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
      toast.success('AI 추천이 생성되었습니다');
    },
    onError: (error) => {
      console.error('Error generating recommendations:', error);
      toast.error('AI 추천 생성에 실패했습니다');
    },
  });

  return {
    ...query,
    dismissRecommendation,
    updateStatus,
    generateRecommendations,
  };
}
