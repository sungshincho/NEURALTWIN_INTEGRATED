import type { LightingPreset as LightingPresetType } from '@/types/scene3d';

interface LightingPresetProps {
  preset: LightingPresetType;
}

export function LightingPreset({ preset }: LightingPresetProps) {
  // Guard against undefined or null
  const safeLights = Array.isArray(preset?.lights) ? preset.lights : [];
  
  return (
    <group>
      {safeLights.map((light, idx) => {
        switch (light.type) {
          case 'ambient':
            return <ambientLight key={idx} color={light.color} intensity={light.intensity} />;
          
          case 'directional':
            return (
              <directionalLight
                key={idx}
                color={light.color}
                intensity={light.intensity}
                position={light.position ? [light.position.x, light.position.y, light.position.z] : undefined}
                castShadow
              />
            );
          
          case 'point':
            return (
              <pointLight
                key={idx}
                color={light.color}
                intensity={light.intensity}
                position={light.position ? [light.position.x, light.position.y, light.position.z] : undefined}
                castShadow
              />
            );
          
          case 'spot':
            return (
              <spotLight
                key={idx}
                color={light.color}
                intensity={light.intensity}
                position={light.position ? [light.position.x, light.position.y, light.position.z] : undefined}
                castShadow
              />
            );
          
          default:
            return null;
        }
      })}
    </group>
  );
}
