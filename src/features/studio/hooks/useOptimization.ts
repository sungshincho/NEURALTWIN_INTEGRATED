/**
 * useOptimization.ts
 *
 * AI 레이아웃 최적화 결과를 관리하는 훅
 *
 * Features:
 * - 최적화 결과 생성 요청
 * - 결과 적용/롤백
 * - 부분 적용 (선택한 변경사항만)
 * - 히스토리 관리
 *
 * B안 확장:
 * - 레이아웃 최적화 → 직원 위치 제안 (부가 결과)
 * - 인력배치 최적화 → 가구 미세 조정 (부가 결과)
 * - 전체/부분 적용 옵션
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type {
  AILayoutOptimizationResult,
  ProductAsset,
  Vector3D,
  StaffSuggestions,
  FurnitureAdjustments,
  StaffChange,
} from '@/types/scene3d';

// ============================================================================
// 타입 정의
// ============================================================================

export type OptimizationStatus = 'idle' | 'generating' | 'ready' | 'applying' | 'applied' | 'error';

export interface UseOptimizationOptions {
  storeId: string;
  userId?: string;
  onOptimizationGenerated?: (result: AILayoutOptimizationResult) => void;
  onOptimizationApplied?: (appliedChanges: string[]) => void;
  onError?: (error: Error) => void;
}

export interface OptimizationHistoryItem {
  id: string;
  created_at: string;
  optimization_type: 'furniture' | 'product' | 'both';
  status: 'pending' | 'applied' | 'rejected' | 'partial';
  summary: AILayoutOptimizationResult['summary'];
  applied_changes: string[];
}

export interface UseOptimizationReturn {
  // 상태
  status: OptimizationStatus;
  result: AILayoutOptimizationResult | null;
  error: Error | null;
  isLoading: boolean;

  // 액션
  generateOptimization: (params: GenerateOptimizationParams) => Promise<AILayoutOptimizationResult | null>;
  applyChange: (changeId: string, type: 'furniture' | 'product' | 'staff') => Promise<boolean>;
  applyAllChanges: () => Promise<boolean>;
  rejectChange: (changeId: string, type: 'furniture' | 'product' | 'staff') => void;
  rejectAllChanges: () => void;
  clearResult: () => void;

  // B안: 통합 적용 액션
  /** 선택적 적용 (가구만, 직원만, 전체 등) */
  applyChangesWithOption: (option: ApplyChangesOption) => Promise<boolean>;
  /** 직원 제안만 적용 */
  applyStaffSuggestions: () => Promise<boolean>;
  /** 가구 미세 조정만 적용 */
  applyFurnitureAdjustments: () => Promise<boolean>;

  // 히스토리
  history: OptimizationHistoryItem[];
  loadHistory: () => Promise<void>;

  // 유틸리티
  getAppliedProducts: () => ProductAsset[];
  getPendingChangesCount: () => number;

  // B안: 유틸리티 확장
  /** 직원 제안 수 반환 */
  getStaffSuggestionsCount: () => number;
  /** 가구 조정 수 반환 */
  getFurnitureAdjustmentsCount: () => number;
  /** 변경사항 유형별 카운트 */
  getChangesSummary: () => {
    furniture: number;
    product: number;
    staff: number;
    furnitureAdjustments: number;
  };
}

// B안: 적용 옵션 타입
export type ApplyChangesOption = 'furniture' | 'product' | 'staff' | 'all' | 'furniture_only' | 'staff_only';

export interface GenerateOptimizationParams {
  optimizationType: 'furniture' | 'product' | 'both' | 'staff';
  zoneIds?: string[];
  productIds?: string[];
  furnitureIds?: string[];
  prioritizeRevenue?: boolean;
  prioritizeVisibility?: boolean;
  prioritizeAccessibility?: boolean;
  maxChanges?: number;
  // B안: 통합 최적화 옵션
  /** 레이아웃 최적화 시 직원 위치도 함께 제안 */
  includeStaffOptimization?: boolean;
  /** 인력배치 최적화 시 가구 미세 조정 허용 */
  allowFurnitureAdjustment?: boolean;
  /** 가구 미세 조정 최대 거리 (cm) */
  maxAdjustmentDistance?: number;
  // Staffing 전용 파라미터
  staffingGoal?: 'customer_service' | 'sales' | 'efficiency';
  staffCount?: number;
}

// ============================================================================
// 메인 훅
// ============================================================================

export function useOptimization({
  storeId,
  userId,
  onOptimizationGenerated,
  onOptimizationApplied,
  onError,
}: UseOptimizationOptions): UseOptimizationReturn {
  const [status, setStatus] = useState<OptimizationStatus>('idle');
  const [result, setResult] = useState<AILayoutOptimizationResult | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [history, setHistory] = useState<OptimizationHistoryItem[]>([]);
  const [appliedChangeIds, setAppliedChangeIds] = useState<Set<string>>(new Set());
  const [rejectedChangeIds, setRejectedChangeIds] = useState<Set<string>>(new Set());

  // 최적화 생성 (B안: 통합 파라미터 포함)
  const generateOptimization = useCallback(async (params: GenerateOptimizationParams) => {
    try {
      setStatus('generating');
      setError(null);

      const { data, error: fnError } = await supabase.functions.invoke('generate-optimization', {
        body: {
          store_id: storeId,
          optimization_type: params.optimizationType,
          parameters: {
            zone_ids: params.zoneIds,
            product_ids: params.productIds,
            furniture_ids: params.furnitureIds,
            prioritize_revenue: params.prioritizeRevenue,
            prioritize_visibility: params.prioritizeVisibility,
            prioritize_accessibility: params.prioritizeAccessibility,
            max_changes: params.maxChanges,
            // B안: 통합 최적화 파라미터
            include_staff_optimization: params.includeStaffOptimization,
            allow_furniture_adjustment: params.allowFurnitureAdjustment,
            max_adjustment_distance: params.maxAdjustmentDistance,
            // Staffing 전용 파라미터
            staffing_goal: params.staffingGoal,
            staff_count: params.staffCount,
          },
        },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Optimization failed');
      }

      const optimizationResult = data.result as AILayoutOptimizationResult;
      setResult(optimizationResult);
      setStatus('ready');
      setAppliedChangeIds(new Set());
      setRejectedChangeIds(new Set());

      onOptimizationGenerated?.(optimizationResult);
      return optimizationResult;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setStatus('error');
      onError?.(error);
      return null;
    }
  }, [storeId, onOptimizationGenerated, onError]);

  // 단일 변경사항 적용
  const applyChange = useCallback(async (changeId: string, type: 'furniture' | 'product') => {
    if (!result) return false;

    try {
      setStatus('applying');

      // 변경사항 찾기
      const change = type === 'furniture'
        ? result.furniture_changes.find(c => c.furniture_id === changeId)
        : result.product_changes.find(c => c.product_id === changeId);

      if (!change) {
        throw new Error('Change not found');
      }

      // 상품 위치 업데이트 (product_placements 테이블)
      if (type === 'product') {
        const productChange = change as AILayoutOptimizationResult['product_changes'][0];

        const { error: updateError } = await supabase
          .from('product_placements')
          .upsert({
            product_id: productChange.product_id,
            store_id: storeId,
            user_id: userId,
            slot_id: productChange.suggested.slot_id,
            display_type: 'shelf',
            position_offset: productChange.suggested.position ? JSON.parse(JSON.stringify(productChange.suggested.position)) : null,
            updated_at: new Date().toISOString(),
          } as any, {
            onConflict: 'product_id,store_id',
          });

        if (updateError) {
          console.warn('Failed to save placement:', updateError);
        }
      }

      // 적용된 변경사항 추적
      setAppliedChangeIds(prev => new Set([...prev, changeId]));
      setRejectedChangeIds(prev => {
        const next = new Set(prev);
        next.delete(changeId);
        return next;
      });

      setStatus('ready');
      onOptimizationApplied?.([changeId]);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to apply change');
      setError(error);
      setStatus('error');
      onError?.(error);
      return false;
    }
  }, [result, storeId, userId, onOptimizationApplied, onError]);

  // 모든 변경사항 적용
  const applyAllChanges = useCallback(async () => {
    if (!result) return false;

    try {
      setStatus('applying');

      const allChangeIds: string[] = [];

      // 가구 변경사항 적용
      for (const change of result.furniture_changes) {
        if (!rejectedChangeIds.has(change.furniture_id)) {
          allChangeIds.push(change.furniture_id);
        }
      }

      // 상품 변경사항 적용
      const productPlacements = result.product_changes
        .filter(c => !rejectedChangeIds.has(c.product_id))
        .map(c => ({
          product_id: c.product_id,
          store_id: storeId,
          user_id: userId,
          slot_id: c.suggested.slot_id,
          display_type: 'shelf',
          position_offset: c.suggested.position ? JSON.parse(JSON.stringify(c.suggested.position)) : null,
          updated_at: new Date().toISOString(),
        }));

      if (productPlacements.length > 0) {
        const { error: upsertError } = await supabase
          .from('product_placements')
          .upsert(productPlacements as any, {
            onConflict: 'product_id,store_id',
          });

        if (upsertError) {
          console.warn('Failed to save placements:', upsertError);
        }

        productPlacements.forEach(p => allChangeIds.push(p.product_id));
      }

      // 최적화 결과 상태 업데이트
      await supabase
        .from('layout_optimization_results')
        .update({
          status: 'applied',
          applied_at: new Date().toISOString(),
          applied_changes: allChangeIds,
        })
        .eq('id', result.optimization_id);

      setAppliedChangeIds(new Set(allChangeIds));
      setStatus('applied');
      onOptimizationApplied?.(allChangeIds);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to apply all changes');
      setError(error);
      setStatus('error');
      onError?.(error);
      return false;
    }
  }, [result, storeId, userId, rejectedChangeIds, onOptimizationApplied, onError]);

  // 단일 변경사항 거부
  const rejectChange = useCallback((changeId: string, _type: 'furniture' | 'product') => {
    setRejectedChangeIds(prev => new Set([...prev, changeId]));
    setAppliedChangeIds(prev => {
      const next = new Set(prev);
      next.delete(changeId);
      return next;
    });
  }, []);

  // 모든 변경사항 거부
  const rejectAllChanges = useCallback(() => {
    if (!result) return;

    const allIds = [
      ...result.furniture_changes.map(c => c.furniture_id),
      ...result.product_changes.map(c => c.product_id),
    ];

    setRejectedChangeIds(new Set(allIds));
    setAppliedChangeIds(new Set());

    // 최적화 결과 상태 업데이트
    supabase
      .from('layout_optimization_results')
      .update({ status: 'rejected' })
      .eq('id', result.optimization_id);
  }, [result]);

  // 결과 초기화
  const clearResult = useCallback(() => {
    setResult(null);
    setStatus('idle');
    setError(null);
    setAppliedChangeIds(new Set());
    setRejectedChangeIds(new Set());
  }, []);

  // ============================================================================
  // B안: 통합 적용 함수
  // ============================================================================

  // B안: 선택적 적용 (가구만, 직원만, 전체 등)
  const applyChangesWithOption = useCallback(async (option: ApplyChangesOption): Promise<boolean> => {
    if (!result) return false;

    try {
      setStatus('applying');
      const appliedIds: string[] = [];

      // 가구 변경 적용
      if (option === 'all' || option === 'furniture' || option === 'furniture_only') {
        for (const change of result.furniture_changes) {
          if (!rejectedChangeIds.has(change.furniture_id)) {
            appliedIds.push(change.furniture_id);
          }
        }
      }

      // 상품 변경 적용
      if (option === 'all' || option === 'product') {
        const productPlacements = result.product_changes
          .filter(c => !rejectedChangeIds.has(c.product_id))
          .map(c => ({
            product_id: c.product_id,
            store_id: storeId,
            user_id: userId,
            slot_id: c.suggested.slot_id,
            display_type: 'shelf',
            position_offset: c.suggested.position ? JSON.parse(JSON.stringify(c.suggested.position)) : null,
            updated_at: new Date().toISOString(),
          }));

        if (productPlacements.length > 0) {
          await supabase
            .from('product_placements')
            .upsert(productPlacements as any, { onConflict: 'product_id,store_id' });

          productPlacements.forEach(p => appliedIds.push(p.product_id));
        }
      }

      // 직원 제안 적용 (B안)
      if ((option === 'all' || option === 'staff' || option === 'staff_only') && result.staff_suggestions) {
        for (const suggestion of result.staff_suggestions.items) {
          if (!rejectedChangeIds.has(suggestion.staff_id)) {
            appliedIds.push(`staff_${suggestion.staff_id}`);
            // 직원 위치는 씬 저장 시 반영되므로 여기서는 ID만 추적
          }
        }
      }

      // 직원 변경 적용 (staff 타입 최적화)
      if ((option === 'all' || option === 'staff' || option === 'staff_only') && result.staff_changes) {
        for (const change of result.staff_changes) {
          if (!rejectedChangeIds.has(change.staff_id)) {
            appliedIds.push(`staff_${change.staff_id}`);
          }
        }
      }

      // 가구 미세 조정 적용 (B안)
      if (option === 'all' && result.furniture_adjustments) {
        for (const adjustment of result.furniture_adjustments.items) {
          if (!rejectedChangeIds.has(`adj_${adjustment.furniture_id}`)) {
            appliedIds.push(`adj_${adjustment.furniture_id}`);
          }
        }
      }

      // DB 상태 업데이트
      await supabase
        .from('layout_optimization_results')
        .update({
          status: appliedIds.length > 0 ? 'applied' : 'rejected',
          applied_at: new Date().toISOString(),
          applied_changes: appliedIds,
        })
        .eq('id', result.optimization_id);

      setAppliedChangeIds(new Set(appliedIds));
      setStatus('applied');
      onOptimizationApplied?.(appliedIds);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to apply changes');
      setError(error);
      setStatus('error');
      onError?.(error);
      return false;
    }
  }, [result, storeId, userId, rejectedChangeIds, onOptimizationApplied, onError]);

  // B안: 직원 제안만 적용
  const applyStaffSuggestions = useCallback(async (): Promise<boolean> => {
    return applyChangesWithOption('staff_only');
  }, [applyChangesWithOption]);

  // B안: 가구 미세 조정만 적용
  const applyFurnitureAdjustments = useCallback(async (): Promise<boolean> => {
    if (!result?.furniture_adjustments) return false;

    try {
      setStatus('applying');
      const appliedIds: string[] = [];

      for (const adjustment of result.furniture_adjustments.items) {
        if (!rejectedChangeIds.has(`adj_${adjustment.furniture_id}`)) {
          appliedIds.push(`adj_${adjustment.furniture_id}`);
        }
      }

      setAppliedChangeIds(prev => new Set([...prev, ...appliedIds]));
      setStatus('ready');
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to apply furniture adjustments');
      setError(error);
      setStatus('error');
      onError?.(error);
      return false;
    }
  }, [result, rejectedChangeIds, onError]);

  // 히스토리 로드
  const loadHistory = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('layout_optimization_results')
        .select('*')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) {
        throw error;
      }

      setHistory((data || []).map((item: any) => ({
        id: item.id,
        created_at: item.created_at,
        optimization_type: item.optimization_type,
        status: item.status,
        summary: item.summary,
        applied_changes: item.applied_changes || [],
      })));
    } catch (err) {
      console.error('Failed to load optimization history:', err);
    }
  }, [storeId]);

  // 적용된 상품 위치 반환
  const getAppliedProducts = useCallback((): ProductAsset[] => {
    if (!result) return [];

    return result.product_changes
      .filter(c => appliedChangeIds.has(c.product_id))
      .map(c => ({
        id: c.product_id,
        type: 'product' as const,
        model_url: '',
        sku: c.sku,
        product_name: c.sku,
        category: '',
        zone_id: c.suggested.zone_id,
        furniture_id: c.suggested.furniture_id,
        slot_id: c.suggested.slot_id,
        position: c.suggested.position,
        rotation: { x: 0, y: 0, z: 0 },
        scale: { x: 1, y: 1, z: 1 },
        display_type: 'standing' as any,
        stock_quantity: 0,
        price: 0,
        movable: true,
      }));
  }, [result, appliedChangeIds]);

  // 대기 중인 변경사항 수
  const getPendingChangesCount = useCallback(() => {
    if (!result) return 0;

    const totalChanges = result.furniture_changes.length + result.product_changes.length;
    return totalChanges - appliedChangeIds.size - rejectedChangeIds.size;
  }, [result, appliedChangeIds, rejectedChangeIds]);

  // ============================================================================
  // B안: 유틸리티 함수
  // ============================================================================

  // B안: 직원 제안 수 반환
  const getStaffSuggestionsCount = useCallback(() => {
    if (!result) return 0;
    return result.staff_suggestions?.items?.length || 0;
  }, [result]);

  // B안: 가구 조정 수 반환
  const getFurnitureAdjustmentsCount = useCallback(() => {
    if (!result) return 0;
    return result.furniture_adjustments?.items?.length || 0;
  }, [result]);

  // B안: 변경사항 유형별 카운트
  const getChangesSummary = useCallback(() => {
    if (!result) {
      return { furniture: 0, product: 0, staff: 0, furnitureAdjustments: 0 };
    }

    return {
      furniture: result.furniture_changes.length,
      product: result.product_changes.length,
      staff: (result.staff_suggestions?.items?.length || 0) + (result.staff_changes?.length || 0),
      furnitureAdjustments: result.furniture_adjustments?.items?.length || 0,
    };
  }, [result]);

  return {
    status,
    result,
    error,
    isLoading: status === 'generating' || status === 'applying',

    generateOptimization,
    applyChange,
    applyAllChanges,
    rejectChange,
    rejectAllChanges,
    clearResult,

    // B안: 통합 적용 액션
    applyChangesWithOption,
    applyStaffSuggestions,
    applyFurnitureAdjustments,

    history,
    loadHistory,

    getAppliedProducts,
    getPendingChangesCount,

    // B안: 유틸리티 확장
    getStaffSuggestionsCount,
    getFurnitureAdjustmentsCount,
    getChangesSummary,
  };
}

export default useOptimization;
