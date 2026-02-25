import { useState } from 'react';
import { Line, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';

interface PathPoint {
  x: number;
  y: number;
  z: number;
  timestamp?: number;
}

interface CustomerPathOverlayProps {
  paths: PathPoint[][];
  animate?: boolean;
  color?: string;
}

interface PathWithInfo {
  path: PathPoint[];
  index: number;
}

function AnimatedPath({ points, color = '#1B6BFF' }: { points: PathPoint[], color?: string }) {
  const [progress, setProgress] = useState(0);

  useFrame((state, delta) => {
    setProgress(prev => Math.min(prev + delta * 0.2, 1));
  });

  const positions = points
    .slice(0, Math.max(2, Math.floor(points.length * progress)))
    .map(p => [p.x, p.y, p.z] as [number, number, number]);

  if (positions.length < 2) return null;

  return (
    <Line
      points={positions}
      color={color}
      lineWidth={2}
      transparent
      opacity={0.7}
    />
  );
}

export function CustomerPathOverlay({ paths, animate = true, color = '#1B6BFF' }: CustomerPathOverlayProps) {
  const [selectedPath, setSelectedPath] = useState<PathWithInfo | null>(null);

  return (
    <group>
      {paths.map((path, index) => {
        const pathLength = path.reduce((sum, point, i) => {
          if (i === 0) return 0;
          const prev = path[i - 1];
          const dx = point.x - prev.x;
          const dz = point.z - prev.z;
          return sum + Math.sqrt(dx * dx + dz * dz);
        }, 0);

        const startTime = path[0]?.timestamp;
        const endTime = path[path.length - 1]?.timestamp;
        const duration = startTime && endTime ? (endTime - startTime) / 1000 : 0;

        return (
          <group key={index}>
            {animate ? (
              <AnimatedPath points={path} color={color} />
            ) : (
              <Line
                points={path.map(p => [p.x, p.y, p.z] as [number, number, number])}
                color={color}
                lineWidth={2}
                transparent
                opacity={0.7}
              />
            )}
            
            {/* Start point marker - 클릭 가능 */}
            {path.length > 0 && (
              <mesh 
                position={[path[0].x, path[0].y + 0.5, path[0].z]}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPath({ path, index });
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  document.body.style.cursor = 'default';
                }}
              >
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial 
                  color="#10B981" 
                  emissive="#10B981" 
                  emissiveIntensity={selectedPath?.index === index ? 0.8 : 0.5} 
                />
              </mesh>
            )}
            
            {/* End point marker - 클릭 가능 */}
            {path.length > 1 && (
              <mesh 
                position={[path[path.length - 1].x, path[path.length - 1].y + 0.5, path[path.length - 1].z]}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPath({ path, index });
                }}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  document.body.style.cursor = 'default';
                }}
              >
                <sphereGeometry args={[0.3, 16, 16]} />
                <meshStandardMaterial 
                  color="#EF4444" 
                  emissive="#EF4444" 
                  emissiveIntensity={selectedPath?.index === index ? 0.8 : 0.5} 
                />
              </mesh>
            )}

            {/* 경로 정보 표시 */}
            {selectedPath?.index === index && path.length > 0 && (
              <Html position={[path[0].x, path[0].y + 2, path[0].z]} center>
                <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-sm">고객 동선 #{index + 1}</h4>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedPath(null);
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">경로점:</span>
                      <span className="font-semibold">{path.length}개</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">이동 거리:</span>
                      <span className="font-semibold">{pathLength.toFixed(1)}m</span>
                    </div>
                    {duration > 0 && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">소요 시간:</span>
                        <span className="font-semibold">{duration.toFixed(0)}초</span>
                      </div>
                    )}
                    <div className="mt-2 pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-xs">
                        <div className="w-2 h-2 rounded-full bg-green-500" />
                        <span className="text-muted-foreground">시작점</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-1">
                        <div className="w-2 h-2 rounded-full bg-red-500" />
                        <span className="text-muted-foreground">종료점</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Html>
            )}
          </group>
        );
      })}
    </group>
  );
}
