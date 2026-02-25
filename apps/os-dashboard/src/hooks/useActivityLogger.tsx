import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCallback } from "react";

type ActivityType = 'login' | 'logout' | 'page_view' | 'feature_use' | 'api_call' | 'data_upload' | 'data_download';

export const useActivityLogger = () => {
  const { user } = useAuth();
  
  const logActivity = useCallback(async (
    activityType: ActivityType,
    activityData?: Record<string, any>
  ) => {
    if (!user?.id) return;

    try {
      // org_id 가져오기
      const { data: membership } = await supabase
        .from('organization_members')
        .select('org_id')
        .eq('user_id', user.id)
        .single();

      await supabase
        .from('user_activity_logs')
        .insert({
          user_id: user.id,
          org_id: membership?.org_id || null,
          activity_type: activityType,
          activity_data: activityData || {},
        });
    } catch (error) {
      // 로깅 실패는 조용히 처리 (사용자 경험 방해 방지)
      console.debug('Activity logging skipped:', error);
    }
  }, [user?.id]);

  return { logActivity };
};
