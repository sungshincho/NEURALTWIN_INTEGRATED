/**
 * deviceCapability.ts
 *
 * 디바이스 적응형 품질 시스템
 * - 하드웨어 성능 감지 (CPU, 메모리, GPU, 화면 크기)
 * - 'high' | 'medium' | 'low' 품질 티어 자동 판별
 * - 각 티어별 3D 렌더링 설정 제공
 *
 * 게임 비유: 첫 실행 시 하드웨어 벤치마크 후 그래픽 프리셋 자동 설정
 */

// ============================================================================
// 타입 정의
// ============================================================================

/** 품질 티어 */
export type QualityTier = 'high' | 'medium' | 'low';

/** 디바이스 유형 */
export type DeviceType = 'desktop' | 'tablet' | 'mobile';

/** 하드웨어 정보 (감지 결과) */
export interface DeviceCapabilityInfo {
  /** 디바이스 유형 */
  deviceType: DeviceType;
  /** 품질 티어 (자동 판별) */
  tier: QualityTier;
  /** CPU 논리 코어 수 */
  cpuCores: number;
  /** 디바이스 메모리 (GB, Chrome 한정) */
  deviceMemoryGB: number | null;
  /** 화면 너비 (px) */
  screenWidth: number;
  /** GPU 렌더러 이름 */
  gpuRenderer: string | null;
  /** 최대 텍스처 크기 */
  maxTextureSize: number;
  /** 터치 지원 여부 */
  isTouchDevice: boolean;
  /** WebGL 버전 (1 | 2 | 0) */
  webglVersion: number;
}

/** Canvas(WebGL) 설정 */
export interface CanvasQualityConfig {
  antialias: boolean;
  shadows: boolean;
  preserveDrawingBuffer: boolean;
  dpr: number;
  powerPreference: 'high-performance' | 'default' | 'low-power';
}

/** 후처리 설정 */
export interface PostProcessingQualityConfig {
  enabled: boolean;
  multisampling: number;
  ssao: boolean;
  ssaoQuality: 'low' | 'medium' | 'high' | 'ultra';
  bloom: boolean;
  vignette: boolean;
}

/** 그림자 설정 */
export interface ShadowQualityConfig {
  enabled: boolean;
  mainLightMapSize: number;
  dynamicLightMapSize: number;
  dynamicLightCastShadow: boolean;
}

/** 시뮬레이션 설정 */
export interface SimulationQualityConfig {
  maxCustomers: number;
  spawnRateMultiplier: number;
}

/** 파티클/오버레이 설정 */
export interface ParticleQualityConfig {
  /** 파티클 수 배율 (1.0 = 원본, 0.5 = 50%) */
  countMultiplier: number;
  /** Preload all 사용 여부 */
  preloadAll: boolean;
}

/** 전체 품질 설정 (모든 카테고리 통합) */
export interface QualityConfig {
  tier: QualityTier;
  deviceType: DeviceType;
  canvas: CanvasQualityConfig;
  postProcessing: PostProcessingQualityConfig;
  shadow: ShadowQualityConfig;
  simulation: SimulationQualityConfig;
  particle: ParticleQualityConfig;
}

// ============================================================================
// 디바이스 유형 감지
// ============================================================================

function detectDeviceType(): DeviceType {
  if (typeof window === 'undefined') return 'desktop';

  const ua = navigator.userAgent.toLowerCase();
  const screenWidth = window.screen.width;

  // 모바일 UA 패턴
  const mobilePattern =
    /android|webos|iphone|ipod|blackberry|iemobile|opera mini|mobile/i;
  // 태블릿 UA 패턴
  const tabletPattern = /ipad|tablet|playbook|silk/i;

  if (tabletPattern.test(ua)) return 'tablet';
  if (mobilePattern.test(ua)) return 'mobile';

  // UA로 판별 안 되는 경우 화면 크기 + 터치 기반 판별
  const isTouchDevice =
    'ontouchstart' in window || navigator.maxTouchPoints > 0;

  if (isTouchDevice && screenWidth <= 768) return 'mobile';
  if (isTouchDevice && screenWidth <= 1024) return 'tablet';

  return 'desktop';
}

// ============================================================================
// 하드웨어 정보 수집
// ============================================================================

function getHardwareInfo(): Omit<DeviceCapabilityInfo, 'tier'> {
  const deviceType = detectDeviceType();
  const cpuCores = navigator.hardwareConcurrency || 2;

  // navigator.deviceMemory: Chrome 한정 API (GB 단위)
  const deviceMemoryGB =
    (navigator as any).deviceMemory != null
      ? (navigator as any).deviceMemory
      : null;

  const screenWidth =
    typeof window !== 'undefined' ? window.screen.width : 1920;

  const isTouchDevice =
    typeof window !== 'undefined' &&
    ('ontouchstart' in window || navigator.maxTouchPoints > 0);

  // WebGL 정보 수집 (오프스크린 캔버스 사용)
  let gpuRenderer: string | null = null;
  let maxTextureSize = 4096; // 기본값
  let webglVersion = 0;

  try {
    const canvas = document.createElement('canvas');
    // WebGL2 먼저 시도
    let gl: WebGLRenderingContext | WebGL2RenderingContext | null =
      canvas.getContext('webgl2');
    if (gl) {
      webglVersion = 2;
    } else {
      gl = canvas.getContext('webgl');
      if (gl) webglVersion = 1;
    }

    if (gl) {
      const dbgExt = gl.getExtension('WEBGL_debug_renderer_info');
      if (dbgExt) {
        gpuRenderer = gl.getParameter(dbgExt.UNMASKED_RENDERER_WEBGL);
      }
      maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;

      // 컨텍스트 정리
      const loseCtx = gl.getExtension('WEBGL_lose_context');
      if (loseCtx) loseCtx.loseContext();
    }
    canvas.remove();
  } catch {
    // WebGL 감지 실패 시 기본값 사용
  }

  return {
    deviceType,
    cpuCores,
    deviceMemoryGB,
    screenWidth,
    gpuRenderer,
    maxTextureSize,
    isTouchDevice,
    webglVersion,
  };
}

// ============================================================================
// GPU 등급 판별 (렌더러 이름 기반)
// ============================================================================

type GPUGrade = 'high' | 'mid' | 'low' | 'unknown';

function classifyGPU(renderer: string | null): GPUGrade {
  if (!renderer) return 'unknown';

  const r = renderer.toLowerCase();

  // 고성능 GPU
  if (
    /rtx\s*(30|40|50)/i.test(r) ||
    /radeon\s*rx\s*(6[89]|7[0-9])/i.test(r) ||
    /apple\s*m[2-9]/i.test(r) ||
    /geforce\s*gtx\s*1[06-9]/i.test(r)
  ) {
    return 'high';
  }

  // 중간 GPU
  if (
    /rtx\s*20/i.test(r) ||
    /gtx\s*1[0-5]/i.test(r) ||
    /radeon\s*rx\s*(5[0-9]|6[0-7])/i.test(r) ||
    /apple\s*m1/i.test(r) ||
    /intel\s*(iris|uhd)/i.test(r)
  ) {
    return 'mid';
  }

  // 저성능 GPU (모바일 통합 GPU)
  if (
    /adreno/i.test(r) ||
    /mali/i.test(r) ||
    /powervr/i.test(r) ||
    /apple\s*gpu/i.test(r) ||
    /intel\s*hd/i.test(r) ||
    /swiftshader/i.test(r)
  ) {
    return 'low';
  }

  return 'unknown';
}

// ============================================================================
// 품질 티어 결정
// ============================================================================

function determineTier(
  hw: Omit<DeviceCapabilityInfo, 'tier'>
): QualityTier {
  // 점수 기반 평가 (0~100)
  let score = 50; // 기준점

  // --- 디바이스 유형 가중치 ---
  if (hw.deviceType === 'mobile') score -= 25;
  else if (hw.deviceType === 'tablet') score -= 10;
  else score += 10;

  // --- CPU 코어 수 ---
  if (hw.cpuCores >= 8) score += 10;
  else if (hw.cpuCores >= 4) score += 0;
  else score -= 15;

  // --- 디바이스 메모리 ---
  if (hw.deviceMemoryGB !== null) {
    if (hw.deviceMemoryGB >= 8) score += 10;
    else if (hw.deviceMemoryGB >= 4) score += 0;
    else if (hw.deviceMemoryGB >= 2) score -= 10;
    else score -= 20;
  }

  // --- GPU 등급 ---
  const gpuGrade = classifyGPU(hw.gpuRenderer);
  if (gpuGrade === 'high') score += 15;
  else if (gpuGrade === 'mid') score += 5;
  else if (gpuGrade === 'low') score -= 15;
  // unknown: 변동 없음

  // --- 화면 크기 ---
  if (hw.screenWidth < 768) score -= 10;
  else if (hw.screenWidth >= 1920) score += 5;

  // --- WebGL 버전 ---
  if (hw.webglVersion < 2) score -= 10;

  // --- 최대 텍스처 크기 ---
  if (hw.maxTextureSize < 4096) score -= 10;

  // 점수 → 티어 매핑
  if (score >= 55) return 'high';
  if (score >= 30) return 'medium';
  return 'low';
}

// ============================================================================
// 티어별 품질 설정
// ============================================================================

const QUALITY_CONFIGS: Record<QualityTier, Omit<QualityConfig, 'tier' | 'deviceType'>> = {
  high: {
    canvas: {
      antialias: true,
      shadows: false,
      preserveDrawingBuffer: false,
      dpr: 1,
      powerPreference: 'high-performance',
    },
    postProcessing: {
      enabled: true,
      multisampling: 0,
      ssao: false,
      ssaoQuality: 'medium',
      bloom: false,
      vignette: true,
    },
    shadow: {
      enabled: false,
      mainLightMapSize: 512,
      dynamicLightMapSize: 512,
      dynamicLightCastShadow: false,
    },
    simulation: {
      maxCustomers: 30,
      spawnRateMultiplier: 1.0,
    },
    particle: {
      countMultiplier: 1.0,
      preloadAll: true,
    },
  },

  medium: {
    canvas: {
      antialias: false,
      shadows: true,
      preserveDrawingBuffer: false,
      dpr: 1,
      powerPreference: 'default',
    },
    postProcessing: {
      enabled: true,
      multisampling: 0,
      ssao: true,
      ssaoQuality: 'low',
      bloom: false,
      vignette: false,
    },
    shadow: {
      enabled: true,
      mainLightMapSize: 512,
      dynamicLightMapSize: 512,
      dynamicLightCastShadow: true,
    },
    simulation: {
      maxCustomers: 20,
      spawnRateMultiplier: 0.7,
    },
    particle: {
      countMultiplier: 0.5,
      preloadAll: false,
    },
  },

  low: {
    canvas: {
      antialias: false,
      shadows: false,
      preserveDrawingBuffer: false,
      dpr: 1,
      powerPreference: 'low-power',
    },
    postProcessing: {
      enabled: false,
      multisampling: 0,
      ssao: false,
      ssaoQuality: 'low',
      bloom: false,
      vignette: false,
    },
    shadow: {
      enabled: false,
      mainLightMapSize: 256,
      dynamicLightMapSize: 256,
      dynamicLightCastShadow: false,
    },
    simulation: {
      maxCustomers: 10,
      spawnRateMultiplier: 0.4,
    },
    particle: {
      countMultiplier: 0.3,
      preloadAll: false,
    },
  },
};

// ============================================================================
// 메인 API
// ============================================================================

/** 캐시된 결과 (페이지 로드당 한 번만 감지) */
let _cachedCapability: DeviceCapabilityInfo | null = null;
let _cachedConfig: QualityConfig | null = null;

/**
 * 디바이스 하드웨어 정보 감지
 * 결과는 캐시되어 페이지 로드당 한 번만 실행됩니다.
 */
export function detectDeviceCapability(): DeviceCapabilityInfo {
  if (_cachedCapability) return _cachedCapability;

  const hw = getHardwareInfo();
  const tier = determineTier(hw);

  _cachedCapability = { ...hw, tier };

  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
    console.log(
      `[DeviceCapability] type=${_cachedCapability.deviceType}, tier=${tier}, ` +
      `cores=${hw.cpuCores}, memory=${hw.deviceMemoryGB}GB, ` +
      `gpu=${hw.gpuRenderer || 'unknown'}, screen=${hw.screenWidth}px`
    );
  }

  return _cachedCapability;
}

/**
 * 현재 디바이스에 맞는 품질 설정 반환
 * 결과는 캐시되어 반복 호출해도 성능 부담 없음
 */
export function getQualityConfig(): QualityConfig {
  if (_cachedConfig) return _cachedConfig;

  const capability = detectDeviceCapability();
  const tierConfig = QUALITY_CONFIGS[capability.tier];

  _cachedConfig = {
    tier: capability.tier,
    deviceType: capability.deviceType,
    ...tierConfig,
  };

  return _cachedConfig;
}

/**
 * 특정 티어의 품질 설정 반환 (수동 오버라이드용)
 */
export function getQualityConfigForTier(tier: QualityTier): QualityConfig {
  const capability = detectDeviceCapability();
  return {
    tier,
    deviceType: capability.deviceType,
    ...QUALITY_CONFIGS[tier],
  };
}

/**
 * 캐시 초기화 (테스트용 또는 동적 재감지)
 */
export function resetDeviceCapabilityCache(): void {
  _cachedCapability = null;
  _cachedConfig = null;
}

/**
 * 모바일 디바이스 여부 (간편 헬퍼)
 */
export function isMobileDevice(): boolean {
  const capability = detectDeviceCapability();
  return capability.deviceType === 'mobile';
}

/**
 * 저사양 디바이스 여부 (간편 헬퍼)
 */
export function isLowEndDevice(): boolean {
  const capability = detectDeviceCapability();
  return capability.tier === 'low';
}
