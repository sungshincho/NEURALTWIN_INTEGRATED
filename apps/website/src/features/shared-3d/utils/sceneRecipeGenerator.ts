import { supabase } from "@/integrations/supabase/client";
import type {
  SceneRecipe,
  AILayoutResult,
  AILayoutOptimizationResult,
  OntologyQueryResult,
  SpaceAsset,
  FurnitureAsset,
  ProductAsset,
  StaffAsset,
  CustomerAsset,
  LightingPreset,
  ModelDimensions,
  Vector3D,
  FurnitureSlot,
  SlotSnapResult,
  ProductDisplayType
} from "@/types/scene3d";

const DEFAULT_LIGHTING: LightingPreset = {
  name: "default",
  description: "Default retail lighting",
  lights: [
    { type: "ambient", color: "#ffffff", intensity: 0.5 },
    { 
      type: "directional", 
      color: "#ffffff", 
      intensity: 0.8,
      position: { x: 5, y: 10, z: 5 },
      target: { x: 0, y: 0, z: 0 }
    }
  ]
};

export async function generateSceneRecipe(
  aiResult: AILayoutResult,
  userId: string
): Promise<SceneRecipe> {
  // Fetch ontology data
  const { data: entityTypes } = await supabase
    .from('ontology_entity_types')
    .select('*')
    .eq('user_id', userId);

  const { data: entities } = await supabase
    .from('graph_entities')
    .select('*')
    .eq('user_id', userId);

  const ontologyData: OntologyQueryResult = {
    entity_types: (entityTypes || []).map(et => ({
      id: et.id,
      name: et.name,
      model_3d_url: et.model_3d_url || undefined,
      model_3d_dimensions: et.model_3d_dimensions as unknown as ModelDimensions | undefined,
      model_3d_type: et.model_3d_type || undefined
    })),
    entities: (entities || []).map(e => ({
      id: e.id,
      entity_type_id: e.entity_type_id,
      label: e.label,
      properties: e.properties as Record<string, any>,
      model_3d_position: e.model_3d_position as unknown as Vector3D | undefined,
      model_3d_rotation: e.model_3d_rotation as unknown as Vector3D | undefined,
      model_3d_scale: e.model_3d_scale as unknown as Vector3D | undefined
    }))
  };

  // 1. Select Space Model
  const spaceType = entityTypes?.find(et => et.model_3d_type === 'space');
  const space: SpaceAsset = {
    id: 'main-space',
    type: 'space',
    model_url: spaceType?.model_3d_url || '', // Empty string will trigger fallback rendering
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    dimensions: spaceType?.model_3d_dimensions as unknown as ModelDimensions | undefined
  };

  // 2. Layout Furniture
  const furniture: FurnitureAsset[] = [];
  for (const zone of aiResult.zones) {
    for (const furnitureItem of zone.furniture || []) {
      const entity = entities?.find(e => e.id === furnitureItem.furniture_id);
      const entityType = entityTypes?.find(et => et.id === entity?.entity_type_id);
      
      if (entityType?.model_3d_url) {
        furniture.push({
          id: furnitureItem.furniture_id,
          type: 'furniture',
          model_url: entityType.model_3d_url,
          position: furnitureItem.position,
          rotation: furnitureItem.rotation,
          scale: (entity?.model_3d_scale as unknown as Vector3D) || { x: 1, y: 1, z: 1 },
          dimensions: entityType.model_3d_dimensions as unknown as ModelDimensions | undefined,
          furniture_type: entityType.name
        });
      }
    }
  }

  // 3. Place Products
  const products: ProductAsset[] = [];
  for (const zone of aiResult.zones) {
    for (const productItem of zone.products || []) {
      const entity = entities?.find(e => e.id === productItem.product_id);
      const entityType = entityTypes?.find(et => et.id === entity?.entity_type_id);
      
      if (entityType?.model_3d_url) {
        products.push({
          id: productItem.product_id,
          type: 'product',
          model_url: entityType.model_3d_url,
          position: productItem.position,
          rotation: { x: 0, y: 0, z: 0 },
          scale: (entity?.model_3d_scale as unknown as Vector3D) || { x: 1, y: 1, z: 1 },
          dimensions: entityType.model_3d_dimensions as unknown as ModelDimensions | undefined,
          product_id: entity?.id,
          sku: (entity?.properties as any)?.sku as string | undefined
        });
      }
    }
  }

  // 4. Select Lighting
  let lighting = DEFAULT_LIGHTING;
  if (aiResult.lighting_suggestion) {
    try {
      const response = await fetch(`/lighting-presets/${aiResult.lighting_suggestion}.json`);
      if (response.ok) {
        lighting = await response.json();
      }
    } catch (error) {
      console.warn('Failed to load lighting preset, using default', error);
    }
  }

  // 5. Apply Effects
  const effects = [];
  if (aiResult.heatmap_data) {
    effects.push({
      type: 'heatmap' as const,
      data: aiResult.heatmap_data,
      opacity: 0.6
    });
  }

  // 6. Load Staff Avatars
  const staff = await loadStaffAvatars(userId);

  // 7. Load Customer Avatars (for simulation)
  const customers = await loadCustomerAvatars(userId);

  return {
    space,
    furniture,
    products,
    staff,
    customers,
    lighting,
    effects,
    camera: {
      position: { x: 0, y: 10, z: 15 },
      target: { x: 0, y: 0, z: 0 },
      fov: 50
    }
  };
}

/**
 * Load staff avatars from staff table
 */
async function loadStaffAvatars(userId: string): Promise<StaffAsset[]> {
  const { data: staffData, error } = await supabase
    .from('staff')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.warn('Failed to load staff avatars:', error);
    return [];
  }

  return (staffData || [])
    .filter(s => (s as any).avatar_url)
    .map(s => {
      const staff = s as any;
      return {
        id: staff.id,
        type: 'staff' as const,
        model_url: staff.avatar_url!,
        position: (staff.avatar_position as Vector3D) || { x: 0, y: 0, z: 0 },
        rotation: (staff.avatar_rotation as Vector3D) || { x: 0, y: 0, z: 0 },
        scale: (staff.avatar_scale as Vector3D) || { x: 1, y: 1, z: 1 },
        staff_id: staff.id,
        staff_name: staff.staff_name,
        role: staff.role || 'staff',
        assigned_zone_id: staff.assigned_zone_id || staff.department
      };
    });
}

/**
 * Load customer avatars for simulation
 * Uses generic avatar models based on customer segment
 */
async function loadCustomerAvatars(userId: string): Promise<CustomerAsset[]> {
  const { data: customersData, error } = await supabase
    .from('customers')
    .select('*')
    .eq('user_id', userId)
    .not('avatar_url', 'is', null)
    .limit(50); // Limit for performance

  if (error) {
    console.warn('Failed to load customer avatars:', error);
    return [];
  }

  return (customersData || [])
    .filter(c => c.avatar_url)
    .map(c => ({
      id: c.id,
      type: 'customer' as const,
      model_url: c.avatar_url!,
      position: { x: 0, y: 0, z: 0 }, // Position will be determined by simulation
      rotation: { x: 0, y: 0, z: 0 },
      scale: { x: 1, y: 1, z: 1 },
      customer_id: c.id,
      customer_segment: (c.avatar_type as 'vip' | 'regular' | 'new') || 'regular',
      is_animated: false
    }));
}

/**
 * Generate scene recipe with store-specific data
 * Uses slot-based positioning for products when slot data is available
 */
export async function generateSceneRecipeForStore(
  storeId: string,
  userId: string
): Promise<SceneRecipe> {
  // Fetch store data (for 3D model URL)
  const { data: storeData } = await supabase
    .from('stores')
    .select('*')
    .eq('id', storeId)
    .single();

  // Fetch furniture for this store
  const { data: furnitureData } = await supabase
    .from('furniture')
    .select('*')
    .eq('store_id', storeId);

  // Fetch products with placement info
  const { data: productsData } = await supabase
    .from('products')
    .select('*')
    .eq('store_id', storeId);

  // 🔧 NEW: Fetch product_placements for display_type info
  const { data: placementsData } = await supabase
    .from('product_placements')
    .select('*')
    .eq('store_id', storeId)
    .eq('is_active', true);

  // 🔧 NEW: Fetch product_models for display_type-specific model URLs
  const { data: productModelsData } = await supabase
    .from('product_models')
    .select('*');

  // Fetch staff with avatars
  const { data: staffData } = await supabase
    .from('staff')
    .select('*')
    .eq('store_id', storeId);

  // Fetch furniture slots for slot-based positioning
  const slots = await loadFurnitureSlots(storeId);

  // Build space asset from store data
  const storeAny = storeData as any;
  const space: SpaceAsset = {
    id: storeAny?.id || 'main-space',
    type: 'space',
    model_url: storeAny?.model_3d_url || '',
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    zone_name: storeAny?.store_name || 'Store',
    dimensions: storeAny?.dimensions as unknown as ModelDimensions | undefined
  };

  // Build furniture array with 3D data
  const furniture: FurnitureAsset[] = (furnitureData || [])
    .filter(f => f.model_url)
    .map(f => {
      const fAny = f as any;
      const pos = fAny.position || { x: fAny.position_x || 0, y: fAny.position_y || 0, z: fAny.position_z || 0 };
      const rot = fAny.rotation || { x: fAny.rotation_x || 0, y: fAny.rotation_y || 0, z: fAny.rotation_z || 0 };
      const scl = fAny.scale || { x: fAny.scale_x || 1, y: fAny.scale_y || 1, z: fAny.scale_z || 1 };
      return {
        id: f.id,
        type: 'furniture' as const,
        model_url: f.model_url!,
        position: pos as Vector3D,
        rotation: rot as Vector3D,
        scale: scl as Vector3D,
        furniture_type: f.furniture_type,
        movable: f.movable ?? false,
        dimensions: {
          width: f.width || 1,
          height: f.height || 1,
          depth: f.depth || 1
        }
      };
    });

  // Create furniture position map for slot-based calculations
  const furnitureMap = new Map<string, FurnitureAsset>();
  for (const f of furniture) {
    furnitureMap.set(f.id, f);
  }

  // 🔧 FIX: Create reverse lookup map from product_id -> slot
  // furniture_slots.occupied_by_product_id tells us which product is in which slot
  const productToSlotMap = new Map<string, FurnitureSlot>();
  for (const slot of slots) {
    if (slot.occupied_by_product_id) {
      productToSlotMap.set(slot.occupied_by_product_id, slot);
    }
  }

  // 🔧 NEW: Create placement map (product_id -> placement with display_type)
  const placementMap = new Map<string, { slot_id: string; display_type: string }>();
  for (const placement of placementsData || []) {
    placementMap.set(placement.product_id, {
      slot_id: placement.slot_id,
      display_type: placement.display_type
    });
  }

  // 🔧 NEW: Create product_models map (product_id + display_type -> model_url)
  const productModelsMap = new Map<string, string>();
  for (const model of productModelsData || []) {
    const key = `${model.product_id}_${model.display_type}`;
    productModelsMap.set(key, model.model_3d_url);
  }

  console.log('[SceneRecipe] Product-to-slot mapping:', {
    totalSlots: slots.length,
    occupiedSlots: productToSlotMap.size,
    products: productsData?.length || 0,
    placements: placementMap.size,
    productModels: productModelsMap.size,
  });

  // Build products array with slot-based positioning
  const products: ProductAsset[] = (productsData || [])
    .filter(p => p.model_3d_url)
    .map(p => {
      // Default position from product data
      let position: Vector3D = (p.model_3d_position as unknown as Vector3D) || { x: 0, y: 0, z: 0 };
      let rotation: Vector3D = (p.model_3d_rotation as unknown as Vector3D) || { x: 0, y: 0, z: 0 };
      let furnitureId: string | undefined = p.initial_furniture_id;
      let slotId: string | undefined = p.slot_id;

      // 🔧 NEW: Get display_type from product_placements
      const placement = placementMap.get(p.id);
      const placedDisplayType = placement?.display_type;

      // 🔧 NEW: Select model URL based on display_type from product_models
      // Priority: product_models[display_type] > products.model_3d_url (fallback)
      let modelUrl = p.model_3d_url!;
      if (placedDisplayType) {
        const modelKey = `${p.id}_${placedDisplayType}`;
        const displayTypeModelUrl = productModelsMap.get(modelKey);
        if (displayTypeModelUrl) {
          modelUrl = displayTypeModelUrl;
          console.log(`[SceneRecipe] Product ${p.sku} using display_type '${placedDisplayType}' model: ${displayTypeModelUrl}`);
        } else {
          console.log(`[SceneRecipe] Product ${p.sku} no model for display_type '${placedDisplayType}', using default: ${modelUrl}`);
        }
      }

      // 🔧 FIX: First try reverse lookup from furniture_slots.occupied_by_product_id
      const occupiedSlot = productToSlotMap.get(p.id);
      if (occupiedSlot) {
        const parentFurniture = furnitureMap.get(occupiedSlot.furniture_id);
        if (parentFurniture) {
          // Calculate world position using slot-based auto-snap
          const snapResult = calculateSlotWorldPosition(
            parentFurniture.position,
            parentFurniture.rotation,
            occupiedSlot.slot_position,
            occupiedSlot.slot_rotation
          );
          position = snapResult.world_position;
          rotation = snapResult.world_rotation;
          furnitureId = occupiedSlot.furniture_id;
          slotId = occupiedSlot.slot_id;

          console.log(`[SceneRecipe] Product ${p.sku} positioned at slot ${slotId} on furniture ${parentFurniture.furniture_type}:`, position);
        }
      }
      // Fallback: If product has direct slot assignment in products table
      else if (p.initial_furniture_id && p.slot_id) {
        const parentFurniture = furnitureMap.get(p.initial_furniture_id);
        const slot = slots.find(s =>
          s.furniture_id === p.initial_furniture_id &&
          s.slot_id === p.slot_id
        );

        if (parentFurniture && slot) {
          // Calculate world position using slot-based auto-snap
          const snapResult = calculateSlotWorldPosition(
            parentFurniture.position,
            parentFurniture.rotation,
            slot.slot_position,
            slot.slot_rotation
          );
          position = snapResult.world_position;
          rotation = snapResult.world_rotation;
        }
      }

      return {
        id: p.id,
        type: 'product' as const,
        model_url: modelUrl,  // 🔧 CHANGED: Use display_type-based model URL
        position,
        rotation,
        scale: (p.model_3d_scale as unknown as Vector3D) || { x: 1, y: 1, z: 1 },
        product_id: p.id,
        sku: p.sku,
        movable: p.movable ?? true,
        initial_furniture_id: furnitureId,  // 🔧 Use resolved furniture ID
        slot_id: slotId                      // 🔧 Use resolved slot ID
      };
    });

  // Build staff array with avatars
  const staff: StaffAsset[] = (staffData || [])
    .filter(s => (s as any).avatar_url)
    .map(s => {
      const sAny = s as any;
      return {
        id: s.id,
        type: 'staff' as const,
        model_url: sAny.avatar_url!,
        position: (sAny.avatar_position as Vector3D) || { x: 0, y: 0, z: 0 },
        rotation: (sAny.avatar_rotation as Vector3D) || { x: 0, y: 0, z: 0 },
        scale: (sAny.avatar_scale as Vector3D) || { x: 1, y: 1, z: 1 },
        staff_id: s.id,
        staff_name: s.staff_name,
        role: s.role || 'staff',
        assigned_zone_id: sAny.assigned_zone_id || s.department
      };
    });

  return {
    space,
    furniture,
    products,
    staff,
    customers: [], // Customers loaded for simulation
    lighting: DEFAULT_LIGHTING,
    effects: [],
    camera: {
      position: { x: 0, y: 10, z: 15 },
      target: { x: 0, y: 0, z: 0 },
      fov: 50
    }
  };
}

// =====================================================
// Slot-Based Auto-Snap Rendering Logic
// =====================================================

/**
 * Load furniture slots for a store
 */
async function loadFurnitureSlots(storeId: string): Promise<FurnitureSlot[]> {
  const { data, error } = await supabase
    .from('furniture_slots')
    .select('*')
    .eq('store_id', storeId);

  if (error) {
    console.warn('Failed to load furniture slots:', error);
    return [];
  }

  return (data || []).map(s => {
    const slot = s as any;
    return {
      id: slot.id,
      furniture_id: slot.furniture_id,
      furniture_type: slot.furniture_type,
      slot_id: slot.slot_id,
      slot_type: slot.slot_type as any,
      slot_position: (slot.slot_position as unknown as Vector3D) || { x: 0, y: 0, z: 0 },
      slot_rotation: (slot.slot_rotation as unknown as Vector3D) || { x: 0, y: 0, z: 0 },
      compatible_display_types: slot.compatible_display_types as ProductDisplayType[] || ['standing'],
      max_product_width: slot.max_product_width,
      max_product_height: slot.max_product_height,
      max_product_depth: slot.max_product_depth,
      is_occupied: slot.is_occupied || false,
      occupied_by_product_id: slot.occupied_by_product_id
    };
  });
}

/**
 * Check if product display type is compatible with slot
 */
function isDisplayTypeCompatible(
  productDisplayType: ProductDisplayType | undefined,
  slotCompatibleTypes: ProductDisplayType[] | undefined
): boolean {
  if (!productDisplayType || !slotCompatibleTypes || slotCompatibleTypes.length === 0) {
    return true; // Allow if not specified
  }
  return slotCompatibleTypes.includes(productDisplayType);
}

/**
 * Calculate world position from furniture position + slot relative position
 * Handles rotation transformation
 */
function calculateSlotWorldPosition(
  furniturePosition: Vector3D,
  furnitureRotation: Vector3D,
  slotRelativePosition: Vector3D,
  slotRelativeRotation: Vector3D
): SlotSnapResult {
  // Convert rotation from degrees to radians
  const radY = (furnitureRotation.y * Math.PI) / 180;

  // Apply Y-axis rotation to slot relative position
  const rotatedX = slotRelativePosition.x * Math.cos(radY) - slotRelativePosition.z * Math.sin(radY);
  const rotatedZ = slotRelativePosition.x * Math.sin(radY) + slotRelativePosition.z * Math.cos(radY);

  // Calculate world position
  const worldPosition: Vector3D = {
    x: furniturePosition.x + rotatedX,
    y: furniturePosition.y + slotRelativePosition.y,
    z: furniturePosition.z + rotatedZ
  };

  // Calculate world rotation (additive)
  const worldRotation: Vector3D = {
    x: furnitureRotation.x + slotRelativeRotation.x,
    y: furnitureRotation.y + slotRelativeRotation.y,
    z: furnitureRotation.z + slotRelativeRotation.z
  };

  return {
    world_position: worldPosition,
    world_rotation: worldRotation,
    slot_id: '',
    furniture_id: '',
    furniture_world_position: furniturePosition,
    furniture_world_rotation: furnitureRotation
  };
}

/**
 * Apply AI optimization results to scene recipe
 * Products automatically snap to their new furniture slots
 */
export async function applyOptimizedPlacements(
  baseRecipe: SceneRecipe,
  optimizationResult: AILayoutOptimizationResult,
  storeId: string
): Promise<SceneRecipe> {
  // Load furniture slots
  const slots = await loadFurnitureSlots(storeId);

  // Create furniture position map
  const furnitureMap = new Map<string, FurnitureAsset>();
  for (const f of baseRecipe.furniture) {
    furnitureMap.set(f.id, f);
  }

  // Apply furniture changes first (furniture can move)
  const updatedFurniture = baseRecipe.furniture.map(f => {
    const change = optimizationResult.furniture_changes.find(c => c.furniture_id === f.id);
    if (change && f.movable !== false) {
      return {
        ...f,
        position: change.suggested.position,
        rotation: change.suggested.rotation,
        suggested_position: change.suggested.position,
        suggested_rotation: change.suggested.rotation,
        optimization_reason: change.reason
      };
    }
    return f;
  });

  // Rebuild furniture map with updated positions
  furnitureMap.clear();
  for (const f of updatedFurniture) {
    furnitureMap.set(f.id, f);
  }

  // Apply product changes with slot snapping
  const updatedProducts = baseRecipe.products.map(p => {
    const change = optimizationResult.product_changes.find(c => c.product_id === p.id);

    if (change && p.movable !== false) {
      const targetFurniture = furnitureMap.get(change.suggested.furniture_id);

      // Find compatible slot (check display type compatibility)
      const targetSlot = slots.find(
        s => s.furniture_id === change.suggested.furniture_id &&
             s.slot_id === change.suggested.slot_id &&
             isDisplayTypeCompatible(p.display_type, s.compatible_display_types)
      );

      // If exact slot not compatible, try to find any compatible slot on same furniture
      const fallbackSlot = !targetSlot ? slots.find(
        s => s.furniture_id === change.suggested.furniture_id &&
             !s.is_occupied &&
             isDisplayTypeCompatible(p.display_type, s.compatible_display_types)
      ) : null;

      const selectedSlot = targetSlot || fallbackSlot;

      if (targetFurniture && selectedSlot) {
        // Auto-snap: calculate world position from furniture + slot
        const snapResult = calculateSlotWorldPosition(
          targetFurniture.position,
          targetFurniture.rotation,
          selectedSlot.slot_position,
          selectedSlot.slot_rotation
        );

        return {
          ...p,
          position: snapResult.world_position,
          rotation: snapResult.world_rotation,
          suggested_position: snapResult.world_position,
          suggested_rotation: snapResult.world_rotation,
          initial_furniture_id: change.suggested.furniture_id,
          slot_id: selectedSlot.slot_id,
          optimization_reason: change.reason + (fallbackSlot ? ' (slot adjusted for display type compatibility)' : ''),
          expected_impact: {
            revenue_change_pct: change.expected_revenue_impact,
            visibility_score: change.expected_visibility_impact,
            accessibility_score: 0.8
          }
        };
      }

      // Skip if display type not compatible with any slot on target furniture
      if (targetFurniture && !selectedSlot) {
        console.warn(
          `Product ${p.id} (display_type: ${p.display_type}) not compatible with any slot on furniture ${change.suggested.furniture_id}`
        );
        return p; // Keep original position
      }

      // Fallback: use suggested position directly (no slot info available)
      return {
        ...p,
        position: change.suggested.position,
        suggested_position: change.suggested.position,
        initial_furniture_id: change.suggested.furniture_id,
        slot_id: change.suggested.slot_id,
        optimization_reason: change.reason
      };
    }

    return p;
  });

  return {
    ...baseRecipe,
    furniture: updatedFurniture,
    products: updatedProducts,
    effects: [
      ...(baseRecipe.effects || []),
      {
        type: 'ai_suggestion',
        data: {
          optimization_id: optimizationResult.optimization_id,
          summary: optimizationResult.summary
        },
        opacity: 0.8
      }
    ]
  };
}

/**
 * Generate scene with optimized placements directly from optimization result ID
 */
export async function generateOptimizedSceneRecipe(
  storeId: string,
  userId: string,
  optimizationResultId: string
): Promise<SceneRecipe> {
  // Load base scene
  const baseRecipe = await generateSceneRecipeForStore(storeId, userId);

  // Load optimization result
  const { data: optResult, error } = await supabase
    .from('layout_optimization_results')
    .select('*')
    .eq('id', optimizationResultId)
    .single();

  if (error || !optResult) {
    console.warn('Optimization result not found, returning base recipe');
    return baseRecipe;
  }

  // Convert to AILayoutOptimizationResult type
  const optimizationResult: AILayoutOptimizationResult = {
    optimization_id: optResult.id,
    store_id: optResult.store_id,
    created_at: optResult.created_at,
    optimization_type: optResult.optimization_type as 'furniture' | 'product' | 'both',
    furniture_changes: optResult.furniture_changes as any[] || [],
    product_changes: optResult.product_changes as any[] || [],
    summary: {
      total_furniture_changes: optResult.total_furniture_changes || 0,
      total_product_changes: optResult.total_product_changes || 0,
      expected_revenue_improvement: optResult.expected_revenue_improvement || 0,
      expected_traffic_improvement: optResult.expected_traffic_improvement || 0,
      expected_conversion_improvement: optResult.expected_conversion_improvement || 0
    }
  };

  // Apply optimizations with auto-snap
  return applyOptimizedPlacements(baseRecipe, optimizationResult, storeId);
}

/**
 * Preview product placement at a specific slot
 * Returns the calculated world position without saving
 */
export function previewProductAtSlot(
  furniture: FurnitureAsset,
  slot: FurnitureSlot,
  product: ProductAsset
): ProductAsset {
  const snapResult = calculateSlotWorldPosition(
    furniture.position,
    furniture.rotation,
    slot.slot_position,
    slot.slot_rotation
  );

  return {
    ...product,
    position: snapResult.world_position,
    rotation: snapResult.world_rotation,
    initial_furniture_id: furniture.id,
    slot_id: slot.slot_id
  };
}
