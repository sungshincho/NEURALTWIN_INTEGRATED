/**
 * PostProcessingEffects.tsx
 * 
 * 후처리 효과 컴포넌트
 * - Bloom: 밝은 부분 빛 번짐 (언리얼 느낌의 핵심!)
 * - SSAO: 틈새 어두움 (입체감)
 * - Vignette: 가장자리 어둡게 (영화적 느낌)
 * - ToneMapping: 색감 보정
 * 
 * 🎛️ 조절 가능한 변수들은 POSTPROCESS_CONFIG에서 수정
 */

import { EffectComposer, Bloom, N8AO, Vignette, ToneMapping, BrightnessContrast, HueSaturation } from '@react-three/postprocessing';
import { BlendFunction, ToneMappingMode } from 'postprocessing';

// ============================================================================
// 🎛️ 후처리 설정 - 이 값들을 조절하여 미세 조정 가능
// ============================================================================
export const POSTPROCESS_CONFIG = {
  // Bloom 설정 - 밝은 부분 빛 번짐
  bloom: {
    enabled: false,
    intensity: 0.5,              // 🎛️ 블룸 강도 (0.2 ~ 1.5) - 높을수록 빛 번짐 강함
    luminanceThreshold: 0.9,     // 🎛️ 밝기 임계값 (0.5 ~ 1.0) - 낮을수록 더 많은 부분이 빛남
    luminanceSmoothing: 0.4,     // 🎛️ 부드러움 (0.0 ~ 1.0)
    mipmapBlur: true,            // 고품질 블러
    radius: 0.8,                 // 🎛️ 블룸 반경 (0.5 ~ 1.0)
  },
  
  // SSAO (Screen Space Ambient Occlusion) - 틈새 어두움
  ssao: {
    enabled: true,
    intensity: 1.5,              // 🎛️ AO 강도 (0.5 ~ 3.0) - 높을수록 틈새가 어두움
    aoRadius: 0.5,               // 🎛️ AO 반경 (0.1 ~ 1.0) - 어두움이 퍼지는 범위
    distanceFalloff: 0.5,        // 🎛️ 거리 감쇠 (0.1 ~ 1.0)
    quality: 'medium' as 'low' | 'medium' | 'high' | 'ultra',  // 🎛️ 품질 (성능과 트레이드오프)
  },
  
  // Vignette - 가장자리 어둡게 (영화적 느낌)
  vignette: {
    enabled: true,
    offset: 0.3,                 // 🎛️ 시작 위치 (0.1 ~ 0.5) - 낮을수록 중앙부터
    darkness: 0.4,               // 🎛️ 어두움 강도 (0.2 ~ 0.8)
  },
  
  // Tone Mapping - 색감 보정 (mode는 컴포넌트에서 설정 - TDZ 방지)
  toneMapping: {
    enabled: true,
    // mode: ToneMappingMode.ACES_FILMIC - 컴포넌트에서 직접 사용
    // 다른 옵션: REINHARD, CINEON, NEUTRAL
  },
  
  // Brightness/Contrast - 밝기/대비
  brightnessContrast: {
    enabled: false,              // 🎛️ 필요시 활성화
    brightness: 0.0,             // 🎛️ 밝기 (-0.2 ~ 0.2)
    contrast: 0.1,               // 🎛️ 대비 (0.0 ~ 0.3) - 높을수록 선명
  },
  
  // Hue/Saturation - 색조/채도
  hueSaturation: {
    enabled: false,              // 🎛️ 필요시 활성화
    hue: 0,                      // 🎛️ 색조 회전 (-Math.PI ~ Math.PI)
    saturation: 0.1,             // 🎛️ 채도 (-1 ~ 1) - 높을수록 색이 진함
  },
};

// ============================================================================
// 후처리 효과 컴포넌트
// ============================================================================
interface PostProcessingEffectsProps {
  /** 전체 효과 활성화/비활성화 */
  enabled?: boolean;
  /** 개별 효과 오버라이드 */
  bloom?: boolean;
  ssao?: boolean;
  vignette?: boolean;
}

export function PostProcessingEffects({
  enabled = true,
  bloom,
  ssao,
  vignette,
}: PostProcessingEffectsProps) {
  if (!enabled) return null;
  
  const bloomEnabled = bloom ?? POSTPROCESS_CONFIG.bloom.enabled;
  const ssaoEnabled = ssao ?? POSTPROCESS_CONFIG.ssao.enabled;
  const vignetteEnabled = vignette ?? POSTPROCESS_CONFIG.vignette.enabled;
  
  return (
    <EffectComposer multisampling={4}>
      {/* Bloom - 빛 번짐 효과 */}
      {bloomEnabled && (
        <Bloom
          intensity={POSTPROCESS_CONFIG.bloom.intensity}
          luminanceThreshold={POSTPROCESS_CONFIG.bloom.luminanceThreshold}
          luminanceSmoothing={POSTPROCESS_CONFIG.bloom.luminanceSmoothing}
          mipmapBlur={POSTPROCESS_CONFIG.bloom.mipmapBlur}
          radius={POSTPROCESS_CONFIG.bloom.radius}
        />
      )}
      
      {/* N8AO - 고품질 SSAO (drei의 SSAO보다 성능 좋음) */}
      {ssaoEnabled && (
        <N8AO
          intensity={POSTPROCESS_CONFIG.ssao.intensity}
          aoRadius={POSTPROCESS_CONFIG.ssao.aoRadius}
          distanceFalloff={POSTPROCESS_CONFIG.ssao.distanceFalloff}
          quality={POSTPROCESS_CONFIG.ssao.quality}
        />
      )}
      
      {/* Vignette - 가장자리 어둡게 */}
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
// 프리셋 (필요시 사용)
// ============================================================================
export const POSTPROCESS_PRESETS = {
  // 기본 - 자연스러운 향상
  natural: {
    bloom: { ...POSTPROCESS_CONFIG.bloom, intensity: 0.3, luminanceThreshold: 0.95 },
    ssao: { ...POSTPROCESS_CONFIG.ssao, intensity: 1.0 },
    vignette: { ...POSTPROCESS_CONFIG.vignette, darkness: 0.3 },
  },
  
  // 시네마틱 - 영화적 느낌
  cinematic: {
    bloom: { ...POSTPROCESS_CONFIG.bloom, intensity: 0.6, luminanceThreshold: 0.85 },
    ssao: { ...POSTPROCESS_CONFIG.ssao, intensity: 2.0 },
    vignette: { ...POSTPROCESS_CONFIG.vignette, darkness: 0.6, offset: 0.2 },
  },
  
  // 클린 - 깔끔한 느낌
  clean: {
    bloom: { ...POSTPROCESS_CONFIG.bloom, intensity: 0.2, luminanceThreshold: 0.98 },
    ssao: { ...POSTPROCESS_CONFIG.ssao, intensity: 0.8 },
    vignette: { ...POSTPROCESS_CONFIG.vignette, enabled: false },
  },
  
  // 드라마틱 - 강한 대비
  dramatic: {
    bloom: { ...POSTPROCESS_CONFIG.bloom, intensity: 0.8, luminanceThreshold: 0.8 },
    ssao: { ...POSTPROCESS_CONFIG.ssao, intensity: 2.5 },
    vignette: { ...POSTPROCESS_CONFIG.vignette, darkness: 0.7 },
  },
};

export default PostProcessingEffects;
