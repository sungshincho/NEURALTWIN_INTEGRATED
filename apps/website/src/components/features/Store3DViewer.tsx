import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, Box, Plane, Sphere, Line, useGLTF } from "@react-three/drei";
import { Suspense, useRef, useMemo, useState, useEffect, memo, Component, ReactNode, useCallback, useImperativeHandle, forwardRef } from "react";
import * as THREE from "three";
import { RotateCcw, Mouse } from "lucide-react";
import { Button } from "@/components/ui/button";

// 마우스 휠 아이콘 (휠 부분만 채워진 형태)
const MouseWheelIcon = ({ className }: { className?: string }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    <rect x="6" y="3" width="12" height="18" rx="6" />
    <rect x="10" y="6" width="4" height="5" rx="2" fill="currentColor" />
  </svg>
);

// 마우스 조작 가이드 컴포넌트
const ControlsGuide = () => (
  <div className="absolute bottom-3 left-3 flex flex-col gap-1.5 bg-background/70 backdrop-blur-sm rounded-lg px-3 py-2 border border-border/50">
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Mouse className="w-4 h-4" />
        <span className="absolute -top-0.5 -left-0.5 text-[8px] font-bold text-primary">L</span>
      </div>
      <span>카메라 회전</span>
    </div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="relative w-5 h-5 flex items-center justify-center">
        <Mouse className="w-4 h-4" />
        <span className="absolute -top-0.5 -right-0.5 text-[8px] font-bold text-primary">R</span>
      </div>
      <span>카메라 이동</span>
    </div>
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <div className="w-5 h-5 flex items-center justify-center">
        <MouseWheelIcon className="w-4 h-4" />
      </div>
      <span>축소 / 확대</span>
    </div>
  </div>
);

interface CustomerPath {
  id: string;
  points: [number, number, number][];
  isReturning: boolean;
  dwellTime: number;
}

interface Store3DViewerProps {
  mode: "footfall" | "layout" | "heatmap";
  // Footfall props
  showReturning?: boolean;
  showNew?: boolean;
  customerPaths?: CustomerPath[];
  isPlaying?: boolean;
  // Layout props
  layoutProducts?: Array<{ id: string; name: string; x: number; y: number; color: string; worldX?: number; worldY?: number; rotationY?: number; snappedTo?: string }>;
  // Heatmap props
  timeOfDay?: number;
  heatmapData?: Array<{ x: number; y: number; intensity: number }>;
  hotspots?: Array<{ x: number; y: number; intensity: number }>;
}

// 애니메이션되는 고객 구체
const AnimatedCustomer = ({ 
  path, 
  isReturning, 
  speed = 8,
  isPlaying = true
}: { 
  path: [number, number, number][]; 
  isReturning: boolean; 
  speed?: number;
  isPlaying?: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);

  // path가 2개 미만이면 안전용 더미
  const safePath = path.length >= 2 
    ? path 
    : [[0, 0.5, 0], [0, 0.5, 0]] as [number, number, number][];

  // 각 손님마다 랜덤 시작 지연 (0.5초 ~ 4초)
  const spawnDelayRef = useRef(0.5 + Math.random() * 3.5);
  const elapsedRef = useRef(0);
  const [started, setStarted] = useState(false);

  // 진행도는 인덱스 기반
  const [progress, setProgress] = useState(0);

  useFrame((_, delta) => {
    // 손님별 로컬 경과 시간
    elapsedRef.current += delta;

    // 아직 입장 전이면 아예 숨김
    if (!started && elapsedRef.current < spawnDelayRef.current) {
      return;
    }

    if (!started) {
      setStarted(true);
    }

    // isPlaying이 false면 애니메이션 멈춤
    if (!isPlaying) {
      return;
    }

    // 여기부터 기존 로직
    setProgress((prev) => {
      const next = prev + delta * speed;
      return next > safePath.length - 1 ? 0 : next;
    });

    if (meshRef.current && safePath.length > 1) {
      const index = Math.floor(progress);
      const safeIndex = Math.min(index, safePath.length - 1);
      const nextIndex = Math.min(safeIndex + 1, safePath.length - 1);
      const t = progress - safeIndex;

      const current = safePath[safeIndex];
      const next = safePath[nextIndex];

      if (current && next) {
        meshRef.current.position.x = current[0] + (next[0] - current[0]) * t;
        meshRef.current.position.y = current[1] + (next[1] - current[1]) * t;
        meshRef.current.position.z = current[2] + (next[2] - current[2]) * t;
      }
    }
  });

  const color = isReturning ? "#8b5cf6" : "#3b82f6";
  const initialPosition = safePath[0] || [0, 0.5, 0];

  return (
    <Sphere 
      ref={meshRef} 
      args={[0.25]} 
      position={initialPosition}
      // spawnDelay 지나기 전까지는 안 보이게
      visible={started}
    >
      <meshStandardMaterial 
        color={color} 
        emissive={color} 
        emissiveIntensity={0.6}
        transparent
        opacity={0.9}
      />
    </Sphere>
  );
};

// 고객 동선 라인
const CustomerPathLine = ({ 
  points, 
  isReturning 
}: { 
  points: [number, number, number][]; 
  isReturning: boolean;
}) => {
  // Safety check: Line requires at least 2 points
  if (!points || points.length < 2) {
    return null;
  }
  
  const color = isReturning ? "#8b5cf6" : "#3b82f6";
  
  return (
    <Line
      points={points}
      color={color}
      lineWidth={3}
      transparent={false}  
      opacity={1}
      dashed={false}  
    />
  );
};

// 히트맵 셀 애니메이션
const HeatmapCell = ({ 
  x, 
  z, 
  intensity, 
  isHotspot = false 
}: { 
  x: number; 
  z: number; 
  intensity: number; 
  isHotspot?: boolean;
}) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      const material = meshRef.current.material as THREE.MeshStandardMaterial;
      
      if (isHotspot) {
        // 핫스팟인 경우 깜빡이는 효과 (깜빡이는 속도: * 6 부분을 조절)
        const blinkIntensity = Math.sin(state.clock.elapsedTime * 6) * 0.5 + 0.5;
        material.opacity = intensity * 0.6 + blinkIntensity * 0.4;
        material.emissiveIntensity = intensity * 0.4 + blinkIntensity * 0.5;
      } else {
        // 핫스팟이 아닌 경우 원래 intensity에 맞는 값으로 복구
        material.opacity = intensity * 0.6 + 0.1;
        material.emissiveIntensity = intensity * 0.4;
      }
    }
  });

  const getColor = (intensity: number) => {
    if (intensity < 0.2) return '#3b82f6';
    if (intensity < 0.4) return '#06b6d4';
    if (intensity < 0.6) return '#eab308';
    if (intensity < 0.8) return '#f97316';
    return '#ef4444';
  };

  const color = getColor(intensity);

  return (
    <Plane 
      ref={meshRef}
      args={[1, 1]} 
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[x, 0.3, z]}
    >
      <meshStandardMaterial 
        color={color} 
        transparent 
        opacity={intensity * 0.6 + 0.1}
        emissive={color}
        emissiveIntensity={intensity * 0.4}
      />
    </Plane>
  );
};


// ============================================================
// 가구/제품 레이아웃 데이터 (furniture_product_layout.csv 기반)
// ============================================================
export const furnitureLayout = [
  // Shelf_WallShelf
  { file: 'Shelf_WallShelf1_1.7x2.5x0.5.glb', x: -7.1, y: 3.2, z: 0.0, rotationY: 90 },
  { file: 'Shelf_WallShelf2_1.7x2.5x0.5.glb', x: -7.1, y: 1.3, z: 0.0, rotationY: 90 },
  { file: 'Shelf_WallShelf3_1.7x2.5x0.5.glb', x: -7.1, y: -0.6, z: 0.0, rotationY: 90 },
  { file: 'Shelf_WallShelf4_1.7x2.5x0.5.glb', x: -7.1, y: -3.5, z: 0.0, rotationY: 90 },
  { file: 'Shelf_WallShelf5_1.7x2.5x0.5.glb', x: -7.1, y: -5.4, z: 0.0, rotationY: 90 },
  { file: 'Shelf_WallShelf6_1.7x2.5x0.5.glb', x: -4.2, y: -7.7, z: 0.0, rotationY: 0 },
  { file: 'Shelf_WallShelf7_1.7x2.5x0.5.glb', x: -2.5, y: -7.7, z: 0.0, rotationY: 0 },
  { file: 'Shelf_WallShelf8_1.7x2.5x0.5.glb', x: -0.6, y: -7.7, z: 0.0, rotationY: 0 },
  { file: 'Shelf_WallShelf9_1.7x2.5x0.5.glb', x: 7.4, y: -1.6, z: 0.0, rotationY: -90 },
  { file: 'Shelf_WallShelf10_1.7x2.5x0.5.glb', x: 7.4, y: 0.8, z: 0.0, rotationY: -90 },
  { file: 'Shelf_WallShelf11_1.7x2.5x0.5.glb', x: 7.4, y: 3.2, z: 0.0, rotationY: -90 },
  { file: 'Shelf_WallShelf12_1.7x2.5x0.5.glb', x: 6.0, y: 5.0, z: 0.0, rotationY: -180 },
  { file: 'Shelf_WallShelf13_1.7x2.5x0.5.glb', x: 4.0, y: 5.0, z: 0.0, rotationY: -180 },
  // Shelf_SideShelf
  { file: 'Shelf_SideShelf1_1.3x0.8x0.5.glb', x: -0.8, y: 1.2, z: 0.1, rotationY: 90 },
  { file: 'Shelf_SideShelf2_1.9x1.0x0.5.glb', x: 3.6, y: -1.0, z: 0.1, rotationY: 0 },
  // Mannequin
  { file: 'Mannequin_FullMannequin1_0.7x1.9x0.7.glb', x: -2.4, y: 5.0, z: 0.1, rotationY: 0 },
  { file: 'Mannequin_FullMannequin2_0.6x1.9x0.6.glb', x: -1.2, y: 5.0, z: 0.1, rotationY: 0 },
  { file: 'Mannequin_HalfMannequin_0.4x1.6x0.4.glb', x: -3.5, y: 5.0, z: 0.0, rotationY: 0 },
  // DisplayTable
  { file: 'DisplayTable_CenterTable_3.6x1.2x1.3.glb', x: -3.0, y: 1.2, z: 0.0, rotationY: 0 },
  { file: 'DisplayTable_CircularTable_2.3x0.9x2.3.glb', x: -3.5, y: -4.5, z: 0.0, rotationY: 0 },
  // CheckoutCounter
  { file: 'CheckoutCounter_CheckoutCounter_2.9x1.2x0.7.glb', x: 3, y: -4, z: 0.0, rotationY: 0 },
  // Rack_Hanger
  { file: 'Rack_Hanger1_1.7x1.5x0.5.glb', x: -1.0, y: -2.6, z: 0.0, rotationY: -90 },
  { file: 'Rack_Hanger2_1.7x1.5x0.5.glb', x: -1.0, y: -4.5, z: 0.0, rotationY: -90 },
  { file: 'Rack_Hanger3_1.7x1.5x0.5.glb', x: -0.2, y: -2.6, z: 0.0, rotationY: -90 },
  { file: 'Rack_Hanger4_1.7x1.5x0.5.glb', x: -0.2, y: -4.5, z: 0.0, rotationY: -90 },
  { file: 'Rack_Hanger5_1.7x1.5x0.5.glb', x: 2.0, y: 1.6, z: 0.0, rotationY: -90 },
  { file: 'Rack_Hanger6_1.7x1.5x0.5.glb', x: 2.0, y: -0.3, z: 0.0, rotationY: -90 },
  { file: 'Rack_Hanger7_1.7x1.5x0.5.glb', x: 5.0, y: 1.6, z: 0.0, rotationY: -90 },
  { file: 'Rack_Hanger8_1.7x1.5x0.5.glb', x: 5.0, y: -0.3, z: 0.0, rotationY: -90 },
  // Product_set
  { file: 'Product_set_1.glb', x: -3, y: 1.15, z: 0.0, rotationY: 0 },
  { file: 'Product_set_2.glb', x: -3.5, y: -4.45, z: 0.0, rotationY: 0 },
];


// ErrorBoundary for individual furniture items
class FurnitureErrorBoundary extends Component<
  { children: ReactNode; fallback?: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback?: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    console.warn('Failed to load furniture model:', error.message);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || null;
    }
    return this.props.children;
  }
}

// 개별 GLB 가구/제품 로더
const FurnitureItemInner = ({ 
  file, 
  x, 
  y, 
  z, 
  rotationY = 0 
}: { 
  file: string; 
  x: number; 
  y: number; 
  z: number; 
  rotationY?: number;
}) => {
  const { scene } = useGLTF(`/models/${file}`);
  const clonedScene = useMemo(() => scene.clone(), [scene]);
  
  return (
    <primitive 
      object={clonedScene} 
      scale={1} 
      position={[x, z, y]} 
      rotation={[0, (rotationY * Math.PI) / 180, 0]}
    />
  );
};

// Wrapped FurnitureItem with error boundary
const FurnitureItem = (props: { 
  file: string; 
  x: number; 
  y: number; 
  z: number; 
  rotationY?: number;
}) => (
  <FurnitureErrorBoundary>
    <FurnitureItemInner {...props} />
  </FurnitureErrorBoundary>
);

// GLB 매장 모델 로더
const GLBStoreModel = () => {
  const { scene } = useGLTF('/models/store-kolon.glb');
  return <primitive object={scene} scale={1} position={[0, 0, 0]} />;
};

// 전체 가구/제품 배치
const FurnitureLayout = () => {
  return (
    <>
      {furnitureLayout.map((item, idx) => (
        <FurnitureItem 
          key={`${item.file}-${idx}`}
          file={item.file}
          x={item.x}
          y={item.y}
          z={item.z}
          rotationY={item.rotationY}
        />
      ))}
    </>
  );
};

// 3D 매장 모델 — memo로 래핑하여 props 변경 시에만 리렌더 (카메라 스냅백 방지)
const StoreModel = memo(({
  mode,
  showReturning = true,
  showNew = true,
  customerPaths = [],
  isPlaying = true,
  layoutProducts = [],
  timeOfDay = 14,
  heatmapData = [],
  hotspots = [],
}: Store3DViewerProps) => {

  return (
    <>
      {/* GLB 매장 모델 */}
      <GLBStoreModel />
      
      {/* 가구/제품 레이아웃 */}
      <FurnitureLayout />

      {/* Footfall 모드 - 고객 동선 시각화 */}
      {mode === "footfall" && (
        <>
          {/* 고객 동선 라인 */}
          {customerPaths.map((path, i) => {
            if ((path.isReturning && !showReturning) || (!path.isReturning && !showNew)) {
              return null;
            }
            return (
              <group key={path.id}>
                <CustomerPathLine 
                  points={path.points} 
                  isReturning={path.isReturning} 
                />
                <AnimatedCustomer 
                  path={path.points} 
                  isReturning={path.isReturning}
                  speed={1.5 + Math.random() * 1.0}
                  isPlaying={isPlaying}
                />
              </group>
            );
          })}
        </>
      )}

      {/* Layout 모드 - 레이아웃 시뮬레이션 */}
      {mode === "layout" && (
        <>
          {/* 사용자가 배치한 제품들 시각화 */}
          {layoutProducts.map((product) => {
            // 스냅된 가구가 있으면 해당 가구의 실제 3D 좌표 사용
            const x3d = product.worldX !== undefined ? product.worldX : (product.x / 100) * 16 - 8;
            const z3d = product.worldY !== undefined ? product.worldY : (product.y / 100) * 12 - 6;
            // 스냅된 가구의 회전값 적용 (degree → radian)
            const rotationY = product.rotationY !== undefined ? (product.rotationY * Math.PI) / 180 : 0;
            
            // 스냅된 가구의 GLB 파일명에서 크기 파싱
            let boxWidth = 1.0;
            let boxHeight = 0.8;
            let boxDepth = 0.6;
            
            if (product.snappedTo) {
              // 파일명 형식: CategoryType_ItemName_WxHxD.glb
              const match = product.snappedTo.match(/(\d+\.?\d*)x(\d+\.?\d*)x(\d+\.?\d*)\.glb$/);
              if (match) {
                boxWidth = parseFloat(match[1]);
                boxHeight = parseFloat(match[2]);
                boxDepth = parseFloat(match[3]);
              }
            }
            
            const colorMap: { [key: string]: string } = {
              'bg-primary': '#0EA5E9',
              'bg-blue-500': '#3b82f6',
              'bg-purple-500': '#a855f7',
              'bg-amber-500': '#f59e0b',
              'bg-yellow-500': '#eab308',
              'bg-pink-500': '#ec4899'
            };
            const color = colorMap[product.color] || '#0EA5E9';

            return (
              <group key={product.id} position={[x3d, 0, z3d]} rotation={[0, rotationY, 0]}>
                {/* 제품 진열대 - 스냅된 가구 크기에 맞춤 */}
                <Box args={[boxWidth, boxHeight, boxDepth]} position={[0, boxHeight / 2, 0]}>
                  <meshStandardMaterial 
                    color={color} 
                    emissive={color}
                    emissiveIntensity={0.25}
                    transparent
                    opacity={0.65}
                  />
                </Box>
                {/* 바닥 강조 */}
                <Plane args={[boxWidth + 0.4, boxDepth + 0.4]} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
                  <meshStandardMaterial 
                    color={color} 
                    transparent 
                    opacity={0.3}
                    emissive={color}
                    emissiveIntensity={0.2}
                  />
                </Plane>
              </group>
            );
          })}
        </>
      )}

      {/* Heatmap 모드 - 트래픽 히트맵 */}
      {mode === "heatmap" && (
        <>
          {/* 히트맵 데이터 시각화 - allowedHeatmapPositions에 정의된 좌표만 표시 */}
          {heatmapData.map((cell, idx) => {
            // 3D 공간 좌표로 직접 사용 (이미 generateHeatmapData에서 필터링됨)
            const x3d = cell.x;
            const z3d = cell.y;
            
            // hotspots 배열에서 현재 셀이 핫스팟인지 확인
            const isHotspot = hotspots.some(spot => spot.x === x3d && spot.y === z3d);
            
            return (
              <HeatmapCell 
                key={idx}
                x={x3d}
                z={z3d}
                intensity={cell.intensity}
                isHotspot={isHotspot}
              />
            );
          })}

        </>
      )}
    </>
  );
});

StoreModel.displayName = 'StoreModel';

// GLB 파일 프리로드
useGLTF.preload('/models/store-kolon.glb');
furnitureLayout.forEach(item => useGLTF.preload(`/models/${item.file}`));

// 기본 카메라 설정
const DEFAULT_CAMERA_POSITION: [number, number, number] = [18, 14, 18];
const DEFAULT_TARGET: [number, number, number] = [0, 0, 0];

// 카메라 컨트롤러 — dampening + 사용자 인터랙션 감지로 안정화
interface CameraControllerHandle {
  reset: () => void;
}

const CameraController = forwardRef<CameraControllerHandle, object>((_, ref) => {
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  const isUserInteracting = useRef(false);
  const isResetting = useRef(false);

  // 초기 카메라 위치 + target 설정 (1회만 실행 — 리렌더 시 카메라 리셋 방지)
  useEffect(() => {
    camera.position.set(...DEFAULT_CAMERA_POSITION);
    if (controlsRef.current) {
      controlsRef.current.target.set(...DEFAULT_TARGET);
      controlsRef.current.update();
    }
  }, []);

  // 사용자 인터랙션 감지 (드래그 중 자동 애니메이션 충돌 방지)
  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const onStart = () => { isUserInteracting.current = true; };
    const onEnd = () => { isUserInteracting.current = false; };
    controls.addEventListener('start', onStart);
    controls.addEventListener('end', onEnd);
    return () => {
      controls.removeEventListener('start', onStart);
      controls.removeEventListener('end', onEnd);
    };
  }, []);

  // dampening 동작 + 리셋 시 부드러운 카메라 전환
  useFrame(() => {
    if (!controlsRef.current) return;
    controlsRef.current.update();

    if (isResetting.current && !isUserInteracting.current) {
      camera.position.lerp(new THREE.Vector3(...DEFAULT_CAMERA_POSITION), 0.08);
      controlsRef.current.target.lerp(new THREE.Vector3(...DEFAULT_TARGET), 0.08);

      // 목표 위치에 충분히 가까우면 리셋 완료
      const dist = camera.position.distanceTo(new THREE.Vector3(...DEFAULT_CAMERA_POSITION));
      if (dist < 0.05) {
        camera.position.set(...DEFAULT_CAMERA_POSITION);
        controlsRef.current.target.set(...DEFAULT_TARGET);
        isResetting.current = false;
      }
    }
  });

  useImperativeHandle(ref, () => ({
    reset: () => {
      isResetting.current = true;
    }
  }));

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      enableDamping={true}
      dampingFactor={0.05}
      minDistance={8}
      maxDistance={45}
      maxPolarAngle={Math.PI / 2.1}
    />
  );
});

CameraController.displayName = 'CameraController';

export const Store3DViewer = (props: Store3DViewerProps) => {
  const cameraControllerRef = useRef<CameraControllerHandle>(null);

  const handleResetCamera = useCallback(() => {
    cameraControllerRef.current?.reset();
  }, []);

  return (
    <div className="relative w-full h-[500px] rounded-xl overflow-hidden bg-gradient-to-b from-muted/10 to-muted/30 border border-border/50">
      <Canvas shadows gl={{ preserveDrawingBuffer: true, antialias: true }}>
        <Suspense fallback={null}>
          {/* PerspectiveCamera에서 position prop 제거 — CameraController가 초기 위치를 1회만 설정 */}
          <PerspectiveCamera makeDefault fov={50} />
          <CameraController ref={cameraControllerRef} />
          
          {/* 조명 */}
          <ambientLight intensity={0.5} />
          <directionalLight 
            position={[12, 18, 10]} 
            intensity={0.9} 
            castShadow 
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          
          {/* 천장 조명 */}
          {[[-6, -4], [-6, 0], [-6, 4], [0, -4], [0, 0], [0, 4], [6, -4], [6, 0], [6, 4]].map(([x, z], i) => (
            <pointLight 
              key={i} 
              position={[x, 3.8, z]} 
              intensity={0.5} 
              distance={8} 
              decay={2} 
              color="#fffaf0" 
            />
          ))}
          
          {/* 진열대 스팟 조명 */}
          <pointLight position={[-6, 2.5, 0]} intensity={0.4} distance={5} color="#ffffff" />
          <pointLight position={[6, 2.5, 0]} intensity={0.4} distance={5} color="#ffffff" />
          
          {/* 입구 조명 */}
          <pointLight position={[0, 2, 7]} intensity={0.6} distance={6} color="#ffffff" />
          
          {/* 계산대 조명 */}
          <pointLight position={[0, 2.5, -6]} intensity={0.5} distance={5} color="#ffffff" />
          
          {/* 3D 매장 모델 */}
          <StoreModel {...props} />
        </Suspense>
      </Canvas>
      
      {/* 카메라 리셋 버튼 */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleResetCamera}
        className="absolute bottom-3 right-3 bg-background/80 backdrop-blur-sm hover:bg-background/90 border-border/50"
      >
        <RotateCcw className="w-4 h-4 mr-1.5" />
        리셋 카메라뷰
      </Button>
      
      {/* 마우스 조작 가이드 */}
      <ControlsGuide />
    </div>
  );
};
