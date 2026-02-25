/**
 * EnvironmentEffectsOverlay.tsx
 *
 * 환경 효과 3D 오버레이
 * - 날씨 파티클 (비, 눈)
 * - 안개/먼지 효과
 * - 동적 조명 조정
 *
 * 📌 실제 날씨 데이터 기반 렌더링
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { getQualityConfig } from '@/utils/deviceCapability';
import type { RenderingConfig, ParticleConfig, LightingConfig } from '../types/environment.types';

// ============================================================================
// Props 정의
// ============================================================================

export interface EnvironmentEffectsOverlayProps {
  renderingConfig: RenderingConfig | null;
  enabled?: boolean;
  particleScale?: number; // 파티클 영역 스케일
  debugMode?: boolean;
}

// ============================================================================
// 비 파티클 컴포넌트
// ============================================================================

interface RainParticlesProps {
  config: ParticleConfig['weatherParticles'];
  scale: number;
}

function RainParticles({ config, scale }: RainParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const velocitiesRef = useRef<Float32Array | null>(null);

  const { positions, velocities } = useMemo(() => {
    const count = config.count;
    const posArray = new Float32Array(count * 3);
    const velArray = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // 랜덤 위치 (넓은 영역)
      posArray[i * 3] = (Math.random() - 0.5) * scale * 2;
      posArray[i * 3 + 1] = Math.random() * 20 + 5; // 높이
      posArray[i * 3 + 2] = (Math.random() - 0.5) * scale * 2;

      // 개별 속도 변화
      velArray[i] = 0.8 + Math.random() * 0.4;
    }

    return { positions: posArray, velocities: velArray };
  }, [config.count, scale]);

  useEffect(() => {
    velocitiesRef.current = velocities;
  }, [velocities]);

  useFrame((_, delta) => {
    if (!particlesRef.current || !velocitiesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const vel = velocitiesRef.current;
    const speed = config.speed * delta * 10;

    for (let i = 0; i < config.count; i++) {
      // Y축으로 떨어지기
      positions[i * 3 + 1] -= speed * vel[i];

      // 바닥에 닿으면 다시 위로
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = 20 + Math.random() * 5;
        positions[i * 3] = (Math.random() - 0.5) * scale * 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * scale * 2;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!config.enabled || config.count === 0) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={config.count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#a0c0e0"
        size={0.05}
        transparent
        opacity={0.6 * config.intensity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// 눈 파티클 컴포넌트
// ============================================================================

interface SnowParticlesProps {
  config: ParticleConfig['weatherParticles'];
  scale: number;
}

function SnowParticles({ config, scale }: SnowParticlesProps) {
  const particlesRef = useRef<THREE.Points>(null);
  const offsetsRef = useRef<Float32Array | null>(null);

  const { positions, offsets } = useMemo(() => {
    const count = config.count;
    const posArray = new Float32Array(count * 3);
    const offsetArray = new Float32Array(count * 2);

    for (let i = 0; i < count; i++) {
      posArray[i * 3] = (Math.random() - 0.5) * scale * 2;
      posArray[i * 3 + 1] = Math.random() * 20 + 5;
      posArray[i * 3 + 2] = (Math.random() - 0.5) * scale * 2;

      // 눈의 좌우 흔들림을 위한 오프셋
      offsetArray[i * 2] = Math.random() * Math.PI * 2; // phase
      offsetArray[i * 2 + 1] = 0.3 + Math.random() * 0.5; // amplitude
    }

    return { positions: posArray, offsets: offsetArray };
  }, [config.count, scale]);

  useEffect(() => {
    offsetsRef.current = offsets;
  }, [offsets]);

  useFrame((state, delta) => {
    if (!particlesRef.current || !offsetsRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
    const offs = offsetsRef.current;
    const speed = config.speed * delta * 2;
    const time = state.clock.elapsedTime;

    for (let i = 0; i < config.count; i++) {
      // Y축으로 천천히 떨어지기
      positions[i * 3 + 1] -= speed;

      // 좌우 흔들림
      const phase = offs[i * 2];
      const amp = offs[i * 2 + 1];
      positions[i * 3] += Math.sin(time * 2 + phase) * amp * delta;

      // 바닥에 닿으면 다시 위로
      if (positions[i * 3 + 1] < 0) {
        positions[i * 3 + 1] = 20 + Math.random() * 5;
        positions[i * 3] = (Math.random() - 0.5) * scale * 2;
        positions[i * 3 + 2] = (Math.random() - 0.5) * scale * 2;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  if (!config.enabled || config.count === 0) return null;

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={config.count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        color="#ffffff"
        size={0.08}
        transparent
        opacity={0.8 * config.intensity}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

// ============================================================================
// 안개 효과 컴포넌트
// ============================================================================

interface FogEffectProps {
  config: ParticleConfig['atmosphericEffects']['fog'];
}

function FogEffect({ config }: FogEffectProps) {
  const { scene } = useThree();

  useEffect(() => {
    if (config.enabled) {
      scene.fog = new THREE.FogExp2(config.color, config.density);
    } else {
      scene.fog = null;
    }

    return () => {
      scene.fog = null;
    };
  }, [scene, config.enabled, config.color, config.density]);

  return null;
}

// ============================================================================
// 동적 조명 컴포넌트
// ============================================================================

interface DynamicLightingProps {
  config: LightingConfig;
}

function DynamicLighting({ config }: DynamicLightingProps) {
  const ambientRef = useRef<THREE.AmbientLight>(null);
  const directionalRef = useRef<THREE.DirectionalLight>(null);
  const fillRef = useRef<THREE.DirectionalLight>(null);

  // 디바이스 그림자 설정
  const shadowCfg = getQualityConfig().shadow;

  // 조명 설정 적용 (부드러운 전환)
  useFrame((_, delta) => {
    const lerpFactor = Math.min(delta * 2, 1);

    if (ambientRef.current) {
      ambientRef.current.intensity = THREE.MathUtils.lerp(
        ambientRef.current.intensity,
        config.ambientIntensity,
        lerpFactor
      );
      ambientRef.current.color.lerp(new THREE.Color(config.ambientColor), lerpFactor);
    }

    if (directionalRef.current) {
      directionalRef.current.intensity = THREE.MathUtils.lerp(
        directionalRef.current.intensity,
        config.directionalIntensity,
        lerpFactor
      );
      directionalRef.current.color.lerp(new THREE.Color(config.directionalColor), lerpFactor);
    }

    if (fillRef.current && config.fillLightEnabled) {
      fillRef.current.intensity = THREE.MathUtils.lerp(
        fillRef.current.intensity,
        config.fillLightIntensity,
        lerpFactor
      );
    }
  });

  return (
    <group>
      <ambientLight
        ref={ambientRef}
        intensity={config.ambientIntensity}
        color={config.ambientColor}
      />
      <directionalLight
        ref={directionalRef}
        intensity={config.directionalIntensity}
        color={config.directionalColor}
        position={config.directionalPosition}
        castShadow={shadowCfg.dynamicLightCastShadow && config.shadowEnabled}
        shadow-mapSize-width={shadowCfg.dynamicLightMapSize}
        shadow-mapSize-height={shadowCfg.dynamicLightMapSize}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
      />
      {config.fillLightEnabled && (
        <directionalLight
          ref={fillRef}
          intensity={config.fillLightIntensity}
          color={config.fillLightColor}
          position={[-5, 10, -5]}
        />
      )}
    </group>
  );
}

// ============================================================================
// 환경 정보 디버그 표시
// ============================================================================

interface EnvironmentDebugInfoProps {
  config: RenderingConfig;
}

function EnvironmentDebugInfo({ config }: EnvironmentDebugInfoProps) {
  return (
    <group position={[0, 5, 0]}>
      {/* 디버그 정보는 개발 모드에서만 표시 */}
      {/* Html 컴포넌트 대신 콘솔 로그로 처리 */}
    </group>
  );
}

// ============================================================================
// 메인 EnvironmentEffectsOverlay 컴포넌트
// ============================================================================

export function EnvironmentEffectsOverlay({
  renderingConfig,
  enabled = true,
  particleScale = 30,
  debugMode = false,
}: EnvironmentEffectsOverlayProps) {
  // 🔧 디버그 로그
  console.log('[EnvironmentEffectsOverlay] Render:', {
    hasConfig: !!renderingConfig,
    enabled,
    particleType: renderingConfig?.particles?.weatherParticles?.type,
    particleCount: renderingConfig?.particles?.weatherParticles?.count,
    particleEnabled: renderingConfig?.particles?.weatherParticles?.enabled,
  });

  // 렌더링 설정이 없거나 비활성화되면 렌더링하지 않음
  if (!renderingConfig || !enabled) {
    console.log('[EnvironmentEffectsOverlay] Skipping render - no config or disabled');
    return null;
  }

  const { particles, lighting } = renderingConfig;

  // 디바이스 파티클 배율 적용 (low: 0.3, medium: 0.5, high: 1.0)
  const qualityCfg = getQualityConfig();
  const countMul = qualityCfg.particle.countMultiplier;
  const scaledParticles = useMemo(() => ({
    ...particles.weatherParticles,
    count: Math.round(particles.weatherParticles.count * countMul),
  }), [particles.weatherParticles, countMul]);

  // 파티클 설정이 변경될 때 컴포넌트를 재생성하기 위한 key
  const particleKey = `${scaledParticles.type}-${scaledParticles.count}-${scaledParticles.intensity}`;
  console.log('[EnvironmentEffectsOverlay] Particle key:', particleKey);

  return (
    <group name="environment-effects">
      {/* 동적 조명 */}
      <DynamicLighting config={lighting} />

      {/* 날씨 파티클 - key를 사용해 설정 변경 시 재생성 */}
      {scaledParticles.type === 'rain' && (
        <RainParticles
          key={`rain-${particleKey}`}
          config={scaledParticles}
          scale={particleScale}
        />
      )}
      {scaledParticles.type === 'snow' && (
        <SnowParticles
          key={`snow-${particleKey}`}
          config={scaledParticles}
          scale={particleScale}
        />
      )}

      {/* 안개 효과 */}
      {particles.atmosphericEffects.enabled && particles.atmosphericEffects.fog.enabled && (
        <FogEffect config={particles.atmosphericEffects.fog} />
      )}

      {/* 디버그 정보 */}
      {debugMode && <EnvironmentDebugInfo config={renderingConfig} />}
    </group>
  );
}

// ============================================================================
// 날씨 상태 표시 UI 컴포넌트 (2D)
// ============================================================================

export interface WeatherStatusBadgeProps {
  weatherCondition: string | null;
  temperature: number | null;
  className?: string;
}

export function WeatherStatusBadge({
  weatherCondition,
  temperature,
  className = '',
}: WeatherStatusBadgeProps) {
  if (!weatherCondition) return null;

  const weatherEmoji: Record<string, string> = {
    clear: '☀️',
    clouds: '☁️',
    rain: '🌧️',
    drizzle: '🌦️',
    thunderstorm: '⛈️',
    snow: '❄️',
    mist: '🌫️',
    fog: '🌫️',
    haze: '🌁',
  };

  const emoji = weatherEmoji[weatherCondition] || '🌤️';

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 bg-white/80 dark:bg-gray-800/80 rounded-full text-sm ${className}`}
    >
      <span>{emoji}</span>
      {temperature !== null && <span>{Math.round(temperature)}°C</span>}
    </div>
  );
}

export default EnvironmentEffectsOverlay;
