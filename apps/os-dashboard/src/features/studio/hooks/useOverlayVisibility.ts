/**
 * useOverlayVisibility.ts
 *
 * 오버레이 가시성 관리 훅
 */

import { useState, useCallback } from 'react';
import type { OverlayType } from '../types';

interface UseOverlayVisibilityOptions {
  initialOverlays?: OverlayType[];
  onOverlayChange?: (overlays: OverlayType[]) => void;
}

export function useOverlayVisibility(options: UseOverlayVisibilityOptions = {}) {
  const { initialOverlays = [], onOverlayChange } = options;
  const [activeOverlays, setActiveOverlays] = useState<OverlayType[]>(initialOverlays);

  const toggleOverlay = useCallback(
    (overlayId: OverlayType) => {
      setActiveOverlays((prev) => {
        const next = prev.includes(overlayId)
          ? prev.filter((o) => o !== overlayId)
          : [...prev, overlayId];
        onOverlayChange?.(next);
        return next;
      });
    },
    [onOverlayChange]
  );

  const showOverlay = useCallback(
    (overlayId: OverlayType) => {
      setActiveOverlays((prev) => {
        if (prev.includes(overlayId)) return prev;
        const next = [...prev, overlayId];
        onOverlayChange?.(next);
        return next;
      });
    },
    [onOverlayChange]
  );

  const hideOverlay = useCallback(
    (overlayId: OverlayType) => {
      setActiveOverlays((prev) => {
        if (!prev.includes(overlayId)) return prev;
        const next = prev.filter((o) => o !== overlayId);
        onOverlayChange?.(next);
        return next;
      });
    },
    [onOverlayChange]
  );

  // 🆕 오버레이 가시성을 직접 설정 (visible: true면 표시, false면 숨김)
  const setOverlayVisibility = useCallback(
    (overlayId: OverlayType, visible: boolean) => {
      setActiveOverlays((prev) => {
        const isCurrentlyActive = prev.includes(overlayId);
        
        // 이미 원하는 상태면 변경 없음
        if (visible === isCurrentlyActive) return prev;
        
        const next = visible
          ? [...prev, overlayId]  // 표시
          : prev.filter((o) => o !== overlayId);  // 숨김
        
        onOverlayChange?.(next);
        return next;
      });
    },
    [onOverlayChange]
  );

  const isActive = useCallback(
    (overlayId: OverlayType) => activeOverlays.includes(overlayId),
    [activeOverlays]
  );

  const clearAll = useCallback(() => {
    setActiveOverlays([]);
    onOverlayChange?.([]);
  }, [onOverlayChange]);

  return {
    activeOverlays,
    toggleOverlay,
    showOverlay,
    hideOverlay,
    setOverlayVisibility,  // 🆕 추가
    isActive,
    clearAll,
  };
}

export default useOverlayVisibility;
