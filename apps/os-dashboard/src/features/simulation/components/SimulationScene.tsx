import React, { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Grid, Html, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useSimulationStore, EntityState, CustomerAgent, ZoneMetric } from '@/stores/simulationStore';

// ============== Zone Component ==============

interface ZoneProps {
  entity: EntityState;
  metric?: ZoneMetric;
}

function Zone({ entity, metric }: ZoneProps) {
  const color = useMemo(() => {
    if (!metric) return '#4a5568';
    const intensity = metric.heatmapIntensity;
    // Red-Green gradient based on intensity
    const r = Math.floor(255 * intensity);
    const g = 100;
    const b = Math.floor(255 * (1 - intensity));
    return `rgb(${r}, ${g}, ${b})`;
  }, [metric]);

  const zoneName = entity.metadata?.zone_name || entity.metadata?.name || entity.id;

  return (
    <group position={entity.position}>
      {/* Zone floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[entity.scale[0] || 5, entity.scale[2] || 5]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Zone border */}
      <lineSegments rotation={[-Math.PI / 2, 0, 0]}>
        <edgesGeometry
          args={[new THREE.PlaneGeometry(entity.scale[0] || 5, entity.scale[2] || 5)]}
        />
        <lineBasicMaterial color="#ffffff" linewidth={2} />
      </lineSegments>

      {/* Zone label */}
      <Html position={[0, 2, 0]} center distanceFactor={15}>
        <div className="bg-black/80 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap pointer-events-none">
          <div className="font-bold text-sm">{zoneName}</div>
          {metric && (
            <div className="mt-1 space-y-0.5">
              <div>방문: {metric.visitorCount}명</div>
              <div>체류: {metric.avgDwellTime.toFixed(0)}초</div>
              <div>전환: {(metric.conversionRate * 100).toFixed(1)}%</div>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

// ============== Customer Agent Component ==============

interface CustomerAgentProps {
  customer: CustomerAgent;
}

function CustomerAgentMesh({ customer }: CustomerAgentProps) {
  const ref = useRef<THREE.Mesh>(null);
  const targetPosition = useRef(new THREE.Vector3(...customer.position));

  // Update target position
  targetPosition.current.set(...customer.position);

  // Smooth movement
  useFrame(() => {
    if (ref.current) {
      ref.current.position.lerp(targetPosition.current, 0.1);
    }
  });

  // Color based on behavior
  const color = useMemo(() => {
    switch (customer.behavior) {
      case 'browsing':
        return '#3b82f6'; // Blue
      case 'walking':
        return '#22c55e'; // Green
      case 'purchasing':
        return '#eab308'; // Yellow
      case 'exiting':
        return '#ef4444'; // Red
      default:
        return '#6b7280'; // Gray
    }
  }, [customer.behavior]);

  return (
    <mesh ref={ref} position={customer.position} castShadow>
      {/* Body */}
      <capsuleGeometry args={[0.2, 0.6, 4, 8]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// ============== Furniture Component ==============

interface FurnitureProps {
  entity: EntityState;
  onClick?: () => void;
}

function Furniture({ entity, onClick }: FurnitureProps) {
  const color = entity.isSelected ? '#3b82f6' : entity.isHighlighted ? '#eab308' : '#94a3b8';

  return (
    <mesh
      position={entity.position}
      rotation={entity.rotation}
      scale={entity.scale}
      onClick={onClick}
      castShadow
      receiveShadow
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={color} />
    </mesh>
  );
}

// ============== Store Floor Component ==============

function StoreFloor() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial color="#e5e7eb" />
    </mesh>
  );
}

// ============== Scene Content ==============

function SceneContent() {
  const { entities, customers, zoneMetrics, selectEntity } = useSimulationStore();

  const zones = Object.values(entities).filter((e) => e.type === 'Zone');
  const furniture = Object.values(entities).filter((e) => e.type === 'Furniture');

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 20, 10]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />

      {/* Controls */}
      <OrbitControls
        makeDefault
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.2}
        minDistance={5}
        maxDistance={50}
      />

      {/* Grid */}
      <Grid
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#9ca3af"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#6b7280"
        fadeDistance={50}
        infiniteGrid
      />

      {/* Store Floor */}
      <StoreFloor />

      {/* Zones */}
      {zones.map((zone) => (
        <Zone
          key={zone.id}
          entity={zone}
          metric={zoneMetrics.find((m) => m.zoneId === zone.id)}
        />
      ))}

      {/* Furniture */}
      {furniture.map((f) => (
        <Furniture
          key={f.id}
          entity={f}
          onClick={() => selectEntity(f.id)}
        />
      ))}

      {/* Customer Agents */}
      {customers.map((c) => (
        <CustomerAgentMesh key={c.id} customer={c} />
      ))}
    </>
  );
}

// ============== Main Scene Component ==============

interface SimulationSceneProps {
  className?: string;
}

export function SimulationScene({ className }: SimulationSceneProps) {
  return (
    <div className={className || 'w-full h-full'}>
      <Canvas shadows>
        <PerspectiveCamera makeDefault position={[20, 20, 20]} fov={50} />
        <SceneContent />
      </Canvas>
    </div>
  );
}

export default SimulationScene;
