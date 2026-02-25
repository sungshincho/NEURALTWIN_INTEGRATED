/**
 * useFurnitureSlots.ts
 *
 * 가구 슬롯 데이터 로드 및 관리 훅
 * - furniture_slots 테이블에서 슬롯 로드
 * - 슬롯 점유 상태 업데이트
 * - 호환 가능한 슬롯 필터링
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/components/ui/use-toast';
import type {
  FurnitureSlot,
  ProductDisplayType,
  Vector3D,
} from '@/types/scene3d';

// ============================================================================
// 타입 정의
// ============================================================================

export interface UseFurnitureSlotsOptions {
  storeId: string;
  autoLoad?: boolean;
}

export interface UseFurnitureSlotsReturn {
  // 상태
  slots: FurnitureSlot[];
  isLoading: boolean;
  error: Error | null;

  // 데이터 로드
  loadSlots: () => Promise<void>;
  refetch: () => void;

  // 슬롯 필터링
  getSlotsByFurniture: (furnitureId: string) => FurnitureSlot[];
  getEmptySlots: () => FurnitureSlot[];
  getCompatibleSlots: (displayType: ProductDisplayType) => FurnitureSlot[];
  findBestSlot: (
    displayType: ProductDisplayType,
    productDimensions: { width: number; height: number; depth: number }
  ) => FurnitureSlot | null;

  // 슬롯 상태 업데이트
  occupySlot: (slotId: string, productId: string) => Promise<void>;
  releaseSlot: (slotId: string) => Promise<void>;
  batchUpdateOccupancy: (updates: Array<{ slotId: string; productId: string | null }>) => Promise<void>;
}

// ============================================================================
// 훅 구현
// ============================================================================

export function useFurnitureSlots({
  storeId,
  autoLoad = true,
}: UseFurnitureSlotsOptions): UseFurnitureSlotsReturn {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [error, setError] = useState<Error | null>(null);

  // 슬롯 데이터 쿼리
  const {
    data: slots = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['furniture-slots', storeId],
    queryFn: async (): Promise<FurnitureSlot[]> => {
      const { data, error } = await supabase
        .from('furniture_slots')
        .select('*')
        .eq('store_id', storeId);

      if (error) throw error;

      return (data || []).map((s) => {
        const slot = s as any;
        return {
          id: slot.id,
          furniture_id: slot.furniture_id,
          furniture_type: slot.furniture_type,
          slot_id: slot.slot_id,
          slot_type: slot.slot_type as any,
          slot_position: (slot.slot_position as unknown as Vector3D) || { x: 0, y: 0, z: 0 },
          slot_rotation: (slot.slot_rotation as unknown as Vector3D) || { x: 0, y: 0, z: 0 },
          compatible_display_types: (slot.compatible_display_types as ProductDisplayType[]) || ['standing'],
          max_product_width: slot.max_product_width || undefined,
          max_product_height: slot.max_product_height || undefined,
          max_product_depth: slot.max_product_depth || undefined,
          is_occupied: slot.is_occupied || false,
          occupied_by_product_id: slot.occupied_by_product_id || undefined,
        };
      });
    },
    enabled: autoLoad && !!storeId,
    staleTime: 30000, // 30초
  });

  // 수동 로드
  const loadSlots = useCallback(async () => {
    try {
      await refetch();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load slots'));
    }
  }, [refetch]);

  // 가구별 슬롯 필터링
  const getSlotsByFurniture = useCallback(
    (furnitureId: string) => {
      return slots.filter((s) => s.furniture_id === furnitureId);
    },
    [slots]
  );

  // 빈 슬롯만 가져오기
  const getEmptySlots = useCallback(() => {
    return slots.filter((s) => !s.is_occupied);
  }, [slots]);

  // 호환 가능한 슬롯 필터링
  const getCompatibleSlots = useCallback(
    (displayType: ProductDisplayType) => {
      return slots.filter((s) => {
        if (!s.compatible_display_types || s.compatible_display_types.length === 0) {
          return true;
        }
        return s.compatible_display_types.includes(displayType);
      });
    },
    [slots]
  );

  // 최적의 슬롯 찾기
  const findBestSlot = useCallback(
    (
      displayType: ProductDisplayType,
      productDimensions: { width: number; height: number; depth: number }
    ): FurnitureSlot | null => {
      const candidates = slots.filter((s) => {
        // 점유 체크
        if (s.is_occupied) return false;

        // display_type 호환성 체크
        if (s.compatible_display_types && s.compatible_display_types.length > 0) {
          if (!s.compatible_display_types.includes(displayType)) return false;
        }

        // 크기 체크
        if (s.max_product_width && productDimensions.width > s.max_product_width) return false;
        if (s.max_product_height && productDimensions.height > s.max_product_height) return false;
        if (s.max_product_depth && productDimensions.depth > s.max_product_depth) return false;

        return true;
      });

      // 첫 번째 호환 슬롯 반환
      return candidates[0] || null;
    },
    [slots]
  );

  // 슬롯 점유 업데이트 뮤테이션
  const occupySlotMutation = useMutation({
    mutationFn: async ({ slotId, productId }: { slotId: string; productId: string }) => {
      const { error } = await supabase
        .from('furniture_slots')
        .update({
          is_occupied: true,
          occupied_by_product_id: productId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', slotId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['furniture-slots', storeId] });
    },
    onError: (err) => {
      toast({
        title: '슬롯 점유 실패',
        description: err instanceof Error ? err.message : '오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 슬롯 해제 뮤테이션
  const releaseSlotMutation = useMutation({
    mutationFn: async (slotId: string) => {
      const { error } = await supabase
        .from('furniture_slots')
        .update({
          is_occupied: false,
          occupied_by_product_id: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', slotId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['furniture-slots', storeId] });
    },
    onError: (err) => {
      toast({
        title: '슬롯 해제 실패',
        description: err instanceof Error ? err.message : '오류가 발생했습니다.',
        variant: 'destructive',
      });
    },
  });

  // 슬롯 점유
  const occupySlot = useCallback(
    async (slotId: string, productId: string) => {
      await occupySlotMutation.mutateAsync({ slotId, productId });
    },
    [occupySlotMutation]
  );

  // 슬롯 해제
  const releaseSlot = useCallback(
    async (slotId: string) => {
      await releaseSlotMutation.mutateAsync(slotId);
    },
    [releaseSlotMutation]
  );

  // 배치 점유 업데이트
  const batchUpdateOccupancy = useCallback(
    async (updates: Array<{ slotId: string; productId: string | null }>) => {
      const promises = updates.map(({ slotId, productId }) => {
        if (productId) {
          return supabase
            .from('furniture_slots')
            .update({
              is_occupied: true,
              occupied_by_product_id: productId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', slotId);
        } else {
          return supabase
            .from('furniture_slots')
            .update({
              is_occupied: false,
              occupied_by_product_id: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', slotId);
        }
      });

      const results = await Promise.all(promises);
      const errors = results.filter((r) => r.error);
      if (errors.length > 0) {
        throw new Error(`${errors.length} updates failed`);
      }

      queryClient.invalidateQueries({ queryKey: ['furniture-slots', storeId] });
    },
    [storeId, queryClient]
  );

  return {
    slots,
    isLoading,
    error,
    loadSlots,
    refetch,
    getSlotsByFurniture,
    getEmptySlots,
    getCompatibleSlots,
    findBestSlot,
    occupySlot,
    releaseSlot,
    batchUpdateOccupancy,
  };
}

// ============================================================================
// 슬롯 유틸리티 함수
// ============================================================================

/**
 * 슬롯의 월드 좌표 계산
 */
export function calculateSlotWorldPosition(
  furniturePosition: [number, number, number],
  furnitureRotation: [number, number, number],
  slotRelativePosition: Vector3D
): [number, number, number] {
  const radY = furnitureRotation[1]; // 이미 라디안

  // Y축 회전 적용
  const rotatedX =
    slotRelativePosition.x * Math.cos(radY) - slotRelativePosition.z * Math.sin(radY);
  const rotatedZ =
    slotRelativePosition.x * Math.sin(radY) + slotRelativePosition.z * Math.cos(radY);

  return [
    furniturePosition[0] + rotatedX,
    furniturePosition[1] + slotRelativePosition.y,
    furniturePosition[2] + rotatedZ,
  ];
}

/**
 * display_type 호환성 체크
 */
export function isSlotCompatible(
  slot: FurnitureSlot,
  displayType: ProductDisplayType
): boolean {
  if (!slot.compatible_display_types || slot.compatible_display_types.length === 0) {
    return true;
  }
  return slot.compatible_display_types.includes(displayType);
}

/**
 * 상품 크기가 슬롯에 맞는지 체크
 */
export function doesProductFitSlot(
  slot: FurnitureSlot,
  productDimensions: { width: number; height: number; depth: number }
): boolean {
  if (slot.max_product_width && productDimensions.width > slot.max_product_width) {
    return false;
  }
  if (slot.max_product_height && productDimensions.height > slot.max_product_height) {
    return false;
  }
  if (slot.max_product_depth && productDimensions.depth > slot.max_product_depth) {
    return false;
  }
  return true;
}

export default useFurnitureSlots;
