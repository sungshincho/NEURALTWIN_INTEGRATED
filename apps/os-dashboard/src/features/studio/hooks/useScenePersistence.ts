/**
 * useScenePersistence.ts
 *
 * 씬 저장/불러오기 훅
 *
 * B안 확장:
 * - staff_positions: 직원 위치 저장
 * - scene_type: 씬 타입 (manual, ai_optimized, staffing_optimized)
 * - metadata: 최적화 메타데이터
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SceneRecipe, SavedScene, StaffPosition, SceneType, SceneMetadata } from '../types';

interface UseScenePersistenceOptions {
  userId?: string;
  storeId?: string;
}

// B안: 씬 저장 옵션
export interface SaveSceneOptions {
  recipe: SceneRecipe;
  name: string;
  sceneId?: string;
  /** B안: 직원 위치 */
  staffPositions?: StaffPosition[];
  /** B안: 씬 타입 */
  sceneType?: SceneType;
  /** B안: 메타데이터 */
  metadata?: SceneMetadata;
}

// B안: DB에서 씬 매핑
function mapDbSceneToSavedScene(scene: any): SavedScene {
  return {
    id: scene.id,
    name: scene.scene_name,
    recipe_data: scene.recipe_data,
    thumbnail: undefined,
    is_active: scene.is_active,
    created_at: scene.created_at,
    updated_at: scene.updated_at,
    // B안 확장 필드
    staff_positions: scene.staff_positions || [],
    scene_type: scene.scene_type || 'manual',
    metadata: scene.metadata || {},
  };
}

export function useScenePersistence(options: UseScenePersistenceOptions = {}) {
  const { userId, storeId } = options;
  const [scenes, setScenes] = useState<SavedScene[]>([]);
  const [activeScene, setActiveSceneState] = useState<SavedScene | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // 씬 목록 로드
  // skipActiveScene: true면 목록만 갱신하고 activeScene은 건드리지 않음 (저장 후 사용)
  const loadScenes = useCallback(async (skipActiveScene = false) => {
    if (!userId || !storeId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('store_scenes')
        .select('*')
        .eq('user_id', userId)
        .eq('store_id', storeId)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      // B안: 확장 필드 포함하여 매핑
      const mappedScenes: SavedScene[] = (data || []).map(mapDbSceneToSavedScene);

      setScenes(mappedScenes);

      // 🔧 FIX: skipActiveScene이 true면 activeScene 설정 스킵 (저장 후 화면 깨짐 방지)
      if (!skipActiveScene) {
        const active = mappedScenes.find((s) => s.is_active);
        if (active) {
          setActiveSceneState(active);
        }
      }
    } catch (error) {
      console.error('Failed to load scenes:', error);
      toast.error('씬 목록을 불러오는데 실패했습니다');
    } finally {
      setIsLoading(false);
    }
  }, [userId, storeId]);

  // 씬 저장 (기존 API 호환)
  const saveScene = useCallback(
    async (recipe: SceneRecipe, name: string, sceneId?: string) => {
      return saveSceneWithOptions({
        recipe,
        name,
        sceneId,
      });
    },
    [userId, storeId]
  );

  // B안: 확장 씬 저장 (직원 위치, 메타데이터 포함)
  const saveSceneWithOptions = useCallback(
    async (options: SaveSceneOptions) => {
      const { recipe, name, sceneId, staffPositions, sceneType, metadata } = options;

      if (!userId || !storeId) {
        toast.error('사용자 또는 매장 정보가 없습니다');
        return;
      }

      setIsSaving(true);
      try {
        // B안: 확장 데이터 구성
        const sceneData: any = {
          scene_name: name,
          recipe_data: recipe as any,
          updated_at: new Date().toISOString(),
        };

        // B안: 직원 위치 추가
        if (staffPositions !== undefined) {
          sceneData.staff_positions = staffPositions;
        }

        // B안: 씬 타입 추가
        if (sceneType !== undefined) {
          sceneData.scene_type = sceneType;
        }

        // B안: 메타데이터 추가
        if (metadata !== undefined) {
          sceneData.metadata = metadata;
        }

        if (sceneId) {
          // 업데이트
          const { error } = await supabase
            .from('store_scenes')
            .update(sceneData)
            .eq('id', sceneId);

          if (error) throw error;
          toast.success('씬이 업데이트되었습니다');
        } else {
          // 새로 생성
          const { error } = await supabase.from('store_scenes').insert({
            user_id: userId,
            store_id: storeId,
            is_active: true,
            ...sceneData,
          });

          if (error) throw error;
          toast.success('씬이 저장되었습니다');
        }

        await loadScenes(true);  // 목록만 갱신, activeScene은 건드리지 않음
      } catch (error) {
        console.error('Failed to save scene:', error);
        toast.error('씬 저장에 실패했습니다');
        throw error;
      } finally {
        setIsSaving(false);
      }
    },
    [userId, storeId, loadScenes]
  );

  // 씬 삭제
  const deleteScene = useCallback(
    async (sceneId: string) => {
      try {
        const { error } = await supabase.from('store_scenes').delete().eq('id', sceneId);

        if (error) throw error;
        toast.success('씬이 삭제되었습니다');
        await loadScenes(true);  // 🔧 FIX: 목록만 갱신
      } catch (error) {
        console.error('Failed to delete scene:', error);
        toast.error('씬 삭제에 실패했습니다');
      }
    },
    [loadScenes]
  );

  // 활성 씬 설정
  const setActiveScene = useCallback(
    async (sceneId: string) => {
      if (!userId || !storeId) return;

      try {
        // 기존 활성 해제
        await supabase
          .from('store_scenes')
          .update({ is_active: false })
          .eq('user_id', userId)
          .eq('store_id', storeId);

        // 새 씬 활성화
        const { error } = await supabase
          .from('store_scenes')
          .update({ is_active: true })
          .eq('id', sceneId);

        if (error) throw error;

        // 🔧 FIX: 목록 다시 로드 후 활성 씬 즉시 설정
        const { data } = await supabase
          .from('store_scenes')
          .select('*')
          .eq('user_id', userId)
          .eq('store_id', storeId)
          .order('updated_at', { ascending: false });

        if (data) {
          // B안: 확장 필드 포함하여 매핑
          const mappedScenes: SavedScene[] = data.map(mapDbSceneToSavedScene);

          setScenes(mappedScenes);

          // 선택한 씬을 activeScene으로 설정 (새 객체 참조 생성)
          const selectedScene = mappedScenes.find(s => s.id === sceneId);
          if (selectedScene) {
            setActiveSceneState({ ...selectedScene });
          }
        }
      } catch (error) {
        console.error('Failed to set active scene:', error);
        toast.error('씬 활성화에 실패했습니다');
      }
    },
    [userId, storeId]
  );

  // 🆕 활성 씬 해제 (씬 초기화 시 사용)
  const clearActiveScene = useCallback(async () => {
    if (!userId || !storeId) return;
    
    try {
      // 모든 씬의 is_active를 false로 설정
      await supabase
        .from('store_scenes')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('store_id', storeId);
      
      setActiveSceneState(null);
      await loadScenes(true);  // 목록만 갱신
    } catch (error) {
      console.error('Failed to clear active scene:', error);
    }
  }, [userId, storeId, loadScenes]);

  // 🆕 씬 이름 변경
  const renameScene = useCallback(
    async (sceneId: string, newName: string) => {
      try {
        const { error } = await supabase
          .from('store_scenes')
          .update({ scene_name: newName })
          .eq('id', sceneId);

        if (error) throw error;
        toast.success('씬 이름이 변경되었습니다');
        await loadScenes(true);  // 목록만 갱신
      } catch (error) {
        console.error('Failed to rename scene:', error);
        toast.error('씬 이름 변경에 실패했습니다');
      }
    },
    [loadScenes]
  );

  // 초기 로드
  useEffect(() => {
    loadScenes();
  }, [loadScenes]);

  return {
    scenes,
    activeScene,
    isLoading,
    isSaving,
    loadScenes,
    saveScene,
    saveSceneWithOptions,  // B안: 확장 저장
    deleteScene,
    setActiveScene,
    clearActiveScene,
    renameScene,
  };
}

export default useScenePersistence;
