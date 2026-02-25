import { useMemo, useState } from 'react';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface HeatPoint {
  x: number;
  z: number;
  intensity: number; // 0-1
}

interface HeatmapOverlay3DProps {
  heatPoints: HeatPoint[];
  gridSize?: number;
  heightScale?: number;
}

export function HeatmapOverlay3D({ 
  heatPoints, 
  gridSize = 20, 
  heightScale = 2 
}: HeatmapOverlay3DProps) {
  const [selectedPoint, setSelectedPoint] = useState<{ x: number, z: number, intensity: number } | null>(null);
  const [hoverPoint, setHoverPoint] = useState<{ x: number, z: number } | null>(null);
  
  const { geometry, colors } = useMemo(() => {
    const geo = new THREE.PlaneGeometry(gridSize, gridSize, 32, 32);
    const positions = geo.attributes.position.array as Float32Array;
    const colorArray = new Float32Array(positions.length);
    
    // Create height map and color based on heat intensity
    for (let i = 0; i < positions.length; i += 3) {
      const x = positions[i];
      const z = positions[i + 1];
      
      // Find closest heat point and calculate intensity
      let maxIntensity = 0;
      heatPoints.forEach(point => {
        const distance = Math.sqrt(
          Math.pow(x - point.x, 2) + Math.pow(z - point.z, 2)
        );
        const influence = Math.max(0, 1 - distance / 3) * point.intensity;
        maxIntensity = Math.max(maxIntensity, influence);
      });
      
      // Set height based on intensity
      positions[i + 2] = maxIntensity * heightScale;
      
      // Set color based on intensity (blue -> green -> yellow -> red)
      const color = getHeatColor(maxIntensity);
      colorArray[i] = color.r;
      colorArray[i + 1] = color.g;
      colorArray[i + 2] = color.b;
    }
    
    geo.setAttribute('color', new THREE.BufferAttribute(colorArray, 3));
    geo.computeVertexNormals();
    
    return { geometry: geo, colors: colorArray };
  }, [heatPoints, gridSize, heightScale]);

  return (
    <group>
      <mesh 
        geometry={geometry} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, 0.1, 0]}
        onClick={(e) => {
          e.stopPropagation();
          const point = e.point;
          // Find closest heat point
          let closest = heatPoints[0];
          let minDist = Infinity;
          heatPoints.forEach(hp => {
            const dist = Math.sqrt(
              Math.pow(point.x - hp.x, 2) + Math.pow(point.z - hp.z, 2)
            );
            if (dist < minDist) {
              minDist = dist;
              closest = hp;
            }
          });
          setSelectedPoint(closest);
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
          document.body.style.cursor = 'pointer';
          const point = e.point;
          setHoverPoint({ x: point.x, z: point.z });
        }}
        onPointerOut={() => {
          document.body.style.cursor = 'default';
          setHoverPoint(null);
        }}
      >
        <meshStandardMaterial
          vertexColors
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          emissive="#ffffff"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* 히트 포인트 마커 */}
      {heatPoints.map((point, idx) => (
        <mesh 
          key={idx} 
          position={[point.x, point.intensity * heightScale + 0.2, point.z]}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedPoint(point);
          }}
          onPointerOver={(e) => {
            e.stopPropagation();
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            document.body.style.cursor = 'default';
          }}
        >
          <sphereGeometry args={[0.2, 16, 16]} />
          <meshStandardMaterial
            color={getHeatColor(point.intensity).hex}
            emissive={getHeatColor(point.intensity).hex}
            emissiveIntensity={selectedPoint === point ? 0.8 : 0.3}
            transparent
            opacity={0.8}
          />
        </mesh>
      ))}

      {/* 선택된 포인트 정보 */}
      {selectedPoint && (
        <Html position={[selectedPoint.x, selectedPoint.intensity * heightScale + 1.5, selectedPoint.z]} center>
          <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[180px]">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-sm">히트맵 포인트</h4>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPoint(null);
                }}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </button>
            </div>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">위치:</span>
                <span className="font-mono">
                  ({selectedPoint.x.toFixed(1)}, {selectedPoint.z.toFixed(1)})
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">밀집도:</span>
                <span className="font-semibold" style={{ color: getHeatColor(selectedPoint.intensity).hex }}>
                  {(selectedPoint.intensity * 100).toFixed(0)}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">강도:</span>
                <span>
                  {selectedPoint.intensity > 0.75 ? '매우 높음' :
                   selectedPoint.intensity > 0.5 ? '높음' :
                   selectedPoint.intensity > 0.25 ? '보통' : '낮음'}
                </span>
              </div>
            </div>
          </div>
        </Html>
      )}
    </group>
  );
}

function getHeatColor(intensity: number): { r: number; g: number; b: number; hex: string } {
  // Blue (cold) -> Cyan -> Green -> Yellow -> Red (hot)
  let r: number, g: number, b: number;
  
  if (intensity < 0.25) {
    const t = intensity / 0.25;
    r = 0;
    g = t;
    b = 1;
  } else if (intensity < 0.5) {
    const t = (intensity - 0.25) / 0.25;
    r = 0;
    g = 1;
    b = 1 - t;
  } else if (intensity < 0.75) {
    const t = (intensity - 0.5) / 0.25;
    r = t;
    g = 1;
    b = 0;
  } else {
    const t = (intensity - 0.75) / 0.25;
    r = 1;
    g = 1 - t;
    b = 0;
  }

  // Convert to hex
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  const hex = '#' + toHex(r) + toHex(g) + toHex(b);

  return { r, g, b, hex };
}
