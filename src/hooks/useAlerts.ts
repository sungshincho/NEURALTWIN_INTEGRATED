/**
 * useAlerts.ts
 *
 * 알림 시스템 Hook
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSelectedStore } from '@/hooks/useSelectedStore';

// ============================================================================
// 타입 정의
// ============================================================================

export type AlertType = 'inventory' | 'conversion' | 'goal' | 'recommendation' | 'roi';
export type AlertSeverity = 'critical' | 'warning' | 'success' | 'info';

export interface UserAlert {
  id: string;
  org_id: string;
  store_id: string | null;
  user_id: string | null;
  alert_type: AlertType;
  severity: AlertSeverity;
  title: string;
  message: string | null;
  action_url: string | null;
  action_label: string | null;
  is_read: boolean;
  is_dismissed: boolean;
  metadata: Record<string, any>;
  created_at: string;
  read_at: string | null;
  expires_at: string | null;
}

// ============================================================================
// 알림 목록 조회
// ============================================================================

export function useAlerts(limit: number = 20) {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();

  return useQuery({
    queryKey: ['user-alerts', user?.id, selectedStore?.id, limit],
    queryFn: async () => {
      if (!user?.id || !orgId) return [];

      let query = supabase
        .from('user_alerts')
        .select('*')
        .eq('org_id', orgId)
        .eq('is_dismissed', false)
        .order('created_at', { ascending: false })
        .limit(limit);

      // 매장별 필터링 (선택된 매장이 있으면)
      if (selectedStore?.id) {
        query = query.or(`store_id.eq.${selectedStore.id},store_id.is.null`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as UserAlert[];
    },
    enabled: !!user?.id && !!orgId,
    refetchInterval: 60000, // 1분마다 새로고침
  });
}

// ============================================================================
// 읽지 않은 알림 수
// ============================================================================

export function useUnreadAlertCount() {
  const { data: alerts = [] } = useAlerts();
  return alerts.filter(a => !a.is_read).length;
}

// ============================================================================
// 알림 읽음 처리
// ============================================================================

export function useMarkAlertRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('user_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-alerts'] });
    },
  });
}

// ============================================================================
// 모든 알림 읽음 처리
// ============================================================================

export function useMarkAllAlertsRead() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      if (!user?.id) return;

      const { error } = await supabase
        .from('user_alerts')
        .update({
          is_read: true,
          read_at: new Date().toISOString(),
        })
        .eq('user_id', user.id)
        .eq('is_read', false);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-alerts'] });
    },
  });
}

// ============================================================================
// 알림 숨기기
// ============================================================================

export function useDismissAlert() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alertId: string) => {
      const { error } = await supabase
        .from('user_alerts')
        .update({ is_dismissed: true })
        .eq('id', alertId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-alerts'] });
    },
  });
}

// ============================================================================
// 알림 생성 (내부용)
// ============================================================================

export function useCreateAlert() {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (alert: {
      alertType: AlertType;
      severity: AlertSeverity;
      title: string;
      message?: string;
      actionUrl?: string;
      actionLabel?: string;
      metadata?: Record<string, any>;
    }) => {
      if (!orgId) throw new Error('Organization not found');

      const { data, error } = await supabase
        .from('user_alerts')
        .insert({
          org_id: orgId,
          store_id: selectedStore?.id || null,
          user_id: user?.id || null,
          alert_type: alert.alertType,
          severity: alert.severity,
          title: alert.title,
          message: alert.message || null,
          action_url: alert.actionUrl || null,
          action_label: alert.actionLabel || null,
          metadata: alert.metadata || {},
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-alerts'] });
    },
  });
}
