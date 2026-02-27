/**
 * PostProcessing.tsx
 *
 * 후처리 효과 컴포넌트
 * - Bloom: 밝은 부분 빛 번짐
 * - SSAO: 틈새 어두움 (입체감)
 * - Vignette: 가장자리 어둡게
 * - ToneMapping: 색감 보정
 */

import {
  EffectComposer,
  Bloom,
  N8AO,
  Vignette,
  ToneMapping,
  BrightnessContrast,
  HueSaturation,
} from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';
import { useDeviceCapability } from '@/hooks/useDeviceCapability';

// ============================================================================
// 후처리 설정
// ============================================================================
// NOTE: ToneMappingMode는 런타임에만 접근 (TDZ 에러 방지)
export const POSTPROCESS_CONFIG = {
  // Bloom 설정
  bloom: {
    enabled: false,
    intensity: 0.5,
    luminanceThreshold: 0.9,
    luminanceSmoothing: 0.4,
    mipmapBlur: true,
    radius: 0.8,
  },

  // SSAO 설정
  ssao: {
    enabled: true,
    intensity: 1.5,
    aoRadius: 0.5,
    distanceFalloff: 0.5,
    quality: 'medium' as 'low' | 'medium' | 'high' | 'ultra',
  },

  // Vignette 설정
  vignette: {
    enabled: true,
    offset: 0.3,
    darkness: 0.4,
  },

  // Tone Mapping 설정 (gl 레벨에서 적용하므로 PostProcessing에서는 비활성화)
  toneMapping: {
    enabled: false,
  },

  // Brightness/Contrast 설정
  brightnessContrast: {
    enabled: false,
    brightness: 0.0,
    contrast: 0.1,
  },

  // Hue/Saturation 설정
  hueSaturation: {
    enabled: false,
    hue: 0,
    saturation: 0.1,
  },
};

// ============================================================================
// Props
// ============================================================================
interface PostProcessingProps {
  /** 전체 효과 활성화/비활성화 */
  enabled?: boolean;
  /** 개별 효과 오버라이드 */
  bloom?: boolean;
  ssao?: boolean;
  vignette?: boolean;
  /** 품질 프리셋 */
  quality?: 'low' | 'medium' | 'high' | 'ultra';
}

// ============================================================================
// PostProcessing 컴포넌트
// ============================================================================
export function PostProcessing({
  enabled = true,
  bloom,
  ssao,
  vignette,
  quality,
}: PostProcessingProps) {
  const { config } = useDeviceCapability();
  const ppCfg = config.postProcessing;

  // 디바이스가 PP 미지원(low tier) 이거나 caller가 비활성화 → 렌더링 안 함
  if (!ppCfg.enabled || !enabled) return null;

  // props 오버라이드 > 디바이스 설정 > 하드코딩 기본값
  const bloomEnabled = bloom ?? ppCfg.bloom;
  const ssaoEnabled = ssao ?? ppCfg.ssao;
  const vignetteEnabled = vignette ?? ppCfg.vignette;
  const ssaoQuality = quality ?? ppCfg.ssaoQuality;

  return (
    <EffectComposer multisampling={ppCfg.multisampling}>
      {/* Bloom */}
      {bloomEnabled && (
        <Bloom
          intensity={POSTPROCESS_CONFIG.bloom.intensity}
          luminanceThreshold={POSTPROCESS_CONFIG.bloom.luminanceThreshold}
          luminanceSmoothing={POSTPROCESS_CONFIG.bloom.luminanceSmoothing}
          mipmapBlur={POSTPROCESS_CONFIG.bloom.mipmapBlur}
          radius={POSTPROCESS_CONFIG.bloom.radius}
        />
      )}

      {/* N8AO - 고품질 SSAO */}
      {ssaoEnabled && (
        <N8AO
          intensity={POSTPROCESS_CONFIG.ssao.intensity}
          aoRadius={POSTPROCESS_CONFIG.ssao.aoRadius}
          distanceFalloff={POSTPROCESS_CONFIG.ssao.distanceFalloff}
          quality={ssaoQuality}
        />
      )}

      {/* Vignette */}
      {vignetteEnabled && (
        <Vignette
          offset={POSTPROCESS_CONFIG.vignette.offset}
          darkness={POSTPROCESS_CONFIG.vignette.darkness}
          blendFunction={BlendFunction.NORMAL}
        />
      )}

      {/* Tone Mapping */}
      {POSTPROCESS_CONFIG.toneMapping.enabled && (
        <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      )}

      {/* Brightness/Contrast */}
      {POSTPROCESS_CONFIG.brightnessContrast.enabled && (
        <BrightnessContrast
          brightness={POSTPROCESS_CONFIG.brightnessContrast.brightness}
          contrast={POSTPROCESS_CONFIG.brightnessContrast.contrast}
        />
      )}

      {/* Hue/Saturation */}
      {POSTPROCESS_CONFIG.hueSaturation.enabled && (
        <HueSaturation
          hue={POSTPROCESS_CONFIG.hueSaturation.hue}
          saturation={POSTPROCESS_CONFIG.hueSaturation.saturation}
        />
      )}
    </EffectComposer>
  );
}

// ============================================================================
// 프리셋
// ============================================================================
export const POSTPROCESS_PRESETS = {
  natural: {
    bloom: { ...POSTPROCESS_CONFIG.bloom, intensity: 0.3, luminanceThreshold: 0.95, enabled: true },
    ssao: { ...POSTPROCESS_CONFIG.ssao, intensity: 1.0 },
    vignette: { ...POSTPROCESS_CONFIG.vignette, darkness: 0.3 },
  },

  cinematic: {
    bloom: { ...POSTPROCESS_CONFIG.bloom, intensity: 0.6, luminanceThreshold: 0.85, enabled: true },
    ssao: { ...POSTPROCESS_CONFIG.ssao, intensity: 2.0 },
    vignette: { ...POSTPROCESS_CONFIG.vignette, darkness: 0.6, offset: 0.2 },
  },

  clean: {
    bloom: { ...POSTPROCESS_CONFIG.bloom, intensity: 0.2, luminanceThreshold: 0.98, enabled: true },
    ssao: { ...POSTPROCESS_CONFIG.ssao, intensity: 0.8 },
    vignette: { ...POSTPROCESS_CONFIG.vignette, enabled: false },
  },

  dramatic: {
    bloom: { ...POSTPROCESS_CONFIG.bloom, intensity: 0.8, luminanceThreshold: 0.8, enabled: true },
    ssao: { ...POSTPROCESS_CONFIG.ssao, intensity: 2.5 },
    vignette: { ...POSTPROCESS_CONFIG.vignette, darkness: 0.7 },
  },
};

export default PostProcessing;
