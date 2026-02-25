/**
 * Canvas3D.tsx
 *
 * 통합 3D 캔버스 컴포넌트
 * - 모든 3D 렌더링을 단일 컴포넌트로 통합
 * - 모드 기반 동작 (편집/뷰/시뮬레이션)
 * - 오버레이 및 UI 통합
 * - 실시간 고객 시뮬레이션 지원
 */

import { Suspense, ReactNode, useMemo, useCallback, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Preload, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import { cn } from '@/lib/utils';
import { useScene } from './SceneProvider';
import { SceneEnvironment } from './SceneEnvironment';
import { useEnvironmentModels } from '../hooks/useEnvironmentModels';
import { useSpaceTextures } from '../hooks/useSpaceTextures';
import { ModelLoader } from './ModelLoader';
import { SelectionManager } from './SelectionManager';
import { TransformControls } from './TransformControls';
import { PostProcessing } from './PostProcessing';
import { CustomerAgents } from '../components/CustomerAgents';
import { useSimulationEngine } from '@/hooks/useSimulationEngine';
import { useSimulationStore } from '@/stores/simulationStore';
import { ChildProductItem } from '@/features/simulation/components/digital-twin/ChildProductItem';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';
import type { StudioMode, EnvironmentPreset, Canvas3DProps, RenderingConfig } from '../types';
import type { ProductAsset } from '@/types/scene3d';
import { EnvironmentEffectsOverlay } from '../overlays/EnvironmentEffectsOverlay';

// 시뮬레이션용 Zone 타입
interface SimulationZone {
  id: string;
  zone_name?: string;
  x?: number;
  z?: number;
  width?: number;
  depth?: number;
  zone_type?: string;
  coordinates?: {
    x?: number;
    z?: number;
    width?: number;
    depth?: number;
  };
}

// ============================================================================
// 확장된 Canvas3D Props (zones, userId, storeId, renderingConfig 추가)
// ============================================================================
interface ExtendedCanvas3DProps extends Canvas3DProps {
  zones?: SimulationZone[];
  userId?: string;
  storeId?: string;
  /** 환경 효과 렌더링 설정 (날씨, 시간대 등) */
  renderingConfig?: RenderingConfig | null;
  /** 낮/밤 모드 (true = 낮, false = 밤) */
  isDayMode?: boolean;
}

// ============================================================================
// Canvas3D 컴포넌트
// ============================================================================
export function Canvas3D({
  mode = 'view',
  transformMode = 'translate',
  enableControls = true,
  enableSelection = false,
  enableTransform = false,
  showGrid = false,
  className,
  children,
  onAssetClick,
  zones = [],
  userId,
  storeId,
  renderingConfig,
  isDayMode = true,  // 기본값: 낮
}: ExtendedCanvas3DProps) {
  // environment 폴더에서 환경 모델 로드 (시간대 반영)
  const { models: environmentModels } = useEnvironmentModels({
    userId,
    storeId,
    enabled: !!userId && !!storeId,
    isDayMode,  // 시간대 전달
  });

  // 🆕 Space 텍스처 로드 (낮/밤)
  const { dayTextureUrl, nightTextureUrl } = useSpaceTextures({
    userId,
    storeId,
    enabled: !!userId && !!storeId,
  });

  // 디바이스 품질 설정
  const { config } = useDeviceCapability();
  const canvasCfg = config.canvas;

  // WebGL 컨텍스트 손실/복구 상태
  const [contextLost, setContextLost] = useState(false);

  const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('[Canvas3D] WebGL context lost — awaiting restore');
      setContextLost(true);
    });
    canvas.addEventListener('webglcontextrestored', () => {
      console.info('[Canvas3D] WebGL context restored');
      setContextLost(false);
    });
  }, []);

  return (
    <div className={cn('w-full h-full relative', className)}>
      {/* WebGL 컨텍스트 손실 시 복구 안내 오버레이 */}
      {contextLost && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 text-white gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-sm">3D 렌더링을 복구하는 중입니다…</p>
          <button
            className="mt-2 px-4 py-1.5 text-xs bg-white/20 hover:bg-white/30 rounded-md transition-colors"
            onClick={() => window.location.reload()}
          >
            페이지 새로고침
          </button>
        </div>
      )}
      <Canvas
        shadows={canvasCfg.shadows}
        dpr={canvasCfg.dpr}
        gl={{
          antialias: canvasCfg.antialias,
          alpha: false,
          powerPreference: canvasCfg.powerPreference,
          stencil: false,
          preserveDrawingBuffer: canvasCfg.preserveDrawingBuffer,
        }}
        onCreated={handleCreated}
      >
        <SceneContent
          mode={mode}
          transformMode={transformMode}
          enableControls={enableControls}
          enableSelection={enableSelection}
          enableTransform={enableTransform}
          showGrid={showGrid}
          onAssetClick={onAssetClick}
          zones={zones}
          storeId={storeId}
          environmentModels={environmentModels}
          renderingConfig={renderingConfig}
          isDayMode={isDayMode}
          dayTextureUrl={dayTextureUrl}
          nightTextureUrl={nightTextureUrl}
        >
          {children}
        </SceneContent>
      </Canvas>
    </div>
  );
}

// ============================================================================
// 씬 컨텐츠 (Canvas 내부)
// ============================================================================
interface EnvironmentModelProp {
  url: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  isBaked?: boolean;
}

interface SceneContentProps {
  mode: StudioMode;
  transformMode: string;
  enableControls: boolean;
  enableSelection: boolean;
  enableTransform: boolean;
  showGrid: boolean;
  onAssetClick?: (assetId: string, assetType: string) => void;
  children?: ReactNode;
  zones?: SimulationZone[];
  storeId?: string;  // 🆕 DB 기반 시뮬레이션용
  environmentModels?: EnvironmentModelProp[];
  renderingConfig?: RenderingConfig | null;  // 🆕 환경 효과 렌더링 설정
  isDayMode?: boolean;  // 🆕 낮/밤 모드
  dayTextureUrl?: string | null;  // 🆕 낮 텍스처 URL
  nightTextureUrl?: string | null;  // 🆕 밤 텍스처 URL
}

function SceneContent({
  mode,
  transformMode,
  enableControls,
  enableSelection,
  enableTransform,
  showGrid,
  onAssetClick,
  children,
  zones = [],
  storeId,  // 🆕 DB 기반 시뮬레이션용
  environmentModels = [],
  renderingConfig,  // 🆕 환경 효과 렌더링 설정
  isDayMode = true,  // 🆕 낮/밤 모드
  dayTextureUrl,  // 🆕 낮 텍스처 URL
  nightTextureUrl,  // 🆕 밤 텍스처 URL
}: SceneContentProps) {
  const { camera } = useScene();
  const { config: deviceConfig } = useDeviceCapability();

  // 실시간 시뮬레이션 상태
  const isRunning = useSimulationStore((state) => state.isRunning);
  const simConfig = useSimulationStore((state) => state.config);

  // 🆕 시뮬레이션 엔진 활성화 (DB 데이터 기반)
  // storeId가 있으면 DB에서 zones_dim, zone_transitions 데이터 로드
  const { hasDbData, transitionPathCount } = useSimulationEngine({
    storeId,
    zones: zones || [],
    enabled: isRunning
  });

  return (
    <>
      {/* 카메라 */}
      <PerspectiveCamera
        makeDefault
        position={[camera.position.x, camera.position.y, camera.position.z]}
        fov={camera.fov}
        near={0.1}
        far={1000}
      />

      <Suspense fallback={<LoadingFallback />}>
        {/* 환경 설정 */}
        <SceneEnvironment
          environmentModels={environmentModels.map((m) => ({
            url: m.url,
            position: m.position,
            rotation: m.rotation,
            scale: m.scale,
            isBaked: m.isBaked,
          }))}
          isDayMode={isDayMode}
        />

        {/* 그리드 (편집 모드) */}
        {showGrid && (
          <gridHelper args={[50, 50, '#444444', '#222222']} position={[0, 0.001, 0]} />
        )}

        {/* 카메라 컨트롤 */}
        {enableControls && (
          <OrbitControls
            makeDefault
            target={[camera.target.x, camera.target.y, camera.target.z]}
            enableDamping={false}  // 성능 최적화: 관성 계산 제거
            minDistance={8}
            maxDistance={40}
            maxPolarAngle={Math.PI / 2.5}
            minPolarAngle={0.3}
            enablePan={true}
            panSpeed={0.5}            
            onChange={(e) => {
              if (e?.target) {
                const target = e.target.target;
                const limit = 12;
                target.x = Math.max(-limit, Math.min(limit, target.x));
                target.z = Math.max(-limit, Math.min(limit, target.z));
                target.y = Math.max(0, Math.min(5, target.y));
              }
            }}
          />
        )}

        {/* 모델 렌더링 */}
        <SceneModels
          onAssetClick={onAssetClick}
          isDayMode={isDayMode}
          dayTextureUrl={dayTextureUrl}
          nightTextureUrl={nightTextureUrl}
        />

        {/* 🆕 고객 에이전트 시뮬레이션 (실시간 모드) */}
        <CustomerAgents
          showPaths={simConfig.showAgentPaths}
          showLabels={false}
        />

        {/* 선택 관리 (편집 모드) */}
        {enableSelection && <SelectionManager />}

        {/* 변환 컨트롤 (편집 모드) */}
        {enableTransform && <TransformControls mode={transformMode as any} />}

        {/* 자식 컴포넌트 (오버레이 등) */}
        {children}

        {/* 후처리 효과 (뷰/시뮬레이션 모드) */}
        <PostProcessing enabled={mode !== 'edit'} ssao={false} />

        {/* 🆕 환경 효과 오버레이 (날씨, 시간대 등) */}
        {renderingConfig && (
          <EnvironmentEffectsOverlay
            renderingConfig={renderingConfig}
            enabled={true}
            particleScale={30}
          />
        )}

        {/* 프리로드 */}
        {deviceConfig.particle.preloadAll && <Preload all />}
      </Suspense>
    </>
  );
}

// ============================================================================
// 씬 모델 렌더링
// ============================================================================
interface SceneModelsProps {
  onAssetClick?: (assetId: string, assetType: string) => void;
  isDayMode?: boolean;
  dayTextureUrl?: string | null;
  nightTextureUrl?: string | null;
}

function SceneModels({
  onAssetClick,
  isDayMode = true,
  dayTextureUrl,
  nightTextureUrl,
}: SceneModelsProps) {
  const { models, selectedId, hoveredId, select, hover } = useScene();

  return (
    <group>
      {models
        .filter((model) => model.visible)
        .map((model) => {
          // 가구 모델인 경우, childProducts도 함께 렌더링
          const rawChildProducts = (model.metadata as any)?.childProducts as any[] | undefined;
          const hasChildren = model.type === 'furniture' && rawChildProducts && rawChildProducts.length > 0;

          // childProducts를 ProductAsset 형식으로 변환 (rotation은 degrees → radians)
          const degToRad = (deg: number) => (deg || 0) * Math.PI / 180;
          const childProducts: ProductAsset[] | undefined = hasChildren
            ? rawChildProducts!.map((cp) => ({
                id: cp.id,
                type: 'product' as const,
                model_url: cp.model_url || '',
                position: cp.position || { x: 0, y: 0, z: 0 },
                // 🔧 FIX: degrees → radians 변환
                rotation: {
                  x: degToRad(cp.rotation?.x),
                  y: degToRad(cp.rotation?.y),
                  z: degToRad(cp.rotation?.z),
                },
                scale: cp.scale || { x: 1, y: 1, z: 1 },
                sku: cp.metadata?.sku || cp.name,
                display_type: cp.metadata?.displayType,
                dimensions: cp.metadata?.dimensions || { width: 0.3, height: 0.4, depth: 0.2 },
                isRelativePosition: true,
              }))
            : undefined;

          // 공간(space) 타입은 클릭 비활성화
          const isSpace = model.type === 'space';

          return (
            <group
              key={model.id}
              position={model.position}
              rotation={model.rotation}
            >
              {/* 가구/모델 자체 렌더링 (position은 group에서 처리) */}
              <ModelLoader
                modelId={model.id}
                url={model.url}
                position={[0, 0, 0]}  // group이 position 담당
                rotation={[0, 0, 0]}  // group이 rotation 담당
                scale={model.scale}
                selected={false}  // 선택 박스는 바깥에서 렌더링
                hovered={!isSpace && model.id === hoveredId}
                onClick={isSpace ? undefined : () => {
                  select(model.id);
                  onAssetClick?.(model.id, model.type);
                }}
                onPointerOver={isSpace ? undefined : () => hover(model.id)}
                onPointerOut={isSpace ? undefined : () => hover(null)}
                // 🆕 Space 모델에만 텍스처 교체 적용
                isDayMode={isSpace ? isDayMode : undefined}
                dayTextureUrl={isSpace ? dayTextureUrl : undefined}
                nightTextureUrl={isSpace ? nightTextureUrl : undefined}
              />

              {/* 선택 박스 - 바깥 group에서 렌더링 (rotation 따라감) */}
              {!isSpace && model.id === selectedId && (
                <SelectionBox 
                  scale={model.scale} 
                  url={model.url}
                />
              )}

              {/* 자식 제품들 (가구 기준 상대 좌표) - 개별 visible 속성 사용 */}
              {hasChildren && childProducts!.map((child, idx) => {
                // 🔧 FIX: childProduct의 visible 속성 직접 확인 (rawChildProducts에서)
                const rawChild = rawChildProducts![idx];
                const childVisible = rawChild?.visible !== false;

                return (
                  <ChildProductItem
                    key={child.id}
                    asset={child}
                    visible={childVisible}  // 🆕 개별 visible 속성 사용
                    onClick={() => {
                      select(child.id);
                      onAssetClick?.(child.id, 'product');
                    }}
                  />
                );
              })}
            </group>
          );
        })}
    </group>
  );
}

// ============================================================================
// 로딩 폴백
// ============================================================================
function LoadingFallback() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#4a90d9" wireframe transparent opacity={0.5} />
    </mesh>
  );
}

// ============================================================================
// 단독 Canvas3D (SceneProvider 없이 사용)
// ============================================================================
interface StandaloneCanvas3DProps extends Canvas3DProps {
  environmentPreset?: EnvironmentPreset;
  hdriPath?: string;
  cameraPosition?: [number, number, number];
  cameraTarget?: [number, number, number];
  cameraFov?: number;
}

export function StandaloneCanvas3D({
  mode = 'view',
  enableControls = true,
  showGrid = false,
  className,
  children,
  environmentPreset = 'city',
  hdriPath,
  cameraPosition = [10, 10, 15],
  cameraTarget = [0, 0, 0],
  cameraFov = 50,
}: StandaloneCanvas3DProps) {
  // 디바이스 품질 설정
  const { config } = useDeviceCapability();
  const canvasCfg = config.canvas;

  // WebGL 컨텍스트 손실/복구 상태
  const [contextLost, setContextLost] = useState(false);

  const handleCreated = useCallback(({ gl }: { gl: THREE.WebGLRenderer }) => {
    const canvas = gl.domElement;
    canvas.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
      console.warn('[StandaloneCanvas3D] WebGL context lost — awaiting restore');
      setContextLost(true);
    });
    canvas.addEventListener('webglcontextrestored', () => {
      console.info('[StandaloneCanvas3D] WebGL context restored');
      setContextLost(false);
    });
  }, []);

  return (
    <div className={cn('w-full h-full relative', className)}>
      {contextLost && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/60 text-white gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent" />
          <p className="text-sm">3D 렌더링을 복구하는 중입니다…</p>
          <button
            className="mt-2 px-4 py-1.5 text-xs bg-white/20 hover:bg-white/30 rounded-md transition-colors"
            onClick={() => window.location.reload()}
          >
            페이지 새로고침
          </button>
        </div>
      )}
      <Canvas
        shadows={canvasCfg.shadows}
        dpr={canvasCfg.dpr}
        gl={{
          antialias: canvasCfg.antialias,
          alpha: false,
          powerPreference: canvasCfg.powerPreference,
          stencil: false,
          preserveDrawingBuffer: canvasCfg.preserveDrawingBuffer,
        }}
        onCreated={handleCreated}
      >
        <PerspectiveCamera
          makeDefault
          position={cameraPosition}
          fov={cameraFov}
          near={0.1}
          far={1000}
        />

        <Suspense fallback={<LoadingFallback />}>
          <SceneEnvironment environmentPreset={environmentPreset} hdriPath={hdriPath} />

          {showGrid && (
            <gridHelper args={[50, 50, '#444444', '#222222']} position={[0, 0.001, 0]} />
          )}

          {enableControls && (
            <OrbitControls
              makeDefault
              target={cameraTarget}
              enableDamping={false}  // 성능 최적화: 관성 계산 제거
              minDistance={8}
              maxDistance={40}
              maxPolarAngle={Math.PI / 2.5}
              minPolarAngle={0.3}
              enablePan={true}
              panSpeed={0.5}            
              onChange={(e) => {
                if (e?.target) {
                  const target = e.target.target;
                  const limit = 12;
                  target.x = Math.max(-limit, Math.min(limit, target.x));
                  target.z = Math.max(-limit, Math.min(limit, target.z));
                  target.y = Math.max(0, Math.min(5, target.y));
                }
              }}              
            />
          )}

          {children}

          <PostProcessing enabled={mode !== 'edit'} />

          {config.particle.preloadAll && <Preload all />}
        </Suspense>
      </Canvas>
    </div>
  );
}

// ============================================================================
// 선택 박스 컴포넌트 (바깥 group에서 rotation 따라감)
// ============================================================================
interface SelectionBoxProps {
  scale: [number, number, number];
  url: string;
}

function SelectionBox({ scale, url }: SelectionBoxProps) {
  // GLB 로드해서 BoundingBox 계산
  const { scene } = useGLTF(url);

  // 씬 복제 없이 직접 바운딩 박스 계산 (성능 최적화)
  const boundingBox = useMemo(() => {
    if (!scene) return null;

    // clone(true) 제거 - scene 자체에서 바로 계산
    const box = new THREE.Box3().setFromObject(scene);
    const sizeVec = new THREE.Vector3();
    box.getSize(sizeVec);
    const center = new THREE.Vector3();
    box.getCenter(center);

    return {
      width: sizeVec.x,
      height: sizeVec.y,
      depth: sizeVec.z,
      centerY: center.y,
    };
  }, [scene]);

  // 펄스 애니메이션 제거 - 성능 최적화

  if (!boundingBox) return null;

  // 여백 추가 (10%)
  const w = boundingBox.width * 1.1;
  const h = boundingBox.height * 1.1;
  const d = boundingBox.depth * 1.1;

  return (
    <mesh
      position={[0, boundingBox.centerY, 0]}
      scale={scale}
    >
      <boxGeometry args={[w, h, d]} />
      <meshBasicMaterial
        color="#ea572a"
        transparent
        opacity={0.3}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  );
}

export default Canvas3D;
