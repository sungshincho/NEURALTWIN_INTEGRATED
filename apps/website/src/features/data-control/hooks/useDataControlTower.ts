/**
 * Stub for data-control hooks — full implementation pending data-control feature migration.
 * Provides useDataQualityScore used by DataQualityBanner.
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAuth } from '@/hooks/useAuth';

export interface DataQualityScore {
  overall_score: number;
  confidence_level: 'high' | 'medium' | 'low';
  warnings: { message: string; severity: string }[];
  sources: Record<string, { connected: boolean; freshness: string }>;
}

export function useDataQualityScore(date?: string) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();
  const storeId = selectedStore?.id;

  return useQuery<DataQualityScore>({
    queryKey: ['data-quality-score', storeId, orgId, date],
    queryFn: async () => {
      if (!storeId) throw new Error('No store selected');

      try {
        const { data, error } = await supabase
          .rpc('calculate_data_quality_score', {
            p_store_id: storeId,
            p_date: date || new Date().toISOString().split('T')[0],
          });

        if (error) throw error;
        return data as unknown as DataQualityScore;
      } catch {
        // Fallback: return default high score (hides banner)
        return {
          overall_score: 100,
          confidence_level: 'high' as const,
          warnings: [],
          sources: {},
        };
      }
    },
    enabled: !!storeId,
  });
}
