/**
 * React Query 캐시 초기화 Hook
 * 스토리지/데이터베이스 초기화 시 사용
 */

import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useClearCache() {
  const queryClient = useQueryClient();

  const clearAllCache = () => {
    // 모든 쿼리 캐시 초기화
    queryClient.clear();

    // 업로드 기록(localStorage)도 함께 초기화
    if (typeof window !== 'undefined' && window.localStorage) {
      Object.keys(window.localStorage).forEach((key) => {
        if (key.startsWith('upload-history-')) {
          window.localStorage.removeItem(key);
        }
      });
    }

    toast.success('캐시가 초기화되었습니다');
  };

  const clearStoreDataCache = (storeId?: string) => {
    if (storeId) {
      // 특정 매장의 데이터 캐시만 초기화
      queryClient.removeQueries({ queryKey: ['store-data', storeId] });
      queryClient.removeQueries({ queryKey: ['store-dataset', storeId] });
      queryClient.removeQueries({ queryKey: ['dashboard-kpis', storeId] });
      queryClient.removeQueries({ queryKey: ['ai-recommendations', storeId] });
      queryClient.removeQueries({ queryKey: ['ontology-data', storeId] });
    } else {
      // 모든 매장 데이터 캐시 초기화
      queryClient.removeQueries({ queryKey: ['store-data'] });
      queryClient.removeQueries({ queryKey: ['store-dataset'] });
      queryClient.removeQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.removeQueries({ queryKey: ['ai-recommendations'] });
      queryClient.removeQueries({ queryKey: ['ontology-data'] });
    }
    toast.success('데이터 캐시가 초기화되었습니다');
  };

  const invalidateStoreData = (storeId?: string) => {
    // 캐시를 무효화하고 다시 가져오기
    if (storeId) {
      queryClient.invalidateQueries({ queryKey: ['store-data', storeId] });
      queryClient.invalidateQueries({ queryKey: ['store-dataset', storeId] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis', storeId] });
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations', storeId] });
      queryClient.invalidateQueries({ queryKey: ['ontology-data', storeId] });
    } else {
      queryClient.invalidateQueries({ queryKey: ['store-data'] });
      queryClient.invalidateQueries({ queryKey: ['store-dataset'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-kpis'] });
      queryClient.invalidateQueries({ queryKey: ['ai-recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['ontology-data'] });
    }
  };

  return {
    clearAllCache,
    clearStoreDataCache,
    invalidateStoreData
  };
}
