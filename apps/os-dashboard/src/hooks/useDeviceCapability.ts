/**
 * useDeviceCapability.ts
 *
 * 디바이스 품질 설정을 React 컴포넌트에서 사용하기 위한 훅
 * - 초기 렌더링 시 한 번만 감지 (useMemo 캐시)
 * - 개별 카테고리별 설정 직접 접근 가능
 */

import { useMemo } from 'react';
import {
  detectDeviceCapability,
  getQualityConfig,
  type DeviceCapabilityInfo,
  type QualityConfig,
} from '@/utils/deviceCapability';

/**
 * 디바이스 품질 설정 훅
 *
 * @example
 * const { config, capability } = useDeviceCapability();
 * // config.canvas.antialias → false (모바일)
 * // config.shadow.enabled → false (low 티어)
 * // capability.tier → 'low'
 */
export function useDeviceCapability(): {
  config: QualityConfig;
  capability: DeviceCapabilityInfo;
} {
  const capability = useMemo(() => detectDeviceCapability(), []);
  const config = useMemo(() => getQualityConfig(), []);

  return { config, capability };
}
