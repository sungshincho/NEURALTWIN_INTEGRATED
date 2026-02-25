/**
 * PlacementEditor.tsx
 *
 * 상품 배치 편집기 컴포넌트
 * - 드래그&드롭으로 상품 이동
 * - 슬롯 자동 스냅
 * - 호환성 실시간 체크
 * - 배치 변경 이력 관리
 */

import { useState, useCallback, useMemo, useRef } from 'react';
import { Canvas, useThree, ThreeEvent } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, TransformControls, Html, Grid } from '@react-three/drei';
import * as THREE from 'three';
import type {
  SceneRecipe,
  ProductAsset,
  FurnitureAsset,
  FurnitureSlot,
  ProductDisplayType,
  Vector3D,
} from '@/types/scene3d';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Undo2, Redo2, Save, Eye, EyeOff, Grid3X3, AlertCircle, CheckCircle2 } from 'lucide-react';

// ============================================================================
// 타입 정의
// ============================================================================

interface PlacementChange {
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

interface PlacementEditorProps {
  recipe: SceneRecipe;
  slots: FurnitureSlot[];
  onSave?: (updatedProducts: ProductAsset[], changes: PlacementChange[]) => void;
  onCancel?: () => void;
  height?: string;
}

interface DragState {
  isDragging: boolean;
  productId: string | null;
  startPosition: Vector3D | null;
  currentPosition: Vector3D | null;
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

function vectorToTuple(v: Vector3D): [number, number, number] {
  return [v.x, v.y, v.z];
}

function tupleToVector(t: [number, number, number]): Vector3D {
  return { x: t[0], y: t[1], z: t[2] };
}

function isDisplayTypeCompatible(
  productDisplayType: ProductDisplayType | undefined,
  slotCompatibleTypes: ProductDisplayType[] | undefined
): boolean {
  if (!productDisplayType || !slotCompatibleTypes || slotCompatibleTypes.length === 0) {
    return true;
  }
  return slotCompatibleTypes.includes(productDisplayType);
}

function calculateSlotWorldPosition(
  furniturePosition: Vector3D,
  furnitureRotation: Vector3D,
  slotRelativePosition: Vector3D
): Vector3D {
  const radY = (furnitureRotation.y * Math.PI) / 180;
  const rotatedX =
    slotRelativePosition.x * Math.cos(radY) - slotRelativePosition.z * Math.sin(radY);
  const rotatedZ =
    slotRelativePosition.x * Math.sin(radY) + slotRelativePosition.z * Math.cos(radY);

  return {
    x: furniturePosition.x + rotatedX,
    y: furniturePosition.y + slotRelativePosition.y,
    z: furniturePosition.z + rotatedZ,
  };
}

function findNearestCompatibleSlot(
  position: Vector3D,
  displayType: ProductDisplayType | undefined,
  slots: FurnitureSlot[],
  furniture: FurnitureAsset[],
  maxDistance: number = 0.5
): { slot: FurnitureSlot; worldPosition: Vector3D } | null {
  let nearest: { slot: FurnitureSlot; worldPosition: Vector3D; distance: number } | null = null;

  for (const slot of slots) {
    // 점유 체크
    if (slot.is_occupied) continue;

    // 호환성 체크
    if (!isDisplayTypeCompatible(displayType, slot.compatible_display_types)) continue;

    // 가구 찾기
    const furn = furniture.find((f) => f.id === slot.furniture_id);
    if (!furn) continue;

    // 슬롯 월드 좌표 계산
    const worldPos = calculateSlotWorldPosition(furn.position, furn.rotation, slot.slot_position);

    // 거리 계산
    const distance = Math.sqrt(
      Math.pow(position.x - worldPos.x, 2) +
        Math.pow(position.y - worldPos.y, 2) +
        Math.pow(position.z - worldPos.z, 2)
    );

    if (distance < maxDistance && (!nearest || distance < nearest.distance)) {
      nearest = { slot, worldPosition: worldPos, distance };
    }
  }

  return nearest ? { slot: nearest.slot, worldPosition: nearest.worldPosition } : null;
}

// ============================================================================
// 드래그 가능한 상품 컴포넌트
// ============================================================================

interface DraggableProductProps {
  product: ProductAsset;
  isSelected: boolean;
  isCompatible: boolean;
  onSelect: () => void;
  onDragStart: (position: Vector3D) => void;
  onDragEnd: (position: Vector3D) => void;
  onPositionChange: (position: Vector3D) => void;
}

function DraggableProduct({
  product,
  isSelected,
  isCompatible,
  onSelect,
  onDragStart,
  onDragEnd,
  onPositionChange,
}: DraggableProductProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hovered, setHovered] = useState(false);

  const dimensions = product.dimensions || { width: 0.3, height: 0.4, depth: 0.2 };

  // 색상 결정
  const color = useMemo(() => {
    if (!isCompatible) return '#ef4444'; // 빨강 - 비호환
    if (isSelected) return '#f59e0b'; // 주황 - 선택됨
    if (hovered) return '#8b5cf6'; // 보라 - 호버
    return '#3b82f6'; // 파랑 - 기본
  }, [isCompatible, isSelected, hovered]);

  const handlePointerDown = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    onSelect();
    setIsDragging(true);
    onDragStart(product.position);
  };

  const handlePointerUp = (e: ThreeEvent<PointerEvent>) => {
    if (isDragging && meshRef.current) {
      setIsDragging(false);
      const pos = meshRef.current.position;
      onDragEnd({ x: pos.x, y: pos.y, z: pos.z });
    }
  };

  // degrees → radians 변환
  const rotation: [number, number, number] = [
    (product.rotation.x || 0) * Math.PI / 180,
    (product.rotation.y || 0) * Math.PI / 180,
    (product.rotation.z || 0) * Math.PI / 180,
  ];

  return (
    <group
      position={vectorToTuple(product.position)}
      rotation={rotation}
    >
      <mesh
        ref={meshRef}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        castShadow
      >
        <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
        <meshStandardMaterial
          color={color}
          metalness={0.3}
          roughness={0.7}
          transparent={isDragging}
          opacity={isDragging ? 0.6 : 1}
        />
      </mesh>

      {/* 선택 테두리 */}
      {isSelected && (
        <mesh>
          <boxGeometry
            args={[dimensions.width + 0.05, dimensions.height + 0.05, dimensions.depth + 0.05]}
          />
          <meshBasicMaterial color="#f59e0b" wireframe />
        </mesh>
      )}

      {/* 상품 정보 라벨 */}
      {(isSelected || hovered) && (
        <Html position={[0, dimensions.height / 2 + 0.3, 0]} center>
          <div className="px-2 py-1 bg-black/80 text-white text-xs rounded whitespace-nowrap">
            <div className="font-semibold">{product.sku}</div>
            <div className="text-[10px] text-gray-300">
              {product.display_type || 'standing'}
              {!isCompatible && <span className="text-red-400 ml-1">비호환</span>}
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 슬롯 하이라이트 컴포넌트
// ============================================================================

interface SlotHighlightsProps {
  slots: FurnitureSlot[];
  furniture: FurnitureAsset[];
  selectedProductDisplayType?: ProductDisplayType;
  nearestSlotId?: string;
}

function SlotHighlights({
  slots,
  furniture,
  selectedProductDisplayType,
  nearestSlotId,
}: SlotHighlightsProps) {
  return (
    <group name="slot-highlights">
      {slots.map((slot) => {
        const furn = furniture.find((f) => f.id === slot.furniture_id);
        if (!furn || slot.is_occupied) return null;

        const isCompatible = isDisplayTypeCompatible(
          selectedProductDisplayType,
          slot.compatible_display_types
        );
        const isNearest = slot.id === nearestSlotId;

        const worldPos = calculateSlotWorldPosition(furn.position, furn.rotation, slot.slot_position);

        return (
          <mesh
            key={slot.id}
            position={vectorToTuple(worldPos)}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <circleGeometry args={[0.2, 16]} />
            <meshStandardMaterial
              color={isNearest ? '#22c55e' : isCompatible ? '#3b82f6' : '#6b7280'}
              transparent
              opacity={isNearest ? 0.8 : 0.4}
              emissive={isNearest ? '#22c55e' : isCompatible ? '#3b82f6' : '#6b7280'}
              emissiveIntensity={isNearest ? 0.5 : 0.2}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ============================================================================
// 편집 씬 컴포넌트
// ============================================================================

interface EditSceneProps {
  products: ProductAsset[];
  furniture: FurnitureAsset[];
  slots: FurnitureSlot[];
  selectedProductId: string | null;
  onSelectProduct: (id: string | null) => void;
  onProductMove: (productId: string, newPosition: Vector3D, slotId?: string) => void;
}

function EditScene({
  products,
  furniture,
  slots,
  selectedProductId,
  onSelectProduct,
  onProductMove,
}: EditSceneProps) {
  const [dragPosition, setDragPosition] = useState<Vector3D | null>(null);
  const [nearestSlotId, setNearestSlotId] = useState<string | null>(null);

  const selectedProduct = products.find((p) => p.id === selectedProductId);

  const handleDragStart = useCallback((position: Vector3D) => {
    setDragPosition(position);
  }, []);

  const handleDragEnd = useCallback(
    (productId: string, position: Vector3D, displayType: ProductDisplayType | undefined) => {
      // 가장 가까운 호환 슬롯 찾기
      const nearest = findNearestCompatibleSlot(position, displayType, slots, furniture);

      if (nearest) {
        onProductMove(productId, nearest.worldPosition, nearest.slot.slot_id);
      } else {
        onProductMove(productId, position);
      }

      setDragPosition(null);
      setNearestSlotId(null);
    },
    [slots, furniture, onProductMove]
  );

  const handlePositionChange = useCallback(
    (position: Vector3D, displayType: ProductDisplayType | undefined) => {
      setDragPosition(position);

      // 가장 가까운 호환 슬롯 찾기
      const nearest = findNearestCompatibleSlot(position, displayType, slots, furniture);
      setNearestSlotId(nearest?.slot.id || null);
    },
    [slots, furniture]
  );

  return (
    <>
      {/* 가구 (편집 불가) */}
      {furniture.map((f) => {
        // degrees → radians 변환
        const rotation: [number, number, number] = [
          (f.rotation.x || 0) * Math.PI / 180,
          (f.rotation.y || 0) * Math.PI / 180,
          (f.rotation.z || 0) * Math.PI / 180,
        ];
        return (
          <mesh
            key={f.id}
            position={vectorToTuple(f.position)}
            rotation={rotation}
          >
            <boxGeometry args={[1, 1.5, 0.5]} />
            <meshStandardMaterial color="#6b7280" metalness={0.2} roughness={0.8} />
          </mesh>
        );
      })}

      {/* 슬롯 하이라이트 */}
      {selectedProduct && (
        <SlotHighlights
          slots={slots}
          furniture={furniture}
          selectedProductDisplayType={selectedProduct.display_type}
          nearestSlotId={nearestSlotId || undefined}
        />
      )}

      {/* 상품 */}
      {products.map((p) => {
        const isSelected = p.id === selectedProductId;
        const isCompatible = p.slot_id
          ? isDisplayTypeCompatible(
              p.display_type,
              slots.find((s) => s.slot_id === p.slot_id)?.compatible_display_types
            )
          : true;

        return (
          <DraggableProduct
            key={p.id}
            product={p}
            isSelected={isSelected}
            isCompatible={isCompatible}
            onSelect={() => onSelectProduct(p.id)}
            onDragStart={handleDragStart}
            onDragEnd={(pos) => handleDragEnd(p.id, pos, p.display_type)}
            onPositionChange={(pos) => handlePositionChange(pos, p.display_type)}
          />
        );
      })}

      {/* 조명 */}
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

      {/* 그리드 */}
      <Grid
        args={[20, 20]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6b7280"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#3b82f6"
        fadeDistance={30}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid
      />
    </>
  );
}

// ============================================================================
// 메인 PlacementEditor 컴포넌트
// ============================================================================

export function PlacementEditor({
  recipe,
  slots,
  onSave,
  onCancel,
  height = '600px',
}: PlacementEditorProps) {
  // 편집 가능한 상품 상태
  const [products, setProducts] = useState<ProductAsset[]>(() =>
    (recipe.products || []).filter((p) => p.movable !== false)
  );
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [changes, setChanges] = useState<PlacementChange[]>([]);
  const [undoStack, setUndoStack] = useState<PlacementChange[]>([]);
  const [showSlots, setShowSlots] = useState(true);

  // 상품 이동 처리
  const handleProductMove = useCallback(
    (productId: string, newPosition: Vector3D, slotId?: string) => {
      setProducts((prev) => {
        const updated = prev.map((p) => {
          if (p.id === productId) {
            const oldPosition = p.position;
            const oldSlotId = p.slot_id;

            // 변경 기록
            const change: PlacementChange = {
              id: `change-${Date.now()}`,
              productId,
              productSku: p.sku || '',
              fromPosition: oldPosition,
              toPosition: newPosition,
              fromSlotId: oldSlotId,
              toSlotId: slotId,
              timestamp: Date.now(),
            };
            setChanges((c) => [...c, change]);
            setUndoStack([]); // 새 변경 시 redo 스택 초기화

            return {
              ...p,
              position: newPosition,
              slot_id: slotId || p.slot_id,
            };
          }
          return p;
        });
        return updated;
      });
    },
    []
  );

  // 실행 취소
  const handleUndo = useCallback(() => {
    if (changes.length === 0) return;

    const lastChange = changes[changes.length - 1];
    setChanges((c) => c.slice(0, -1));
    setUndoStack((u) => [...u, lastChange]);

    // 상품 위치 복원
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === lastChange.productId) {
          return {
            ...p,
            position: lastChange.fromPosition,
            slot_id: lastChange.fromSlotId,
          };
        }
        return p;
      })
    );
  }, [changes]);

  // 다시 실행
  const handleRedo = useCallback(() => {
    if (undoStack.length === 0) return;

    const lastUndo = undoStack[undoStack.length - 1];
    setUndoStack((u) => u.slice(0, -1));
    setChanges((c) => [...c, lastUndo]);

    // 상품 위치 재적용
    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === lastUndo.productId) {
          return {
            ...p,
            position: lastUndo.toPosition,
            slot_id: lastUndo.toSlotId,
          };
        }
        return p;
      })
    );
  }, [undoStack]);

  // 저장
  const handleSave = useCallback(() => {
    onSave?.(products, changes);
  }, [products, changes, onSave]);

  // 선택된 상품 정보
  const selectedProduct = products.find((p) => p.id === selectedProductId);

  return (
    <Card className="overflow-hidden" style={{ height }}>
      {/* 툴바 */}
      <div className="flex items-center justify-between p-2 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleUndo}
            disabled={changes.length === 0}
          >
            <Undo2 className="w-4 h-4 mr-1" />
            실행취소
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRedo}
            disabled={undoStack.length === 0}
          >
            <Redo2 className="w-4 h-4 mr-1" />
            다시실행
          </Button>
          <div className="h-4 w-px bg-border" />
          <Button
            variant={showSlots ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => setShowSlots(!showSlots)}
          >
            <Grid3X3 className="w-4 h-4 mr-1" />
            슬롯 {showSlots ? '숨기기' : '표시'}
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {changes.length > 0 && (
            <Badge variant="secondary">{changes.length}개 변경됨</Badge>
          )}
          <Button variant="outline" size="sm" onClick={onCancel}>
            취소
          </Button>
          <Button size="sm" onClick={handleSave} disabled={changes.length === 0}>
            <Save className="w-4 h-4 mr-1" />
            저장
          </Button>
        </div>
      </div>

      {/* 선택된 상품 정보 */}
      {selectedProduct && (
        <div className="absolute top-14 left-2 z-10 bg-background/95 backdrop-blur-sm border rounded-lg p-3 shadow-lg min-w-[200px]">
          <h4 className="font-semibold text-sm mb-2">{selectedProduct.sku}</h4>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Display Type:</span>
              <Badge variant="outline">{selectedProduct.display_type || 'standing'}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Slot:</span>
              <span>{selectedProduct.slot_id || '-'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">위치:</span>
              <span className="font-mono">
                ({selectedProduct.position.x.toFixed(1)}, {selectedProduct.position.y.toFixed(1)},{' '}
                {selectedProduct.position.z.toFixed(1)})
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 3D 뷰어 */}
      <div className="flex-1" style={{ height: `calc(${height} - 52px)` }}>
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[10, 10, 10]} fov={50} />
          <OrbitControls enableDamping dampingFactor={0.05} minDistance={3} maxDistance={30} />

          <EditScene
            products={products}
            furniture={recipe.furniture || []}
            slots={showSlots ? slots : []}
            selectedProductId={selectedProductId}
            onSelectProduct={setSelectedProductId}
            onProductMove={handleProductMove}
          />
        </Canvas>
      </div>

      {/* 호환성 경고 */}
      {selectedProduct && selectedProduct.slot_id && (
        <CompatibilityAlert product={selectedProduct} slots={slots} />
      )}
    </Card>
  );
}

// ============================================================================
// 호환성 경고 컴포넌트
// ============================================================================

function CompatibilityAlert({
  product,
  slots,
}: {
  product: ProductAsset;
  slots: FurnitureSlot[];
}) {
  const slot = slots.find((s) => s.slot_id === product.slot_id);
  if (!slot) return null;

  const isCompatible = isDisplayTypeCompatible(
    product.display_type,
    slot.compatible_display_types
  );

  if (isCompatible) {
    return (
      <div className="absolute bottom-2 left-2 right-2">
        <Alert className="bg-green-500/10 border-green-500/50">
          <CheckCircle2 className="h-4 w-4 text-green-500" />
          <AlertDescription className="text-xs text-green-600">
            {product.sku}은(는) 슬롯 {slot.slot_id}과(와) 호환됩니다
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="absolute bottom-2 left-2 right-2">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-xs">
          {product.sku} ({product.display_type})은(는) 슬롯 {slot.slot_id}과(와) 호환되지 않습니다.
          호환 타입: {slot.compatible_display_types?.join(', ') || 'any'}
        </AlertDescription>
      </Alert>
    </div>
  );
}

export default PlacementEditor;
