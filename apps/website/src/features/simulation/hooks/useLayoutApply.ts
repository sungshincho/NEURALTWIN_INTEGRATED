/**
 * useLayoutApply.ts v2
 * 레이아웃 변경사항을 DB에 저장하는 Hook
 * 2D (x, y) 및 3D (x, y, z) 형식 모두 지원
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LayoutChange {
  entityId: string;
  entityLabel: string;
  entityType: string;
  currentPosition?: { x: number; y: number; z?: number };
  suggestedPosition?: { x: number; y?: number; z: number };
  reason: string;
  impact: 'high' | 'medium' | 'low';
}

interface ApplyResult {
  success: boolean;
  updatedCount: number;
  failedCount: number;
  errors: string[];
}

export function useLayoutApply() {
  const [isApplying, setIsApplying] = useState(false);
  const [lastApplyResult, setLastApplyResult] = useState<ApplyResult | null>(null);

  const applyLayoutChanges = useCallback(async (
    changes: LayoutChange[],
    options?: {
      createSnapshot?: boolean;
      storeId?: string;
    }
  ): Promise<ApplyResult> => {
    console.log('🚀 applyLayoutChanges called!');
    console.log('Changes:', changes);

    if (!changes || changes.length === 0) {
      toast.warning('적용할 변경사항이 없습니다.');
      return { success: false, updatedCount: 0, failedCount: 0, errors: ['No changes to apply'] };
    }

    setIsApplying(true);
    const result: ApplyResult = {
      success: true,
      updatedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      console.log('=== Applying Layout Changes ===');
      console.log('Changes count:', changes.length);

      for (const change of changes) {
        if (!change.entityId || !change.suggestedPosition) {
          console.warn('Invalid change (missing entityId or suggestedPosition):', change);
          result.failedCount++;
          result.errors.push(`Invalid change data for ${change.entityLabel || 'unknown'}`);
          continue;
        }

        // 먼저 기존 엔티티의 model_3d_position 형식을 확인
        const { data: existingEntity, error: fetchError } = await supabase
          .from('graph_entities')
          .select('id, label, model_3d_position')
          .eq('id', change.entityId)
          .single();

        if (fetchError || !existingEntity) {
          console.warn(`⚠️ Entity not found: ${change.entityLabel} (${change.entityId})`);
          result.failedCount++;
          result.errors.push(`${change.entityLabel}: 엔티티가 DB에 존재하지 않습니다`);
          continue;
        }

        // 기존 형식 확인 (2D vs 3D)
        const existingPosition = existingEntity.model_3d_position as any;
        const is3DFormat = existingPosition && 'z' in existingPosition;

        // 새 위치 생성 (기존 형식에 맞춤)
        let newPosition: any;
        
        if (is3DFormat) {
          // 3D 형식 유지: {x, y, z}
          newPosition = {
            x: change.suggestedPosition.x,
            y: change.suggestedPosition.y ?? 0,
            z: change.suggestedPosition.z,
          };
        } else {
          // 2D 형식 유지: {x, y} - z를 y로 매핑 (평면도 기준)
          newPosition = {
            x: change.suggestedPosition.x,
            y: change.suggestedPosition.z,  // 3D의 z가 2D의 y (깊이)
          };
        }

        console.log(`Updating ${change.entityLabel} (${change.entityId})`);
        console.log(`  기존 형식: ${is3DFormat ? '3D' : '2D'}`, existingPosition);
        console.log(`  새 위치:`, newPosition);

        const { data, error } = await supabase
          .from('graph_entities')
          .update({
            model_3d_position: newPosition,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.entityId)
          .select();

        if (error) {
          console.error(`❌ Error updating ${change.entityLabel}:`, error);
          result.failedCount++;
          result.errors.push(`${change.entityLabel}: ${error.message}`);
        } else if (!data || data.length === 0) {
          console.warn(`⚠️ No rows updated for ${change.entityLabel}`);
          result.failedCount++;
          result.errors.push(`${change.entityLabel}: 업데이트된 행이 없습니다`);
        } else {
          console.log(`✅ Updated ${change.entityLabel}`, data[0].model_3d_position);
          result.updatedCount++;
        }
      }

      result.success = result.failedCount === 0 && result.updatedCount > 0;
      setLastApplyResult(result);

      console.log('=== Apply Result ===', result);

      if (result.success) {
        toast.success(`${result.updatedCount}개 가구 위치가 업데이트되었습니다.`);
      } else if (result.updatedCount > 0) {
        toast.warning(`${result.updatedCount}개 성공, ${result.failedCount}개 실패`);
      } else {
        toast.error('레이아웃 적용에 실패했습니다.');
      }

      return result;
    } catch (error) {
      console.error('Apply layout error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.success = false;
      result.errors.push(errorMessage);
      setLastApplyResult(result);
      toast.error(`레이아웃 적용 실패: ${errorMessage}`);
      return result;
    } finally {
      setIsApplying(false);
    }
  }, []);

  const revertLayoutChanges = useCallback(async (
    changes: LayoutChange[]
  ): Promise<ApplyResult> => {
    if (!changes || changes.length === 0) {
      return { success: false, updatedCount: 0, failedCount: 0, errors: ['No changes to revert'] };
    }

    setIsApplying(true);
    const result: ApplyResult = {
      success: true,
      updatedCount: 0,
      failedCount: 0,
      errors: [],
    };

    try {
      for (const change of changes) {
        if (!change.entityId || !change.currentPosition) {
          result.failedCount++;
          continue;
        }

        const { error } = await supabase
          .from('graph_entities')
          .update({
            model_3d_position: change.currentPosition,
            updated_at: new Date().toISOString(),
          })
          .eq('id', change.entityId);

        if (error) {
          result.failedCount++;
          result.errors.push(`${change.entityLabel}: ${error.message}`);
        } else {
          result.updatedCount++;
        }
      }

      result.success = result.failedCount === 0;
      setLastApplyResult(result);

      if (result.success) {
        toast.success(`${result.updatedCount}개 가구 위치가 원래대로 복원되었습니다.`);
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      result.success = false;
      result.errors.push(errorMessage);
      toast.error(`복원 실패: ${errorMessage}`);
      return result;
    } finally {
      setIsApplying(false);
    }
  }, []);

  return {
    isApplying,
    lastApplyResult,
    applyLayoutChanges,
    revertLayoutChanges,
  };
}

export default useLayoutApply;
