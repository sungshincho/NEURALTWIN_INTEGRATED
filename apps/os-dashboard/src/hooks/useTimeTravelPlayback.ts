/**
 * useTimeTravelPlayback.ts
 *
 * 시간 여행 재생 엔진 훅
 * - setInterval 기반 재생 루프 (1초 간격)
 * - playbackSpeed에 따라 1프레임(15분)당 실시간 비율 조절
 * - 키보드 단축키 지원 (Space, Arrow, +/-)
 * - 3D 씬 이벤트 발행
 */

import { useEffect, useRef, useCallback } from 'react';
import { useTimeTravelStore, type PlaybackSpeed } from '@/store/useTimeTravelStore';

interface UseTimeTravelPlaybackOptions {
  /** 키보드 단축키 활성화 (기본: true) */
  enableKeyboard?: boolean;
}

interface UseTimeTravelPlaybackReturn {
  /** Time Travel 활성화 여부 */
  isEnabled: boolean;
  /** 재생 중 여부 */
  isPlaying: boolean;
  /** 현재 시각 */
  currentTime: Date;
  /** 재생 속도 */
  playbackSpeed: PlaybackSpeed;
  /** HH:MM 형식 현재 시각 */
  formattedTime: string;
  /** 진행률 (0~1) */
  progress: number;
  /** 재생 */
  play: () => void;
  /** 일시정지 */
  pause: () => void;
  /** 재생/일시정지 토글 */
  togglePlayback: () => void;
  /** 다음 프레임 */
  nextFrame: () => void;
  /** 이전 프레임 */
  prevFrame: () => void;
  /** 속도 변경 */
  setSpeed: (speed: PlaybackSpeed) => void;
  /** 진행률로 이동 */
  seekToProgress: (progress: number) => void;
  /** 특정 시각으로 이동 */
  seekTo: (time: Date) => void;
  /** Time Travel 활성화 */
  enable: () => void;
  /** Time Travel 비활성화 */
  disable: () => void;
  /** Time Travel 토글 */
  toggle: () => void;
}

const SPEED_CYCLE: PlaybackSpeed[] = [1, 2, 4, 8];

export function useTimeTravelPlayback(
  options: UseTimeTravelPlaybackOptions = {}
): UseTimeTravelPlaybackReturn {
  const { enableKeyboard = true } = options;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // 스토어에서 상태/액션 가져오기
  const isEnabled = useTimeTravelStore((s) => s.isEnabled);
  const isPlaying = useTimeTravelStore((s) => s.isPlaying);
  const currentTime = useTimeTravelStore((s) => s.currentTime);
  const playbackSpeed = useTimeTravelStore((s) => s.playbackSpeed);

  const play = useTimeTravelStore((s) => s.play);
  const pause = useTimeTravelStore((s) => s.pause);
  const nextFrame = useTimeTravelStore((s) => s.nextFrame);
  const prevFrame = useTimeTravelStore((s) => s.prevFrame);
  const setSpeed = useTimeTravelStore((s) => s.setSpeed);
  const seekTo = useTimeTravelStore((s) => s.seekTo);
  const seekToProgress = useTimeTravelStore((s) => s.seekToProgress);
  const enable = useTimeTravelStore((s) => s.enable);
  const disable = useTimeTravelStore((s) => s.disable);
  const toggle = useTimeTravelStore((s) => s.toggle);
  const tick = useTimeTravelStore((s) => s.tick);
  const getProgress = useTimeTravelStore((s) => s.getProgress);
  const getFormattedTime = useTimeTravelStore((s) => s.getFormattedTime);

  // =========================================================================
  // 재생 루프 (1초 간격)
  // =========================================================================
  useEffect(() => {
    if (isPlaying && isEnabled) {
      intervalRef.current = setInterval(() => {
        tick();
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isPlaying, isEnabled, tick]);

  // 비활성화 시 타이머 정리
  useEffect(() => {
    if (!isEnabled && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [isEnabled]);

  // =========================================================================
  // 재생/일시정지 토글
  // =========================================================================
  const togglePlayback = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, pause, play]);

  // =========================================================================
  // 키보드 단축키
  // =========================================================================
  useEffect(() => {
    if (!enableKeyboard || !isEnabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 입력 필드에서는 무시
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayback();
          break;

        case 'ArrowLeft':
          e.preventDefault();
          prevFrame();
          break;

        case 'ArrowRight':
          e.preventDefault();
          nextFrame();
          break;

        case 'Equal': // + 키
        case 'NumpadAdd': {
          e.preventDefault();
          const currentIdx = SPEED_CYCLE.indexOf(playbackSpeed);
          if (currentIdx < SPEED_CYCLE.length - 1) {
            setSpeed(SPEED_CYCLE[currentIdx + 1]);
          }
          break;
        }

        case 'Minus': // - 키
        case 'NumpadSubtract': {
          e.preventDefault();
          const currentIdx2 = SPEED_CYCLE.indexOf(playbackSpeed);
          if (currentIdx2 > 0) {
            setSpeed(SPEED_CYCLE[currentIdx2 - 1]);
          }
          break;
        }

        case 'Escape':
          e.preventDefault();
          disable();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    enableKeyboard,
    isEnabled,
    isPlaying,
    playbackSpeed,
    togglePlayback,
    prevFrame,
    nextFrame,
    setSpeed,
    disable,
  ]);

  return {
    isEnabled,
    isPlaying,
    currentTime,
    playbackSpeed,
    formattedTime: getFormattedTime(),
    progress: getProgress(),
    play,
    pause,
    togglePlayback,
    nextFrame,
    prevFrame,
    setSpeed,
    seekToProgress,
    seekTo,
    enable,
    disable,
    toggle,
  };
}

export default useTimeTravelPlayback;
