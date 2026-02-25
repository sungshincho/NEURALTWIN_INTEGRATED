import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ImportProgress {
  import_id: string;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'failed' | 'paused';
  stage?: string;
  percentage?: number;
  details?: Record<string, any>;
  error?: string;
  can_pause?: boolean;
  can_resume?: boolean;
}

export function useImportProgress(import_id?: string) {
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!import_id) return;

    // 초기 데이터 조회
    const fetchInitialProgress = async () => {
      const { data } = await supabase
        .from('user_data_imports')
        .select('id, status, progress, error_details, can_pause, can_resume')
        .eq('id', import_id)
        .single();

      if (data) {
        const progressData = data.progress as any;
        const errorDetails = data.error_details;
        const errorMessage = typeof errorDetails === 'string' 
          ? errorDetails 
          : errorDetails 
            ? JSON.stringify(errorDetails) 
            : undefined;
            
        setProgress({
          import_id: data.id,
          status: data.status as any,
          stage: progressData?.stage,
          percentage: progressData?.percentage,
          details: progressData,
          error: errorMessage,
          can_pause: data.can_pause || undefined,
          can_resume: data.can_resume || undefined
        });
      }
    };

    fetchInitialProgress();

    // Realtime 구독
    const newChannel = supabase
      .channel(`import-progress-${import_id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'user_data_imports',
          filter: `id=eq.${import_id}`
        },
        (payload) => {
          const data = payload.new as any;
          const progressData = data.progress;
          const errorDetails = data.error_details;
          const errorMessage = typeof errorDetails === 'string' 
            ? errorDetails 
            : errorDetails 
              ? JSON.stringify(errorDetails) 
              : undefined;
              
          setProgress({
            import_id: data.id,
            status: data.status,
            stage: progressData?.stage,
            percentage: progressData?.percentage,
            details: progressData,
            error: errorMessage,
            can_pause: data.can_pause || undefined,
            can_resume: data.can_resume || undefined
          });
        }
      )
      .subscribe();

    setChannel(newChannel);

    return () => {
      if (newChannel) {
        supabase.removeChannel(newChannel);
      }
    };
  }, [import_id]);

  return { progress };
}
