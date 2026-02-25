/**
 * renderingConfigCalculator.ts
 *
 * 3D 렌더링 설정 계산
 * - 날씨/시간대/시즌에 따른 조명, 파티클, 후처리 설정
 * - 환경 데이터 기반 동적 렌더링 구성
 *
 * 📌 모든 설정은 실제 환경 데이터 기반으로 생성
 */

import type {
  RealWeatherData,
  HolidayData,
  StoreEventData,
  RenderingConfig,
  LightingConfig,
  ParticleConfig,
  PostProcessingConfig,
  TimeOfDay,
  SeasonType,
  WeatherCondition,
} from '../types/environment.types';
import { getTimeOfDay } from './environmentImpactCalculator';

// ============================================================================
// 1. 시간대 계산
// ============================================================================

/**
 * 현재 날짜 → 시즌 계산
 */
export function getCurrentSeason(): SeasonType {
  const month = new Date().getMonth() + 1; // 1-12

  if (month >= 3 && month <= 5) return 'spring';
  if (month >= 6 && month <= 8) return 'summer';
  if (month >= 9 && month <= 11) return 'fall';
  return 'winter';
}

// ============================================================================
// 2. 조명 설정 계산
// ============================================================================

/**
 * 시간대별 기본 조명 설정
 */
function getBaseTimeOfDayLighting(timeOfDay: TimeOfDay): Partial<LightingConfig> {
  const configs: Record<TimeOfDay, Partial<LightingConfig>> = {
    dawn: {
      ambientIntensity: 0.4,
      ambientColor: '#ffeedd',
      directionalIntensity: 0.6,
      directionalColor: '#ffc0a0',
      directionalPosition: [5, 10, 8],
      environmentPreset: 'dawn',
      environmentIntensity: 0.5,
    },
    morning: {
      ambientIntensity: 0.5,
      ambientColor: '#ffffff',
      directionalIntensity: 0.8,
      directionalColor: '#fff5e0',
      directionalPosition: [8, 15, 5],
      environmentPreset: 'city',
      environmentIntensity: 0.7,
    },
    afternoon: {
      ambientIntensity: 0.6,
      ambientColor: '#ffffff',
      directionalIntensity: 1.0,
      directionalColor: '#fffef5',
      directionalPosition: [0, 20, 0],
      environmentPreset: 'city',
      environmentIntensity: 0.8,
    },
    evening: {
      ambientIntensity: 0.45,
      ambientColor: '#ffeedd',
      directionalIntensity: 0.7,
      directionalColor: '#ffb080',
      directionalPosition: [-8, 10, -5],
      environmentPreset: 'sunset',
      environmentIntensity: 0.6,
    },
    night: {
      ambientIntensity: 0.3,
      ambientColor: '#c0d0ff',
      directionalIntensity: 0.2,
      directionalColor: '#a0b0ff',
      directionalPosition: [-5, 15, -8],
      environmentPreset: 'night',
      environmentIntensity: 0.4,
    },
  };

  return configs[timeOfDay];
}

/**
 * 날씨 조건에 따른 조명 조정
 */
function adjustLightingForWeather(
  baseLighting: Partial<LightingConfig>,
  weather: RealWeatherData | null
): Partial<LightingConfig> {
  if (!weather) return baseLighting;

  const adjusted = { ...baseLighting };

  switch (weather.condition) {
    case 'clear':
      // 맑은 날 - 기본 설정 유지
      break;

    case 'clouds':
      // 흐림 - 주 광원 감소, 앰비언트 증가
      adjusted.directionalIntensity = (adjusted.directionalIntensity || 0.8) * 0.7;
      adjusted.ambientIntensity = (adjusted.ambientIntensity || 0.5) * 1.2;
      adjusted.ambientColor = '#e0e0e8';
      break;

    case 'rain':
    case 'drizzle':
      // 비 - 어둡고 차가운 톤
      adjusted.directionalIntensity = (adjusted.directionalIntensity || 0.8) * 0.5;
      adjusted.ambientIntensity = (adjusted.ambientIntensity || 0.5) * 0.9;
      adjusted.ambientColor = '#d0d5e0';
      adjusted.directionalColor = '#c0c8d0';
      break;

    case 'thunderstorm':
      // 뇌우 - 매우 어둡고 드라마틱
      adjusted.directionalIntensity = (adjusted.directionalIntensity || 0.8) * 0.3;
      adjusted.ambientIntensity = (adjusted.ambientIntensity || 0.5) * 0.6;
      adjusted.ambientColor = '#b0b8c8';
      break;

    case 'snow':
      // 눈 - 밝고 차가운 톤
      adjusted.directionalIntensity = (adjusted.directionalIntensity || 0.8) * 0.8;
      adjusted.ambientIntensity = (adjusted.ambientIntensity || 0.5) * 1.3;
      adjusted.ambientColor = '#f0f5ff';
      adjusted.directionalColor = '#e8f0ff';
      break;

    case 'mist':
    case 'fog':
      // 안개 - 낮은 대비
      adjusted.directionalIntensity = (adjusted.directionalIntensity || 0.8) * 0.4;
      adjusted.ambientIntensity = (adjusted.ambientIntensity || 0.5) * 1.4;
      adjusted.ambientColor = '#e8e8e8';
      break;

    case 'haze':
      // 연무 - 약간 뿌연 느낌
      adjusted.directionalIntensity = (adjusted.directionalIntensity || 0.8) * 0.85;
      adjusted.ambientColor = '#e8e5e0';
      break;
  }

  return adjusted;
}

/**
 * 시즌에 따른 조명 미세 조정
 */
function adjustLightingForSeason(
  lighting: Partial<LightingConfig>,
  season: SeasonType
): Partial<LightingConfig> {
  const adjusted = { ...lighting };

  switch (season) {
    case 'spring':
      // 봄 - 부드럽고 따뜻한 톤
      adjusted.ambientColor = blendColors(adjusted.ambientColor || '#ffffff', '#fff0e8', 0.2);
      break;

    case 'summer':
      // 여름 - 강렬하고 밝은 톤
      adjusted.directionalIntensity = (adjusted.directionalIntensity || 0.8) * 1.1;
      adjusted.ambientColor = blendColors(adjusted.ambientColor || '#ffffff', '#fffff0', 0.15);
      break;

    case 'fall':
      // 가을 - 따뜻하고 골든 톤
      adjusted.ambientColor = blendColors(adjusted.ambientColor || '#ffffff', '#ffe8d0', 0.25);
      adjusted.directionalColor = blendColors(adjusted.directionalColor || '#ffffff', '#ffd0a0', 0.2);
      break;

    case 'winter':
      // 겨울 - 차갑고 푸른 톤
      adjusted.ambientColor = blendColors(adjusted.ambientColor || '#ffffff', '#e8f0ff', 0.2);
      adjusted.ambientIntensity = (adjusted.ambientIntensity || 0.5) * 0.9;
      break;
  }

  return adjusted;
}

/**
 * 완전한 조명 설정 생성
 */
function calculateLightingConfig(
  weather: RealWeatherData | null,
  timeOfDay: TimeOfDay,
  season: SeasonType
): LightingConfig {
  // 기본 시간대 설정
  let lighting = getBaseTimeOfDayLighting(timeOfDay);

  // 날씨 조정
  lighting = adjustLightingForWeather(lighting, weather);

  // 시즌 조정
  lighting = adjustLightingForSeason(lighting, season);

  // 기본값으로 완성
  return {
    ambientIntensity: lighting.ambientIntensity ?? 0.5,
    ambientColor: lighting.ambientColor ?? '#ffffff',
    directionalIntensity: lighting.directionalIntensity ?? 0.8,
    directionalColor: lighting.directionalColor ?? '#ffffff',
    directionalPosition: lighting.directionalPosition ?? [5, 15, 5],
    shadowEnabled: true,
    shadowIntensity: lighting.directionalIntensity ? lighting.directionalIntensity * 0.3 : 0.25,
    fillLightEnabled: true,
    fillLightIntensity: 0.3,
    fillLightColor: lighting.ambientColor ?? '#e0e0ff',
    environmentPreset: lighting.environmentPreset ?? 'city',
    environmentIntensity: lighting.environmentIntensity ?? 0.7,
  };
}

// ============================================================================
// 3. 파티클 설정 계산
// ============================================================================

/**
 * 날씨 기반 파티클 설정
 */
function calculateParticleConfig(weather: RealWeatherData | null): ParticleConfig {
  const baseConfig: ParticleConfig = {
    weatherParticles: {
      enabled: false,
      type: 'none',
      intensity: 0,
      speed: 1,
      count: 0,
    },
    atmosphericEffects: {
      enabled: false,
      fog: {
        enabled: false,
        color: '#ffffff',
        near: 10,
        far: 100,
        density: 0.01,
      },
      dust: {
        enabled: false,
        intensity: 0,
      },
    },
  };

  if (!weather) return baseConfig;

  // 날씨 조건별 파티클 설정
  switch (weather.condition) {
    case 'rain':
      return {
        weatherParticles: {
          enabled: true,
          type: 'rain',
          intensity: weather.rain1h ? Math.min(weather.rain1h / 10, 1) : 0.5,
          speed: 2.5,
          count: weather.rain1h ? Math.min(weather.rain1h * 100, 1000) : 500,
        },
        atmosphericEffects: {
          enabled: true,
          fog: {
            enabled: true,
            color: '#c8d0d8',
            near: 20,
            far: 80,
            density: 0.015,
          },
          dust: { enabled: false, intensity: 0 },
        },
      };

    case 'drizzle':
      return {
        weatherParticles: {
          enabled: true,
          type: 'rain',
          intensity: 0.3,
          speed: 1.5,
          count: 200,
        },
        atmosphericEffects: {
          enabled: true,
          fog: {
            enabled: true,
            color: '#d8dce0',
            near: 30,
            far: 100,
            density: 0.008,
          },
          dust: { enabled: false, intensity: 0 },
        },
      };

    case 'thunderstorm':
      return {
        weatherParticles: {
          enabled: true,
          type: 'rain',
          intensity: 1.0,
          speed: 3.5,
          count: 1500,
        },
        atmosphericEffects: {
          enabled: true,
          fog: {
            enabled: true,
            color: '#a0a8b8',
            near: 10,
            far: 50,
            density: 0.025,
          },
          dust: { enabled: false, intensity: 0 },
        },
      };

    case 'snow':
      return {
        weatherParticles: {
          enabled: true,
          type: 'snow',
          intensity: weather.snow1h ? Math.min(weather.snow1h / 5, 1) : 0.5,
          speed: 0.8,
          count: weather.snow1h ? Math.min(weather.snow1h * 200, 800) : 400,
        },
        atmosphericEffects: {
          enabled: true,
          fog: {
            enabled: true,
            color: '#f0f4f8',
            near: 25,
            far: 90,
            density: 0.01,
          },
          dust: { enabled: false, intensity: 0 },
        },
      };

    case 'mist':
    case 'fog':
      return {
        weatherParticles: { enabled: false, type: 'none', intensity: 0, speed: 1, count: 0 },
        atmosphericEffects: {
          enabled: true,
          fog: {
            enabled: true,
            color: weather.condition === 'fog' ? '#e0e0e0' : '#e8e8e8',
            near: weather.condition === 'fog' ? 5 : 15,
            far: weather.condition === 'fog' ? 30 : 60,
            density: weather.condition === 'fog' ? 0.04 : 0.02,
          },
          dust: { enabled: false, intensity: 0 },
        },
      };

    case 'haze':
      return {
        weatherParticles: { enabled: false, type: 'none', intensity: 0, speed: 1, count: 0 },
        atmosphericEffects: {
          enabled: true,
          fog: {
            enabled: true,
            color: '#e8e4e0',
            near: 30,
            far: 120,
            density: 0.008,
          },
          dust: {
            enabled: true,
            intensity: 0.3,
          },
        },
      };

    default:
      return baseConfig;
  }
}

// ============================================================================
// 4. 후처리 설정 계산
// ============================================================================

/**
 * 환경 기반 후처리 설정
 */
function calculatePostProcessingConfig(
  weather: RealWeatherData | null,
  timeOfDay: TimeOfDay,
  activeEvents: StoreEventData[]
): PostProcessingConfig {
  // 기본 설정
  const config: PostProcessingConfig = {
    bloom: {
      enabled: true,
      intensity: 0.5,
      threshold: 0.8,
      radius: 0.5,
    },
    vignette: {
      enabled: true,
      intensity: 0.3,
    },
    colorCorrection: {
      enabled: true,
      saturation: 1.0,
      brightness: 1.0,
      contrast: 1.0,
      temperature: 0,
    },
    depthOfField: {
      enabled: false,
      focusDistance: 10,
      focalLength: 50,
      bokehScale: 2,
    },
  };

  // 시간대별 조정
  switch (timeOfDay) {
    case 'dawn':
      config.colorCorrection.temperature = 15; // 따뜻한 톤
      config.bloom.intensity = 0.7;
      break;

    case 'evening':
      config.colorCorrection.temperature = 20;
      config.bloom.intensity = 0.8;
      config.vignette.intensity = 0.4;
      break;

    case 'night':
      config.colorCorrection.brightness = 0.9;
      config.colorCorrection.temperature = -10; // 차가운 톤
      config.vignette.intensity = 0.5;
      config.bloom.intensity = 0.6;
      break;
  }

  // 날씨별 조정
  if (weather) {
    switch (weather.condition) {
      case 'rain':
      case 'drizzle':
        config.colorCorrection.saturation = 0.9;
        config.colorCorrection.temperature = -5;
        break;

      case 'thunderstorm':
        config.colorCorrection.saturation = 0.8;
        config.colorCorrection.contrast = 1.1;
        config.vignette.intensity = 0.6;
        break;

      case 'snow':
        config.colorCorrection.brightness = 1.1;
        config.colorCorrection.saturation = 0.85;
        config.bloom.intensity = 0.8;
        break;

      case 'clear':
        config.colorCorrection.saturation = 1.05;
        config.bloom.intensity = 0.6;
        break;
    }
  }

  // 이벤트 진행 중일 때 - 약간 화려하게
  if (activeEvents.length > 0) {
    config.bloom.intensity *= 1.2;
    config.colorCorrection.saturation *= 1.05;
  }

  return config;
}

// ============================================================================
// 5. 유틸리티 함수
// ============================================================================

/**
 * 두 색상 블렌딩
 */
function blendColors(color1: string, color2: string, ratio: number): string {
  const hex1 = color1.replace('#', '');
  const hex2 = color2.replace('#', '');

  const r1 = parseInt(hex1.substring(0, 2), 16);
  const g1 = parseInt(hex1.substring(2, 4), 16);
  const b1 = parseInt(hex1.substring(4, 6), 16);

  const r2 = parseInt(hex2.substring(0, 2), 16);
  const g2 = parseInt(hex2.substring(2, 4), 16);
  const b2 = parseInt(hex2.substring(4, 6), 16);

  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// ============================================================================
// 6. 통합 렌더링 설정 생성
// ============================================================================

export interface CalculateRenderingParams {
  weather: RealWeatherData | null;
  todayHoliday: HolidayData | null;
  activeEvents: StoreEventData[];
}

/**
 * 완전한 렌더링 설정 생성
 */
export function calculateRenderingConfig(params: CalculateRenderingParams): RenderingConfig {
  const { weather, activeEvents } = params;

  const timeOfDay = getTimeOfDay();
  const season = getCurrentSeason();
  const weatherCondition = weather?.condition || 'clear';

  return {
    lighting: calculateLightingConfig(weather, timeOfDay, season),
    particles: calculateParticleConfig(weather),
    postProcessing: calculatePostProcessingConfig(weather, timeOfDay, activeEvents),

    timeOfDay,
    season,
    weatherCondition,

    generatedAt: new Date().toISOString(),
    basedOn: {
      weather: weather !== null,
      holiday: params.todayHoliday !== null,
      event: activeEvents.length > 0,
      timeOfDay: true,
    },
  };
}

// ============================================================================
// 7. 렌더링 설정 프리셋 (빠른 접근용)
// ============================================================================

export type RenderingPreset = 'realistic' | 'stylized' | 'performance' | 'custom';

/**
 * 프리셋 기반 렌더링 설정 조정
 */
export function applyRenderingPreset(
  config: RenderingConfig,
  preset: RenderingPreset
): RenderingConfig {
  const adjusted = { ...config };

  switch (preset) {
    case 'realistic':
      // 최대 품질
      adjusted.particles.weatherParticles.count = Math.min(
        adjusted.particles.weatherParticles.count * 1.5,
        2000
      );
      adjusted.postProcessing.depthOfField.enabled = true;
      break;

    case 'stylized':
      // 스타일화된 렌더링
      adjusted.postProcessing.colorCorrection.saturation = 1.2;
      adjusted.postProcessing.bloom.intensity *= 1.3;
      adjusted.lighting.ambientIntensity *= 1.1;
      break;

    case 'performance':
      // 성능 최적화
      adjusted.particles.weatherParticles.enabled = false;
      adjusted.particles.atmosphericEffects.enabled = false;
      adjusted.postProcessing.bloom.enabled = false;
      adjusted.postProcessing.depthOfField.enabled = false;
      break;

    case 'custom':
      // 사용자 정의 - 변경 없음
      break;
  }

  return adjusted;
}
