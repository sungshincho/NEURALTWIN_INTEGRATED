// ============================================================================
// Phase 7: API Connector Hooks
// ============================================================================
// React Query 기반 API Connector 훅 모음
// ============================================================================

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ApiConnection,
  ApiMappingTemplate,
  ApiSyncLog,
  ConnectionTestResult,
  SyncResult,
  MappingPreview,
  ApiConnectionsDashboard,
  AuthType,
  DataCategory,
  FieldMapping,
  AuthConfig,
} from '../types';

// ============================================================================
// Query Keys
// ============================================================================

export const apiConnectorKeys = {
  all: ['api-connector'] as const,
  connections: (params?: { orgId?: string; storeId?: string }) =>
    [...apiConnectorKeys.all, 'connections', params] as const,
  connection: (id: string) => [...apiConnectorKeys.all, 'connection', id] as const,
  templates: (params?: { provider?: string; dataCategory?: string }) =>
    [...apiConnectorKeys.all, 'templates', params] as const,
  syncLogs: (connectionId: string) =>
    [...apiConnectorKeys.all, 'sync-logs', connectionId] as const,
  dashboard: (params?: { orgId?: string; storeId?: string }) =>
    [...apiConnectorKeys.all, 'dashboard', params] as const,
};

// ============================================================================
// useApiConnections - 연결 목록 조회
// ============================================================================

export function useApiConnections(params?: { orgId?: string; storeId?: string }) {
  return useQuery({
    queryKey: apiConnectorKeys.connections(params),
    queryFn: async () => {
      let query = supabase
        .from('api_connections')
        .select('*')
        .order('created_at', { ascending: false });

      if (params?.orgId) {
        query = query.eq('org_id', params.orgId);
      }
      if (params?.storeId) {
        query = query.eq('store_id', params.storeId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as ApiConnection[];
    },
  });
}

// ============================================================================
// useApiConnection - 단일 연결 조회
// ============================================================================

export function useApiConnection(connectionId: string) {
  return useQuery({
    queryKey: apiConnectorKeys.connection(connectionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_connections')
        .select('*')
        .eq('id', connectionId)
        .single();

      if (error) throw error;
      return data as unknown as ApiConnection;
    },
    enabled: !!connectionId,
  });
}

// ============================================================================
// useApiConnectionsDashboard - 대시보드용 연결 요약
// ============================================================================

export function useApiConnectionsDashboard(params?: { orgId?: string; storeId?: string }) {
  return useQuery({
    queryKey: apiConnectorKeys.dashboard(params),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_api_connections_dashboard', {
        p_org_id: params?.orgId || null,
        p_store_id: params?.storeId || null,
      });

      if (error) throw error;
      return data as unknown as ApiConnectionsDashboard;
    },
  });
}

// ============================================================================
// useApiMappingTemplates - 매핑 템플릿 조회
// ============================================================================

export function useApiMappingTemplates(params?: { provider?: string; dataCategory?: string }) {
  return useQuery({
    queryKey: apiConnectorKeys.templates(params),
    queryFn: async () => {
      let query = supabase
        .from('api_mapping_templates')
        .select('*')
        .eq('is_active', true)
        .order('is_official', { ascending: false })
        .order('provider');

      if (params?.provider) {
        query = query.eq('provider', params.provider);
      }
      if (params?.dataCategory) {
        query = query.eq('data_category', params.dataCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []) as unknown as ApiMappingTemplate[];
    },
  });
}

// ============================================================================
// useApiSyncLogs - 동기화 로그 조회
// ============================================================================

export function useApiSyncLogs(connectionId: string) {
  return useQuery({
    queryKey: apiConnectorKeys.syncLogs(connectionId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from('api_sync_logs')
        .select('*')
        .eq('api_connection_id', connectionId)
        .order('started_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data as ApiSyncLog[];
    },
    enabled: !!connectionId,
  });
}

// ============================================================================
// useCreateConnection - 연결 생성
// ============================================================================

interface CreateConnectionParams {
  orgId?: string;
  storeId?: string;
  name: string;
  provider: string;
  dataCategory: DataCategory;
  url: string;
  authType: AuthType;
  authConfig?: AuthConfig;
  fieldMappings?: FieldMapping[];
  targetTable?: string;
  responseDataPath?: string;
}

export function useCreateConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateConnectionParams) => {
      const { data, error } = await supabase.rpc('create_api_connection', {
        p_org_id: params.orgId || null,
        p_store_id: params.storeId || null,
        p_name: params.name,
        p_provider: params.provider,
        p_data_category: params.dataCategory,
        p_url: params.url,
        p_auth_type: params.authType,
        p_auth_config: (params.authConfig || {}) as any,
        p_field_mappings: (params.fieldMappings || []) as any,
        p_target_table: params.targetTable || null,
        p_response_data_path: params.responseDataPath || 'data',
      });

      if (error) throw error;
      return data as { success: boolean; connection_id: string; message: string };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiConnectorKeys.all });
    },
  });
}

// ============================================================================
// useUpdateConnection - 연결 수정
// ============================================================================

interface UpdateConnectionParams {
  id: string;
  updates: Partial<ApiConnection>;
}

export function useUpdateConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: UpdateConnectionParams) => {
      const { data, error } = await supabase
        .from('api_connections')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ApiConnection;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: apiConnectorKeys.all });
      queryClient.setQueryData(apiConnectorKeys.connection(data.id), data);
    },
  });
}

// ============================================================================
// useDeleteConnection - 연결 삭제
// ============================================================================

export function useDeleteConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('api_connections')
        .delete()
        .eq('id', connectionId);

      if (error) throw error;
      return connectionId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiConnectorKeys.all });
    },
  });
}

// ============================================================================
// useTestConnection - 연결 테스트
// ============================================================================

interface TestConnectionParams {
  connectionId?: string;
  connectionConfig?: {
    url: string;
    method?: string;
    authType?: AuthType;
    authConfig?: AuthConfig;
    headers?: Record<string, string>;
    responseDataPath?: string;
  };
}

export function useTestConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: TestConnectionParams) => {
      const { data, error } = await supabase.functions.invoke('api-connector', {
        body: {
          action: 'test',
          connection_id: params.connectionId,
          connection_config: params.connectionConfig,
        },
      });

      if (error) throw error;
      return data as ConnectionTestResult;
    },
    onSuccess: (_, variables) => {
      if (variables.connectionId) {
        queryClient.invalidateQueries({
          queryKey: apiConnectorKeys.connection(variables.connectionId),
        });
      }
    },
  });
}

// ============================================================================
// useSyncConnection - 동기화 실행
// Phase 8: sync_type 지원 (manual, scheduled, retry)
// ============================================================================

interface SyncConnectionParams {
  connectionId: string;
  syncType?: 'manual' | 'scheduled' | 'retry';
}

export function useSyncConnection() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: string | SyncConnectionParams) => {
      // 하위 호환성: string인 경우 connectionId로 처리
      const connectionId = typeof params === 'string' ? params : params.connectionId;
      const syncType = typeof params === 'string' ? 'manual' : (params.syncType || 'manual');

      const { data, error } = await supabase.functions.invoke('api-connector', {
        body: {
          action: 'sync',
          connection_id: connectionId,
          sync_type: syncType,
        },
      });

      if (error) throw error;
      return data as SyncResult;
    },
    onSuccess: (_, params) => {
      const connectionId = typeof params === 'string' ? params : params.connectionId;
      queryClient.invalidateQueries({ queryKey: apiConnectorKeys.all });
      queryClient.invalidateQueries({
        queryKey: apiConnectorKeys.syncLogs(connectionId),
      });
    },
  });
}

// ============================================================================
// usePreviewMapping - 매핑 미리보기
// ============================================================================

interface PreviewMappingParams {
  sampleData: any[];
  fieldMappings: FieldMapping[];
}

export function usePreviewMapping() {
  return useMutation({
    mutationFn: async (params: PreviewMappingParams) => {
      const { data, error } = await supabase.functions.invoke('api-connector', {
        body: {
          action: 'preview',
          sample_data: params.sampleData,
          field_mappings: params.fieldMappings,
        },
      });

      if (error) throw error;
      return data as {
        success: boolean;
        preview: MappingPreview[];
        field_count: number;
        sample_count: number;
      };
    },
  });
}

// ============================================================================
// useApplyTemplate - 템플릿 적용
// ============================================================================

interface ApplyTemplateParams {
  provider: string;
  dataCategory: DataCategory;
  targetTable?: string;
}

export function useApplyTemplate() {
  return useMutation({
    mutationFn: async (params: ApplyTemplateParams) => {
      const { data, error } = await supabase.functions.invoke('api-connector', {
        body: {
          action: 'apply-template',
          provider: params.provider,
          data_category: params.dataCategory,
          target_table: params.targetTable,
        },
      });

      if (error) throw error;
      return data as {
        success: boolean;
        template: ApiMappingTemplate;
        is_official?: boolean;
        is_generic?: boolean;
        message: string;
      };
    },
  });
}

// ============================================================================
// useToggleConnectionStatus - 연결 활성화/비활성화
// ============================================================================

export function useToggleConnectionStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { data, error } = await supabase
        .from('api_connections')
        .update({ is_active: isActive, status: isActive ? 'inactive' : 'inactive' })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as ApiConnection;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: apiConnectorKeys.all });
    },
  });
}
