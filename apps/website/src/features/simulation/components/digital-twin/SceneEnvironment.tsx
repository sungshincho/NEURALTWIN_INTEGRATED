/**
 * SceneEnvironment.tsx
 *
 * 3D 씬 환경 설정 컴포넌트
 * - HDRI 환경맵
 * - 배경 및 조명 프리셋
 */

import { Environment } from '@react-three/drei';

export type EnvironmentPreset =
  | 'sunset'
  | 'dawn'
  | 'night'
  | 'warehouse'
  | 'forest'
  | 'apartment'
  | 'studio'
  | 'city'
  | 'park'
  | 'lobby';

interface SceneEnvironmentProps {
  preset?: EnvironmentPreset;
  background?: boolean;
  blur?: number;
  hdriPath?: string;
}

export function SceneEnvironment({
  preset = 'warehouse',
  background = true,
  blur = 0,
  hdriPath,
}: SceneEnvironmentProps) {
  // HDRI 경로가 제공된 경우 커스텀 환경 사용
  if (hdriPath) {
    return (
      <Environment
        files={hdriPath}
        background={background}
        blur={blur}
      />
    );
  }

  // 프리셋 환경 사용
  return (
    <Environment
      preset={preset}
      background={background}
      blur={blur}
    />
  );
}

export default SceneEnvironment;
