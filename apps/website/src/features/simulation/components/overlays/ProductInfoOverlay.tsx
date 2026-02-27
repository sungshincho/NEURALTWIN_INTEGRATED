import { useState } from 'react';
import { Html } from '@react-three/drei';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';

interface ProductInfo {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  stock: number;
  demand: number;
  status: 'normal' | 'low' | 'critical';
  price?: number;
}

interface ProductInfoOverlayProps {
  products: ProductInfo[];
}

function ProductMarker({ product }: { product: ProductInfo }) {
  const [hovered, setHovered] = useState(false);
  
  const statusColor = {
    normal: '#10B981',
    low: '#F59E0B',
    critical: '#EF4444'
  }[product.status];

  const statusIcon = {
    normal: <Package className="w-3 h-3" />,
    low: <AlertTriangle className="w-3 h-3" />,
    critical: <AlertTriangle className="w-3 h-3" />
  }[product.status];

  return (
    <group position={[product.position.x, product.position.y, product.position.z]}>
      {/* Marker cylinder */}
      <mesh
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
      >
        <cylinderGeometry args={[0.3, 0.3, 1.5, 16]} />
        <meshStandardMaterial 
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={hovered ? 0.8 : 0.3}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Top sphere */}
      <mesh position={[0, 0.75, 0]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial 
          color={statusColor}
          emissive={statusColor}
          emissiveIntensity={hovered ? 1 : 0.5}
        />
      </mesh>

      {/* Info card on hover */}
      {hovered && (
        <Html position={[0, 2, 0]} center style={{ pointerEvents: 'none' }}>
          <Card className="w-64 shadow-xl animate-fade-in">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                {statusIcon}
                {product.name}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">재고:</span>
                <span className="font-semibold">{product.stock}개</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">수요:</span>
                <span className="font-semibold flex items-center gap-1">
                  {product.demand}개
                  {product.demand > product.stock ? (
                    <TrendingUp className="w-3 h-3 text-red-500" />
                  ) : (
                    <TrendingDown className="w-3 h-3 text-green-500" />
                  )}
                </span>
              </div>
              {product.price && (
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">가격:</span>
                  <span className="font-semibold">₩{product.price.toLocaleString()}</span>
                </div>
              )}
              <Badge 
                variant={product.status === 'normal' ? 'default' : 'destructive'}
                className="w-full justify-center text-xs"
              >
                {product.status === 'normal' && '정상'}
                {product.status === 'low' && '재고 부족'}
                {product.status === 'critical' && '긴급 발주 필요'}
              </Badge>
            </CardContent>
          </Card>
        </Html>
      )}

      {/* Pulsing ring effect for critical items */}
      {product.status === 'critical' && (
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.7, 32]} />
          <meshBasicMaterial 
            color="#EF4444" 
            transparent 
            opacity={0.3}
            side={2}
          />
        </mesh>
      )}
    </group>
  );
}

export function ProductInfoOverlay({ products }: ProductInfoOverlayProps) {
  return (
    <group>
      {products.map((product) => (
        <ProductMarker key={product.id} product={product} />
      ))}
    </group>
  );
}
