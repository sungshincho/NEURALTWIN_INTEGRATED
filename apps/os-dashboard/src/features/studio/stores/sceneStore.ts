/**
 * sceneStore.ts
 *
 * 3D 씬 상태 관리 Zustand 스토어
 * - Context 기반에서 Zustand로 마이그레이션하여 성능 최적화
 * - 선택적 구독으로 불필요한 리렌더링 방지
 */

import { create } from 'zustand';
import type {
  StudioMode,
  SceneState,
  Model3D,
  SceneLayer,
  CameraSettings,
  Vector3Tuple,
  ProductPlacement,
} from '../types';

// ============================================================================
// 시뮬레이션 결과 적용을 위한 타입
// ============================================================================
export interface FurnitureMove {
  furnitureId: string;
  furnitureName: string;
  fromPosition: { x: number; y: number; z: number };
  toPosition: { x: number; y: number; z: number };
  rotation?: number;
}

export interface SimulationResultsPayload {
  furnitureMoves?: FurnitureMove[];
  productPlacements?: ProductPlacement[];
  animated?: boolean;
}

// ============================================================================
// Store 타입 정의
// ============================================================================
interface SceneStoreState extends SceneState {
  // 파생 상태
  selectedModel: Model3D | null;
}

interface SceneStoreActions {
  // 모드
  setMode: (mode: StudioMode) => void;

  // 모델 관리
  addModel: (model: Model3D) => void;
  updateModel: (id: string, updates: Partial<Model3D>) => void;
  removeModel: (id: string) => void;
  setModels: (models: Model3D[]) => void;

  // 선택
  select: (id: string | null) => void;
  hover: (id: string | null) => void;

  // 레이어
  addLayer: (layer: SceneLayer) => void;
  updateLayer: (id: string, updates: Partial<SceneLayer>) => void;
  removeLayer: (id: string) => void;
  toggleLayerVisibility: (id: string) => void;

  // 오버레이
  toggleOverlay: (overlayId: string) => void;
  setActiveOverlays: (overlays: string[]) => void;
  isOverlayActive: (overlayId: string) => boolean;

  // 카메라
  setCamera: (settings: Partial<CameraSettings>) => void;

  // 씬 관리
  loadScene: (scene: Partial<SceneState>) => void;
  resetScene: () => void;
  setDirty: (dirty: boolean) => void;

  // 시뮬레이션
  applySimulationResults: (results: SimulationResultsPayload) => void;
  revertSimulationChanges: () => void;

  // 제품 가시성
  toggleProductVisibility: (productId: string) => void;
  isProductVisible: (productId: string) => boolean;

  // 카메라 포커스
  focusOnModel: (modelId: string) => void;

  // 초기화 (Provider에서 사용)
  initialize: (mode: StudioMode, initialModels: Model3D[]) => void;
}

type SceneStore = SceneStoreState & SceneStoreActions;

// ============================================================================
// 초기 상태
// ============================================================================
const initialState: SceneStoreState = {
  mode: 'view',
  models: [],
  layers: [],
  selectedId: null,
  hoveredId: null,
  activeOverlays: [],
  camera: {
    position: { x: 10, y: 10, z: 15 },
    target: { x: 0, y: 0, z: 0 },
    fov: 50,
  },
  isDirty: false,
  selectedModel: null,
};

// ============================================================================
// Zustand Store
// ============================================================================
export const useSceneStore = create<SceneStore>((set, get) => ({
  ...initialState,

  // =========================================================================
  // 초기화
  // =========================================================================
  initialize: (mode, initialModels) => {
    set({
      mode,
      models: initialModels,
      selectedModel: null,
      selectedId: null,
    });
  },

  // =========================================================================
  // 모드
  // =========================================================================
  setMode: (mode) => set({ mode }),

  // =========================================================================
  // 모델 관리
  // =========================================================================
  addModel: (model) =>
    set((state) => ({
      models: [...state.models, model],
      isDirty: true,
    })),

  updateModel: (id, updates) =>
    set((state) => {
      const models = state.models.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      );
      const selectedModel = state.selectedId
        ? models.find((m) => m.id === state.selectedId) || null
        : null;
      return { models, selectedModel, isDirty: true };
    }),

  removeModel: (id) =>
    set((state) => ({
      models: state.models.filter((m) => m.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
      selectedModel: state.selectedId === id ? null : state.selectedModel,
      isDirty: true,
    })),

  setModels: (models) =>
    set((state) => {
      // 새 models에서 기존 selectedId로 모델 찾기
      const selectedModel = state.selectedId
        ? models.find((m) => m.id === state.selectedId) || null
        : null;
      // 못 찾으면 selectedId도 null로 초기화
      const selectedId = selectedModel ? state.selectedId : null;
      return { models, selectedModel, selectedId, isDirty: true };
    }),

  // =========================================================================
  // 선택
  // =========================================================================
  select: (id) =>
    set((state) => {
      const selectedModel = id
        ? state.models.find((m) => m.id === id) || null
        : null;
      return { selectedId: id, selectedModel };
    }),

  hover: (id) => set({ hoveredId: id }),

  // =========================================================================
  // 레이어
  // =========================================================================
  addLayer: (layer) =>
    set((state) => ({
      layers: [...state.layers, layer],
      isDirty: true,
    })),

  updateLayer: (id, updates) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, ...updates } : l
      ),
      isDirty: true,
    })),

  removeLayer: (id) =>
    set((state) => ({
      layers: state.layers.filter((l) => l.id !== id),
      isDirty: true,
    })),

  toggleLayerVisibility: (id) =>
    set((state) => ({
      layers: state.layers.map((l) =>
        l.id === id ? { ...l, visible: !l.visible } : l
      ),
      isDirty: true,
    })),

  // =========================================================================
  // 오버레이
  // =========================================================================
  toggleOverlay: (overlayId) =>
    set((state) => ({
      activeOverlays: state.activeOverlays.includes(overlayId)
        ? state.activeOverlays.filter((o) => o !== overlayId)
        : [...state.activeOverlays, overlayId],
    })),

  setActiveOverlays: (overlays) => set({ activeOverlays: overlays }),

  isOverlayActive: (overlayId) => get().activeOverlays.includes(overlayId),

  // =========================================================================
  // 카메라
  // =========================================================================
  setCamera: (settings) =>
    set((state) => ({
      camera: { ...state.camera, ...settings },
    })),

  // =========================================================================
  // 씬 관리
  // =========================================================================
  loadScene: (scene) =>
    set((state) => ({
      ...state,
      ...scene,
      isDirty: false,
    })),

  resetScene: () => set(initialState),

  setDirty: (dirty) => set({ isDirty: dirty }),

  // =========================================================================
  // 시뮬레이션 결과 적용
  // =========================================================================
  applySimulationResults: (results) => {
    const { furnitureMoves, productPlacements } = results;
    const state = get();

    const hasFurnitureMoves = furnitureMoves && furnitureMoves.length > 0;
    const hasProductPlacements = productPlacements && productPlacements.length > 0;
    if (!hasFurnitureMoves && !hasProductPlacements) return;

    // childProducts 재배치를 위한 사전 처리
    const childProductMoves = new Map<string, {
      productId: string;
      fromFurnitureId: string;
      toFurnitureId: string;
      productData: any;
      newPosition: { x: number; y: number; z: number };
      newSlotId: string | null;
      reason?: string;
    }>();

    if (hasProductPlacements) {
      state.models.forEach((model) => {
        if (model.type === 'furniture' && (model.metadata as any)?.childProducts) {
          const childProducts = (model.metadata as any).childProducts as any[];
          childProducts.forEach((cp) => {
            const placement = productPlacements!.find(
              (p) => p.productId === cp.id || p.productSku === cp.metadata?.sku || p.productSku === cp.name
            );
            if (placement && placement.toFurnitureId && placement.toFurnitureId !== model.id) {
              childProductMoves.set(cp.id, {
                productId: cp.id,
                fromFurnitureId: model.id,
                toFurnitureId: placement.toFurnitureId,
                productData: cp,
                newPosition: placement.toSlotPosition || placement.toPosition || cp.position,
                newSlotId: placement.toSlotId || null,
                reason: placement.reason,
              });
            }
          });
        }
      });
    }

    console.log('[sceneStore] APPLY_SIMULATION - childProduct moves:', childProductMoves.size);

    const updatedModels = state.models.map((model) => {
      // 가구 이동 처리
      if (model.type === 'furniture') {
        let updatedModel = model;
        let needsUpdate = false;

        if (hasFurnitureMoves) {
          const modelFurnitureId = (model.metadata as any)?.furnitureId;
          const move = furnitureMoves!.find(
            (m) => m.furnitureId === model.id ||
                   m.furnitureId === modelFurnitureId ||
                   m.furnitureName === model.name
          );

          if (move) {
            const newPosition: Vector3Tuple = [
              move.toPosition.x,
              move.toPosition.y,
              move.toPosition.z,
            ];

            const newRotation: Vector3Tuple = move.rotation
              ? [model.rotation[0], move.rotation * (Math.PI / 180), model.rotation[2]]
              : model.rotation;

            updatedModel = {
              ...updatedModel,
              position: newPosition,
              rotation: newRotation,
              metadata: {
                ...updatedModel.metadata,
                movedBySimulation: true,
                previousPosition: model.position,
                previousRotation: model.rotation,
                simulationType: 'furniture_move',
              },
            };
            needsUpdate = true;
          }
        }

        // childProducts 재배치 처리
        if (childProductMoves.size > 0) {
          const currentChildProducts = ((updatedModel.metadata as any)?.childProducts as any[]) || [];
          const modelRawFurnitureId = (model.metadata as any)?.furnitureId;
          const productsToRemove = new Set<string>();

          childProductMoves.forEach((move, productId) => {
            if (move.fromFurnitureId === model.id || move.fromFurnitureId === modelRawFurnitureId) {
              productsToRemove.add(productId);
            }
          });

          const productsToAdd: any[] = [];
          childProductMoves.forEach((move) => {
            if (move.toFurnitureId === model.id || move.toFurnitureId === modelRawFurnitureId) {
              productsToAdd.push({
                ...move.productData,
                position: move.newPosition,
                metadata: {
                  ...move.productData.metadata,
                  slot_id: move.newSlotId,
                  movedBySimulation: true,
                  placementReason: move.reason,
                },
              });
            }
          });

          if (productsToRemove.size > 0 || productsToAdd.length > 0) {
            console.log(`[sceneStore] Furniture ${model.id}: removing ${productsToRemove.size}, adding ${productsToAdd.length} products`);

            const newChildProducts = [
              ...currentChildProducts.filter((cp) => !productsToRemove.has(cp.id)),
              ...productsToAdd,
            ];

            updatedModel = {
              ...updatedModel,
              metadata: {
                ...updatedModel.metadata,
                childProducts: newChildProducts,
                childProductsModified: true,
              },
            };
            needsUpdate = true;
          }
        }

        if (needsUpdate) {
          return updatedModel;
        }
      }

      // 상품 재배치 처리
      if (hasProductPlacements && model.type === 'product') {
        const modelProductId = (model.metadata as any)?.productId;
        const placement = productPlacements!.find(
          (p) => p.productId === model.id ||
                 p.productId === modelProductId ||
                 p.productSku === model.metadata?.sku
        );

        if (placement) {
          let newPosition: Vector3Tuple = model.position;

          if (placement.toPosition) {
            newPosition = [
              placement.toPosition.x,
              placement.toPosition.y,
              placement.toPosition.z,
            ];
          } else if (placement.toSlotPosition) {
            const targetFurniture = state.models.find(
              (m) => m.id === placement.toFurnitureId ||
                     m.id === `furniture-${placement.toFurnitureId}` ||
                     m.metadata?.furnitureId === placement.toFurnitureId
            );

            if (targetFurniture) {
              newPosition = [
                targetFurniture.position[0] + placement.toSlotPosition.x,
                targetFurniture.position[1] + placement.toSlotPosition.y,
                targetFurniture.position[2] + placement.toSlotPosition.z,
              ];
            }
          } else {
            const targetFurniture = state.models.find(
              (m) => m.id === placement.toFurnitureId ||
                     m.id === `furniture-${placement.toFurnitureId}` ||
                     m.metadata?.furnitureId === placement.toFurnitureId
            );

            if (targetFurniture) {
              const slotOffsets: Record<string, { x: number; y: number; z: number }> = {
                hanger: { x: 0, y: 1.5, z: 0 },
                mannequin: { x: 0, y: 1.0, z: 0 },
                shelf: { x: 0, y: 0.8, z: 0 },
                table: { x: 0, y: 0.75, z: 0 },
                rack: { x: 0, y: 1.2, z: 0 },
                hook: { x: 0, y: 1.4, z: 0 },
                drawer: { x: 0, y: 0.3, z: 0 },
              };

              const offset = slotOffsets[placement.slotType || 'shelf'] || { x: 0, y: 0.8, z: 0 };

              newPosition = [
                targetFurniture.position[0] + offset.x,
                targetFurniture.position[1] + offset.y,
                targetFurniture.position[2] + offset.z,
              ];
            }
          }

          return {
            ...model,
            position: newPosition,
            metadata: {
              ...model.metadata,
              movedBySimulation: true,
              previousPosition: model.position,
              previousFurnitureId: model.metadata?.furniture_id,
              previousSlotId: model.metadata?.slot_id,
              furniture_id: placement.toFurnitureId,
              slot_id: placement.toSlotId,
              slot_type: placement.slotType,
              display_type: placement.displayType,
              simulationType: 'product_placement',
              placementReason: placement.reason,
            },
          };
        }
      }

      return model;
    });

    set({ models: updatedModels, isDirty: true });
  },

  // =========================================================================
  // 시뮬레이션 결과 되돌리기
  // =========================================================================
  revertSimulationChanges: () => {
    const state = get();
    const revertedModels = state.models.map((model) => {
      if (model.metadata?.movedBySimulation && model.metadata?.previousPosition) {
        return {
          ...model,
          position: model.metadata.previousPosition as Vector3Tuple,
          rotation: (model.metadata.previousRotation as Vector3Tuple) || model.rotation,
          metadata: {
            ...model.metadata,
            movedBySimulation: false,
            previousPosition: undefined,
            previousRotation: undefined,
          },
        };
      }
      return model;
    });

    set({ models: revertedModels, isDirty: true });
  },

  // =========================================================================
  // 제품 가시성
  // =========================================================================
  toggleProductVisibility: (productId) => {
    const state = get();
    const updatedModels = state.models.map((model) => {
      if (model.type !== 'furniture') return model;

      const childProducts = (model.metadata as any)?.childProducts as any[] | undefined;
      if (!childProducts) return model;

      const productIndex = childProducts.findIndex((cp) => cp.id === productId);
      if (productIndex === -1) return model;

      const newChildProducts = childProducts.map((cp, idx) => {
        if (idx !== productIndex) return cp;
        const currentVisible = cp.visible !== false;
        return { ...cp, visible: !currentVisible };
      });

      console.log(`[sceneStore] TOGGLE_PRODUCT_VISIBILITY: ${productId} -> visible: ${!childProducts[productIndex].visible}`);

      return {
        ...model,
        metadata: {
          ...model.metadata,
          childProducts: newChildProducts,
        },
      };
    });

    set({ models: updatedModels, isDirty: true });
  },

  isProductVisible: (productId) => {
    const state = get();
    for (const model of state.models) {
      if (model.type !== 'furniture') continue;

      const childProducts = (model.metadata as any)?.childProducts as any[] | undefined;
      if (!childProducts) continue;

      const product = childProducts.find((cp) => cp.id === productId);
      if (product) {
        return product.visible !== false;
      }
    }
    return true;
  },

  // =========================================================================
  // 카메라 포커스
  // =========================================================================
  focusOnModel: (modelId) => {
    const state = get();
    let targetModel = state.models.find((m) => m.id === modelId);

    // childProduct인 경우 부모 가구 찾기
    if (!targetModel) {
      for (const model of state.models) {
        if (model.type === 'furniture') {
          const childProducts = (model.metadata as any)?.childProducts as any[] | undefined;
          if (childProducts) {
            const child = childProducts.find((cp: any) => cp.id === modelId);
            if (child) {
              const childPos = child.position || { x: 0, y: 0, z: 0 };
              targetModel = {
                ...model,
                id: modelId,
                position: [
                  model.position[0] + childPos.x,
                  model.position[1] + childPos.y,
                  model.position[2] + childPos.z,
                ] as Vector3Tuple,
                rotation: model.rotation,
              };
              break;
            }
          }
        }
      }
    }

    if (!targetModel) {
      get().select(modelId);
      return;
    }

    const [x, y, z] = targetModel.position;
    const rotationY = targetModel.rotation[1];

    const FOCUS_DISTANCE = 10;
    const POLAR_ANGLE = Math.PI / 4;

    const horizontalDist = FOCUS_DISTANCE * Math.sin(POLAR_ANGLE);
    const verticalDist = FOCUS_DISTANCE * Math.cos(POLAR_ANGLE);

    const cameraOffset = {
      x: horizontalDist * Math.sin(rotationY),
      y: verticalDist,
      z: horizontalDist * Math.cos(rotationY),
    };

    const clampedTarget = {
      x: Math.max(-12, Math.min(12, x)),
      y: Math.max(0, Math.min(5, y)),
      z: Math.max(-12, Math.min(12, z)),
    };

    const cameraPosition = {
      x: clampedTarget.x + cameraOffset.x,
      y: clampedTarget.y + cameraOffset.y,
      z: clampedTarget.z + cameraOffset.z,
    };

    console.log('[sceneStore] focusOnModel:', {
      modelId,
      targetPosition: [x, y, z],
      rotationY: (rotationY * 180 / Math.PI).toFixed(1) + '°',
      cameraTarget: clampedTarget,
      cameraPosition,
    });

    set({
      camera: {
        ...state.camera,
        target: clampedTarget,
        position: cameraPosition,
      },
      selectedId: modelId,
      selectedModel: targetModel,
    });
  },
}));

export default useSceneStore;
