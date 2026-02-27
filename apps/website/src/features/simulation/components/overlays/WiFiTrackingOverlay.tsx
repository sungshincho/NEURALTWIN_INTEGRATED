import { useState, useEffect, useMemo } from 'react';
import { Html } from '@react-three/drei';
import type { TrackingData } from '@/features/simulation/types/iot.types';

interface WiFiTrackingOverlayProps {
  trackingData: TrackingData[];
  mode?: 'realtime' | 'heatmap' | 'paths';
  currentTime?: number; // 재생 모드용
  timeWindow?: number; // 표시할 시간 범위 (ms)
}

export function WiFiTrackingOverlay({
  trackingData,
  mode = 'realtime',
  currentTime,
  timeWindow = 30000 // 기본 30초
}: WiFiTrackingOverlayProps) {
  const [selectedPoint, setSelectedPoint] = useState<TrackingData | null>(null);

  // 현재 시간 기준으로 필터링된 데이터
  const visibleData = useMemo(() => {
    if (!currentTime) {
      return trackingData.slice(-100); // 최신 100개
    }
    
    const startTime = currentTime - timeWindow;
    return trackingData.filter(
      d => d.timestamp >= startTime && d.timestamp <= currentTime
    );
  }, [trackingData, currentTime, timeWindow]);

  // 히트맵 데이터 생성
  const heatmapData = useMemo(() => {
    if (mode !== 'heatmap') return [];
    
    const gridSize = 1.0;
    const heatMap = new Map<string, number>();
    
    visibleData.forEach(point => {
      if (point.x === undefined || point.z === undefined) return;
      const gridX = Math.floor(point.x / gridSize) * gridSize;
      const gridZ = Math.floor(point.z / gridSize) * gridSize;
      const key = `${gridX},${gridZ}`;
      heatMap.set(key, (heatMap.get(key) || 0) + 1);
    });
    
    const maxCount = Math.max(...Array.from(heatMap.values()), 1);
    
    return Array.from(heatMap.entries()).map(([key, count]) => {
      const [x, z] = key.split(',').map(Number);
      return { x, z, intensity: count / maxCount };
    });
  }, [mode, visibleData]);

  // 경로 데이터 생성
  const pathsData = useMemo(() => {
    if (mode !== 'paths') return new Map();
    
    const paths = new Map<string, TrackingData[]>();
    visibleData.forEach(point => {
      if (!paths.has(point.customer_id)) {
        paths.set(point.customer_id, []);
      }
      paths.get(point.customer_id)!.push(point);
    });
    
    // 시간순 정렬
    paths.forEach(path => path.sort((a, b) => a.timestamp - b.timestamp));
    
    return paths;
  }, [mode, visibleData]);

  if (mode === 'realtime') {
    return (
      <group>
        {visibleData
          .filter(point => point.x !== undefined && point.z !== undefined)
          .map((point, index) => {
            const color = point.signal_strength 
              ? `hsl(${120 + (point.signal_strength + 100) * 2.4}, 70%, 50%)`
              : '#1B6BFF';
            
            return (
              <mesh
                key={`${point.customer_id}-${index}`}
                position={[point.x!, 0.5, point.z!]}
                onClick={() => setSelectedPoint(point)}
                onPointerOver={(e) => {
                  e.stopPropagation();
                  document.body.style.cursor = 'pointer';
                }}
                onPointerOut={() => {
                  document.body.style.cursor = 'default';
                }}
              >
                <cylinderGeometry args={[0.3, 0.3, 0.1, 16]} />
                <meshStandardMaterial
                  color={color}
                  transparent
                  opacity={0.7}
                  emissive={color}
                  emissiveIntensity={0.3}
                />
              </mesh>
            );
          })}
        
        {selectedPoint && selectedPoint.x !== undefined && selectedPoint.z !== undefined && (
          <Html position={[selectedPoint.x, 1.5, selectedPoint.z]}>
            <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg p-3 shadow-lg min-w-[200px]">
              <h4 className="font-semibold text-foreground mb-2">WiFi Tracking</h4>
              <div className="text-sm space-y-1 text-muted-foreground">
                <div>ID: {selectedPoint.customer_id.substring(0, 8)}...</div>
                <div>RSSI: {selectedPoint.signal_strength} dBm</div>
                <div>위치: ({selectedPoint.x.toFixed(1)}, {selectedPoint.z.toFixed(1)})</div>
                <div>정확도: ±{selectedPoint.accuracy?.toFixed(1) || 'N/A'}m</div>
                <div>시간: {new Date(selectedPoint.timestamp).toLocaleTimeString()}</div>
              </div>
              <button
                onClick={() => setSelectedPoint(null)}
                className="mt-2 text-xs text-primary hover:underline"
              >
                닫기
              </button>
            </div>
          </Html>
        )}
      </group>
    );
  }

  if (mode === 'heatmap') {
    return (
      <group>
        {heatmapData.map((point, index) => {
          const hue = 240 - point.intensity * 240; // 파란색(240) → 빨간색(0)
          const color = `hsl(${hue}, 80%, 50%)`;
          
          return (
            <mesh
              key={`heat-${index}`}
              position={[point.x + 0.5, 0.05, point.z + 0.5]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[1, 1]} />
              <meshStandardMaterial
                color={color}
                transparent
                opacity={0.6}
                emissive={color}
                emissiveIntensity={point.intensity * 0.5}
              />
            </mesh>
          );
        })}
      </group>
    );
  }

  if (mode === 'paths') {
    return (
      <group>
        {Array.from(pathsData.entries()).map(([customerId, path], pathIndex) => {
          if (path.length < 2) return null;
          
          const color = `hsl(${(pathIndex * 137) % 360}, 70%, 60%)`;
          
          return (
            <group key={`path-${customerId}`}>
              {/* 경로 라인 */}
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={path.length}
                    array={new Float32Array(
                      path.flatMap(p => [p.x || 0, 0.5, p.z || 0])
                    )}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color={color} linewidth={2} />
              </line>
              
              {/* 시작점 */}
              {path[0].x !== undefined && path[0].z !== undefined && (
                <mesh position={[path[0].x, 0.5, path[0].z]}>
                  <sphereGeometry args={[0.3, 16, 16]} />
                  <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
                </mesh>
              )}
              
              {/* 종료점 */}
              {path[path.length - 1].x !== undefined && path[path.length - 1].z !== undefined && (
                <mesh position={[path[path.length - 1].x, 0.5, path[path.length - 1].z]}>
                  <sphereGeometry args={[0.3, 16, 16]} />
                  <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.5} />
                </mesh>
              )}
            </group>
          );
        })}
      </group>
    );
  }

  return null;
}
