import { useGLTF } from '@react-three/drei';
import { useMemo } from 'react';
import type { ProductAsset, ProductDisplayType } from '@/types/scene3d';

interface ProductPlacementProps {
  products: ProductAsset[];
  onClick?: (id: string) => void;
  showOptimizationHint?: boolean;
}

// Display type별 색상 정의
const DISPLAY_TYPE_COLORS: Record<ProductDisplayType, string> = {
  hanging: '#8b5cf6',  // 보라 - 걸린 형태
  folded: '#10b981',   // 녹색 - 접힌 형태
  standing: '#3b82f6', // 파랑 - 세운 형태
  boxed: '#f59e0b',    // 주황 - 박스 형태
  stacked: '#ef4444',  // 빨강 - 쌓인 형태
};

// 최적화 제안 있는 상품 색상
const OPTIMIZED_PRODUCT_COLOR = '#22c55e';

export function ProductPlacement({
  products = [],
  onClick,
  showOptimizationHint = true
}: ProductPlacementProps) {
  // Guard against undefined or null
  const safeProducts = Array.isArray(products) ? products : [];

  return (
    <group>
      {safeProducts.map((item) => (
        <ProductItem
          key={item.id}
          asset={item}
          onClick={() => onClick?.(item.id)}
          showOptimizationHint={showOptimizationHint}
        />
      ))}
    </group>
  );
}

interface ProductItemProps {
  asset: ProductAsset;
  onClick: () => void;
  showOptimizationHint: boolean;
}

function ProductItem({ asset, onClick, showOptimizationHint }: ProductItemProps) {
  const dimensions = asset.dimensions || { width: 0.3, height: 0.4, depth: 0.2 };
  const displayType = asset.display_type || 'standing';
  const isOptimized = !!asset.optimization_reason;

  // degrees → radians 변환
  const rotation: [number, number, number] = [
    (asset.rotation.x || 0) * Math.PI / 180,
    (asset.rotation.y || 0) * Math.PI / 180,
    (asset.rotation.z || 0) * Math.PI / 180,
  ];

  // 색상 결정: 최적화 힌트 표시 시 초록색, 아니면 display_type별 색상
  const color = useMemo(() => {
    if (showOptimizationHint && isOptimized) {
      return OPTIMIZED_PRODUCT_COLOR;
    }
    return DISPLAY_TYPE_COLORS[displayType] || DISPLAY_TYPE_COLORS.standing;
  }, [displayType, isOptimized, showOptimizationHint]);

  // Render placeholder if no model URL
  if (!asset.model_url) {
    return (
      <DisplayTypePrimitive
        displayType={displayType}
        position={[asset.position.x, asset.position.y, asset.position.z]}
        rotation={rotation}
        dimensions={dimensions}
        color={color}
        onClick={onClick}
        isOptimized={isOptimized && showOptimizationHint}
      />
    );
  }

  try {
    const { scene } = useGLTF(asset.model_url);

    return (
      <group>
        <primitive
          object={scene.clone()}
          position={[asset.position.x, asset.position.y, asset.position.z]}
          rotation={rotation}
          scale={[asset.scale.x, asset.scale.y, asset.scale.z]}
          onClick={onClick}
        />
        {/* 최적화 제안 인디케이터 */}
        {isOptimized && showOptimizationHint && (
          <OptimizationIndicator
            position={[asset.position.x, asset.position.y + dimensions.height + 0.1, asset.position.z]}
          />
        )}
      </group>
    );
  } catch (error) {
    console.warn('Failed to load product model:', asset.sku, error);
    return (
      <DisplayTypePrimitive
        displayType={displayType}
        position={[asset.position.x, asset.position.y, asset.position.z]}
        rotation={rotation}
        dimensions={dimensions}
        color={color}
        onClick={onClick}
        isOptimized={isOptimized && showOptimizationHint}
      />
    );
  }
}

// ============================================================================
// Display Type별 프리미티브 컴포넌트
// ============================================================================
interface DisplayTypePrimitiveProps {
  displayType: ProductDisplayType;
  position: [number, number, number];
  rotation: [number, number, number];
  dimensions: { width: number; height: number; depth: number };
  color: string;
  onClick: () => void;
  isOptimized: boolean;
}

function DisplayTypePrimitive({
  displayType,
  position,
  rotation,
  dimensions,
  color,
  onClick,
  isOptimized,
}: DisplayTypePrimitiveProps) {
  switch (displayType) {
    case 'hanging':
      return (
        <HangingPrimitive
          position={position}
          rotation={rotation}
          dimensions={dimensions}
          color={color}
          onClick={onClick}
          isOptimized={isOptimized}
        />
      );
    case 'folded':
      return (
        <FoldedPrimitive
          position={position}
          rotation={rotation}
          dimensions={dimensions}
          color={color}
          onClick={onClick}
          isOptimized={isOptimized}
        />
      );
    case 'boxed':
      return (
        <BoxedPrimitive
          position={position}
          rotation={rotation}
          dimensions={dimensions}
          color={color}
          onClick={onClick}
          isOptimized={isOptimized}
        />
      );
    case 'stacked':
      return (
        <StackedPrimitive
          position={position}
          rotation={rotation}
          dimensions={dimensions}
          color={color}
          onClick={onClick}
          isOptimized={isOptimized}
        />
      );
    case 'standing':
    default:
      return (
        <StandingPrimitive
          position={position}
          rotation={rotation}
          dimensions={dimensions}
          color={color}
          onClick={onClick}
          isOptimized={isOptimized}
        />
      );
  }
}

// 걸린 형태 (옷처럼 삼각형 옷걸이 + 직사각형 몸통)
function HangingPrimitive({
  position,
  rotation,
  dimensions,
  color,
  onClick,
  isOptimized,
}: Omit<DisplayTypePrimitiveProps, 'displayType'>) {
  const [x, y, z] = position;
  const { width, height, depth } = dimensions;

  return (
    <group position={[x, y, z]} rotation={rotation} onClick={onClick}>
      {/* 옷걸이 고리 (작은 토러스) */}
      <mesh position={[0, height, 0]} castShadow>
        <torusGeometry args={[0.03, 0.01, 8, 16]} />
        <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* 옷걸이 바 (삼각형 모양의 실린더) */}
      <mesh position={[0, height - 0.05, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.01, 0.01, width * 0.8, 8]} />
        <meshStandardMaterial color="#6b7280" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* 옷 본체 (얇은 박스 - 천 느낌) */}
      <mesh position={[0, height * 0.4, 0]} castShadow>
        <boxGeometry args={[width, height * 0.75, depth * 0.3]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
      </mesh>
      {isOptimized && <OptimizationIndicator position={[0, height + 0.2, 0]} />}
    </group>
  );
}

// 접힌 형태 (납작한 직사각형)
function FoldedPrimitive({
  position,
  rotation,
  dimensions,
  color,
  onClick,
  isOptimized,
}: Omit<DisplayTypePrimitiveProps, 'displayType'>) {
  const [x, y, z] = position;
  const { width, depth } = dimensions;
  const foldedHeight = 0.08; // 접힌 옷의 높이

  return (
    <group position={[x, y, z]} rotation={rotation} onClick={onClick}>
      {/* 접힌 옷 (납작한 박스) */}
      <mesh position={[0, foldedHeight / 2, 0]} castShadow>
        <boxGeometry args={[width, foldedHeight, depth]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.8} />
      </mesh>
      {/* 접힌 선 표시용 윗면 디테일 */}
      <mesh position={[0, foldedHeight + 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[width * 0.9, depth * 0.5]} />
        <meshStandardMaterial color={color} metalness={0.2} roughness={0.7} opacity={0.8} transparent />
      </mesh>
      {isOptimized && <OptimizationIndicator position={[0, foldedHeight + 0.15, 0]} />}
    </group>
  );
}

// 세운 형태 (기본 박스)
function StandingPrimitive({
  position,
  rotation,
  dimensions,
  color,
  onClick,
  isOptimized,
}: Omit<DisplayTypePrimitiveProps, 'displayType'>) {
  const [x, y, z] = position;
  const { width, height, depth } = dimensions;

  return (
    <group position={[x, y, z]} rotation={rotation} onClick={onClick}>
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.7} />
      </mesh>
      {isOptimized && <OptimizationIndicator position={[0, height + 0.1, 0]} />}
    </group>
  );
}

// 박스 형태 (박스 + 테이프 라인)
function BoxedPrimitive({
  position,
  rotation,
  dimensions,
  color,
  onClick,
  isOptimized,
}: Omit<DisplayTypePrimitiveProps, 'displayType'>) {
  const [x, y, z] = position;
  const { width, height, depth } = dimensions;

  return (
    <group position={[x, y, z]} rotation={rotation} onClick={onClick}>
      {/* 메인 박스 */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color={color} metalness={0.1} roughness={0.9} />
      </mesh>
      {/* 박스 테이프 (상단 중앙 줄) */}
      <mesh position={[0, height + 0.001, 0]}>
        <boxGeometry args={[width * 0.3, 0.005, depth * 1.01]} />
        <meshStandardMaterial color="#8b4513" metalness={0.2} roughness={0.8} />
      </mesh>
      {/* 박스 테이프 (측면) */}
      <mesh position={[0, height / 2, depth / 2 + 0.001]}>
        <boxGeometry args={[width * 0.3, height * 0.5, 0.005]} />
        <meshStandardMaterial color="#8b4513" metalness={0.2} roughness={0.8} />
      </mesh>
      {isOptimized && <OptimizationIndicator position={[0, height + 0.15, 0]} />}
    </group>
  );
}

// 쌓인 형태 (3개 박스 스택)
function StackedPrimitive({
  position,
  rotation,
  dimensions,
  color,
  onClick,
  isOptimized,
}: Omit<DisplayTypePrimitiveProps, 'displayType'>) {
  const [x, y, z] = position;
  const { width, height, depth } = dimensions;
  const stackCount = 3;
  const itemHeight = height / stackCount;

  return (
    <group position={[x, y, z]} rotation={rotation} onClick={onClick}>
      {Array.from({ length: stackCount }).map((_, i) => (
        <mesh
          key={i}
          position={[0, itemHeight / 2 + i * itemHeight, 0]}
          castShadow
        >
          <boxGeometry args={[width * (1 - i * 0.05), itemHeight * 0.9, depth * (1 - i * 0.05)]} />
          <meshStandardMaterial
            color={color}
            metalness={0.2}
            roughness={0.8 - i * 0.1}
          />
        </mesh>
      ))}
      {isOptimized && <OptimizationIndicator position={[0, height + 0.1, 0]} />}
    </group>
  );
}

// ============================================================================
// 최적화 인디케이터 (위쪽에 표시되는 반짝이는 구)
// ============================================================================
function OptimizationIndicator({ position }: { position: [number, number, number] }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.04, 16, 16]} />
      <meshStandardMaterial
        color="#22c55e"
        emissive="#22c55e"
        emissiveIntensity={0.5}
        metalness={0.5}
        roughness={0.3}
      />
    </mesh>
  );
}
