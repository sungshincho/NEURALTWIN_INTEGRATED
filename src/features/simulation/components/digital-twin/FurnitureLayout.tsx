import { useGLTF } from '@react-three/drei';
import type { FurnitureAsset, ProductAsset } from '@/types/scene3d';
import { ChildProductItem } from './ChildProductItem';

interface FurnitureLayoutProps {
  furniture: FurnitureAsset[];
  onClick?: (id: string) => void;
  onProductClick?: (id: string) => void;
}

export function FurnitureLayout({ furniture = [], onClick, onProductClick }: FurnitureLayoutProps) {
  // Guard against undefined or null
  const safeFurniture = Array.isArray(furniture) ? furniture : [];

  return (
    <group>
      {safeFurniture.map((item) => (
        <FurnitureItem
          key={item.id}
          asset={item}
          onClick={() => onClick?.(item.id)}
          onProductClick={onProductClick}
        />
      ))}
    </group>
  );
}

interface FurnitureItemProps {
  asset: FurnitureAsset;
  onClick: () => void;
  onProductClick?: (id: string) => void;
}

function FurnitureItem({ asset, onClick, onProductClick }: FurnitureItemProps) {
  const childProducts = asset.childProducts || [];

  // degrees → radians 변환
  const rotationX = asset.rotation.x * Math.PI / 180;
  const rotationY = asset.rotation.y * Math.PI / 180;
  const rotationZ = asset.rotation.z * Math.PI / 180;

  // Render placeholder if no model URL
  if (!asset.model_url) {
    const dimensions = asset.dimensions || { width: 2, height: 2, depth: 0.5 };
    const color = asset.furniture_type?.toLowerCase().includes('shelf') ? '#8b6914' : '#654321';

    return (
      <group
        position={[asset.position.x, asset.position.y, asset.position.z]}
        rotation={[rotationX, rotationY, rotationZ]}
      >
        {/* 가구 플레이스홀더 */}
        <mesh
          position={[0, dimensions.height / 2, 0]}
          onClick={onClick}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* 자식 제품들 (상대 좌표로 렌더링) */}
        {childProducts.map((product) => (
          <ChildProductItem
            key={product.id}
            asset={product}
            onClick={() => onProductClick?.(product.id)}
          />
        ))}
      </group>
    );
  }

  try {
    const { scene } = useGLTF(asset.model_url);

    return (
      <group
        position={[asset.position.x, asset.position.y, asset.position.z]}
        rotation={[rotationX, rotationY, rotationZ]}
        scale={[asset.scale.x, asset.scale.y, asset.scale.z]}
      >
        {/* 가구 모델 */}
        <primitive object={scene.clone()} onClick={onClick} />

        {/* 자식 제품들 (상대 좌표로 렌더링) */}
        {childProducts.map((product) => (
          <ChildProductItem
            key={product.id}
            asset={product}
            onClick={() => onProductClick?.(product.id)}
          />
        ))}
      </group>
    );
  } catch (error) {
    console.warn('Failed to load furniture model:', asset.furniture_type, error);
    const dimensions = asset.dimensions || { width: 2, height: 2, depth: 0.5 };
    const color = asset.furniture_type?.toLowerCase().includes('shelf') ? '#8b6914' : '#654321';

    return (
      <group
        position={[asset.position.x, asset.position.y, asset.position.z]}
        rotation={[rotationX, rotationY, rotationZ]}
      >
        {/* 가구 플레이스홀더 */}
        <mesh
          position={[0, dimensions.height / 2, 0]}
          onClick={onClick}
          castShadow
          receiveShadow
        >
          <boxGeometry args={[dimensions.width, dimensions.height, dimensions.depth]} />
          <meshStandardMaterial color={color} />
        </mesh>

        {/* 자식 제품들 (상대 좌표로 렌더링) */}
        {childProducts.map((product) => (
          <ChildProductItem
            key={product.id}
            asset={product}
            onClick={() => onProductClick?.(product.id)}
          />
        ))}
      </group>
    );
  }
}
