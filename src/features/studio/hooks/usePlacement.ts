/**
 * usePlacement.ts
 *
 * 상품 배치 저장 및 관리 훅
 *
 * Features:
 * - 상품 배치 저장 (단일/일괄)
 * - 배치 히스토리 관리
 * - 롤백 기능
 * - 슬롯 점유 상태 관리
 */

import { useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ProductAsset, Vector3D, FurnitureSlot } from '@/types/scene3d';

// ============================================================================
// 타입 정의
// ============================================================================

export interface PlacementChange {
  id: string;
  productId: string;
  productSku: string;
  fromPosition: Vector3D;
  toPosition: Vector3D;
  fromSlotId?: string;
  toSlotId?: string;
  fromFurnitureId?: string;
  toFurnitureId?: string;
  timestamp: number;
}

export interface PlacementHistoryEntry {
  id: string;
  created_at: string;
  changes: PlacementChange[];
  description?: string;
}

export interface UsePlacementOptions {
  storeId: string;
  userId?: string;
  maxHistorySize?: number;
  autoSave?: boolean;
  onSaveSuccess?: (changes: PlacementChange[]) => void;
  onSaveError?: (error: Error) => void;
  onSlotOccupancyChange?: (slotId: string, occupied: boolean, productId?: string) => void;
}

export interface UsePlacementReturn {
  // 상태
  isSaving: boolean;
  pendingChanges: PlacementChange[];
  history: PlacementHistoryEntry[];
  canUndo: boolean;
  canRedo: boolean;

  // 배치 변경
  recordChange: (change: Omit<PlacementChange, 'id' | 'timestamp'>) => void;
  clearPendingChanges: () => void;

  // 저장
  savePlacements: (products: ProductAsset[]) => Promise<boolean>;
  saveChanges: () => Promise<boolean>;

  // Undo/Redo
  undo: () => PlacementChange | null;
  redo: () => PlacementChange | null;

  // 히스토리
  loadHistory: () => Promise<void>;
  rollbackToEntry: (entryId: string) => Promise<boolean>;

  // 슬롯 관리
  updateSlotOccupancy: (slotId: string, productId: string | null) => Promise<boolean>;
  getSlotOccupancy: (slotId: string) => Promise<string | null>;
}

// ============================================================================
// 메인 훅
// ============================================================================

export function usePlacement({
  storeId,
  userId,
  maxHistorySize = 50,
  autoSave = false,
  onSaveSuccess,
  onSaveError,
  onSlotOccupancyChange,
}: UsePlacementOptions): UsePlacementReturn {
  const [isSaving, setIsSaving] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<PlacementChange[]>([]);
  const [history, setHistory] = useState<PlacementHistoryEntry[]>([]);

  // Undo/Redo 스택
  const undoStack = useRef<PlacementChange[]>([]);
  const redoStack = useRef<PlacementChange[]>([]);

  // 변경사항 기록
  const recordChange = useCallback((change: Omit<PlacementChange, 'id' | 'timestamp'>) => {
    const newChange: PlacementChange = {
      ...change,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
    };

    setPendingChanges(prev => [...prev, newChange]);
    undoStack.current.push(newChange);
    redoStack.current = []; // redo 스택 초기화

    // 자동 저장
    if (autoSave) {
      // 디바운스 처리는 컴포넌트에서 처리
    }
  }, [autoSave]);

  // 대기 중인 변경사항 초기화
  const clearPendingChanges = useCallback(() => {
    setPendingChanges([]);
  }, []);

  // 상품 배치 저장
  const savePlacements = useCallback(async (products: ProductAsset[]): Promise<boolean> => {
    try {
      setIsSaving(true);

      const placements = products.map(p => {
        const pAny = p as any;
        return {
          product_id: p.id,
          store_id: storeId,
          user_id: userId,
          zone_id: pAny.zone_id,
          furniture_id: pAny.furniture_id,
          slot_id: p.slot_id,
          position: p.position,
          rotation: p.rotation,
          scale: p.scale,
          display_type: p.display_type,
          updated_at: new Date().toISOString(),
        };
      });

      const { error } = await supabase
        .from('product_placements')
        .upsert(placements as any, {
          onConflict: 'product_id,store_id',
        });

      if (error) {
        throw error;
      }

      // 히스토리 저장
      if (pendingChanges.length > 0) {
        const historyEntry: PlacementHistoryEntry = {
          id: crypto.randomUUID(),
          created_at: new Date().toISOString(),
          changes: [...pendingChanges],
          description: `${pendingChanges.length}개 상품 배치 변경`,
        };

        await (supabase as any)
          .from('placement_history')
          .insert({
            id: historyEntry.id,
            store_id: storeId,
            user_id: userId,
            changes: historyEntry.changes,
            description: historyEntry.description,
          });

        setHistory(prev => [historyEntry, ...prev].slice(0, maxHistorySize));
      }

      onSaveSuccess?.(pendingChanges);
      setPendingChanges([]);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save placements');
      onSaveError?.(error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [storeId, userId, pendingChanges, maxHistorySize, onSaveSuccess, onSaveError]);

  // 변경사항만 저장
  const saveChanges = useCallback(async (): Promise<boolean> => {
    if (pendingChanges.length === 0) return true;

    try {
      setIsSaving(true);

      // 변경된 상품만 업데이트
      for (const change of pendingChanges) {
        const updateData: Record<string, any> = {
          position: change.toPosition,
          updated_at: new Date().toISOString(),
        };

        if (change.toSlotId) {
          updateData.slot_id = change.toSlotId;
        }
        if (change.toFurnitureId) {
          updateData.furniture_id = change.toFurnitureId;
        }

        const { error } = await supabase
          .from('product_placements')
          .update(updateData)
          .eq('product_id', change.productId)
          .eq('store_id', storeId);

        if (error) {
          console.warn('Failed to update placement:', error);
        }

        // 슬롯 점유 상태 업데이트
        if (change.fromSlotId && change.fromSlotId !== change.toSlotId) {
          await updateSlotOccupancy(change.fromSlotId, null);
        }
        if (change.toSlotId) {
          await updateSlotOccupancy(change.toSlotId, change.productId);
        }
      }

      // 히스토리 저장
      const historyEntry: PlacementHistoryEntry = {
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        changes: [...pendingChanges],
      };

      await (supabase as any)
        .from('placement_history')
        .insert({
          id: historyEntry.id,
          store_id: storeId,
          user_id: userId,
          changes: historyEntry.changes,
        });

      setHistory(prev => [historyEntry, ...prev].slice(0, maxHistorySize));
      onSaveSuccess?.(pendingChanges);
      setPendingChanges([]);
      return true;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Failed to save changes');
      onSaveError?.(error);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [storeId, userId, pendingChanges, maxHistorySize, onSaveSuccess, onSaveError]);

  // Undo
  const undo = useCallback((): PlacementChange | null => {
    const change = undoStack.current.pop();
    if (!change) return null;

    redoStack.current.push(change);

    // 대기 중인 변경사항에서 제거
    setPendingChanges(prev => prev.filter(c => c.id !== change.id));

    return change;
  }, []);

  // Redo
  const redo = useCallback((): PlacementChange | null => {
    const change = redoStack.current.pop();
    if (!change) return null;

    undoStack.current.push(change);
    setPendingChanges(prev => [...prev, change]);

    return change;
  }, []);

  // 히스토리 로드
  const loadHistory = useCallback(async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('placement_history')
        .select('id, created_at, changes, description')
        .eq('store_id', storeId)
        .order('created_at', { ascending: false })
        .limit(maxHistorySize);

      if (error) {
        throw error;
      }

      setHistory((data || []).map((item: any) => ({
        id: item.id,
        created_at: item.created_at,
        changes: item.changes || [],
        description: item.description,
      })));
    } catch (err) {
      console.error('Failed to load placement history:', err);
    }
  }, [storeId, maxHistorySize]);

  // 특정 히스토리 시점으로 롤백
  const rollbackToEntry = useCallback(async (entryId: string): Promise<boolean> => {
    try {
      setIsSaving(true);

      const entry = history.find(h => h.id === entryId);
      if (!entry) {
        throw new Error('History entry not found');
      }

      // 롤백할 변경사항들을 역순으로 적용
      const rollbackChanges = entry.changes.map(change => ({
        productId: change.productId,
        position: change.fromPosition, // 이전 위치로 복원
        slotId: change.fromSlotId,
        furnitureId: change.fromFurnitureId,
      }));

      for (const rollback of rollbackChanges) {
        const updateData: Record<string, any> = {
          position: rollback.position,
          updated_at: new Date().toISOString(),
        };

        if (rollback.slotId) {
          updateData.slot_id = rollback.slotId;
        }
        if (rollback.furnitureId) {
          updateData.furniture_id = rollback.furnitureId;
        }

        await supabase
          .from('product_placements')
          .update(updateData)
          .eq('product_id', rollback.productId)
          .eq('store_id', storeId);
      }

      // 롤백 히스토리 기록
      await (supabase as any)
        .from('placement_history')
        .insert({
          id: crypto.randomUUID(),
          store_id: storeId,
          user_id: userId,
          changes: entry.changes.map(c => ({
            ...c,
            fromPosition: c.toPosition,
            toPosition: c.fromPosition,
            fromSlotId: c.toSlotId,
            toSlotId: c.fromSlotId,
          })),
          description: `롤백: ${entry.description || entry.id}`,
        });

      await loadHistory();
      return true;
    } catch (err) {
      console.error('Failed to rollback:', err);
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [storeId, userId, history, loadHistory]);

  // 슬롯 점유 상태 업데이트
  const updateSlotOccupancy = useCallback(async (slotId: string, productId: string | null): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('furniture_slots')
        .update({
          is_occupied: productId !== null,
          occupied_by_product_id: productId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', slotId)
        .eq('store_id', storeId);

      if (error) {
        throw error;
      }

      onSlotOccupancyChange?.(slotId, productId !== null, productId || undefined);
      return true;
    } catch (err) {
      console.error('Failed to update slot occupancy:', err);
      return false;
    }
  }, [storeId, onSlotOccupancyChange]);

  // 슬롯 점유 상태 조회
  const getSlotOccupancy = useCallback(async (slotId: string): Promise<string | null> => {
    try {
      // furniture_slots에서 is_occupied 확인 후, product_placements에서 해당 슬롯의 상품 조회
      const { data: slotData, error: slotError } = await supabase
        .from('furniture_slots')
        .select('is_occupied')
        .eq('id', slotId)
        .eq('store_id', storeId)
        .maybeSingle();

      if (slotError || !slotData?.is_occupied) {
        return null;
      }

      // 해당 슬롯에 배치된 상품 조회
      const { data: placementData } = await supabase
        .from('product_placements')
        .select('product_id')
        .eq('slot_id', slotId)
        .eq('store_id', storeId)
        .eq('is_active', true)
        .maybeSingle();

      return placementData?.product_id || null;
    } catch (err) {
      console.error('Failed to get slot occupancy:', err);
      return null;
    }
  }, [storeId]);

  return {
    isSaving,
    pendingChanges,
    history,
    canUndo: undoStack.current.length > 0,
    canRedo: redoStack.current.length > 0,

    recordChange,
    clearPendingChanges,

    savePlacements,
    saveChanges,

    undo,
    redo,

    loadHistory,
    rollbackToEntry,

    updateSlotOccupancy,
    getSlotOccupancy,
  };
}

export default usePlacement;
