import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useSelectedStore } from './useSelectedStore';
import { toast } from 'sonner';
import type { SceneRecipe } from '@/types/scene3d';

interface StoreScene {
  id: string;
  name: string;
  recipe_data: SceneRecipe;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  store_id: string | null;
}

export function useStoreScene() {
  const { user, orgId } = useAuth();
  const { selectedStore } = useSelectedStore();
  const queryClient = useQueryClient();
  const selectedStoreId = selectedStore?.id;

  // Fetch active scene for current store
  const { data: activeScene, isLoading, error } = useQuery({
    queryKey: ['store-scene', user?.id, selectedStoreId],
    queryFn: async () => {
      if (!user?.id || !orgId) return null;

      const query = supabase
        .from('store_scenes')
        .select('*')
        .eq('user_id', user.id)
        .eq('org_id', orgId)
        .eq('is_active', true)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (selectedStoreId) {
        query.eq('store_id', selectedStoreId);
      } else {
        query.is('store_id', null);
      }

      const { data, error } = await query.maybeSingle();

      if (error) throw error;
      return data ? {
        ...data,
        name: data.scene_name,
        recipe_data: data.recipe_data as unknown as SceneRecipe
      } as StoreScene : null;
    },
    enabled: !!user?.id,
  });

  // Fetch all scenes for current store
  const { data: allScenes = [] } = useQuery({
    queryKey: ['store-scenes-all', user?.id, selectedStoreId],
    queryFn: async () => {
      if (!user?.id || !orgId) return [];

      const query = supabase
        .from('store_scenes')
        .select('*')
        .eq('user_id', user.id)
        .eq('org_id', orgId)
        .order('updated_at', { ascending: false });

      if (selectedStoreId) {
        query.eq('store_id', selectedStoreId);
      } else {
        query.is('store_id', null);
      }

      const { data, error } = await query;

      if (error) throw error;
      return (data || []).map(scene => ({
        ...scene,
        name: scene.scene_name,
        recipe_data: scene.recipe_data as unknown as SceneRecipe
      })) as StoreScene[];
    },
    enabled: !!user?.id,
  });

  // Save or update scene
  const saveSceneMutation = useMutation({
    mutationFn: async ({ 
      recipe, 
      name = 'Default Scene',
      sceneId 
    }: { 
      recipe: SceneRecipe; 
      name?: string;
      sceneId?: string;
    }) => {
      if (!user?.id) throw new Error('User not authenticated');

      if (sceneId) {
        // Update existing scene
        const { data, error } = await supabase
          .from('store_scenes')
          .update({
            recipe_data: recipe as any,
            scene_name: name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', sceneId)
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new scene (deactivate others first)
        if (selectedStoreId) {
          await supabase
            .from('store_scenes')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .eq('org_id', orgId)
            .eq('store_id', selectedStoreId);
        } else {
          await supabase
            .from('store_scenes')
            .update({ is_active: false })
            .eq('user_id', user.id)
            .eq('org_id', orgId)
            .is('store_id', null);
        }

        const { data, error } = await supabase
          .from('store_scenes')
          .insert({
            user_id: user.id,
            org_id: orgId,
            store_id: selectedStoreId || null,
            scene_name: name,
            recipe_data: recipe as any,
            is_active: true,
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-scene'] });
      queryClient.invalidateQueries({ queryKey: ['store-scenes-all'] });
      toast.success('씬이 저장되었습니다');
    },
    onError: (error) => {
      console.error('Failed to save scene:', error);
      toast.error('씬 저장에 실패했습니다');
    },
  });

  // Set active scene
  const setActiveSceneMutation = useMutation({
    mutationFn: async (sceneId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      // Deactivate all scenes for this store
      if (selectedStoreId) {
        await supabase
          .from('store_scenes')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('org_id', orgId)
          .eq('store_id', selectedStoreId);
      } else {
        await supabase
          .from('store_scenes')
          .update({ is_active: false })
          .eq('user_id', user.id)
          .eq('org_id', orgId)
          .is('store_id', null);
      }

      // Activate selected scene
      const { data, error } = await supabase
        .from('store_scenes')
        .update({ is_active: true })
        .eq('id', sceneId)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-scene'] });
      queryClient.invalidateQueries({ queryKey: ['store-scenes-all'] });
      toast.success('활성 씬이 변경되었습니다');
    },
    onError: (error) => {
      console.error('Failed to set active scene:', error);
      toast.error('씬 활성화에 실패했습니다');
    },
  });

  // Delete scene
  const deleteSceneMutation = useMutation({
    mutationFn: async (sceneId: string) => {
      if (!user?.id) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('store_scenes')
        .delete()
        .eq('id', sceneId)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-scene'] });
      queryClient.invalidateQueries({ queryKey: ['store-scenes-all'] });
      toast.success('씬이 삭제되었습니다');
    },
    onError: (error) => {
      console.error('Failed to delete scene:', error);
      toast.error('씬 삭제에 실패했습니다');
    },
  });

  const saveScene = useCallback(
    (recipe: SceneRecipe, name?: string, sceneId?: string) => {
      return saveSceneMutation.mutateAsync({ recipe, name, sceneId });
    },
    [saveSceneMutation]
  );

  const setActiveScene = useCallback(
    (sceneId: string) => {
      return setActiveSceneMutation.mutateAsync(sceneId);
    },
    [setActiveSceneMutation]
  );

  const deleteScene = useCallback(
    (sceneId: string) => {
      return deleteSceneMutation.mutateAsync(sceneId);
    },
    [deleteSceneMutation]
  );

  return {
    activeScene,
    allScenes,
    isLoading,
    error,
    saveScene,
    setActiveScene,
    deleteScene,
    isSaving: saveSceneMutation.isPending,
  };
}
