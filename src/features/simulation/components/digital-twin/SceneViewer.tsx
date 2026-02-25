import { Suspense, useMemo, useState, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Environment, Grid, Html } from '@react-three/drei';
import type { SceneRecipe, FurnitureSlot, ProductDisplayType, StaffAsset, CustomerAsset, Vector3D } from '@/types/scene3d';
import { StoreSpace } from './StoreSpace';
import { FurnitureLayout } from './FurnitureLayout';
import { ProductPlacement } from './ProductPlacement';
import { LightingPreset } from './LightingPreset';
import { HeatmapOverlay3D } from '../overlays/HeatmapOverlay3D';
import { SlotVisualizerOverlay } from '@/features/studio/overlays/SlotVisualizerOverlay';
import type { Model3D } from '@/features/studio/types';

// ============================================================================
// 타입 정의
// ============================================================================

type OverlayType = 'visitor' | 'heatmap' | 'journey' | 'inventory' | 'layout' | 'slots' | 'optimization' | null;

interface SceneViewerProps {
  recipe: SceneRecipe;
  onAssetClick?: (assetId: string, assetType: string) => void;
  overlay?: OverlayType;
  overlayData?: any;
  // 슬롯 시각화 관련
  slots?: FurnitureSlot[];
  selectedProductDisplayType?: ProductDisplayType;
  onSlotClick?: (slot: FurnitureSlot) => void;
  // 렌더링 옵션
  showGrid?: boolean;
  showEnvironment?: boolean;
  showOptimizationHints?: boolean;
  showStaff?: boolean;
  showCustomers?: boolean;
  // 크기
  height?: string;
  className?: string;
}

// ============================================================================
// 유틸리티: FurnitureAsset → Model3D 변환 (슬롯 시각화용)
// ============================================================================

function furnitureToModel3D(furniture: SceneRecipe['furniture']): Model3D[] {
  return furniture.map((f) => ({
    id: f.id,
    name: f.furniture_type || 'Furniture',
    url: f.model_url || '',
    position: [f.position.x, f.position.y, f.position.z] as [number, number, number],
    // degrees → radians 변환
    rotation: [
      f.rotation.x * Math.PI / 180,
      f.rotation.y * Math.PI / 180,
      f.rotation.z * Math.PI / 180,
    ] as [number, number, number],
    scale: [f.scale.x, f.scale.y, f.scale.z] as [number, number, number],
    visible: true,
    type: 'furniture' as const,
    dimensions: f.dimensions,
  }));
}

// ============================================================================
// 스태프 아바타 컴포넌트
// ============================================================================

interface StaffAvatarsProps {
  staff: StaffAsset[];
  onClick?: (id: string) => void;
}

function StaffAvatars({ staff, onClick }: StaffAvatarsProps) {
  return (
    <group name="staff-avatars">
      {staff.map((s) => (
        <StaffAvatar key={s.id} asset={s} onClick={() => onClick?.(s.id)} />
      ))}
    </group>
  );
}

function StaffAvatar({ asset, onClick }: { asset: StaffAsset; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  // 모델이 없으면 캡슐 형태로 표시
  if (!asset.model_url) {
    return (
      <group
        position={[asset.position.x, asset.position.y, asset.position.z]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* 몸통 */}
        <mesh position={[0, 0.9, 0]} castShadow>
          <capsuleGeometry args={[0.25, 1.2, 8, 16]} />
          <meshStandardMaterial
            color={hovered ? '#3b82f6' : '#2563eb'}
            metalness={0.3}
            roughness={0.7}
          />
        </mesh>
        {/* 머리 */}
        <mesh position={[0, 1.7, 0]} castShadow>
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial color="#fcd34d" metalness={0.2} roughness={0.8} />
        </mesh>
        {/* 이름 라벨 */}
        {hovered && (
          <Html position={[0, 2.2, 0]} center>
            <div className="px-2 py-1 bg-blue-600 text-white text-xs rounded whitespace-nowrap">
              {asset.staff_name} ({asset.role})
            </div>
          </Html>
        )}
      </group>
    );
  }

  // TODO: GLB 모델 로드
  return null;
}

// ============================================================================
// 고객 아바타 컴포넌트
// ============================================================================

interface CustomerAvatarsProps {
  customers: CustomerAsset[];
  onClick?: (id: string) => void;
}

function CustomerAvatars({ customers, onClick }: CustomerAvatarsProps) {
  return (
    <group name="customer-avatars">
      {customers.map((c) => (
        <CustomerAvatar key={c.id} asset={c} onClick={() => onClick?.(c.id)} />
      ))}
    </group>
  );
}

function CustomerAvatar({ asset, onClick }: { asset: CustomerAsset; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  // 세그먼트별 색상
  const colors = {
    vip: '#f59e0b',
    regular: '#22c55e',
    new: '#8b5cf6',
  };
  const color = colors[asset.customer_segment] || colors.regular;

  // 모델이 없으면 원형 표시
  if (!asset.model_url) {
    return (
      <group
        position={[asset.position.x, asset.position.y, asset.position.z]}
        onClick={onClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        {/* 바닥 원 */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <circleGeometry args={[0.3, 16]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.6}
            emissive={color}
            emissiveIntensity={hovered ? 0.5 : 0.2}
          />
        </mesh>
        {/* 방향 표시 삼각형 */}
        <mesh rotation={[-Math.PI / 2, asset.rotation.y || 0, 0]} position={[0, 0.02, 0]}>
          <coneGeometry args={[0.15, 0.3, 3]} />
          <meshStandardMaterial color={color} />
        </mesh>
        {/* 세그먼트 라벨 */}
        {hovered && (
          <Html position={[0, 0.5, 0]} center>
            <div
              className="px-2 py-1 text-white text-xs rounded whitespace-nowrap"
              style={{ backgroundColor: color }}
            >
              {asset.customer_segment.toUpperCase()}
            </div>
          </Html>
        )}
      </group>
    );
  }

  // TODO: GLB 모델 로드
  return null;
}

// ============================================================================
// 최적화 결과 오버레이
// ============================================================================

interface OptimizationOverlayProps {
  changes: Array<{
    id: string;
    type: 'furniture' | 'product';
    fromPosition: Vector3D;
    toPosition: Vector3D;
    reason?: string;
  }>;
}

function OptimizationOverlay({ changes }: OptimizationOverlayProps) {
  return (
    <group name="optimization-overlay">
      {changes.map((change) => (
        <OptimizationArrow key={change.id} change={change} />
      ))}
    </group>
  );
}

function OptimizationArrow({
  change,
}: {
  change: OptimizationOverlayProps['changes'][0];
}) {
  const [hovered, setHovered] = useState(false);

  const from: [number, number, number] = [
    change.fromPosition.x,
    change.fromPosition.y + 0.5,
    change.fromPosition.z,
  ];
  const to: [number, number, number] = [
    change.toPosition.x,
    change.toPosition.y + 0.5,
    change.toPosition.z,
  ];

  const color = change.type === 'furniture' ? '#3b82f6' : '#22c55e';

  return (
    <group
      onPointerOver={() => setHovered(true)}
      onPointerOut={() => setHovered(false)}
    >
      {/* 시작점 */}
      <mesh position={from}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#ef4444" transparent opacity={0.8} />
      </mesh>

      {/* 끝점 (화살표) */}
      <mesh position={to}>
        <coneGeometry args={[0.2, 0.4, 8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={hovered ? 0.5 : 0.2}
        />
      </mesh>

      {/* 연결선 (간소화된 버전) */}
      <mesh position={[(from[0] + to[0]) / 2, (from[1] + to[1]) / 2, (from[2] + to[2]) / 2]}>
        <boxGeometry args={[0.02, 0.02, Math.sqrt(
          Math.pow(to[0] - from[0], 2) +
          Math.pow(to[1] - from[1], 2) +
          Math.pow(to[2] - from[2], 2)
        )]} />
        <meshStandardMaterial color={color} transparent opacity={0.6} />
      </mesh>

      {/* 이유 표시 */}
      {hovered && change.reason && (
        <Html position={to} center>
          <div className="px-2 py-1 bg-black/80 text-white text-xs rounded max-w-[200px]">
            {change.reason}
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 메인 SceneViewer 컴포넌트
// ============================================================================

export function SceneViewer({
  recipe,
  onAssetClick,
  overlay,
  overlayData,
  slots,
  selectedProductDisplayType,
  onSlotClick,
  showGrid = true,
  showEnvironment = false,
  showOptimizationHints = true,
  showStaff = true,
  showCustomers = true,
  height = '600px',
  className = '',
}: SceneViewerProps) {
  const handleAssetClick = useCallback(
    (id: string, type: string) => {
      onAssetClick?.(id, type);
    },
    [onAssetClick]
  );

  // 가구 모델 변환 (슬롯 시각화용)
  const furnitureModels = useMemo(() => {
    return furnitureToModel3D(recipe.furniture || []);
  }, [recipe.furniture]);

  return (
    <div className={`w-full bg-background rounded-lg overflow-hidden border ${className}`} style={{ height }}>
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[
            recipe.camera?.position.x || 0,
            recipe.camera?.position.y || 10,
            recipe.camera?.position.z || 15,
          ]}
          fov={recipe.camera?.fov || 50}
        />
        <OrbitControls
          target={[
            recipe.camera?.target.x || 0,
            recipe.camera?.target.y || 0,
            recipe.camera?.target.z || 0,
          ]}
          enableDamping
          dampingFactor={0.05}
          minDistance={3}
          maxDistance={50}
        />

        <Suspense fallback={<LoadingIndicator />}>
          {/* 공간 */}
          {recipe.space && (
            <StoreSpace
              asset={recipe.space}
              onClick={() => handleAssetClick(recipe.space.id, 'space')}
            />
          )}

          {/* 가구 */}
          {recipe.furniture && recipe.furniture.length > 0 && (
            <FurnitureLayout
              furniture={recipe.furniture}
              onClick={(id) => handleAssetClick(id, 'furniture')}
            />
          )}

          {/* 상품 */}
          {recipe.products && recipe.products.length > 0 && (
            <ProductPlacement
              products={recipe.products}
              onClick={(id) => handleAssetClick(id, 'product')}
              showOptimizationHint={showOptimizationHints}
            />
          )}

          {/* 스태프 아바타 */}
          {showStaff && recipe.staff && recipe.staff.length > 0 && (
            <StaffAvatars
              staff={recipe.staff}
              onClick={(id) => handleAssetClick(id, 'staff')}
            />
          )}

          {/* 고객 아바타 */}
          {showCustomers && recipe.customers && recipe.customers.length > 0 && (
            <CustomerAvatars
              customers={recipe.customers}
              onClick={(id) => handleAssetClick(id, 'customer')}
            />
          )}

          {/* 조명 */}
          <LightingPreset preset={recipe.lighting} />

          {/* 환경 */}
          {showEnvironment && <Environment preset="warehouse" />}

          {/* ========== 오버레이 ========== */}

          {/* 방문자 오버레이 */}
          {overlay === 'visitor' && overlayData && (
            <group>
              {overlayData.visitors?.map((visitor: any, idx: number) => (
                <mesh key={`visitor-${idx}`} position={[visitor.x, 1.5, visitor.z]}>
                  <sphereGeometry args={[0.2, 16, 16]} />
                  <meshStandardMaterial
                    color="#10b981"
                    emissive="#10b981"
                    emissiveIntensity={0.5}
                  />
                </mesh>
              ))}
            </group>
          )}

          {/* 히트맵 오버레이 */}
          {overlay === 'heatmap' && overlayData && (
            <HeatmapOverlay3D heatPoints={overlayData.heatPoints || []} />
          )}

          {/* 동선 오버레이 */}
          {overlay === 'journey' && overlayData && (
            <group>
              {overlayData.paths?.map((path: any, idx: number) => (
                <line key={`path-${idx}`}>
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      count={path.points.length}
                      array={new Float32Array(path.points.flat())}
                      itemSize={3}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial color="#3b82f6" linewidth={2} />
                </line>
              ))}
            </group>
          )}

          {/* 재고 오버레이 */}
          {overlay === 'inventory' && overlayData && (
            <group>
              {overlayData.items?.map((item: any, idx: number) => (
                <mesh key={`inv-${idx}`} position={[item.x, item.y + 1, item.z]}>
                  <cylinderGeometry args={[0.3, 0.3, 0.1, 32]} />
                  <meshStandardMaterial
                    color={item.stock < item.min ? '#ef4444' : '#10b981'}
                    transparent
                    opacity={0.6}
                  />
                </mesh>
              ))}
            </group>
          )}

          {/* 슬롯 시각화 오버레이 */}
          {overlay === 'slots' && slots && (
            <SlotVisualizerOverlay
              slots={slots}
              furnitureModels={furnitureModels}
              selectedProductDisplayType={selectedProductDisplayType}
              onSlotClick={onSlotClick}
              showLabels={true}
            />
          )}

          {/* 최적화 결과 오버레이 */}
          {overlay === 'optimization' && overlayData?.changes && (
            <OptimizationOverlay changes={overlayData.changes} />
          )}

          {/* 그리드 */}
          {showGrid && (
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
          )}
        </Suspense>
      </Canvas>
    </div>
  );
}

// ============================================================================
// 로딩 인디케이터
// ============================================================================

function LoadingIndicator() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#3b82f6" wireframe />
    </mesh>
  );
}

export default SceneViewer;
