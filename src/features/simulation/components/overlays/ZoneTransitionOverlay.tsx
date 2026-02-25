import { useMemo } from 'react';
import { Line, Text } from '@react-three/drei';
import type { ZoneTransition } from '@/hooks/useZoneTransition';
import type { StoreZone } from '@/features/simulation/types/iot.types';

interface ZoneTransitionOverlayProps {
  transitions: ZoneTransition[];
  zones: StoreZone[];
  showLabels?: boolean;
}

export const ZoneTransitionOverlay = ({ 
  transitions, 
  zones,
  showLabels = true 
}: ZoneTransitionOverlayProps) => {
  const transitionLines = useMemo(() => {
    return transitions.map(transition => {
      const fromZone = zones.find(z => z.id === transition.fromZone);
      const toZone = zones.find(z => z.id === transition.toZone);

      if (!fromZone || !toZone) return null;

      // 전환 강도에 따른 색상 및 두께
      const intensity = transition.probability / 100;
      const color = `hsl(${220 - intensity * 60}, 70%, ${50 + intensity * 20}%)`;
      const lineWidth = 2 + intensity * 6;

      // 화살표를 위한 중간 지점
      const midX = (fromZone.center.x + toZone.center.x) / 2;
      const midZ = (fromZone.center.z + toZone.center.z) / 2;

      return {
        key: `${transition.fromZone}-${transition.toZone}`,
        points: [
          [fromZone.center.x, 0.3, fromZone.center.z],
          [midX, 0.5, midZ],
          [toZone.center.x, 0.3, toZone.center.z]
        ],
        color,
        lineWidth,
        midPoint: [midX, 0.6, midZ],
        label: `${transition.probability.toFixed(1)}%`
      };
    }).filter(Boolean);
  }, [transitions, zones]);

  return (
    <group>
      {transitionLines.map((line) => line && (
        <group key={line.key}>
          <Line
            points={line.points as [number, number, number][]}
            color={line.color}
            lineWidth={line.lineWidth}
            opacity={0.7}
            transparent
          />
          {showLabels && (
            <Text
              position={line.midPoint as [number, number, number]}
              fontSize={0.2}
              color="#1B6BFF"
              anchorX="center"
              anchorY="middle"
            >
              {line.label}
            </Text>
          )}
        </group>
      ))}
    </group>
  );
};
