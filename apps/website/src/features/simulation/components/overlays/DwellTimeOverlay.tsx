import { useMemo } from 'react';
import { Text } from '@react-three/drei';
import type { ZoneDwellTime } from '@/hooks/useDwellTime';
import type { StoreZone } from '@/features/simulation/types/iot.types';

interface DwellTimeOverlayProps {
  dwellTimes: ZoneDwellTime[];
  zones: StoreZone[];
  showBars?: boolean;
}

export const DwellTimeOverlay = ({ 
  dwellTimes, 
  zones,
  showBars = true 
}: DwellTimeOverlayProps) => {
  const maxDwellTime = useMemo(() => {
    return Math.max(...dwellTimes.map(d => d.avgDwellTime), 1);
  }, [dwellTimes]);

  const zoneVisuals = useMemo(() => {
    return dwellTimes.map(dwellTime => {
      const zone = zones.find(z => z.id === dwellTime.zoneId);
      if (!zone) return null;

      // 체류 시간에 따른 높이 (0.5 ~ 3.0)
      const normalizedHeight = (dwellTime.avgDwellTime / maxDwellTime) * 2.5 + 0.5;
      
      // 체류 시간에 따른 색상 (파란색 -> 빨간색)
      const intensity = dwellTime.avgDwellTime / maxDwellTime;
      const hue = 220 - intensity * 100; // 220 (blue) to 120 (green) to 0 (red)
      const color = `hsl(${hue}, 70%, 50%)`;

      return {
        key: dwellTime.zoneId,
        position: [zone.center.x, normalizedHeight / 2, zone.center.z] as [number, number, number],
        height: normalizedHeight,
        color,
        label: `${Math.round(dwellTime.avgDwellTime / 60)}분`,
        radius: zone.radius * 0.8
      };
    }).filter(Boolean);
  }, [dwellTimes, zones, maxDwellTime]);

  return (
    <group>
      {zoneVisuals.map((visual) => visual && (
        <group key={visual.key}>
          {showBars && (
            <mesh position={visual.position}>
              <cylinderGeometry args={[visual.radius, visual.radius, visual.height, 16]} />
              <meshStandardMaterial 
                color={visual.color} 
                transparent 
                opacity={0.6}
                emissive={visual.color}
                emissiveIntensity={0.2}
              />
            </mesh>
          )}
          <Text
            position={[visual.position[0], visual.position[1] + visual.height / 2 + 0.3, visual.position[2]]}
            fontSize={0.25}
            color="#FFFFFF"
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {visual.label}
          </Text>
        </group>
      ))}
    </group>
  );
};
