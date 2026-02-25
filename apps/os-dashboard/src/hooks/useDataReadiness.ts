import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSelectedStore } from './useSelectedStore';

/**
 * 데모 프로세스를 위한 데이터 준비 상태 확인 훅
 * 
 * 조건:
 * 1. 매장이 선택되어야 함
 * 2. 데이터가 임포트되어 있어야 함
 * 3. 온톨로지 스키마가 존재해야 함
 */
export function useDataReadiness() {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();

  // 1. 매장 선택 여부
  const hasStore = !!selectedStore;

  // 2. 데이터 임포트 여부 확인
  const { data: importsData, isLoading: importsLoading } = useQuery({
    queryKey: ['data-imports-check', user?.id, selectedStore?.id],
    queryFn: async () => {
      if (!user || !orgId) return null;

      const query = supabase
        .from('user_data_imports')
        .select('id, data_type, created_at')
        .eq('user_id', user.id)
        .eq('org_id', orgId);

      if (selectedStore) {
        query.eq('store_id', selectedStore.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && hasStore,
  });

  // 3. 온톨로지 스키마 존재 여부 확인
  const { data: schemaData, isLoading: schemaLoading } = useQuery({
    queryKey: ['ontology-schema-check', user?.id],
    queryFn: async () => {
      if (!user || !orgId) return null;

      const { data, error } = await supabase
        .from('ontology_entity_types')
        .select('id')
        .eq('user_id', user.id)
        .eq('org_id', orgId)
        .limit(1);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user && hasStore,
  });

  // 4. WiFi 트래킹 데이터 존재 여부 확인
  const { data: wifiData, isLoading: wifiLoading } = useQuery({
    queryKey: ['wifi-tracking-check', user?.id, selectedStore?.id],
    queryFn: async () => {
      if (!user || !orgId) return null;

      const query = supabase
        .from('wifi_tracking' as any)
        .select('id')
        .eq('user_id', user.id)
        .eq('org_id', orgId)
        .limit(1);

      if (selectedStore) {
        query.eq('store_id', selectedStore.id);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && hasStore,
  });

  const isLoading = importsLoading || schemaLoading || wifiLoading;
  
  const hasImportedData = (importsData?.length || 0) > 0;
  const hasOntologySchema = (schemaData?.length || 0) > 0;
  const hasWifiData = (wifiData?.length || 0) > 0;

  // 분석 기능 활성화 조건: 매장 선택 + 데이터 임포트 + 온톨로지 스키마
  const isReady = hasStore && hasImportedData && hasOntologySchema;

  // 각 데이터 타입별 상세 정보
  const dataTypesSummary = importsData?.reduce((acc, item) => {
    const type = item.data_type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  return {
    // 전체 상태
    isReady,
    isLoading,
    
    // 개별 조건
    hasStore,
    hasImportedData,
    hasOntologySchema,
    hasWifiData,
    
    // 상세 정보
    selectedStore,
    importCount: importsData?.length || 0,
    dataTypesSummary,
    
    // 메시지 생성
    getStatusMessage: () => {
      if (!hasStore) {
        return {
          type: 'no-store' as const,
          title: '매장을 선택해주세요',
          message: '분석 기능을 사용하려면 먼저 매장을 등록하고 선택해야 합니다.',
          action: '매장 관리로 이동',
          actionPath: '/stores'
        };
      }
      
      if (!hasImportedData) {
        return {
          type: 'no-data' as const,
          title: '데이터를 임포트해주세요',
          message: '분석 기능을 사용하려면 먼저 데이터를 임포트해야 합니다.',
          action: '데이터 관리로 이동',
          actionPath: '/data-import'
        };
      }
      
      if (!hasOntologySchema) {
        return {
          type: 'no-schema' as const,
          title: '온톨로지 스키마를 설정해주세요',
          message: '분석 기능을 사용하려면 온톨로지 스키마가 필요합니다.',
          action: '스키마 빌더로 이동',
          actionPath: '/schema-builder'
        };
      }
      
      return {
        type: 'ready' as const,
        title: '준비 완료',
        message: '모든 분석 기능을 사용할 수 있습니다.',
        action: null,
        actionPath: null
      };
    }
  };
}
