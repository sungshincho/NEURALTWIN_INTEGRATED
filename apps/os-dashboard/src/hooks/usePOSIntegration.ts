/**
 * usePOSIntegration.ts
 * 
 * Customer Dashboard POS 연동 Hook
 * - POS 제공자 연결/해제
 * - 실시간 데이터 동기화
 * - 동기화 상태 모니터링
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';

// ============================================================================
// 타입 정의
// ============================================================================

export interface POSIntegration {
  id: string;
  org_id: string;
  store_id: string;
  provider: POSProvider;
  provider_store_id: string | null;
  sync_enabled: boolean;
  sync_frequency_minutes: number;
  last_sync_at: string | null;
  last_sync_status: SyncStatus | null;
  last_sync_error: string | null;
  status: IntegrationStatus;
  webhook_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface SyncLog {
  id: string;
  org_id: string;
  pos_integration_id: string;
  sync_type: 'full' | 'incremental' | 'webhook';
  sync_started_at: string;
  sync_ended_at: string | null;
  status: SyncStatus;
  records_fetched: number;
  records_created: number;
  records_updated: number;
  records_failed: number;
  error_message: string | null;
  created_at: string;
}

export interface RealtimeTransaction {
  id: string;
  store_id: string;
  external_transaction_id: string;
  transaction_date: string;
  transaction_time: string;
  transaction_timestamp: string;
  total_amount: number;
  payment_method: string | null;
  item_count: number;
  items: TransactionItem[];
  created_at: string;
}

export interface TransactionItem {
  product_id: string;
  name: string;
  quantity: number;
  price: number;
  discount?: number;
}

export interface RealtimeInventory {
  id: string;
  store_id: string;
  external_product_id: string;
  product_name: string | null;
  sku: string | null;
  category: string | null;
  quantity_on_hand: number;
  quantity_available: number;
  reorder_point: number | null;
  is_low_stock: boolean;
  unit_price: number | null;
  last_updated_at: string;
}

export type POSProvider = 
  | 'square' 
  | 'shopify' 
  | 'toast' 
  | 'lightspeed' 
  | 'clover' 
  | 'custom';

export type SyncStatus = 
  | 'running' 
  | 'success' 
  | 'partial' 
  | 'failed';

export type IntegrationStatus = 
  | 'pending' 
  | 'active' 
  | 'paused' 
  | 'error' 
  | 'disconnected';

// POS 제공자 정보
export const POS_PROVIDERS: Record<POSProvider, {
  name: string;
  logo: string;
  description: string;
  supportedFeatures: string[];
  oauthSupported: boolean;
}> = {
  square: {
    name: 'Square',
    logo: '/pos-logos/square.svg',
    description: '결제, 재고, 고객 데이터 통합',
    supportedFeatures: ['transactions', 'inventory', 'customers', 'orders'],
    oauthSupported: true,
  },
  shopify: {
    name: 'Shopify POS',
    logo: '/pos-logos/shopify.svg',
    description: '온/오프라인 통합 판매 데이터',
    supportedFeatures: ['transactions', 'inventory', 'customers', 'products'],
    oauthSupported: true,
  },
  toast: {
    name: 'Toast',
    logo: '/pos-logos/toast.svg',
    description: 'F&B 특화 POS 시스템',
    supportedFeatures: ['transactions', 'menu', 'orders'],
    oauthSupported: true,
  },
  lightspeed: {
    name: 'Lightspeed',
    logo: '/pos-logos/lightspeed.svg',
    description: '소매/레스토랑 POS',
    supportedFeatures: ['transactions', 'inventory', 'customers'],
    oauthSupported: true,
  },
  clover: {
    name: 'Clover',
    logo: '/pos-logos/clover.svg',
    description: '다목적 POS 시스템',
    supportedFeatures: ['transactions', 'inventory', 'orders'],
    oauthSupported: true,
  },
  custom: {
    name: '커스텀 연동',
    logo: '/pos-logos/custom.svg',
    description: 'API 키를 사용한 직접 연동',
    supportedFeatures: ['transactions', 'inventory'],
    oauthSupported: false,
  },
};

// 상태 라벨
export const STATUS_LABELS: Record<IntegrationStatus, { label: string; color: string }> = {
  pending: { label: '대기 중', color: 'yellow' },
  active: { label: '연결됨', color: 'green' },
  paused: { label: '일시 정지', color: 'gray' },
  error: { label: '오류', color: 'red' },
  disconnected: { label: '연결 해제', color: 'gray' },
};

// ============================================================================
// POS 연동 목록 조회
// ============================================================================

export function usePOSIntegrations(storeId?: string) {
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['pos-integrations', orgId, storeId],
    queryFn: async () => {
      if (!orgId) return [];

      let query = (supabase
        .from('pos_integrations' as any)
        .select(`
          *,
          stores (store_name)
        `)
        .eq('org_id', orgId)
        .order('created_at', { ascending: false }) as any);

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as (POSIntegration & { stores: { store_name: string } | null })[];
    },
    enabled: !!orgId,
  });
}

// ============================================================================
// 단일 POS 연동 조회
// ============================================================================

export function usePOSIntegration(integrationId: string) {
  return useQuery({
    queryKey: ['pos-integration', integrationId],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from('pos_integrations' as any)
        .select(`
          *,
          stores (store_name)
        `)
        .eq('id', integrationId)
        .single() as any);

      if (error) throw error;
      return data as POSIntegration & { stores: { store_name: string } | null };
    },
    enabled: !!integrationId,
  });
}

// ============================================================================
// POS 연결 시작 (OAuth)
// ============================================================================

export function useConnectPOS() {
  const { user, orgId } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      storeId,
      provider,
    }: {
      storeId: string;
      provider: POSProvider;
    }) => {
      if (!user?.id || !orgId) throw new Error('User not authenticated');

      // 이미 연결된 경우 확인
      const { data: existing } = await (supabase
        .from('pos_integrations' as any)
        .select('id')
        .eq('store_id', storeId)
        .eq('provider', provider)
        .maybeSingle() as any);

      if (existing) {
        throw new Error('이미 연결된 POS입니다');
      }

      // 연동 레코드 생성 (pending 상태)
      const { data: integration, error } = await (supabase
        .from('pos_integrations' as any)
        .insert({
          org_id: orgId,
          store_id: storeId,
          provider,
          status: 'pending',
          sync_enabled: true,
          sync_frequency_minutes: 15,
        })
        .select()
        .single() as any);

      if (error) throw error;

      // OAuth 플로우 시작 (Edge Function 호출)
      const { data: oauthData, error: oauthError } = await supabase.functions.invoke('pos-oauth-start', {
        body: {
          integrationId: integration.id,
          provider,
          redirectUrl: `${window.location.origin}/data-management/api?callback=pos`,
        },
      });

      if (oauthError) throw oauthError;

      // OAuth URL로 리다이렉트
      if (oauthData?.authUrl) {
        window.location.href = oauthData.authUrl;
      }

      return integration;
    },
    onError: (error: Error) => {
      toast({
        title: 'POS 연결 실패',
        description: error.message || '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// POS 연결 완료 (OAuth 콜백)
// ============================================================================

export function useCompletePOSConnection() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      integrationId,
      code,
    }: {
      integrationId: string;
      code: string;
    }) => {
      // Edge Function으로 토큰 교환
      const { data, error } = await supabase.functions.invoke('pos-oauth-callback', {
        body: {
          integrationId,
          code,
        },
      });

      if (error) throw error;

      // 연동 상태 업데이트
      await (supabase
        .from('pos_integrations' as any)
        .update({
          status: 'active',
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId) as any);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-integrations'] });
      toast({
        title: 'POS 연결 완료!',
        description: '데이터 동기화가 시작됩니다.',
      });
    },
    onError: (error) => {
      toast({
        title: 'POS 연결 실패',
        description: '인증 과정에서 오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// POS 연결 해제
// ============================================================================

export function useDisconnectPOS() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (integrationId: string) => {
      const { error } = await (supabase
        .from('pos_integrations' as any)
        .update({
          status: 'disconnected',
          sync_enabled: false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId) as any);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pos-integrations'] });
      toast({
        title: 'POS 연결 해제',
        description: '연동이 해제되었습니다.',
      });
    },
  });
}

// ============================================================================
// 수동 동기화 트리거
// ============================================================================

export function useTriggerSync() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (integrationId: string) => {
      // Edge Function 호출
      const { data, error } = await supabase.functions.invoke('sync-pos-data', {
        body: {
          integrationId,
          syncType: 'incremental',
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['pos-integrations'] });
      queryClient.invalidateQueries({ queryKey: ['sync-logs'] });
      queryClient.invalidateQueries({ queryKey: ['realtime-transactions'] });
      queryClient.invalidateQueries({ queryKey: ['realtime-inventory'] });
      
      toast({
        title: '동기화 완료!',
        description: `${data?.recordsCreated || 0}건의 새 데이터가 동기화되었습니다.`,
      });
    },
    onError: (error) => {
      toast({
        title: '동기화 실패',
        description: '잠시 후 다시 시도해주세요.',
        variant: 'destructive',
      });
    },
  });
}

// ============================================================================
// 동기화 로그 조회
// ============================================================================

export function useSyncLogs(integrationId?: string, limit = 10) {
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['sync-logs', orgId, integrationId, limit],
    queryFn: async () => {
      if (!orgId) return [];

      let query = (supabase
        .from('sync_logs' as any)
        .select('*')
        .eq('org_id', orgId)
        .order('created_at', { ascending: false })
        .limit(limit) as any);

      if (integrationId) {
        query = query.eq('pos_integration_id', integrationId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as SyncLog[];
    },
    enabled: !!orgId,
  });
}

// ============================================================================
// 실시간 거래 데이터 조회
// ============================================================================

export function useRealtimeTransactions(storeId: string, options?: {
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  const { orgId } = useAuth();
  const { startDate, endDate, limit = 50 } = options || {};

  return useQuery({
    queryKey: ['realtime-transactions', storeId, startDate, endDate, limit],
    queryFn: async () => {
      if (!orgId) return [];

      let query = (supabase
        .from('realtime_transactions' as any)
        .select('*')
        .eq('store_id', storeId)
        .order('transaction_timestamp', { ascending: false })
        .limit(limit) as any);

      if (startDate) {
        query = query.gte('transaction_date', startDate);
      }
      if (endDate) {
        query = query.lte('transaction_date', endDate);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as RealtimeTransaction[];
    },
    enabled: !!orgId && !!storeId,
    refetchInterval: 60000, // 1분마다 자동 갱신
  });
}

// ============================================================================
// 실시간 재고 데이터 조회
// ============================================================================

export function useRealtimeInventory(storeId: string, options?: {
  lowStockOnly?: boolean;
  category?: string;
}) {
  const { orgId } = useAuth();
  const { lowStockOnly, category } = options || {};

  return useQuery({
    queryKey: ['realtime-inventory', storeId, lowStockOnly, category],
    queryFn: async () => {
      if (!orgId) return [];

      let query = (supabase
        .from('realtime_inventory' as any)
        .select('*')
        .eq('store_id', storeId)
        .order('last_updated_at', { ascending: false }) as any);

      if (lowStockOnly) {
        query = query.eq('is_low_stock', true);
      }
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as RealtimeInventory[];
    },
    enabled: !!orgId && !!storeId,
    refetchInterval: 60000, // 1분마다 자동 갱신
  });
}

// ============================================================================
// 재고 부족 알림
// ============================================================================

export function useLowStockAlerts(storeId?: string) {
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['low-stock-alerts', orgId, storeId],
    queryFn: async () => {
      if (!orgId) return [];

      let query = supabase
        .from('realtime_inventory')
        .select(`
          *,
          stores (store_name)
        `)
        .eq('is_low_stock', true);

      if (storeId) {
        query = query.eq('store_id', storeId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as (RealtimeInventory & { stores: { store_name: string } | null })[];
    },
    enabled: !!orgId,
  });
}

// ============================================================================
// 동기화 상태 요약
// ============================================================================

export function useSyncStatusSummary(storeId?: string) {
  const { data: integrations = [] } = usePOSIntegrations(storeId);

  const activeCount = integrations.filter(i => i.status === 'active').length;
  const errorCount = integrations.filter(i => i.status === 'error').length;
  const lastSync = integrations
    .filter(i => i.last_sync_at)
    .sort((a, b) => new Date(b.last_sync_at!).getTime() - new Date(a.last_sync_at!).getTime())[0]?.last_sync_at;

  return {
    totalIntegrations: integrations.length,
    activeIntegrations: activeCount,
    errorIntegrations: errorCount,
    lastSyncAt: lastSync,
    providers: integrations.map(i => i.provider),
  };
}

// ============================================================================
// 동기화 일시 정지/재개
// ============================================================================

export function useToggleSyncPause() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ integrationId, pause }: { integrationId: string; pause: boolean }) => {
      const { error } = await supabase
        .from('pos_integrations')
        .update({
          status: pause ? 'paused' : 'active',
          sync_enabled: !pause,
          updated_at: new Date().toISOString(),
        })
        .eq('id', integrationId);

      if (error) throw error;
    },
    onSuccess: (_, { pause }) => {
      queryClient.invalidateQueries({ queryKey: ['pos-integrations'] });
      toast({
        title: pause ? '동기화 일시 정지' : '동기화 재개',
        description: pause ? '동기화가 일시 정지되었습니다.' : '동기화가 재개되었습니다.',
      });
    },
  });
}

// ============================================================================
// 헬퍼 함수
// ============================================================================

export function formatSyncTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return '방금 전';
  if (diffMins < 60) return `${diffMins}분 전`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}시간 전`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}일 전`;
}

export function getSyncStatusColor(status: SyncStatus | null): string {
  switch (status) {
    case 'success': return 'text-green-600';
    case 'partial': return 'text-yellow-600';
    case 'failed': return 'text-red-600';
    case 'running': return 'text-blue-600';
    default: return 'text-gray-400';
  }
}

export function getIntegrationStatusColor(status: IntegrationStatus): string {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'pending': return 'bg-yellow-100 text-yellow-800';
    case 'error': return 'bg-red-100 text-red-800';
    case 'paused': return 'bg-gray-100 text-gray-800';
    case 'disconnected': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-800';
  }
}
