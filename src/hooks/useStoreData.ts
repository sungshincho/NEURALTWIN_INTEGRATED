/**
 * 통합 Store 데이터 Hook (DB 테이블 기반)
 * 
 * 수정됨: Storage CSV 파일 대신 DB 테이블 직접 조회
 * 
 * 아키텍처:
 * - 고객 업로드 → Storage → ETL → DB 테이블
 * - 모든 기능 → DB 테이블 직접 조회
 */

import { useQuery, useQueries } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from './useSelectedStore';
import { useAuth } from './useAuth';
import type { DataFileType, LoadOptions, StoreDataset, CustomerData, ProductData, PurchaseData, VisitData, StaffData } from '@/lib/storage/types';

// 지원하는 테이블 타입
type SupportedTable = 'customers' | 'products' | 'purchases' | 'store_visits' | 'staff' | 'wifi_zones' | 'wifi_tracking';

// DB 테이블에서 데이터 로드하는 내부 함수
async function loadFromDB(
  tableName: SupportedTable,
  storeId: string,
  orgId: string,
  options?: { limit?: number }
): Promise<any[]> {
  let query = supabase
    .from(tableName)
    .select('*')
    .eq('store_id', storeId)
    .eq('org_id', orgId);

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.warn(`[useStoreData] ${tableName} query error:`, error);
    return [];
  }

  return data || [];
}

/**
 * 단일 데이터 파일 로드 Hook (DB 기반)
 */
export function useStoreDataFile<K extends DataFileType>(
  fileType: K,
  options: LoadOptions = {}
) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['store-data-db', fileType, selectedStore?.id, orgId],
    queryFn: async () => {
      if (!selectedStore || !orgId) {
        return { data: [], fromCache: false };
      }

      // 테이블 이름 매핑
      const tableNameMap: Record<string, SupportedTable | null> = {
        'customers': 'customers',
        'products': 'products',
        'purchases': 'purchases',
        'visits': 'store_visits',  // visits → store_visits 마이그레이션
        'staff': 'staff',
        'wifi_sensors': 'wifi_zones',
        'wifi_tracking': 'wifi_tracking',
      };

      const tableName = tableNameMap[fileType];
      if (!tableName) {
        console.warn(`[useStoreDataFile] Unsupported file type: ${fileType}`);
        return { data: [], fromCache: false };
      }

      const data = await loadFromDB(tableName, selectedStore.id, orgId, { limit: 500 });

      return { data, fromCache: false };
    },
    enabled: !!selectedStore && !!orgId,
    staleTime: 2 * 60 * 1000, // 2분 캐싱
    gcTime: 5 * 60 * 1000,
  });
}

/**
 * 전체 데이터셋 로드 Hook (DB 기반)
 */
export function useStoreDataset(options: LoadOptions = {}) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['store-dataset-db', selectedStore?.id, orgId],
    queryFn: async (): Promise<StoreDataset> => {
      if (!selectedStore?.id || !orgId) {
        return {
          customers: [],
          products: [],
          purchases: [],
          visits: [],
          staff: [],
        };
      }

      // 병렬로 모든 테이블 조회
      const [
        customersResult,
        productsResult,
        purchasesResult,
        visitsResult,
        staffResult,
      ] = await Promise.all([
        supabase
          .from('customers')
          .select('*')
          .eq('store_id', selectedStore.id)
          .eq('org_id', orgId),
        supabase
          .from('products')
          .select('*')
          .eq('store_id', selectedStore.id)
          .eq('org_id', orgId),
        supabase
          .from('purchases')
          .select(`
            *,
            product:products(product_name, category, price)
          `)
          .eq('store_id', selectedStore.id)
          .eq('org_id', orgId)
          .order('purchase_date', { ascending: false })
          .limit(100),
        supabase
          .from('store_visits')  // visits → store_visits 마이그레이션
          .select('*')
          .eq('store_id', selectedStore.id)
          .eq('org_id', orgId)
          .order('visit_date', { ascending: false })
          .limit(100),
        supabase
          .from('staff')
          .select('*')
          .eq('store_id', selectedStore.id)
          .eq('org_id', orgId)
          .limit(50),
      ]);

      // purchases에 product_name 추가
      const purchasesWithProduct = (purchasesResult.data || []).map((p: any) => ({
        ...p,
        product_name: p.product?.product_name || '상품',
        category: p.product?.category,
      }));

      // DB 스키마를 타입에 맞게 매핑
      const customers: CustomerData[] = (customersResult.data || []).map((c: any) => ({
        ...c,
        id: c.id,
      }));

      const products: ProductData[] = (productsResult.data || []).map((p: any) => ({
        ...p,
        id: p.id,
      }));

      const visits: VisitData[] = (visitsResult.data || []).map((v: any) => ({
        ...v,
        id: v.id,
      }));

      const staff: StaffData[] = (staffResult.data || []).map((s: any) => ({
        ...s,
        id: s.id,
      }));

      return {
        customers,
        products,
        purchases: purchasesWithProduct as PurchaseData[],
        visits,
        staff,
      };
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: 'always',
  });
}

/**
 * 여러 데이터 파일 동시 로드 Hook (DB 기반)
 */
export function useMultipleStoreDataFiles<K extends DataFileType>(
  fileTypes: K[],
  options: LoadOptions = {}
) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQueries({
    queries: fileTypes.map((fileType) => ({
      queryKey: ['store-data-db', fileType, selectedStore?.id, orgId],
      queryFn: async () => {
        if (!selectedStore || !orgId) {
          return { data: [], fromCache: false };
        }

        const tableNameMap: Record<string, SupportedTable | null> = {
          'customers': 'customers',
          'products': 'products',
          'purchases': 'purchases',
          'visits': 'store_visits',  // visits → store_visits 마이그레이션
          'staff': 'staff',
          'wifi_sensors': 'wifi_zones',
          'wifi_tracking': 'wifi_tracking',
        };

        const tableName = tableNameMap[fileType];
        if (!tableName) {
          return { data: [], fromCache: false };
        }

        const data = await loadFromDB(tableName, selectedStore.id, orgId, { limit: 500 });

        return { data, fromCache: false };
      },
      enabled: !!selectedStore && !!orgId,
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
    })),
  });
}

/**
 * 고객 데이터 Hook (DB 기반)
 */
export function useCustomers(options?: LoadOptions) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['customers-db', selectedStore?.id, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return { data: [] };

      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId);

      if (error) {
        console.warn('customers query error:', error);
        return { data: [] };
      }
      return { data: data || [] };
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 상품 데이터 Hook (DB 기반)
 */
export function useProducts(options?: LoadOptions) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['products-db', selectedStore?.id, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return { data: [] };

      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId);

      if (error) {
        console.warn('products query error:', error);
        return { data: [] };
      }
      return { data: data || [] };
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 구매 데이터 Hook (DB 기반)
 */
export function usePurchases(options?: LoadOptions) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['purchases-db', selectedStore?.id, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return { data: [] };

      const { data, error } = await supabase
        .from('purchases')
        .select(`
          *,
          product:products(product_name, category, price)
        `)
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .order('purchase_date', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('purchases query error:', error);
        return { data: [] };
      }

      // product_name 매핑
      const purchasesWithProduct = (data || []).map((p: any) => ({
        ...p,
        product_name: p.product?.product_name || '상품',
        category: p.product?.category,
      }));

      return { data: purchasesWithProduct };
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * 방문 데이터 Hook (DB 기반)
 * store_visits 테이블 사용 (visits에서 마이그레이션됨)
 */
export function useVisits(options?: LoadOptions) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['visits-db', selectedStore?.id, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return { data: [] };

      const { data, error } = await supabase
        .from('store_visits')  // visits → store_visits 마이그레이션
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .order('visit_date', { ascending: false })
        .limit(100);

      if (error) {
        console.warn('store_visits query error:', error);
        return { data: [] };
      }
      return { data: data || [] };
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * 직원 데이터 Hook (DB 기반)
 */
export function useStaff(options?: LoadOptions) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['staff-db', selectedStore?.id, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return { data: [] };

      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId);

      if (error) {
        console.warn('staff query error:', error);
        return { data: [] };
      }
      return { data: data || [] };
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * WiFi 센서 데이터 Hook (DB 기반)
 */
export function useWiFiSensors(options?: LoadOptions) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['wifi-sensors-db', selectedStore?.id, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return { data: [] };

      const { data, error } = await supabase
        .from('wifi_zones')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId);

      if (error) {
        console.warn('wifi_zones query error:', error);
        return { data: [] };
      }
      return { data: data || [] };
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * WiFi 트래킹 데이터 Hook (DB 기반)
 */
export function useWiFiTracking(options?: LoadOptions) {
  const { selectedStore } = useSelectedStore();
  const { orgId } = useAuth();

  return useQuery({
    queryKey: ['wifi-tracking-db', selectedStore?.id, orgId],
    queryFn: async () => {
      if (!selectedStore?.id || !orgId) return { data: [] };

      const { data, error } = await supabase
        .from('wifi_tracking')
        .select('*')
        .eq('store_id', selectedStore.id)
        .eq('org_id', orgId)
        .order('timestamp', { ascending: false })
        .limit(500);

      if (error) {
        console.warn('wifi_tracking query error:', error);
        return { data: [] };
      }
      return { data: data || [] };
    },
    enabled: !!selectedStore?.id && !!orgId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * 데이터 새로고침 유틸리티
 */
export function useRefreshStoreData() {
  const { selectedStore } = useSelectedStore();

  return {
    refreshAll: () => {
      // React Query의 invalidateQueries 사용 시 주석 해제
      // queryClient.invalidateQueries(['store-data-db', selectedStore?.id]);
      // queryClient.invalidateQueries(['store-dataset-db', selectedStore?.id]);
    },
    refreshFile: (fileType: DataFileType) => {
      // queryClient.invalidateQueries(['store-data-db', fileType, selectedStore?.id]);
    },
  };
}
