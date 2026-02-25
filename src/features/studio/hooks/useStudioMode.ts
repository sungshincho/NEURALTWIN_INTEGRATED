/**
 * useStudioMode.ts
 *
 * 스튜디오 모드 관리 훅
 */

import { useState, useCallback } from 'react';
import type { StudioMode } from '../types';

interface UseStudioModeOptions {
  initialMode?: StudioMode;
  onModeChange?: (mode: StudioMode) => void;
}

export function useStudioMode(options: UseStudioModeOptions = {}) {
  const { initialMode = 'view', onModeChange } = options;
  const [mode, setModeState] = useState<StudioMode>(initialMode);

  const setMode = useCallback(
    (newMode: StudioMode) => {
      setModeState(newMode);
      onModeChange?.(newMode);
    },
    [onModeChange]
  );

  const isEditMode = mode === 'edit';
  const isViewMode = mode === 'view';
  const isSimulateMode = mode === 'simulate';

  return {
    mode,
    setMode,
    isEditMode,
    isViewMode,
    isSimulateMode,
  };
}

export default useStudioMode;
