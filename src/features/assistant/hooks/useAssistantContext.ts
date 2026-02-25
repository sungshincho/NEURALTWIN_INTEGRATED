/**
 * 대시보드 상태 수집 훅
 * 현재 페이지, 탭, 날짜 필터 등 수집
 */

import { useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useDateFilterStore } from '@/store/dateFilterStore';
import { useSelectedStore } from '@/hooks/useSelectedStore';

export interface AssistantContext {
  page: {
    current: string;
    tab?: string;
  };
  dateRange: {
    preset: string;
    startDate: string;
    endDate: string;
  };
  store: {
    id: string;
    name: string;
  };
}

export function useAssistantContext(): AssistantContext {
  const location = useLocation();
  const { dateRange } = useDateFilterStore();
  const { selectedStore } = useSelectedStore();

  const context = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const tab = searchParams.get('tab');

    return {
      page: {
        current: location.pathname,
        tab: tab || undefined,
      },
      dateRange: {
        preset: dateRange.preset,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
      },
      store: {
        id: selectedStore?.id || '',
        name: selectedStore?.store_name || '',
      },
    };
  }, [location, dateRange, selectedStore]);

  return context;
}
