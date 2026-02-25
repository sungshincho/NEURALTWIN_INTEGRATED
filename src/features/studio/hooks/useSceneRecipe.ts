/**
 * useSceneRecipe.ts
 *
 * SceneRecipe와 SceneProvider 연동 훅
 * - SceneRecipe (scene3d.ts)를 Model3D[] (studio)로 변환
 * - 슬롯 기반 auto-snap 포지셔닝 지원
 * - AI 최적화 결과 적용
 */

import { useCallback, useState } from 'react';
import { useScene } from '../core/SceneProvider';
import type { Model3D, Vector3Tuple, ModelType } from '../types';
import type {
  SceneRecipe,
  SpaceAsset,
  FurnitureAsset,
  ProductAsset,
  StaffAsset,
  CustomerAsset,
  Vector3D,
  ProductDisplayType,
} from '@/types/scene3d';
import {
  generateSceneRecipeForStore,
  generateOptimizedSceneRecipe,
  applyOptimizedPlacements,
} from '@/features/simulation/utils/sceneRecipeGenerator';
import type { AILayoutOptimizationResult } from '@/types/scene3d';

// ============================================================================
// 유틸리티: Vector3D → Vector3Tuple 변환
// ============================================================================
function toTuple(v: Vector3D): Vector3Tuple {
  return [v.x, v.y, v.z];
}

// ============================================================================
// SceneRecipe Asset → Model3D 변환
// ============================================================================
function spaceToModel(asset: SpaceAsset): Model3D {
  return {
    id: asset.id,
    name: asset.zone_name || 'Space',
    url: asset.model_url || '',
    position: toTuple(asset.position),
    rotation: toTuple(asset.rotation),
    scale: toTuple(asset.scale),
    visible: true,
    type: 'space' as ModelType,
    dimensions: asset.dimensions,
    metadata: {
      ...asset.metadata,
      isBaked: asset.isBaked,
    },
  };
}

function furnitureToModel(asset: FurnitureAsset): Model3D {
  return {
    id: asset.id,
    name: asset.furniture_type || 'Furniture',
    url: asset.model_url || '',
    position: toTuple(asset.position),
    rotation: toTuple(asset.rotation),
    scale: toTuple(asset.scale),
    visible: true,
    type: 'furniture' as ModelType,
    dimensions: asset.dimensions,
    metadata: {
      ...asset.metadata,
      furniture_type: asset.furniture_type,
      movable: asset.movable,
      suggested_position: asset.suggested_position,
      suggested_rotation: asset.suggested_rotation,
      optimization_reason: asset.optimization_reason,
    },
  };
}

function productToModel(asset: ProductAsset): Model3D {
  return {
    id: asset.id,
    name: asset.sku || asset.product_id || 'Product',
    url: asset.model_url || '',
    position: toTuple(asset.position),
    rotation: toTuple(asset.rotation),
    scale: toTuple(asset.scale),
    visible: true,
    type: 'product' as ModelType,
    dimensions: asset.dimensions,
    metadata: {
      ...asset.metadata,
      product_id: asset.product_id,
      sku: asset.sku,
      movable: asset.movable,
      display_type: asset.display_type,
      initial_furniture_id: asset.initial_furniture_id,
      slot_id: asset.slot_id,
      suggested_position: asset.suggested_position,
      suggested_rotation: asset.suggested_rotation,
      optimization_reason: asset.optimization_reason,
      expected_impact: asset.expected_impact,
    },
  };
}

function staffToModel(asset: StaffAsset): Model3D {
  return {
    id: asset.id,
    name: asset.staff_name || 'Staff',
    url: asset.model_url || '',
    position: toTuple(asset.position),
    rotation: toTuple(asset.rotation),
    scale: toTuple(asset.scale),
    visible: true,
    type: 'other' as ModelType, // staff는 'other' 타입
    metadata: {
      assetType: 'staff',
      staff_id: asset.staff_id,
      staff_name: asset.staff_name,
      role: asset.role,
      assigned_zone_id: asset.assigned_zone_id,
      shift_start: asset.shift_start,
      shift_end: asset.shift_end,
    },
  };
}

function customerToModel(asset: CustomerAsset): Model3D {
  return {
    id: asset.id,
    name: `Customer (${asset.customer_segment})`,
    url: asset.model_url || '',
    position: toTuple(asset.position),
    rotation: toTuple(asset.rotation),
    scale: toTuple(asset.scale),
    visible: true,
    type: 'other' as ModelType, // customer는 'other' 타입
    metadata: {
      assetType: 'customer',
      customer_id: asset.customer_id,
      customer_segment: asset.customer_segment,
      is_animated: asset.is_animated,
      path_points: asset.path_points,
      current_zone_id: asset.current_zone_id,
    },
  };
}

// ============================================================================
// SceneRecipe → Model3D[] 전체 변환
// ============================================================================
function recipeToModels(recipe: SceneRecipe): Model3D[] {
  const models: Model3D[] = [];

  // Space
  if (recipe.space) {
    models.push(spaceToModel(recipe.space));
  }

  // Furniture
  for (const furniture of recipe.furniture || []) {
    models.push(furnitureToModel(furniture));
  }

  // Products
  for (const product of recipe.products || []) {
    models.push(productToModel(product));
  }

  // Staff
  for (const staff of recipe.staff || []) {
    models.push(staffToModel(staff));
  }

  // Customers
  for (const customer of recipe.customers || []) {
    models.push(customerToModel(customer));
  }

  return models;
}

// ============================================================================
// 훅: useSceneRecipe
// ============================================================================
export interface UseSceneRecipeOptions {
  storeId: string;
  userId: string;
}

export interface UseSceneRecipeReturn {
  // 상태
  recipe: SceneRecipe | null;
  isLoading: boolean;
  error: Error | null;

  // 씬 로드
  loadBaseScene: () => Promise<void>;
  loadOptimizedScene: (optimizationId: string) => Promise<void>;

  // 최적화 적용
  applyOptimization: (optimizationResult: AILayoutOptimizationResult) => Promise<void>;

  // SceneProvider 동기화
  syncToScene: () => void;

  // 필터링된 모델 접근
  getProductModels: () => Model3D[];
  getFurnitureModels: () => Model3D[];
  getMovableModels: () => Model3D[];
  getOptimizedModels: () => Model3D[];
}

export function useSceneRecipe({ storeId, userId }: UseSceneRecipeOptions): UseSceneRecipeReturn {
  const { setModels, models } = useScene();
  const [recipe, setRecipe] = useState<SceneRecipe | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // 기본 씬 로드
  const loadBaseScene = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const baseRecipe = await generateSceneRecipeForStore(storeId, userId);
      setRecipe(baseRecipe);

      // SceneProvider에 동기화
      const sceneModels = recipeToModels(baseRecipe);
      setModels(sceneModels);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load scene'));
    } finally {
      setIsLoading(false);
    }
  }, [storeId, userId, setModels]);

  // 최적화된 씬 로드
  const loadOptimizedScene = useCallback(async (optimizationId: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const optimizedRecipe = await generateOptimizedSceneRecipe(storeId, userId, optimizationId);
      setRecipe(optimizedRecipe);

      // SceneProvider에 동기화
      const sceneModels = recipeToModels(optimizedRecipe);
      setModels(sceneModels);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load optimized scene'));
    } finally {
      setIsLoading(false);
    }
  }, [storeId, userId, setModels]);

  // 현재 씬에 최적화 적용
  const applyOptimization = useCallback(async (optimizationResult: AILayoutOptimizationResult) => {
    if (!recipe) {
      setError(new Error('No base scene loaded'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const optimizedRecipe = await applyOptimizedPlacements(recipe, optimizationResult, storeId);
      setRecipe(optimizedRecipe);

      // SceneProvider에 동기화
      const sceneModels = recipeToModels(optimizedRecipe);
      setModels(sceneModels);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to apply optimization'));
    } finally {
      setIsLoading(false);
    }
  }, [recipe, storeId, setModels]);

  // 현재 recipe를 SceneProvider에 동기화
  const syncToScene = useCallback(() => {
    if (recipe) {
      const sceneModels = recipeToModels(recipe);
      setModels(sceneModels);
    }
  }, [recipe, setModels]);

  // 필터링된 모델 접근
  const getProductModels = useCallback(() => {
    return models.filter(m => m.type === 'product');
  }, [models]);

  const getFurnitureModels = useCallback(() => {
    return models.filter(m => m.type === 'furniture');
  }, [models]);

  const getMovableModels = useCallback(() => {
    return models.filter(m => m.metadata?.movable === true);
  }, [models]);

  const getOptimizedModels = useCallback(() => {
    return models.filter(m => m.metadata?.optimization_reason);
  }, [models]);

  return {
    recipe,
    isLoading,
    error,
    loadBaseScene,
    loadOptimizedScene,
    applyOptimization,
    syncToScene,
    getProductModels,
    getFurnitureModels,
    getMovableModels,
    getOptimizedModels,
  };
}

// ============================================================================
// 훅: useSlotInfo - 슬롯 정보 조회용
// ============================================================================
export function useSlotInfo(model: Model3D | null) {
  if (!model || model.type !== 'product') {
    return null;
  }

  const { initial_furniture_id, slot_id, display_type, optimization_reason, expected_impact } =
    model.metadata || {};

  return {
    furnitureId: initial_furniture_id as string | undefined,
    slotId: slot_id as string | undefined,
    displayType: display_type as ProductDisplayType | undefined,
    optimizationReason: optimization_reason as string | undefined,
    expectedImpact: expected_impact as {
      revenue_change_pct: number;
      visibility_score: number;
      accessibility_score: number;
    } | undefined,
    isOptimized: !!optimization_reason,
  };
}

// ============================================================================
// 유틸리티: Model3D[] → SceneRecipe 역변환 (저장용)
// ============================================================================
export function modelsToRecipe(
  models: Model3D[],
  lighting: SceneRecipe['lighting'],
  camera: SceneRecipe['camera']
): SceneRecipe {
  const space = models.find(m => m.type === 'space');
  const furniture = models.filter(m => m.type === 'furniture');
  const products = models.filter(m => m.type === 'product');
  const staff = models.filter(m => m.metadata?.assetType === 'staff');
  const customers = models.filter(m => m.metadata?.assetType === 'customer');

  return {
    space: space
      ? {
          id: space.id,
          type: 'space',
          model_url: space.url,
          position: { x: space.position[0], y: space.position[1], z: space.position[2] },
          rotation: { x: space.rotation[0], y: space.rotation[1], z: space.rotation[2] },
          scale: { x: space.scale[0], y: space.scale[1], z: space.scale[2] },
          dimensions: space.dimensions,
          zone_name: space.name,
          isBaked: space.metadata?.isBaked,
        }
      : {
          id: 'default-space',
          type: 'space',
          model_url: '',
          position: { x: 0, y: 0, z: 0 },
          rotation: { x: 0, y: 0, z: 0 },
          scale: { x: 1, y: 1, z: 1 },
        },
    furniture: furniture.map(f => ({
      id: f.id,
      type: 'furniture' as const,
      model_url: f.url,
      position: { x: f.position[0], y: f.position[1], z: f.position[2] },
      rotation: { x: f.rotation[0], y: f.rotation[1], z: f.rotation[2] },
      scale: { x: f.scale[0], y: f.scale[1], z: f.scale[2] },
      dimensions: f.dimensions,
      furniture_type: f.metadata?.furniture_type || f.name,
      movable: f.metadata?.movable ?? true,
    })),
    products: products.map(p => ({
      id: p.id,
      type: 'product' as const,
      model_url: p.url,
      position: { x: p.position[0], y: p.position[1], z: p.position[2] },
      rotation: { x: p.rotation[0], y: p.rotation[1], z: p.rotation[2] },
      scale: { x: p.scale[0], y: p.scale[1], z: p.scale[2] },
      dimensions: p.dimensions,
      product_id: p.metadata?.product_id,
      sku: p.metadata?.sku || p.name,
      movable: p.metadata?.movable ?? true,
      display_type: p.metadata?.display_type,
      initial_furniture_id: p.metadata?.initial_furniture_id,
      slot_id: p.metadata?.slot_id,
    })),
    staff: staff.map(s => ({
      id: s.id,
      type: 'staff' as const,
      model_url: s.url,
      position: { x: s.position[0], y: s.position[1], z: s.position[2] },
      rotation: { x: s.rotation[0], y: s.rotation[1], z: s.rotation[2] },
      scale: { x: s.scale[0], y: s.scale[1], z: s.scale[2] },
      staff_id: s.metadata?.staff_id || s.id,
      staff_name: s.metadata?.staff_name || s.name,
      role: s.metadata?.role || 'staff',
      assigned_zone_id: s.metadata?.assigned_zone_id,
    })),
    customers: customers.map(c => ({
      id: c.id,
      type: 'customer' as const,
      model_url: c.url,
      position: { x: c.position[0], y: c.position[1], z: c.position[2] },
      rotation: { x: c.rotation[0], y: c.rotation[1], z: c.rotation[2] },
      scale: { x: c.scale[0], y: c.scale[1], z: c.scale[2] },
      customer_id: c.metadata?.customer_id,
      customer_segment: c.metadata?.customer_segment || 'regular',
      is_animated: c.metadata?.is_animated,
      path_points: c.metadata?.path_points,
    })),
    lighting,
    camera,
  };
}

export default useSceneRecipe;
