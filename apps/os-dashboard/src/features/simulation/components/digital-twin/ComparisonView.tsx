/**
 * ComparisonView.tsx
 *
 * As-Is / To-Be 씬 비교 뷰 컴포넌트
 * - Side-by-side 비교
 * - 오버레이 비교
 * - 슬라이더 비교
 * - 변경 사항 하이라이트
 */

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Grid, Html } from '@react-three/drei';
import * as THREE from 'three';
import type { SceneRecipe, ProductAsset, FurnitureAsset, Vector3D } from '@/types/scene3d';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeftRight,
  Layers,
  SplitSquareHorizontal,
  SlidersHorizontal,
  Eye,
  EyeOff,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { StoreSpace } from './StoreSpace';
import { FurnitureLayout } from './FurnitureLayout';
import { ProductPlacement } from './ProductPlacement';
import { LightingPreset } from './LightingPreset';

// ============================================================================
// 타입 정의
// ============================================================================

type CompareMode = 'side-by-side' | 'overlay' | 'slider';

interface ComparisonViewProps {
  asIsRecipe: SceneRecipe;
  toBeRecipe: SceneRecipe;
  mode?: CompareMode;
  onModeChange?: (mode: CompareMode) => void;
  height?: string;
  showChangesOnly?: boolean;
  onAssetClick?: (assetId: string, assetType: string, scene: 'asIs' | 'toBe') => void;
}

interface ChangeInfo {
  id: string;
  type: 'furniture' | 'product';
  name: string;
  changeType: 'moved' | 'added' | 'removed';
  fromPosition?: Vector3D;
  toPosition?: Vector3D;
}

// ============================================================================
// 유틸리티 함수
// ============================================================================

function vectorToTuple(v: Vector3D): [number, number, number] {
  return [v.x, v.y, v.z];
}

function comparePositions(a: Vector3D, b: Vector3D, threshold = 0.1): boolean {
  return (
    Math.abs(a.x - b.x) < threshold &&
    Math.abs(a.y - b.y) < threshold &&
    Math.abs(a.z - b.z) < threshold
  );
}

function detectChanges(asIs: SceneRecipe, toBe: SceneRecipe): ChangeInfo[] {
  const changes: ChangeInfo[] = [];

  // 가구 변경 감지
  const asIsFurniture = new Map(asIs.furniture.map((f) => [f.id, f]));
  const toBeFurniture = new Map(toBe.furniture.map((f) => [f.id, f]));

  for (const [id, toBeF] of toBeFurniture) {
    const asIsF = asIsFurniture.get(id);
    if (!asIsF) {
      changes.push({
        id,
        type: 'furniture',
        name: toBeF.furniture_type || 'Furniture',
        changeType: 'added',
        toPosition: toBeF.position,
      });
    } else if (!comparePositions(asIsF.position, toBeF.position)) {
      changes.push({
        id,
        type: 'furniture',
        name: toBeF.furniture_type || 'Furniture',
        changeType: 'moved',
        fromPosition: asIsF.position,
        toPosition: toBeF.position,
      });
    }
  }

  for (const [id, asIsF] of asIsFurniture) {
    if (!toBeFurniture.has(id)) {
      changes.push({
        id,
        type: 'furniture',
        name: asIsF.furniture_type || 'Furniture',
        changeType: 'removed',
        fromPosition: asIsF.position,
      });
    }
  }

  // 상품 변경 감지
  const asIsProducts = new Map(asIs.products.map((p) => [p.id, p]));
  const toBeProducts = new Map(toBe.products.map((p) => [p.id, p]));

  for (const [id, toBeP] of toBeProducts) {
    const asIsP = asIsProducts.get(id);
    if (!asIsP) {
      changes.push({
        id,
        type: 'product',
        name: toBeP.sku || 'Product',
        changeType: 'added',
        toPosition: toBeP.position,
      });
    } else if (!comparePositions(asIsP.position, toBeP.position)) {
      changes.push({
        id,
        type: 'product',
        name: toBeP.sku || 'Product',
        changeType: 'moved',
        fromPosition: asIsP.position,
        toPosition: toBeP.position,
      });
    }
  }

  for (const [id, asIsP] of asIsProducts) {
    if (!toBeProducts.has(id)) {
      changes.push({
        id,
        type: 'product',
        name: asIsP.sku || 'Product',
        changeType: 'removed',
        fromPosition: asIsP.position,
      });
    }
  }

  return changes;
}

// ============================================================================
// 변경 표시 화살표 컴포넌트
// ============================================================================

interface ChangeArrowProps {
  from: Vector3D;
  to: Vector3D;
  type: 'furniture' | 'product';
}

function ChangeArrow({ from, to, type }: ChangeArrowProps) {
  const color = type === 'furniture' ? '#3b82f6' : '#22c55e';

  const fromPos = vectorToTuple(from);
  const toPos = vectorToTuple(to);
  fromPos[1] += 0.5;
  toPos[1] += 0.5;

  const midPoint: [number, number, number] = [
    (fromPos[0] + toPos[0]) / 2,
    (fromPos[1] + toPos[1]) / 2,
    (fromPos[2] + toPos[2]) / 2,
  ];

  const direction = new THREE.Vector3(
    toPos[0] - fromPos[0],
    toPos[1] - fromPos[1],
    toPos[2] - fromPos[2]
  );
  const length = direction.length();
  direction.normalize();

  const quaternion = new THREE.Quaternion();
  quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction);
  const euler = new THREE.Euler().setFromQuaternion(quaternion);

  return (
    <group>
      {/* 시작점 */}
      <mesh position={fromPos}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial color="#ef4444" />
      </mesh>

      {/* 화살표 몸체 */}
      <mesh position={midPoint} rotation={[euler.x, euler.y, euler.z]}>
        <cylinderGeometry args={[0.03, 0.03, length - 0.3, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* 화살표 머리 */}
      <mesh position={toPos}>
        <coneGeometry args={[0.15, 0.3, 8]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

// ============================================================================
// 개별 씬 렌더러
// ============================================================================

interface SceneRendererProps {
  recipe: SceneRecipe;
  changedIds: Set<string>;
  highlightChanges: boolean;
  onAssetClick?: (id: string, type: string) => void;
}

function SceneRenderer({
  recipe,
  changedIds,
  highlightChanges,
  onAssetClick,
}: SceneRendererProps) {
  return (
    <>
      {/* 공간 */}
      {recipe.space && (
        <StoreSpace
          asset={recipe.space}
          onClick={() => onAssetClick?.(recipe.space.id, 'space')}
        />
      )}

      {/* 가구 */}
      {recipe.furniture && recipe.furniture.length > 0 && (
        <FurnitureLayout
          furniture={recipe.furniture}
          onClick={(id) => onAssetClick?.(id, 'furniture')}
        />
      )}

      {/* 상품 */}
      {recipe.products && recipe.products.length > 0 && (
        <ProductPlacement
          products={recipe.products}
          onClick={(id) => onAssetClick?.(id, 'product')}
          showOptimizationHint={highlightChanges}
        />
      )}

      {/* 조명 */}
      <LightingPreset preset={recipe.lighting} />
    </>
  );
}

// ============================================================================
// Side-by-Side 모드
// ============================================================================

interface SideBySideViewProps {
  asIsRecipe: SceneRecipe;
  toBeRecipe: SceneRecipe;
  changes: ChangeInfo[];
  showChangesOnly: boolean;
  onAssetClick?: (assetId: string, assetType: string, scene: 'asIs' | 'toBe') => void;
  height: string;
}

function SideBySideView({
  asIsRecipe,
  toBeRecipe,
  changes,
  showChangesOnly,
  onAssetClick,
  height,
}: SideBySideViewProps) {
  const changedIds = useMemo(() => new Set(changes.map((c) => c.id)), [changes]);

  return (
    <div className="grid grid-cols-2 gap-2" style={{ height }}>
      {/* As-Is 씬 */}
      <div className="relative border rounded-lg overflow-hidden">
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="secondary" className="bg-red-100 text-red-700">
            Before (As-Is)
          </Badge>
        </div>
        <Canvas shadows>
          <PerspectiveCamera
            makeDefault
            position={vectorToTuple(asIsRecipe.camera?.position || { x: 10, y: 10, z: 10 })}
            fov={asIsRecipe.camera?.fov || 50}
          />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <SceneRenderer
            recipe={asIsRecipe}
            changedIds={changedIds}
            highlightChanges={showChangesOnly}
            onAssetClick={(id, type) => onAssetClick?.(id, type, 'asIs')}
          />
          <Grid args={[20, 20]} cellSize={1} cellThickness={0.5} cellColor="#6b7280" />
        </Canvas>
      </div>

      {/* To-Be 씬 */}
      <div className="relative border rounded-lg overflow-hidden">
        <div className="absolute top-2 left-2 z-10">
          <Badge variant="secondary" className="bg-green-100 text-green-700">
            After (To-Be)
          </Badge>
        </div>
        <Canvas shadows>
          <PerspectiveCamera
            makeDefault
            position={vectorToTuple(toBeRecipe.camera?.position || { x: 10, y: 10, z: 10 })}
            fov={toBeRecipe.camera?.fov || 50}
          />
          <OrbitControls enableDamping dampingFactor={0.05} />
          <SceneRenderer
            recipe={toBeRecipe}
            changedIds={changedIds}
            highlightChanges={showChangesOnly}
            onAssetClick={(id, type) => onAssetClick?.(id, type, 'toBe')}
          />
          {/* 변경 화살표 표시 */}
          {showChangesOnly &&
            changes
              .filter((c) => c.changeType === 'moved' && c.fromPosition && c.toPosition)
              .map((c) => (
                <ChangeArrow
                  key={c.id}
                  from={c.fromPosition!}
                  to={c.toPosition!}
                  type={c.type}
                />
              ))}
          <Grid args={[20, 20]} cellSize={1} cellThickness={0.5} cellColor="#6b7280" />
        </Canvas>
      </div>
    </div>
  );
}

// ============================================================================
// 슬라이더 모드
// ============================================================================

interface SliderViewProps {
  asIsRecipe: SceneRecipe;
  toBeRecipe: SceneRecipe;
  changes: ChangeInfo[];
  height: string;
}

function SliderView({ asIsRecipe, toBeRecipe, changes, height }: SliderViewProps) {
  const [sliderValue, setSliderValue] = useState(50);
  const changedIds = useMemo(() => new Set(changes.map((c) => c.id)), [changes]);

  return (
    <div className="relative border rounded-lg overflow-hidden" style={{ height }}>
      {/* 슬라이더 */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 w-64 bg-background/90 backdrop-blur-sm p-3 rounded-lg shadow-lg">
        <div className="flex items-center justify-between mb-2 text-xs">
          <span className="text-red-600">Before</span>
          <span className="text-green-600">After</span>
        </div>
        <Slider
          value={[sliderValue]}
          onValueChange={(v) => setSliderValue(v[0])}
          min={0}
          max={100}
          step={1}
        />
      </div>

      {/* 라벨 */}
      <div className="absolute top-2 left-2 z-10">
        <Badge variant="secondary">
          {sliderValue < 50 ? 'Before' : 'After'} ({sliderValue}%)
        </Badge>
      </div>

      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={vectorToTuple(asIsRecipe.camera?.position || { x: 10, y: 10, z: 10 })}
          fov={asIsRecipe.camera?.fov || 50}
        />
        <OrbitControls enableDamping dampingFactor={0.05} />

        {/* 슬라이더 값에 따라 씬 전환 */}
        <SceneRenderer
          recipe={sliderValue < 50 ? asIsRecipe : toBeRecipe}
          changedIds={changedIds}
          highlightChanges={true}
        />

        <Grid args={[20, 20]} cellSize={1} cellThickness={0.5} cellColor="#6b7280" />
      </Canvas>
    </div>
  );
}

// ============================================================================
// 오버레이 모드
// ============================================================================

interface OverlayViewProps {
  asIsRecipe: SceneRecipe;
  toBeRecipe: SceneRecipe;
  changes: ChangeInfo[];
  height: string;
}

function OverlayView({ asIsRecipe, toBeRecipe, changes, height }: OverlayViewProps) {
  const [showAsIs, setShowAsIs] = useState(true);
  const [showToBe, setShowToBe] = useState(true);
  const [asIsOpacity, setAsIsOpacity] = useState(50);

  return (
    <div className="relative border rounded-lg overflow-hidden" style={{ height }}>
      {/* 컨트롤 */}
      <div className="absolute top-2 left-2 z-10 flex gap-2">
        <Button
          variant={showAsIs ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowAsIs(!showAsIs)}
        >
          {showAsIs ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
          Before
        </Button>
        <Button
          variant={showToBe ? 'secondary' : 'outline'}
          size="sm"
          onClick={() => setShowToBe(!showToBe)}
        >
          {showToBe ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
          After
        </Button>
      </div>

      {/* 투명도 슬라이더 */}
      <div className="absolute top-2 right-2 z-10 w-32 bg-background/90 backdrop-blur-sm p-2 rounded-lg">
        <div className="text-xs text-muted-foreground mb-1">Before 투명도</div>
        <Slider
          value={[asIsOpacity]}
          onValueChange={(v) => setAsIsOpacity(v[0])}
          min={0}
          max={100}
          step={5}
        />
      </div>

      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={vectorToTuple(asIsRecipe.camera?.position || { x: 10, y: 10, z: 10 })}
          fov={asIsRecipe.camera?.fov || 50}
        />
        <OrbitControls enableDamping dampingFactor={0.05} />

        {/* As-Is 레이어 */}
        {showAsIs && (
          <group>
            <SceneRenderer
              recipe={asIsRecipe}
              changedIds={new Set()}
              highlightChanges={false}
            />
          </group>
        )}

        {/* To-Be 레이어 */}
        {showToBe && (
          <group>
            <SceneRenderer
              recipe={toBeRecipe}
              changedIds={new Set()}
              highlightChanges={true}
            />
          </group>
        )}

        {/* 변경 화살표 */}
        {changes
          .filter((c) => c.changeType === 'moved' && c.fromPosition && c.toPosition)
          .map((c) => (
            <ChangeArrow key={c.id} from={c.fromPosition!} to={c.toPosition!} type={c.type} />
          ))}

        {/* 조명 */}
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} castShadow />

        <Grid args={[20, 20]} cellSize={1} cellThickness={0.5} cellColor="#6b7280" />
      </Canvas>
    </div>
  );
}

// ============================================================================
// 변경 요약 패널
// ============================================================================

interface ChangeSummaryProps {
  changes: ChangeInfo[];
}

function ChangeSummary({ changes }: ChangeSummaryProps) {
  const moved = changes.filter((c) => c.changeType === 'moved');
  const added = changes.filter((c) => c.changeType === 'added');
  const removed = changes.filter((c) => c.changeType === 'removed');

  return (
    <div className="flex items-center gap-4 text-sm">
      <div className="flex items-center gap-1">
        <ArrowRight className="w-4 h-4 text-blue-500" />
        <span>{moved.length} 이동</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-green-500">+</span>
        <span>{added.length} 추가</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="text-red-500">-</span>
        <span>{removed.length} 제거</span>
      </div>
    </div>
  );
}

// ============================================================================
// 메인 ComparisonView 컴포넌트
// ============================================================================

export function ComparisonView({
  asIsRecipe,
  toBeRecipe,
  mode = 'side-by-side',
  onModeChange,
  height = '600px',
  showChangesOnly = true,
  onAssetClick,
}: ComparisonViewProps) {
  const [currentMode, setCurrentMode] = useState<CompareMode>(mode);

  // 변경 사항 감지
  const changes = useMemo(() => detectChanges(asIsRecipe, toBeRecipe), [asIsRecipe, toBeRecipe]);

  const handleModeChange = useCallback(
    (newMode: CompareMode) => {
      setCurrentMode(newMode);
      onModeChange?.(newMode);
    },
    [onModeChange]
  );

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5" />
              Before / After 비교
            </CardTitle>
            <ChangeSummary changes={changes} />
          </div>

          <Tabs value={currentMode} onValueChange={(v) => handleModeChange(v as CompareMode)}>
            <TabsList>
              <TabsTrigger value="side-by-side" title="나란히 보기">
                <SplitSquareHorizontal className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="overlay" title="오버레이">
                <Layers className="w-4 h-4" />
              </TabsTrigger>
              <TabsTrigger value="slider" title="슬라이더">
                <SlidersHorizontal className="w-4 h-4" />
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-2">
        {currentMode === 'side-by-side' && (
          <SideBySideView
            asIsRecipe={asIsRecipe}
            toBeRecipe={toBeRecipe}
            changes={changes}
            showChangesOnly={showChangesOnly}
            onAssetClick={onAssetClick}
            height={`calc(${height} - 80px)`}
          />
        )}

        {currentMode === 'overlay' && (
          <OverlayView
            asIsRecipe={asIsRecipe}
            toBeRecipe={toBeRecipe}
            changes={changes}
            height={`calc(${height} - 80px)`}
          />
        )}

        {currentMode === 'slider' && (
          <SliderView
            asIsRecipe={asIsRecipe}
            toBeRecipe={toBeRecipe}
            changes={changes}
            height={`calc(${height} - 80px)`}
          />
        )}
      </CardContent>
    </Card>
  );
}

export default ComparisonView;
