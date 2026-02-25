import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSelectedStore } from '@/hooks/useSelectedStore';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

export type SimulationType = 'demand' | 'inventory' | 'pricing' | 'layout' | 'marketing';

/**
 * 시뮬레이션 히스토리 항목
 */
export interface SimulationHistoryItem {
  id: string;
  storeId: string;
  storeName: string;
  simulationType: SimulationType;
  parameters: Record<string, any>;
  result: any;
  confidenceScore: number;
  ontologyEnhanced: boolean;
  createdAt: string;
  note?: string;
  tags?: string[];
}

/**
 * 히스토리 비교 결과
 */
export interface ComparisonResult {
  items: SimulationHistoryItem[];
  metrics: {
    metric: string;
    values: Array<{ itemId: string; value: number | string }>;
    change?: number;
    changePercent?: number;
  }[];
  insights: string[];
}

interface UseSimulationHistoryReturn {
  // 상태
  history: SimulationHistoryItem[];
  loading: boolean;
  error: Error | null;
  
  // 액션
  saveToHistory: (
    type: SimulationType,
    parameters: Record<string, any>,
    result: any,
    note?: string,
    tags?: string[]
  ) => Promise<string | null>;
  
  loadHistory: (type?: SimulationType, limit?: number) => Promise<SimulationHistoryItem[]>;
  deleteFromHistory: (id: string) => Promise<boolean>;
  updateNote: (id: string, note: string) => Promise<boolean>;
  addTags: (id: string, tags: string[]) => Promise<boolean>;
  
  // 비교
  compareResults: (ids: string[]) => Promise<ComparisonResult | null>;
  
  // 유틸리티
  getLatestByType: (type: SimulationType) => SimulationHistoryItem | undefined;
  filterByDateRange: (startDate: Date, endDate: Date) => SimulationHistoryItem[];
}

/**
 * useSimulationHistory Hook
 * 
 * 시뮬레이션 결과 저장, 로드, 비교 기능
 */
export function useSimulationHistory(): UseSimulationHistoryReturn {
  const { selectedStore } = useSelectedStore();
  const { user } = useAuth();
  
  const [history, setHistory] = useState<SimulationHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  /**
   * 시뮬레이션 결과 저장
   */
  const saveToHistory = useCallback(async (
    type: SimulationType,
    parameters: Record<string, any>,
    result: any,
    note?: string,
    tags?: string[]
  ): Promise<string | null> => {
    if (!selectedStore?.id || !user?.id) {
      toast.error('매장을 선택해주세요');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const historyItem = {
        user_id: user.id,
        store_id: selectedStore.id,
        simulation_type: type,
        parameters,
        result,
        confidence_score: result.confidenceScore || 0,
        ontology_enhanced: result.ontologyEnhanced || false,
        note,
        tags,
      };

      const { data, error: insertError } = await (supabase as any)
        .from('simulation_history')
        .insert(historyItem)
        .select('id')
        .single();

      if (insertError) throw insertError;

      toast.success('시뮬레이션 결과가 저장되었습니다');
      
      // 히스토리 새로고침
      await loadHistory();
      
      return data?.id || null;
    } catch (e) {
      const err = e as Error;
      setError(err);
      console.error('Failed to save simulation history:', e);
      
      // 테이블이 없는 경우 로컬 스토리지에 저장
      if (err.message?.includes('does not exist')) {
        return saveToLocalStorage(type, parameters, result, note, tags);
      }
      
      toast.error('저장 실패');
      return null;
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id, user?.id]);

  /**
   * 로컬 스토리지에 저장 (폴백)
   */
  const saveToLocalStorage = (
    type: SimulationType,
    parameters: Record<string, any>,
    result: any,
    note?: string,
    tags?: string[]
  ): string => {
    const id = `local_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const item: SimulationHistoryItem = {
      id,
      storeId: selectedStore?.id || '',
      storeName: selectedStore?.store_name || '',
      simulationType: type,
      parameters,
      result,
      confidenceScore: result.confidenceScore || 0,
      ontologyEnhanced: result.ontologyEnhanced || false,
      createdAt: new Date().toISOString(),
      note,
      tags,
    };

    const existingHistory = JSON.parse(
      localStorage.getItem('simulation_history') || '[]'
    );
    existingHistory.unshift(item);
    
    // 최대 50개 유지
    const trimmedHistory = existingHistory.slice(0, 50);
    localStorage.setItem('simulation_history', JSON.stringify(trimmedHistory));
    
    setHistory(trimmedHistory);
    toast.success('시뮬레이션 결과가 로컬에 저장되었습니다');
    
    return id;
  };

  /**
   * 히스토리 로드
   */
  const loadHistory = useCallback(async (
    type?: SimulationType,
    limit: number = 50
  ): Promise<SimulationHistoryItem[]> => {
    if (!selectedStore?.id || !user?.id) {
      return loadFromLocalStorage(type, limit);
    }

    setLoading(true);
    setError(null);

    try {
      let query = (supabase as any)
        .from('simulation_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('store_id', selectedStore.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (type) {
        query = query.eq('simulation_type', type);
      }

      const { data, error: fetchError } = await query;

      if (fetchError) throw fetchError;

      const items: SimulationHistoryItem[] = (data || []).map((item: any) => ({
        id: item.id,
        storeId: item.store_id,
        storeName: selectedStore?.store_name || '',
        simulationType: item.simulation_type,
        parameters: item.parameters,
        result: item.result,
        confidenceScore: item.confidence_score,
        ontologyEnhanced: item.ontology_enhanced,
        createdAt: item.created_at,
        note: item.note,
        tags: item.tags,
      }));

      setHistory(items);
      return items;
    } catch (e) {
      console.error('Failed to load simulation history:', e);
      return loadFromLocalStorage(type, limit);
    } finally {
      setLoading(false);
    }
  }, [selectedStore?.id, user?.id]);

  /**
   * 로컬 스토리지에서 로드 (폴백)
   */
  const loadFromLocalStorage = (
    type?: SimulationType,
    limit: number = 50
  ): SimulationHistoryItem[] => {
    try {
      let items: SimulationHistoryItem[] = JSON.parse(
        localStorage.getItem('simulation_history') || '[]'
      );

      if (type) {
        items = items.filter(item => item.simulationType === type);
      }

      if (selectedStore?.id) {
        items = items.filter(item => item.storeId === selectedStore.id);
      }

      const limitedItems = items.slice(0, limit);
      setHistory(limitedItems);
      return limitedItems;
    } catch (e) {
      console.error('Failed to load from localStorage:', e);
      return [];
    }
  };

  /**
   * 히스토리 삭제
   */
  const deleteFromHistory = useCallback(async (id: string): Promise<boolean> => {
    if (id.startsWith('local_')) {
      // 로컬 스토리지에서 삭제
      const items = JSON.parse(localStorage.getItem('simulation_history') || '[]');
      const filtered = items.filter((item: any) => item.id !== id);
      localStorage.setItem('simulation_history', JSON.stringify(filtered));
      setHistory(filtered);
      toast.success('삭제되었습니다');
      return true;
    }

    try {
      const { error: deleteError } = await (supabase as any)
        .from('simulation_history')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setHistory(prev => prev.filter(item => item.id !== id));
      toast.success('삭제되었습니다');
      return true;
    } catch (e) {
      console.error('Failed to delete history:', e);
      toast.error('삭제 실패');
      return false;
    }
  }, []);

  /**
   * 노트 업데이트
   */
  const updateNote = useCallback(async (id: string, note: string): Promise<boolean> => {
    if (id.startsWith('local_')) {
      const items = JSON.parse(localStorage.getItem('simulation_history') || '[]');
      const updated = items.map((item: any) => 
        item.id === id ? { ...item, note } : item
      );
      localStorage.setItem('simulation_history', JSON.stringify(updated));
      setHistory(updated);
      return true;
    }

    try {
      const { error: updateError } = await (supabase as any)
        .from('simulation_history')
        .update({ note })
        .eq('id', id);

      if (updateError) throw updateError;

      setHistory(prev => prev.map(item => 
        item.id === id ? { ...item, note } : item
      ));
      return true;
    } catch (e) {
      console.error('Failed to update note:', e);
      return false;
    }
  }, []);

  /**
   * 태그 추가
   */
  const addTags = useCallback(async (id: string, tags: string[]): Promise<boolean> => {
    if (id.startsWith('local_')) {
      const items = JSON.parse(localStorage.getItem('simulation_history') || '[]');
      const updated = items.map((item: any) => 
        item.id === id ? { ...item, tags: [...(item.tags || []), ...tags] } : item
      );
      localStorage.setItem('simulation_history', JSON.stringify(updated));
      setHistory(updated);
      return true;
    }

    try {
      const existingItem = history.find(h => h.id === id);
      const newTags = [...(existingItem?.tags || []), ...tags];

      const { error: updateError } = await (supabase as any)
        .from('simulation_history')
        .update({ tags: newTags })
        .eq('id', id);

      if (updateError) throw updateError;

      setHistory(prev => prev.map(item => 
        item.id === id ? { ...item, tags: newTags } : item
      ));
      return true;
    } catch (e) {
      console.error('Failed to add tags:', e);
      return false;
    }
  }, [history]);

  /**
   * 결과 비교
   */
  const compareResults = useCallback(async (ids: string[]): Promise<ComparisonResult | null> => {
    if (ids.length < 2) {
      toast.error('비교하려면 최소 2개의 결과를 선택하세요');
      return null;
    }

    const items = history.filter(h => ids.includes(h.id));
    if (items.length < 2) {
      toast.error('선택한 결과를 찾을 수 없습니다');
      return null;
    }

    // 동일한 타입인지 확인
    const types = new Set(items.map(i => i.simulationType));
    if (types.size > 1) {
      toast.warning('다른 유형의 시뮬레이션 결과입니다. 일부 비교가 제한될 수 있습니다.');
    }

    const type = items[0].simulationType;
    const metrics = extractComparisonMetrics(type, items);
    const insights = generateComparisonInsights(items, metrics);

    return {
      items,
      metrics,
      insights,
    };
  }, [history]);

  /**
   * 타입별 최신 결과 가져오기
   */
  const getLatestByType = useCallback((type: SimulationType): SimulationHistoryItem | undefined => {
    return history.find(h => h.simulationType === type);
  }, [history]);

  /**
   * 날짜 범위로 필터링
   */
  const filterByDateRange = useCallback((startDate: Date, endDate: Date): SimulationHistoryItem[] => {
    return history.filter(h => {
      const createdAt = new Date(h.createdAt);
      return createdAt >= startDate && createdAt <= endDate;
    });
  }, [history]);

  // 초기 로드
  useEffect(() => {
    if (selectedStore?.id) {
      loadHistory();
    }
  }, [selectedStore?.id, loadHistory]);

  return {
    history,
    loading,
    error,
    saveToHistory,
    loadHistory,
    deleteFromHistory,
    updateNote,
    addTags,
    compareResults,
    getLatestByType,
    filterByDateRange,
  };
}

/**
 * 비교 메트릭 추출
 */
function extractComparisonMetrics(
  type: SimulationType,
  items: SimulationHistoryItem[]
): ComparisonResult['metrics'] {
  const metrics: ComparisonResult['metrics'] = [];

  // 공통 메트릭
  metrics.push({
    metric: '신뢰도',
    values: items.map(item => ({
      itemId: item.id,
      value: `${item.confidenceScore}%`,
    })),
  });

  // 타입별 메트릭
  switch (type) {
    case 'demand':
      if (items[0].result.demandForecast?.summary) {
        metrics.push({
          metric: '평균 일일 수요',
          values: items.map(item => ({
            itemId: item.id,
            value: item.result.demandForecast?.summary?.avgDailyDemand || 0,
          })),
        });
        metrics.push({
          metric: '피크 수요',
          values: items.map(item => ({
            itemId: item.id,
            value: item.result.demandForecast?.summary?.peakDemand || 0,
          })),
        });
      }
      break;

    case 'inventory':
      if (items[0].result.summary) {
        metrics.push({
          metric: '예상 절감액',
          values: items.map(item => ({
            itemId: item.id,
            value: item.result.summary?.potentialSavings || 0,
          })),
        });
      }
      break;

    case 'pricing':
      if (items[0].result.summary) {
        metrics.push({
          metric: '예상 매출 증가',
          values: items.map(item => ({
            itemId: item.id,
            value: item.result.summary?.projectedRevenueIncrease || 0,
          })),
        });
      }
      break;

    case 'marketing':
      if (items[0].result.summary) {
        metrics.push({
          metric: '예상 매출 증가',
          values: items.map(item => ({
            itemId: item.id,
            value: item.result.summary?.projectedRevenueIncrease || 0,
          })),
        });
      }
      break;

    case 'layout':
      if (items[0].result.predictedKpi) {
        metrics.push({
          metric: '예상 전환율',
          values: items.map(item => ({
            itemId: item.id,
            value: `${((item.result.predictedKpi?.conversionRate || 0) * 100).toFixed(1)}%`,
          })),
        });
      }
      break;
  }

  // 변화율 계산 (첫 번째와 마지막 비교)
  metrics.forEach(metric => {
    if (metric.values.length >= 2) {
      const first = metric.values[0].value;
      const last = metric.values[metric.values.length - 1].value;
      
      if (typeof first === 'number' && typeof last === 'number' && first !== 0) {
        metric.change = last - first;
        metric.changePercent = ((last - first) / first) * 100;
      }
    }
  });

  return metrics;
}

/**
 * 비교 인사이트 생성
 */
function generateComparisonInsights(
  items: SimulationHistoryItem[],
  metrics: ComparisonResult['metrics']
): string[] {
  const insights: string[] = [];

  // 신뢰도 비교
  const confidences = items.map(i => i.confidenceScore);
  const maxConfidence = Math.max(...confidences);
  const maxConfidenceItem = items.find(i => i.confidenceScore === maxConfidence);
  if (maxConfidenceItem) {
    insights.push(
      `가장 높은 신뢰도: ${new Date(maxConfidenceItem.createdAt).toLocaleDateString('ko-KR')} 결과 (${maxConfidence}%)`
    );
  }

  // 온톨로지 강화 비교
  const ontologyEnhanced = items.filter(i => i.ontologyEnhanced);
  if (ontologyEnhanced.length > 0 && ontologyEnhanced.length < items.length) {
    insights.push(
      `${ontologyEnhanced.length}개 결과가 온톨로지 강화 분석을 사용했습니다.`
    );
  }

  // 메트릭 변화
  metrics.forEach(metric => {
    if (metric.changePercent !== undefined && Math.abs(metric.changePercent) > 5) {
      const direction = metric.changePercent > 0 ? '증가' : '감소';
      insights.push(
        `${metric.metric}: ${Math.abs(metric.changePercent).toFixed(1)}% ${direction}`
      );
    }
  });

  return insights;
}

export default useSimulationHistory;
