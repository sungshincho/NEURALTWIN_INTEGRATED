/**
 * LayoutComparisonView.tsx
 * As-Is vs To-Be 레이아웃 비교 뷰 - GLB 모델 지원 + 제품 재배치 시각화
 */

import { useState, Suspense, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Grid, Box, Plane, Html, useGLTF } from '@react-three/drei';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  ArrowLeftRight, Eye, Sparkles, ArrowRight, Save, MoveRight, Loader2, Package 
} from 'lucide-react';
import * as THREE from 'three';

interface Vector3D { x: number; y: number; z: number; }

interface LayoutChange {
  entityId: string;
  entityLabel: string;
  entityType: string;
  currentPosition?: Vector3D;
  suggestedPosition?: Vector3D;
  currentRotation?: Vector3D;
  suggestedRotation?: Vector3D;
  reason: string;
  impact: 'high' | 'medium' | 'low';
}

interface ProductPlacement {
  productId: string;
  productLabel: string;
  currentFurnitureId?: string;
  currentFurnitureLabel?: string;
  suggestedFurnitureId?: string;
  suggestedFurnitureLabel?: string;
  currentPosition?: Vector3D;
  suggestedPosition?: Vector3D;
  reason: string;
  impact: 'high' | 'medium' | 'low';
  isFurnitureChange: boolean;
}

interface FurnitureItem {
  id?: string;
  position?: Vector3D;
  rotation?: Vector3D;
  scale?: Vector3D;
  dimensions?: { width?: number; height?: number; depth?: number };
  color?: string;
  label?: string;
  furniture_type?: string;
  model_url?: string | null;
}

interface ProductItem {
  id?: string;
  position?: Vector3D;
  rotation?: Vector3D;
  scale?: Vector3D;
  dimensions?: { width?: number; height?: number; depth?: number };
  label?: string;
  model_url?: string | null;
}

interface SceneRecipe {
  space?: any;
  furniture: FurnitureItem[];
  products: ProductItem[];
}

interface ConfidenceFactors {
  dataQuality?: number;
  historicalAccuracy?: number;
  modelCertainty?: number;
  externalFactors?: number;
  sampleSize?: number;
  recency?: number;
}

interface LayoutComparisonViewProps {
  currentRecipe: SceneRecipe | null;
  suggestedRecipe: SceneRecipe | null;
  changes: LayoutChange[];
  productPlacements?: ProductPlacement[];
  optimizationSummary?: {
    expectedTrafficIncrease?: number;
    expectedRevenueIncrease?: number;
    confidence?: number;
    confidenceFactors?: ConfidenceFactors;
  };
  onApplySuggestion?: () => void;
  isApplying?: boolean;
}

// 안전한 숫자 포맷
function safeToFixed(value: any, digits: number = 1): string {
  if (value === undefined || value === null || isNaN(value)) return '0.0';
  return Number(value).toFixed(digits);
}

// GLB 모델 컴포넌트 (에러 경계 포함)
function GLBModelInner({ 
  url, 
  position, 
  rotation, 
  scale,
  isHighlighted = false,
  highlightColor = '#FFD700'
}: {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isHighlighted?: boolean;
  highlightColor?: string;
}) {
  const { scene } = useGLTF(url);
  const clonedScene = useRef<THREE.Group | null>(null);
  
  useEffect(() => {
    if (clonedScene.current && isHighlighted) {
      clonedScene.current.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material) {
          const mat = child.material as THREE.MeshStandardMaterial;
          if (mat.emissive) {
            mat.emissive = new THREE.Color(highlightColor);
            mat.emissiveIntensity = 0.4;
          }
        }
      });
    }
  }, [isHighlighted, highlightColor]);

  return (
    <group 
      position={position}
      rotation={rotation.map(r => r * Math.PI / 180) as [number, number, number]}
      scale={scale}
    >
      <primitive ref={clonedScene} object={scene.clone()} />
    </group>
  );
}

// GLB 모델 래퍼 (로드 실패 시 null 반환)
function GLBModel(props: {
  url: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  isHighlighted?: boolean;
  highlightColor?: string;
  onError?: () => void;
}) {
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    // URL 유효성 사전 체크
    fetch(props.url, { method: 'HEAD' })
      .then(res => {
        if (!res.ok) {
          console.warn(`GLB not found: ${props.url}`);
          setHasError(true);
          props.onError?.();
        }
      })
      .catch(() => {
        setHasError(true);
        props.onError?.();
      });
  }, [props.url]);
  
  if (hasError) return null;
  
  return <GLBModelInner {...props} />;
}

// 폴백 박스 컴포넌트 (모델 없을 때)
function FallbackBox({ 
  position, 
  rotation, 
  scale, 
  color = '#8B4513', 
  label, 
  isHighlighted = false,
  highlightColor = '#FFD700',
  isProduct = false
}: {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color?: string;
  label?: string;
  isHighlighted?: boolean;
  highlightColor?: string;
  isProduct?: boolean;
}) {
  const adjustedY = (position[1] || 0) + (scale[1] || 1) / 2;
  const boxColor = isHighlighted ? highlightColor : (isProduct ? '#4CAF50' : color);
  
  return (
    <group 
      position={[position[0] || 0, adjustedY, position[2] || 0]} 
      rotation={rotation.map(r => (r || 0) * Math.PI / 180) as [number, number, number]}
    >
      <Box args={scale}>
        <meshStandardMaterial 
          color={boxColor} 
          transparent 
          opacity={0.85} 
        />
      </Box>
      <Box args={[(scale[0] || 1) + 0.02, (scale[1] || 1) + 0.02, (scale[2] || 1) + 0.02]}>
        <meshBasicMaterial color={isHighlighted ? highlightColor : '#333'} wireframe />
      </Box>
      {label && (
        <Html position={[0, (scale[1] || 1) / 2 + 0.3, 0]} center>
          <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {label}
          </div>
        </Html>
      )}
    </group>
  );
}

// 가구/상품 아이템 렌더러
function ItemRenderer({ 
  item, 
  isHighlighted = false,
  highlightColor = '#FFD700',
  isProduct = false,
  showLabel = true
}: {
  item: FurnitureItem | ProductItem;
  isHighlighted?: boolean;
  highlightColor?: string;
  isProduct?: boolean;
  showLabel?: boolean;
}) {
  const [modelFailed, setModelFailed] = useState(false);
  
  const position: [number, number, number] = [
    item.position?.x || 0, 
    item.position?.y || 0, 
    item.position?.z || 0
  ];
  const rotation: [number, number, number] = [
    item.rotation?.x || 0, 
    item.rotation?.y || 0, 
    item.rotation?.z || 0
  ];
  
  // GLB 모델용 scale (실제 scale 값 사용)
  const modelScale: [number, number, number] = [
    item.scale?.x || 1, 
    item.scale?.y || 1, 
    item.scale?.z || 1
  ];
  
  // 폴백 박스용 scale (dimensions 우선, 없으면 scale)
  const boxScale: [number, number, number] = item.dimensions 
    ? [
        item.dimensions.width || 1,
        item.dimensions.height || 1,
        item.dimensions.depth || 1
      ]
    : modelScale;

  const label = showLabel 
    ? ('furniture_type' in item ? item.furniture_type : item.label) || item.label 
    : undefined;

  // model_url이 있고 로드 실패하지 않았으면 GLB 로드 시도
  if (item.model_url && !modelFailed) {
    return (
      <Suspense fallback={
        <FallbackBox 
          position={position} 
          rotation={rotation} 
          scale={boxScale}
          color={(item as FurnitureItem).color || '#888'}
          label={label}
          isHighlighted={isHighlighted}
          highlightColor={highlightColor}
          isProduct={isProduct}
        />
      }>
        <GLBModel 
          url={item.model_url}
          position={position}
          rotation={rotation}
          scale={modelScale}
          isHighlighted={isHighlighted}
          highlightColor={highlightColor}
          onError={() => setModelFailed(true)}
        />
        {label && (
          <Html position={[position[0], position[1] + (boxScale[1] || 1) + 0.5, position[2]]} center>
            <div className="bg-black/70 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
              {label}
            </div>
          </Html>
        )}
      </Suspense>
    );
  }

  // model_url 없거나 로드 실패하면 폴백 박스
  return (
    <FallbackBox 
      position={position} 
      rotation={rotation} 
      scale={boxScale}
      color={(item as FurnitureItem).color || '#888'}
      label={label}
      isHighlighted={isHighlighted}
      highlightColor={highlightColor}
      isProduct={isProduct}
    />
  );
}

function SceneRenderer({ 
  recipe, 
  changes = [],
  productPlacements = [],
  isToBeView = false 
}: { 
  recipe: SceneRecipe | null; 
  changes?: LayoutChange[];
  productPlacements?: ProductPlacement[];
  isToBeView?: boolean;
}) {
  if (!recipe || !recipe.furniture || recipe.furniture.length === 0) {
    return (
      <Html center>
        <div className="text-gray-400 text-center">
          <div className="text-4xl mb-2">📦</div>
          <div>가구 데이터 없음</div>
        </div>
      </Html>
    );
  }
  
  const changedFurnitureIds = new Set((changes || []).map(c => c.entityId));
  
  // 제품 하이라이트 맵 생성: productId -> { isHighlighted, isFurnitureChange }
  const productHighlightMap = new Map<string, { highlighted: boolean; isFurnitureChange: boolean }>();
  (productPlacements || []).forEach(p => {
    productHighlightMap.set(p.productId, { 
      highlighted: true, 
      isFurnitureChange: p.isFurnitureChange 
    });
  });

  return (
    <>
      <Grid 
        args={[20, 20]} 
        cellSize={1} 
        cellThickness={0.5} 
        cellColor="#6e6e6e"
        sectionSize={5} 
        sectionThickness={1} 
        sectionColor="#9d4b4b" 
        fadeDistance={30} 
      />
      
      {/* 매장 공간 렌더링 */}
      {recipe.space?.model_url ? (
        <Suspense fallback={
          <Plane args={[17.4, 16.6]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
            <meshStandardMaterial color="#f0f0f0" />
          </Plane>
        }>
          <GLBModel 
            url={recipe.space.model_url}
            position={[
              recipe.space.position?.x || 0,
              recipe.space.position?.y || 0,
              recipe.space.position?.z || 0
            ]}
            rotation={[
              recipe.space.rotation?.x || 0,
              recipe.space.rotation?.y || 0,
              recipe.space.rotation?.z || 0
            ]}
            scale={[
              recipe.space.scale?.x || 1,
              recipe.space.scale?.y || 1,
              recipe.space.scale?.z || 1
            ]}
            isHighlighted={false}
            onError={() => console.warn('Store model failed to load')}
          />
        </Suspense>
      ) : (
        <Plane args={[17.4, 16.6]} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]}>
          <meshStandardMaterial color="#f0f0f0" />
        </Plane>
      )}
      
      {/* 가구 렌더링 */}
      {recipe.furniture.map((item, idx) => (
        <ItemRenderer
          key={`furniture-${item.id || idx}`}
          item={item}
          isHighlighted={changedFurnitureIds.has(item.id || '') && isToBeView}
          highlightColor="#FFD700"
          isProduct={false}
        />
      ))}
      
      {/* 상품 렌더링 - 제품 재배치 하이라이트 적용 */}
      {recipe.products?.map((item, idx) => {
        const highlightInfo = productHighlightMap.get(item.id || '');
        const isHighlighted = isToBeView && highlightInfo?.highlighted;
        // 가구 변경: 보라색, 일반 이동: 파란색
        const highlightColor = highlightInfo?.isFurnitureChange ? '#9333EA' : '#3B82F6';
        
        return (
          <ItemRenderer
            key={`product-${item.id || idx}`}
            item={item}
            isHighlighted={isHighlighted}
            highlightColor={highlightColor}
            isProduct={true}
            showLabel={isHighlighted}
          />
        );
      })}
      
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 15, 10]} intensity={0.8} />
    </>
  );
}

// 신뢰도 게이지 컴포넌트
function ConfidenceGauge({ 
  confidence, 
  factors 
}: { 
  confidence: number; 
  factors?: ConfidenceFactors;
}) {
  const factorLabels: Record<keyof ConfidenceFactors, string> = {
    dataQuality: '데이터 품질',
    historicalAccuracy: '과거 정확도',
    modelCertainty: '모델 확신도',
    externalFactors: '외부 요인',
    sampleSize: '샘플 크기',
    recency: '데이터 최신성'
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <div className="text-lg font-bold text-purple-600">{confidence}%</div>
        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-purple-600 transition-all duration-500"
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
      {factors && (
        <div className="grid grid-cols-2 gap-1 text-xs">
          {Object.entries(factors).map(([key, value]) => (
            <div key={key} className="flex items-center justify-between gap-1 px-1">
              <span className="text-muted-foreground truncate">
                {factorLabels[key as keyof ConfidenceFactors] || key}
              </span>
              <div className="flex items-center gap-1">
                <div className="w-12 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-purple-400"
                    style={{ width: `${(value || 0) * 100}%` }}
                  />
                </div>
                <span className="text-purple-600 w-8 text-right">
                  {Math.round((value || 0) * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function LayoutComparisonView({
  currentRecipe, 
  suggestedRecipe, 
  changes = [], 
  productPlacements = [],
  optimizationSummary, 
  onApplySuggestion, 
  isApplying = false
}: LayoutComparisonViewProps) {
  const [viewMode, setViewMode] = useState<'split' | 'current' | 'suggested'>('split');

  // 안전한 배열
  const safeChanges = Array.isArray(changes) ? changes : [];
  const safePlacements = Array.isArray(productPlacements) ? productPlacements : [];

  const getImpactBadge = (impact: string) => {
    const colors: Record<string, string> = {
      high: 'bg-red-100 text-red-800', 
      medium: 'bg-yellow-100 text-yellow-800', 
      low: 'bg-green-100 text-green-800'
    };
    const labels: Record<string, string> = { high: '높음', medium: '중간', low: '낮음' };
    return <Badge className={colors[impact] || 'bg-gray-100'}>{labels[impact] || impact}</Badge>;
  };

  return (
    <div className="space-y-4">
      {/* 요약 + 신뢰도 게이지 */}
      {optimizationSummary && (
        <div className="grid grid-cols-3 gap-4 p-3 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-bold text-green-600">
              +{optimizationSummary.expectedTrafficIncrease || 0}%
            </div>
            <div className="text-xs text-muted-foreground">예상 트래픽</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">
              +{optimizationSummary.expectedRevenueIncrease || 0}%
            </div>
            <div className="text-xs text-muted-foreground">예상 매출</div>
          </div>
          <div>
            <ConfidenceGauge 
              confidence={optimizationSummary.confidence || 0}
              factors={optimizationSummary.confidenceFactors}
            />
            <div className="text-xs text-muted-foreground text-center mt-1">신뢰도</div>
          </div>
        </div>
      )}

      {/* 뷰 모드 탭 */}
      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)}>
        <TabsList>
          <TabsTrigger value="split">
            <ArrowLeftRight className="h-4 w-4 mr-1" />비교
          </TabsTrigger>
          <TabsTrigger value="current">
            <Eye className="h-4 w-4 mr-1" />현재
          </TabsTrigger>
          <TabsTrigger value="suggested">
            <Sparkles className="h-4 w-4 mr-1" />추천
          </TabsTrigger>
        </TabsList>

        <div className="mt-3 border rounded-lg overflow-hidden" style={{ height: '350px' }}>
          <TabsContent value="split" className="h-full m-0">
            <div className="grid grid-cols-2 gap-1 h-full">
              <div className="relative bg-gray-900">
                <div className="absolute top-2 left-2 z-10 bg-black/60 text-white px-2 py-1 rounded text-xs">
                  현재 (As-Is)
                </div>
                <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                  <Suspense fallback={null}>
                    <SceneRenderer recipe={currentRecipe} changes={safeChanges} productPlacements={safePlacements} />
                  </Suspense>
                  <OrbitControls />
                </Canvas>
              </div>
              <div className="relative bg-gray-900">
                <div className="absolute top-2 left-2 z-10 bg-blue-600/80 text-white px-2 py-1 rounded text-xs">
                  추천 (To-Be)
                </div>
                <Canvas camera={{ position: [10, 10, 10], fov: 50 }}>
                  <Suspense fallback={null}>
                    <SceneRenderer recipe={suggestedRecipe} changes={safeChanges} productPlacements={safePlacements} isToBeView />
                  </Suspense>
                  <OrbitControls />
                </Canvas>
              </div>
            </div>
          </TabsContent>
          <TabsContent value="current" className="h-full m-0">
            <div className="relative h-full bg-gray-900">
              <Canvas camera={{ position: [12, 12, 12], fov: 50 }}>
                <Suspense fallback={null}>
                  <SceneRenderer recipe={currentRecipe} changes={safeChanges} productPlacements={safePlacements} />
                </Suspense>
                <OrbitControls />
              </Canvas>
            </div>
          </TabsContent>
          <TabsContent value="suggested" className="h-full m-0">
            <div className="relative h-full bg-gray-900">
              <Canvas camera={{ position: [12, 12, 12], fov: 50 }}>
                <Suspense fallback={null}>
                  <SceneRenderer recipe={suggestedRecipe} changes={safeChanges} productPlacements={safePlacements} isToBeView />
                </Suspense>
                <OrbitControls />
              </Canvas>
            </div>
          </TabsContent>
        </div>
      </Tabs>

      {/* 변경 사항 목록 - 가구 */}
      {safeChanges.length > 0 && (
        <div className="border rounded-lg p-3">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <MoveRight className="h-4 w-4" />가구 변경 제안 ({safeChanges.length}개)
          </h4>
          <ScrollArea className="h-[120px]">
            <div className="space-y-2">
              {safeChanges.map((change, idx) => (
                <div key={idx} className="p-2 rounded border bg-amber-50 text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{change.entityLabel || 'Unknown'}</span>
                    {getImpactBadge(change.impact || 'medium')}
                  </div>
                  <p className="text-muted-foreground text-xs">{change.reason || ''}</p>
                  <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                    ({safeToFixed(change.currentPosition?.x)}, {safeToFixed(change.currentPosition?.z)})
                    <ArrowRight className="h-3 w-3" />
                    <span className="text-amber-600">
                      ({safeToFixed(change.suggestedPosition?.x)}, {safeToFixed(change.suggestedPosition?.z)})
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* 제품 재배치 섹션 */}
      {safePlacements.length > 0 && (
        <div className="border rounded-lg p-3">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Package className="h-4 w-4" />제품 재배치 제안 ({safePlacements.length}개)
          </h4>
          <div className="flex gap-2 mb-2 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-purple-600"></div>
              <span>가구 변경</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded bg-blue-500"></div>
              <span>위치 이동</span>
            </div>
          </div>
          <ScrollArea className="h-[120px]">
            <div className="space-y-2">
              {safePlacements.map((placement, idx) => (
                <div 
                  key={idx} 
                  className={`p-2 rounded border text-sm ${
                    placement.isFurnitureChange ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-medium">{placement.productLabel || 'Unknown'}</span>
                    {getImpactBadge(placement.impact || 'medium')}
                    {placement.isFurnitureChange && (
                      <Badge className="bg-purple-100 text-purple-800 text-[10px]">가구 변경</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-xs">{placement.reason || ''}</p>
                  {placement.isFurnitureChange ? (
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <span>{placement.currentFurnitureLabel || '미지정'}</span>
                      <ArrowRight className="h-3 w-3" />
                      <span className="text-purple-600 font-medium">
                        {placement.suggestedFurnitureLabel || '미지정'}
                      </span>
                    </div>
                  ) : (
                    <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      ({safeToFixed(placement.currentPosition?.x)}, {safeToFixed(placement.currentPosition?.z)})
                      <ArrowRight className="h-3 w-3" />
                      <span className="text-blue-600">
                        ({safeToFixed(placement.suggestedPosition?.x)}, {safeToFixed(placement.suggestedPosition?.z)})
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}

      {/* 적용 버튼 */}
      {(safeChanges.length > 0 || safePlacements.length > 0) && onApplySuggestion && (
        <div className="flex justify-end">
          <Button onClick={onApplySuggestion} disabled={isApplying}>
            {isApplying ? (
              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />적용 중...</>
            ) : (
              <><Save className="h-4 w-4 mr-2" />추천 적용</>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export default LayoutComparisonView;
