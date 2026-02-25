import { useEffect, useState } from 'react';
import { ZoneChange, FurnitureMove } from '@/features/simulation/types/layout.types';
import { Vector3 } from 'three';

interface LayoutChangeOverlayProps {
  zoneChanges?: ZoneChange[];
  furnitureMoves?: FurnitureMove[];
  showPreview?: boolean;
}

export function LayoutChangeOverlay({ 
  zoneChanges = [], 
  furnitureMoves = [],
  showPreview = true 
}: LayoutChangeOverlayProps) {
  const [animationProgress, setAnimationProgress] = useState(0);

  useEffect(() => {
    if (!showPreview) return;

    const interval = setInterval(() => {
      setAnimationProgress((prev) => (prev >= 1 ? 0 : prev + 0.01));
    }, 50);

    return () => clearInterval(interval);
  }, [showPreview]);

  return (
    <group>
      {/* Zone Change Visualization */}
      {zoneChanges.map((change, idx) => {
        if (!change.originalPosition || !change.newPosition) return null;

        const originalPos = new Vector3(
          change.originalPosition.x,
          change.originalPosition.y || 0,
          change.originalPosition.z
        );
        const newPos = new Vector3(
          change.newPosition.x,
          change.newPosition.y || 0,
          change.newPosition.z
        );

        const currentPos = originalPos.clone().lerp(newPos, animationProgress);
        const size = change.newSize || change.originalSize || { width: 2, depth: 2, height: 0.1 };

        return (
          <group key={`zone-${change.zoneId}-${idx}`} position={currentPos}>
            {/* Zone Boundary Box */}
            <mesh position={[0, size.height ? size.height / 2 : 0.05, 0]}>
              <boxGeometry args={[size.width, size.height || 0.1, size.depth]} />
              <meshStandardMaterial 
                color="#1B6BFF" 
                transparent 
                opacity={0.3}
                wireframe={showPreview}
              />
            </mesh>

            {/* Zone Label */}
            {showPreview && (
              <mesh position={[0, (size.height || 0.1) + 0.5, 0]}>
                <sphereGeometry args={[0.2, 16, 16]} />
                <meshStandardMaterial color="#1B6BFF" emissive="#1B6BFF" emissiveIntensity={0.5} />
              </mesh>
            )}

            {/* Movement Arrow */}
            {animationProgress < 0.5 && (
              <arrowHelper
                args={[
                  newPos.clone().sub(originalPos).normalize(),
                  originalPos,
                  originalPos.distanceTo(newPos),
                  0x00ff00,
                  0.5,
                  0.3
                ]}
              />
            )}
          </group>
        );
      })}

      {/* Furniture Move Visualization */}
      {furnitureMoves.map((move, idx) => {
        const fromPos = new Vector3(move.fromPosition.x, move.fromPosition.y || 0, move.fromPosition.z);
        const toPos = new Vector3(move.toPosition.x, move.toPosition.y || 0, move.toPosition.z);
        const currentPos = fromPos.clone().lerp(toPos, animationProgress);

        return (
          <group key={`furniture-${move.furnitureId}-${idx}`} position={currentPos}>
            {/* Furniture Placeholder */}
            <mesh position={[0, 0.5, 0]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial 
                color={move.movable ? "#00ff00" : "#ff0000"} 
                transparent 
                opacity={0.5}
              />
            </mesh>

            {/* Movement Path */}
            {showPreview && animationProgress < 0.8 && (
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([
                      fromPos.x, fromPos.y + 0.5, fromPos.z,
                      toPos.x, toPos.y + 0.5, toPos.z
                    ])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial color="#ffff00" linewidth={2} />
              </line>
            )}
          </group>
        );
      })}

      {/* Impact Indicators */}
      {showPreview && zoneChanges.length > 0 && (
        <group>
          {zoneChanges.map((change, idx) => {
            if (!change.newPosition) return null;
            return (
              <mesh 
                key={`impact-${idx}`}
                position={[
                  change.newPosition.x,
                  0.01,
                  change.newPosition.z
                ]}
                rotation={[-Math.PI / 2, 0, 0]}
              >
                <circleGeometry args={[1 + Math.sin(animationProgress * Math.PI * 4) * 0.2, 32]} />
                <meshBasicMaterial 
                  color="#1B6BFF" 
                  transparent 
                  opacity={0.3 * (1 - animationProgress)}
                />
              </mesh>
            );
          })}
        </group>
      )}
    </group>
  );
}
