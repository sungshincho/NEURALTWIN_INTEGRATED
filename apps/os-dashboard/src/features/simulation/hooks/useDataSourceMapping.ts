import { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

/**
 * 데이터 소스 타입 정의
 */
export interface ImportedDataSource {
  id: string;
  name: string;
  table: string;
  recordCount: number;
  lastUpdated: string;
  status: 'connected' | 'pending' | 'error';
  mappedToOntology: boolean;
  ontologyEntityType?: string;
  ontologyEntityCount?: number;
}

export interface PresetApiSource {
  id: string;
  name: string;
  description: string;
  provider: string;
  enabled: boolean;
  lastSync?: string;
  dataPoints?: number;
  adminOnly: boolean;
}

export interface CustomApiSource {
  id: string;
  name: string;
  type: 'pos' | 'crm' | 'erp' | 'other';
  endpoint: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync?: string;
  recordCount?: number;
}

export interface OntologyMappingStatus {
  totalEntities: number;
  mappedEntities: number;
  totalRelations: number;
  unmappedFields: string[];
  healthScore: number;
}

export interface ApiConfig {
  type: 'preset' | 'custom';
  name: string;
  apiType?: 'pos' | 'crm' | 'erp' | 'other';
  endpoint?: string;
  credentials?: Record<string, string>;
}

interface UseDataSourceMappingReturn {
  // 데이터 소스 상태
  importedData: ImportedDataSource[];
  presetApis: PresetApiSource[];
  customApis: CustomApiSource[];
  mappingStatus: OntologyMappingStatus;
  
  // 로딩 및 에러
  loading: boolean;
  error: Error | null;
  
  // 액션
  refreshMapping: () => Promise<void>;
  connectApi: (config: ApiConfig) => Promise<boolean>;
  disconnectApi: (apiId: string) => Promise<boolean>;
  configurePresetApi: (apiId: string, enabled: boolean) => Promise<boolean>;
  
  // 유틸리티
  isAdmin: boolean;
  hasMinimumData: boolean;
  getSourceByTable: (table: string) => ImportedDataSource | undefined;
}

/**
 * useDataSourceMapping Hook
 * 
 * 시뮬레이션 허브에서 사용할 데이터 소스 매핑 상태 관리
 * 
 * 사용 예:
 * ```tsx
 * const { importedData, presetApis, mappingStatus, refreshMapping } = useDataSourceMapping();
 * ```
 */
export function useDataSourceMapping(): UseDataSourceMappingReturn {
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
  
  // 상태
  const [importedData, setImportedData] = useState<ImportedDataSource[]>([]);
  const [presetApis, setPresetApis] = useState<PresetApiSource[]>([]);
  const [customApis, setCustomApis] = useState<CustomApiSource[]>([]);
  const [mappingStatus, setMappingStatus] = useState<OntologyMappingStatus>({
    totalEntities: 0,
    mappedEntities: 0,
    totalRelations: 0,
    unmappedFields: [],
    healthScore: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 관리자 여부 확인
  const isAdmin = useMemo(() => {
    return user?.email?.includes('@neuraltwin') || user?.email?.includes('admin') || false;
  }, [user?.email]);

  // 최소 데이터 존재 여부
  const hasMinimumData = useMemo(() => {
    return mappingStatus.healthScore >= 25;
  }, [mappingStatus.healthScore]);

  /**
   * 데이터 소스 상태 로드 (Edge Function 사용)
   */
  const loadDataSourceStatus = useCallback(async () => {
    if (!selectedStore?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'simulation-data-mapping',
        {
          body: {
            action: 'get_status',
            store_id: selectedStore.id,
          },
        }
      );

      if (fnError) {
        throw fnError;
      }

      if (data?.success) {
        setImportedData(data.importedData || []);
        setPresetApis(data.presetApis || []);
        setCustomApis(data.customApis || []);
        setMappingStatus(data.mappingStatus || {
          totalEntities: 0,
          mappedEntities: 0,
          totalRelations: 0,
          unmappedFields: [],
          healthScore: 0,
        });
      }
    } catch (e) {
      console.error('Failed to load data source status:', e);
      setError(e as Error);
      
      // Edge Function이 없으면 직접 쿼리로 폴백
      await loadDataSourceStatusFallback();
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id]);

  /**
   * Edge Function이 없을 때 직접 쿼리하는 폴백 함수
   */
  const loadDataSourceStatusFallback = useCallback(async () => {
    if (!selectedStore?.id || !user?.id) return;

    try {
      // 1. 각 테이블 카운트 직접 조회
      const sources: ImportedDataSource[] = [];

      // products
      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      sources.push({
        id: 'products',
        name: '상품 데이터',
        table: 'products',
        recordCount: productsCount || 0,
        lastUpdated: new Date().toISOString(),
        status: (productsCount || 0) > 0 ? 'connected' : 'pending',
        mappedToOntology: true,
        ontologyEntityType: 'Product',
      });

      // customers
      const { count: customersCount } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true });

      sources.push({
        id: 'customers',
        name: '고객 데이터',
        table: 'customers',
        recordCount: customersCount || 0,
        lastUpdated: new Date().toISOString(),
        status: (customersCount || 0) > 0 ? 'connected' : 'pending',
        mappedToOntology: true,
        ontologyEntityType: 'Customer',
      });

      // inventory_levels
      const { count: inventoryCount } = await supabase
        .from('inventory_levels')
        .select('*', { count: 'exact', head: true });

      sources.push({
        id: 'inventory',
        name: '재고 데이터',
        table: 'inventory_levels',
        recordCount: inventoryCount || 0,
        lastUpdated: new Date().toISOString(),
        status: (inventoryCount || 0) > 0 ? 'connected' : 'pending',
        mappedToOntology: true,
        ontologyEntityType: 'InventoryLevel',
      });

      // purchases
      const { count: purchasesCount } = await supabase
        .from('purchases')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', selectedStore.id);

      sources.push({
        id: 'purchases',
        name: '구매 데이터',
        table: 'purchases',
        recordCount: purchasesCount || 0,
        lastUpdated: new Date().toISOString(),
        status: (purchasesCount || 0) > 0 ? 'connected' : 'pending',
        mappedToOntology: true,
        ontologyEntityType: 'Purchase',
      });

      // visits (store_visits 테이블 사용)
      const { count: visitsCount } = await supabase
        .from('store_visits')  // visits → store_visits 마이그레이션
        .select('*', { count: 'exact', head: true })
        .eq('store_id', selectedStore.id);

      sources.push({
        id: 'visits',
        name: '방문 데이터',
        table: 'store_visits',  // visits → store_visits 마이그레이션
        recordCount: visitsCount || 0,
        lastUpdated: new Date().toISOString(),
        status: (visitsCount || 0) > 0 ? 'connected' : 'pending',
        mappedToOntology: true,
        ontologyEntityType: 'Visit',
      });

      // daily_kpis_agg (L3 표준 KPI 테이블)
      const { count: kpisCount } = await supabase
        .from('daily_kpis_agg')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', selectedStore.id);

      sources.push({
        id: 'kpis',
        name: 'KPI 데이터',
        table: 'daily_kpis_agg',  // L3 표준 테이블로 변경
        recordCount: kpisCount || 0,
        lastUpdated: new Date().toISOString(),
        status: (kpisCount || 0) > 0 ? 'connected' : 'pending',
        mappedToOntology: true,
        ontologyEntityType: 'DailyKPI',
      });

      // graph_entities
      const { count: entitiesCount } = await supabase
        .from('graph_entities')
        .select('*', { count: 'exact', head: true })
        .eq('store_id', selectedStore.id)
        .eq('user_id', user.id);

      sources.push({
        id: 'ontology_entities',
        name: '온톨로지 엔티티',
        table: 'graph_entities',
        recordCount: entitiesCount || 0,
        lastUpdated: new Date().toISOString(),
        status: (entitiesCount || 0) > 0 ? 'connected' : 'pending',
        mappedToOntology: true,
        ontologyEntityType: 'Entity',
      });

      setImportedData(sources);

      // 2. 기본 프리셋 API
      setPresetApis([
        {
          id: 'weather',
          name: '날씨 API',
          description: '기상청 날씨 데이터',
          provider: 'OpenWeather',
          enabled: false,
          adminOnly: true,
        },
        {
          id: 'economic',
          name: '경제지표 API',
          description: '소비자물가지수, 경기동행지수',
          provider: 'KOSIS',
          enabled: false,
          adminOnly: true,
        },
        {
          id: 'holidays',
          name: '공휴일 API',
          description: '공휴일 및 특별 기념일',
          provider: '공공데이터포털',
          enabled: false,
          adminOnly: true,
        },
      ]);

      // 3. 매핑 상태 계산
      const connectedSources = sources.filter(s => s.status === 'connected').length;
      const healthScore = Math.round((connectedSources / sources.length) * 100);

      const unmappedFields = ['products', 'customers', 'purchases', 'visits', 'kpis']
        .filter(table => {
          const source = sources.find(s => s.id === table);
          return !source || source.recordCount === 0;
        });

      setMappingStatus({
        totalEntities: entitiesCount || 0,
        mappedEntities: connectedSources,
        totalRelations: 0,
        unmappedFields,
        healthScore,
      });

    } catch (e) {
      console.error('Fallback data source loading failed:', e);
      setError(e as Error);
    }
  }, [selectedStore?.id, user?.id]);

  /**
   * 매핑 새로고침
   */
  const refreshMapping = useCallback(async () => {
    setLoading(true);
    try {
      await loadDataSourceStatus();
      toast.success('데이터 소스 상태가 새로고침되었습니다');
    } catch (e) {
      toast.error('새로고침 실패');
    } finally {
      setLoading(false);
    }
  }, [loadDataSourceStatus]);

  /**
   * API 연결
   */
  const connectApi = useCallback(async (config: ApiConfig): Promise<boolean> => {
    if (!selectedStore?.id) return false;

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'simulation-data-mapping',
        {
          body: {
            action: 'connect_api',
            store_id: selectedStore.id,
            api_config: config,
          },
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(data.message || 'API가 연결되었습니다');
        await loadDataSourceStatus(); // 상태 새로고침
        return true;
      }
      return false;
    } catch (e) {
      console.error('API connection failed:', e);
      toast.error('API 연결 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id, loadDataSourceStatus]);

  /**
   * API 연결 해제
   */
  const disconnectApi = useCallback(async (apiId: string): Promise<boolean> => {
    if (!selectedStore?.id) return false;

    setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'simulation-data-mapping',
        {
          body: {
            action: 'disconnect_api',
            store_id: selectedStore.id,
            api_id: apiId,
          },
        }
      );

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success(data.message || 'API 연결이 해제되었습니다');
        await loadDataSourceStatus();
        return true;
      }
      return false;
    } catch (e) {
      console.error('API disconnection failed:', e);
      toast.error('API 연결 해제 실패');
      return false;
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id, loadDataSourceStatus]);

  /**
   * 프리셋 API 설정 (관리자 전용)
   */
  const configurePresetApi = useCallback(async (apiId: string, enabled: boolean): Promise<boolean> => {
    if (!isAdmin) {
      toast.error('관리자만 프리셋 API를 설정할 수 있습니다');
      return false;
    }

    // TODO: 실제 프리셋 API 활성화/비활성화 로직
    toast.info(`프리셋 API ${enabled ? '활성화' : '비활성화'} 기능은 준비 중입니다`);
    return false;
  }, [isAdmin]);

  /**
   * 테이블명으로 데이터 소스 찾기
   */
  const getSourceByTable = useCallback((table: string): ImportedDataSource | undefined => {
    return importedData.find(s => s.table === table || s.id === table);
  }, [importedData]);

  // 초기 로드
  useEffect(() => {
    if (selectedStore?.id) {
      loadDataSourceStatus();
    }
  }, [selectedStore?.id, loadDataSourceStatus]);

  return {
    importedData,
    presetApis,
    customApis,
    mappingStatus,
    loading,
    error,
    refreshMapping,
    connectApi,
    disconnectApi,
    configurePresetApi,
    isAdmin,
    hasMinimumData,
    getSourceByTable,
  };
}

export default useDataSourceMapping;
